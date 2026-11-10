import asyncio
from datetime import datetime, timezone
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session_maker
import models
from notifications import dispatch_alarm_notification, enviar_email_async
from ws_manager import manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BMS_Engine")

# Intentar importar dependencias industriales
try:
    from pymodbus.client import AsyncModbusTcpClient
except ImportError:
    AsyncModbusTcpClient = None
    logger.warning("pymodbus no está disponible. Instálalo con: pip install pymodbus")

try:
    import BAC0
except ImportError:
    BAC0 = None
    logger.warning("BAC0 no está disponible. Instálalo con: pip install BAC0")

# Inicializar BACnet (lite no carga toda la base de datos de objetos, ideal para lecturas rápidas)
# Se puede definir la IP local de la interfaz de red del servidor/contenedor vía variable de entorno
BACNET_LOCAL_IP = os.getenv("BACNET_IP", "192.168.1.10/24")

bacnet = None
if BAC0:
    try:
        bacnet = BAC0.lite(ip=BACNET_LOCAL_IP)
        logger.info(f"BACnet inicializado en interfaz {BACNET_LOCAL_IP}")
    except Exception as e:
        logger.warning(f"No se pudo iniciar BACnet en {BACNET_LOCAL_IP}: {e}. Intentando interfaz por defecto...")
        try:
            bacnet = BAC0.lite()
            logger.info("BACnet inicializado con interfaz por defecto.")
        except Exception as e2:
            logger.error(f"Error iniciando BACnet: {e2}")
            bacnet = None

# Diccionario en memoria para rastrear el estado anterior y detectar flancos (0 -> 1)
estado_anterior: Dict[int, bool] = {}

# Callback opcional para difusión de eventos vía WebSocket en tiempo real
ws_broadcast_callback = None

def set_ws_broadcast_callback(callback):
    """Permite a FastAPI registrar una función de broadcast por WebSocket."""
    global ws_broadcast_callback
    ws_broadcast_callback = callback


def parse_bacnet_address(register_str: str) -> Tuple[str, str]:
    """
    Normaliza el direccionamiento BACnet extrayendo el tipo de objeto y la instancia.
    Soporta formatos industriales: 'BI:101', 'binaryInput 1', '101'.
    """
    reg = str(register_str).strip()
    prefix_map = {
        "BI:": "binaryInput",
        "BO:": "binaryOutput",
        "BV:": "binaryValue",
        "AI:": "analogInput",
        "AO:": "analogOutput",
        "AV:": "analogValue",
    }
    for prefix, b_type in prefix_map.items():
        if reg.upper().startswith(prefix):
            return b_type, reg[len(prefix):].strip()

    parts = reg.split()
    if len(parts) >= 2:
        return parts[0], parts[1]

    return "binaryInput", reg


async def leer_modbus(ip: str, port: int, address: Any) -> Optional[bool]:
    """Lee una entrada digital (Coil / Discrete Input) vía Modbus TCP de forma asíncrona."""
    if not AsyncModbusTcpClient:
        logger.error("pymodbus no está instalado.")
        return None

    try:
        addr = int(str(address).strip())
    except ValueError:
        logger.error(f"Dirección Modbus no numérica: '{address}'")
        return None

    client = AsyncModbusTcpClient(ip, port=port)
    try:
        await client.connect()
        if client.connected:
            # address-1 o address dependiendo del offset del fabricante (ej. WAGO)
            result = await client.read_discrete_inputs(addr, count=1, slave=1)
            if not result.isError():
                return bool(result.bits[0])  # Retorna True (1) o False (0)
        return None
    except Exception as e:
        logger.error(f"Error Modbus en {ip}: {e}")
        return None
    finally:
        client.close()


def leer_bacnet_sync(ip: str, object_type: str, object_instance: str) -> Optional[bool]:
    """Lee un objeto BACnet. Ejecutado en un hilo para no bloquear el loop asíncrono."""
    if not bacnet:
        return None
    try:
        # Formato de lectura BAC0: 'IP_ADDRESS objectType objectInstance presentValue'
        # Ejemplo: '192.168.1.50 binaryInput 1 presentValue'
        query = f"{ip} {object_type} {object_instance} presentValue"
        resultado = bacnet.read(query)
        # BACnet suele devolver 'active'/'inactive' o 1/0
        return True if resultado in ['active', 1, True] else False
    except Exception as e:
        logger.error(f"Error BACnet en {ip}: {e}")
        return None


async def db_crear_evento(punto: Dict[str, Any]):
    """Inserta el AlarmEvent en la base de datos y dispara la notificación por correo."""
    async with async_session_maker() as session:
        try:
            # Evitar alarmas duplicadas si ya existe una activa
            active_query = select(models.AlarmEvent).where(
                models.AlarmEvent.data_point_id == punto['id'],
                models.AlarmEvent.resolved_at.is_(None),
                models.AlarmEvent.status != models.AlarmStatus.RESOLVED,
            )
            existing = await session.scalar(active_query)

            if not existing:
                new_event = models.AlarmEvent(
                    data_point_id=punto['id'],
                    created_at=datetime.now(timezone.utc),
                    resolved_at=None,
                    status=models.AlarmStatus.GENERATED,
                )
                session.add(new_event)
                await session.flush()

                # Obtener el DataPoint para disparar la notificación por correo según el grupo
                dp = await session.get(models.DataPoint, punto['id'])
                if dp:
                    try:
                        await dispatch_alarm_notification(new_event, dp, session)
                    except Exception as notif_err:
                        logger.error(f"Error al enviar notificación para punto {punto['id']}: {notif_err}")

                await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creando AlarmEvent para punto {punto['id']}: {e}")


async def db_resolver_evento(punto_id: int):
    """Actualiza los AlarmEvents activos marcándolos como 'Resuelta' con timestamp de resolución."""
    async with async_session_maker() as session:
        try:
            active_query = select(models.AlarmEvent).where(
                models.AlarmEvent.data_point_id == punto_id,
                models.AlarmEvent.resolved_at.is_(None),
                models.AlarmEvent.status != models.AlarmStatus.RESOLVED,
            )
            active_events = (await session.scalars(active_query)).all()
            now_utc = datetime.now(timezone.utc)

            for event in active_events:
                event.status = models.AlarmStatus.RESOLVED
                event.resolved_at = now_utc

            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Error resolviendo AlarmEvent para punto {punto_id}: {e}")


async def db_actualizar_estado(punto_id: int, estado: bool):
    """Función auxiliar para registrar el estado de lectura si se requiere."""
    pass


async def procesar_punto(punto: Dict[str, Any]):
    """Evalúa un punto de datos, realiza la lectura y gestiona el disparo de alarmas."""
    punto_id = punto['id']
    estado_actual = None
    proto = str(punto.get('protocolo', '')).lower()

    if proto == 'modbus':
        estado_actual = await leer_modbus(punto['ip'], 502, punto['direccion'])
    
    elif proto == 'bacnet':
        # asyncio.to_thread evita que la llamada síncrona de BAC0 bloquee FastAPI
        estado_actual = await asyncio.to_thread(
            leer_bacnet_sync, punto['ip'], punto.get('bacnet_type', 'binaryInput'), punto['direccion']
        )

    if estado_actual is None:
        return  # Fallo de lectura, se ignora en este ciclo o se registra un error de comms

    # Lógica de detección de flancos (Máquina de estados)
    estado_prev = estado_anterior.get(punto_id, False)

    if estado_actual == True and estado_prev == False:
        logger.warning(f"[!] ALARMA DISPARADA: {punto['nombre']}")
        # Llamada a Base de Datos para INSERTAR el AlarmEvent y notificar
        await db_crear_evento(punto)
        
        grupo_nombre = punto.get('grupo_nombre') or punto.get('grupo', 'General')
        # Emitir el evento en tiempo real al Frontend vía WebSocket
        await manager.broadcast({
            "type": "ALARM_TRIGGERED",
            "group": grupo_nombre,
            "point_name": punto['nombre'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    elif estado_actual == False and estado_prev == True:
        logger.info(f"[OK] ALARMA RESUELTA: {punto['nombre']}")
        # Llamada a la BD para ACTUALIZAR el AlarmEvent con el timestamp de cierre
        await db_resolver_evento(punto_id)
        
        grupo_nombre = punto.get('grupo_nombre') or punto.get('grupo', 'General')
        # Emitir el evento en tiempo real al Frontend vía WebSocket
        await manager.broadcast({
            "type": "ALARM_RESOLVED",
            "group": grupo_nombre,
            "point_name": punto['nombre'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    # Actualizar la memoria y el estado actual en base de datos
    estado_anterior[punto_id] = estado_actual
    await db_actualizar_estado(punto_id, estado_actual)


async def motor_polling(
    lista_puntos: Optional[List[Dict[str, Any]]] = None,
    poll_interval: float = 2.0,
    stop_event: Optional[asyncio.Event] = None
):
    """
    Bucle infinito que escanea los equipos cíclicamente.
    Si se proporciona 'lista_puntos', monitorea esa lista fija (ideal para pruebas).
    Si 'lista_puntos' es None, consulta dinámicamente los DataPoints de la base de datos en cada ciclo.
    """
    logger.info("Motor de Polling BMS iniciado.")
    try:
        while stop_event is None or not stop_event.is_set():
            puntos_a_procesar = []

            if lista_puntos is not None:
                puntos_a_procesar = lista_puntos
            else:
                # 1. Leer los DataPoints activos directamente de la base de datos
                async with async_session_maker() as session:
                    try:
                        result = await session.scalars(
                            select(models.DataPoint).where(models.DataPoint.is_active.is_(True))
                        )
                        datapoints = result.all()
                    except Exception as e:
                        logger.error(f"Error consultando DataPoints en base de datos: {e}")
                        datapoints = []

                # 2. Formatear la lista de puntos para el motor
                for dp in datapoints:
                    proto = dp.protocol.value if hasattr(dp.protocol, 'value') else str(dp.protocol)
                    b_type = dp.bacnet_type or ("binaryInput" if "bacnet" in proto.lower() else None)
                    puntos_a_procesar.append({
                        "id": dp.id,
                        "nombre": dp.name,
                        "protocolo": proto.lower(),
                        "ip": dp.ip_address,
                        "direccion": dp.address,
                        "bacnet_type": b_type,
                    })

            # 3. Ejecuta todas las lecturas concurrentemente
            if puntos_a_procesar:
                tareas = [procesar_punto(punto) for punto in puntos_a_procesar]
                await asyncio.gather(*tareas)

            # 4. Tiempo de espera entre ciclos (ej. 2 segundos)
            try:
                await asyncio.sleep(poll_interval)
            except asyncio.CancelledError:
                break
    except asyncio.CancelledError:
        logger.info("Motor de Polling BMS cancelado.")
    finally:
        if bacnet:
            try:
                bacnet.disconnect()
            except Exception:
                pass
        logger.info("Motor de Polling BMS detenido.")


# Alias de conveniencia para la integración con el ciclo de vida de FastAPI
bms_polling_worker = motor_polling
