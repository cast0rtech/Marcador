import asyncio
from datetime import datetime, timezone
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.future import select
from sqlalchemy.sql import func
from database import AsyncSessionLocal, async_session_maker
from models import AlarmEvent, AlarmStatus, DataPoint
import models
from notifications import procesar_notificacion, dispatch_alarm_notification
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

# Inicializar BACnet lite
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

# Memoria para lógica física
estado_anterior: Dict[int, bool] = {}
eventos_activos: Dict[int, int] = {}

# --- MEMORIA DEL WATCHDOG (Línea de Vida) ---
MAX_TIMEOUTS = 3  # 3 ciclos fallidos consecutivos (~6 segundos) para declarar caída
watchdog_fallos: Dict[str, int] = {}  # Contador de fallos consecutivos por IP
watchdog_alarmas: Dict[str, int] = {}  # ID del evento de BD cuando la IP está caída


def parse_bacnet_address(register_str: str) -> Tuple[str, str]:
    """Normaliza el direccionamiento BACnet extrayendo el tipo de objeto y la instancia."""
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
        query = f"{ip} {object_type} {object_instance} presentValue"
        resultado = bacnet.read(query)
        return True if resultado in ['active', 1, True] else False
    except Exception as e:
        logger.error(f"Error BACnet en {ip}: {e}")
        return None


async def disparar_alarma_watchdog(ip: str, punto: dict):
    """Genera una alarma crítica de pérdida de comunicaciones para todo el PLC."""
    print(f"[WATCHDOG CRÍTICO] Pérdida de enlace de red con equipo {ip}")

    now_iso = datetime.now(timezone.utc).isoformat()
    nuevo_evento_id = None

    try:
        async with AsyncSessionLocal() as session:
            nuevo_evento = AlarmEvent(
                data_point_id=punto['id'],  # Asociamos la caída al primer punto de esta IP
                status=AlarmStatus.GENERATED
            )
            session.add(nuevo_evento)
            await session.commit()
            await session.refresh(nuevo_evento)
            nuevo_evento_id = nuevo_evento.id
            watchdog_alarmas[ip] = nuevo_evento.id
    except Exception as db_err:
        logger.error(f"[WATCHDOG] Error guardando alarma en BD para IP {ip}: {db_err}")

    # Emitir al Dashboard por WebSocket
    await manager.broadcast({
        "type": "ALARM_TRIGGERED",
        "group": "SISTEMA - WATCHDOG",
        "point_name": f"Pérdida de Comunicación IP: {ip}",
        "timestamp": now_iso
    })

    # Enviar notificación crítica (Email / SIP con mensaje TTS adaptado)
    if nuevo_evento_id:
        mensaje_tts_watchdog = f"Alerta crítica del sistema. Se ha perdido el enlace de comunicación con el autómata en la dirección IP {ip}."
        asyncio.create_task(
            procesar_notificacion(
                nuevo_evento_id,
                f"Fallo de Red en IP {ip}",
                "SISTEMA - WATCHDOG",
                texto_tts=mensaje_tts_watchdog
            )
        )


async def resolver_alarma_watchdog(ip: str):
    """Resuelve la alarma de comunicaciones cuando el PLC vuelve a responder."""
    print(f"[WATCHDOG OK] Enlace de red restablecido con {ip}")
    evento_id = watchdog_alarmas.pop(ip, None)

    if evento_id:
        try:
            async with AsyncSessionLocal() as session:
                stmt = select(AlarmEvent).where(AlarmEvent.id == evento_id)
                result = await session.execute(stmt)
                evento = result.scalars().first()

                if evento:
                    evento.status = AlarmStatus.RESOLVED
                    evento.resolved_at = func.now()
                    await session.commit()
        except Exception as db_err:
            logger.error(f"[WATCHDOG] Error resolviendo evento #{evento_id} en BD: {db_err}")

        await manager.broadcast({
            "type": "ALARM_RESOLVED",
            "group": "SISTEMA - WATCHDOG",
            "point_name": f"Pérdida de Comunicación IP: {ip}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })


async def procesar_punto(punto: Dict[str, Any]):
    """
    Procesa un punto de datos con evaluación de Watchdog por IP para evitar 
    tormentas de alarmas ante caídas de PLC y detección de flancos físicos.
    """
    punto_id = punto['id']
    ip = punto['ip']
    estado_actual = None

    # --- LECTURA FÍSICA ---
    proto = str(punto.get('protocolo', '')).lower()
    if proto == 'modbus':
        estado_actual = await leer_modbus(ip, 502, punto['direccion'])
    elif proto == 'bacnet':
        estado_actual = await asyncio.to_thread(
            leer_bacnet_sync, ip, punto.get('bacnet_type', 'binaryInput'), punto['direccion']
        )

    # --- EVALUACIÓN WATCHDOG (Línea de Transmisión SES) ---
    if estado_actual is None:
        # Fallo de lectura
        fallos = watchdog_fallos.get(ip, 0)

        # Solo incrementamos y disparamos si la IP no está YA declarada como caída
        if ip not in watchdog_alarmas:
            watchdog_fallos[ip] = fallos + 1
            if watchdog_fallos[ip] == MAX_TIMEOUTS:
                await disparar_alarma_watchdog(ip, punto)

        return  # Abortamos el procesamiento físico porque no hay datos fiables

    else:
        # Lectura exitosa: Comprobamos si el equipo venía de una caída de red
        if ip in watchdog_alarmas:
            await resolver_alarma_watchdog(ip)

        watchdog_fallos[ip] = 0  # Reseteamos contador

    # --- MÁQUINA DE ESTADOS FÍSICA (Flancos) ---
    estado_prev = estado_anterior.get(punto_id, False)
    grupo_nombre = punto.get('grupo_nombre') or punto.get('grupo', 'General')
    now_iso = datetime.now(timezone.utc).isoformat()

    # Flanco de Subida (0 -> 1)
    if estado_actual is True and estado_prev is False:
        print(f"[!] ALARMA FÍSICA DISPARADA: {punto['nombre']}")

        nuevo_evento_id = None
        try:
            async with AsyncSessionLocal() as session:
                nuevo_evento = AlarmEvent(data_point_id=punto_id, status=AlarmStatus.GENERATED)
                session.add(nuevo_evento)
                await session.commit()
                await session.refresh(nuevo_evento)
                eventos_activos[punto_id] = nuevo_evento.id
                nuevo_evento_id = nuevo_evento.id
        except Exception as db_err:
            logger.error(f"Error creando AlarmEvent para punto {punto_id}: {db_err}")

        await manager.broadcast({
            "type": "ALARM_TRIGGERED",
            "group": grupo_nombre,
            "point_name": punto['nombre'],
            "timestamp": now_iso
        })

        if nuevo_evento_id:
            texto_tts = punto.get('tts_message')
            asyncio.create_task(
                procesar_notificacion(
                    nuevo_evento_id,
                    punto['nombre'],
                    grupo_nombre,
                    texto_tts=texto_tts
                )
            )

    # Flanco de Bajada (1 -> 0)
    elif estado_actual is False and estado_prev == True:
        print(f"[OK] ALARMA FÍSICA RESUELTA: {punto['nombre']}")
        evento_id = eventos_activos.pop(punto_id, None)

        if evento_id:
            try:
                async with AsyncSessionLocal() as session:
                    stmt = select(AlarmEvent).where(AlarmEvent.id == evento_id)
                    result = await session.execute(stmt)
                    evento = result.scalars().first()
                    if evento:
                        evento.status = AlarmStatus.RESOLVED
                        evento.resolved_at = func.now()
                        await session.commit()
            except Exception as db_err:
                logger.error(f"Error resolviendo AlarmEvent #{evento_id}: {db_err}")

            await manager.broadcast({
                "type": "ALARM_RESOLVED",
                "group": grupo_nombre,
                "point_name": punto['nombre'],
                "timestamp": now_iso
            })

    # Actualizar la memoria del ciclo
    estado_anterior[punto_id] = estado_actual


async def motor_polling(
    lista_puntos: Optional[List[Dict[str, Any]]] = None,
    poll_interval: float = 2.0,
    stop_event: Optional[asyncio.Event] = None
):
    """Bucle que escanea los equipos cíclicamente si se ejecuta de forma independiente."""
    logger.info("Motor de Polling BMS iniciado.")
    try:
        while stop_event is None or not stop_event.is_set():
            puntos_a_procesar = []

            if lista_puntos is not None:
                puntos_a_procesar = lista_puntos
            else:
                async with AsyncSessionLocal() as session:
                    try:
                        result = await session.scalars(
                            select(DataPoint).where(DataPoint.is_active.is_(True))
                        )
                        datapoints = result.all()
                    except Exception as e:
                        logger.error(f"Error consultando DataPoints en base de datos: {e}")
                        datapoints = []

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
                        "grupo_nombre": dp.group.name if dp.group else "General",
                        "grupo": dp.group.name if dp.group else "General",
                        "tts_message": dp.tts_message,
                    })

            if puntos_a_procesar:
                tareas = [procesar_punto(punto) for punto in puntos_a_procesar]
                await asyncio.gather(*tareas)

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


# Alias de compatibilidad
bms_polling_worker = motor_polling
