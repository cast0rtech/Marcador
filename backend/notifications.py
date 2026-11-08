import os
import aiosmtplib
from email.message import EmailMessage
from database import AsyncSessionLocal
from models import NotificationLog, NotificationChannel
import logging

logger = logging.getLogger("BMS_Notifications")

# Configuración del servidor SMTP (Ejemplo usando variables de entorno)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "tu_correo@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "tu_password_de_aplicacion")

# Mapeo básico de grupos a correos (en producción, podrías añadir un campo 'email' a la tabla AlarmGroup)
CONTACTOS_POR_GRUPO = {
    "Climatización": "mantenimiento_clima@empresa.com",
    "Incendios": "seguridad@empresa.com",
    "default": "admin_bms@empresa.com"
}


async def enviar_email_async(alarm_event_id: int, nombre_punto: str, grupo_nombre: str, ip: str, direccion: str = ""):
    """
    Construye y despacha el correo electrónico de forma asíncrona hacia el destinatario del grupo,
    y registra el resultado ('delivered' o 'failed') en la tabla NotificationLog para auditoría.
    """
    # 1. Determinar el destinatario según el grupo
    destinatario = CONTACTOS_POR_GRUPO.get(grupo_nombre, CONTACTOS_POR_GRUPO["default"])

    # 2. Construir el mensaje de correo
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = destinatario
    msg["Subject"] = f"🚨 ALERTA BMS: Disparo en {nombre_punto} ({grupo_nombre})"
    
    contenido = f"""ALERTA CRÍTICA DE SISTEMA BMS
==================================================
Se ha detectado una condición de alarma en planta:

- Punto de Datos : {nombre_punto}
- Subsistema/Grupo: {grupo_nombre}
- IP Equipo      : {ip}
- Dirección/Reg  : {direccion}
- ID de Evento   : #{alarm_event_id}

Por favor, proceda a verificar el estado físico de la instalación.
==================================================
Mensaje automático generado por el motor de supervisión BMS.
"""
    msg.set_content(contenido)

    # 3. Envío asíncrono vía SMTP (usando SSL en puerto 465 o STARTTLS en puerto 587)
    use_tls = (SMTP_PORT == 465)
    start_tls = (SMTP_PORT == 587)
    estado_envio = "delivered"

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER if SMTP_USER and "tu_correo" not in SMTP_USER else None,
            password=SMTP_PASS if SMTP_PASS and "tu_password" not in SMTP_PASS else None,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=10.0,
        )
        logger.info(f"📧 [NOTIFICACIÓN] Email enviado exitosamente a {destinatario} para evento #{alarm_event_id}")
    except Exception as e:
        estado_envio = f"failed: {str(e)[:40]}"
        logger.error(f"❌ [NOTIFICACIÓN ERROR] Fallo al enviar email a {destinatario}: {e}")

    # 4. Registrar en la tabla transaccional NotificationLog (Auditoría)
    try:
        async with AsyncSessionLocal() as session:
            log_entry = NotificationLog(
                alarm_event_id=alarm_event_id,
                recipient=destinatario,
                channel=NotificationChannel.EMAIL,
                delivery_status=estado_envio
            )
            session.add(log_entry)
            await session.commit()
    except Exception as db_err:
        logger.error(f"Error guardando NotificationLog en BD: {db_err}")

    return estado_envio == "delivered"


# Alias de conveniencia para invocar pasando el objeto o diccionario
async def dispatch_alarm_notification(new_event, datapoint, session=None):
    """Wrapper para compatibilidad con llamadas directas desde el motor de polling."""
    nombre = getattr(datapoint, 'name', None) or datapoint.get('nombre', 'Punto desconocido')
    ip = getattr(datapoint, 'ip_address', None) or datapoint.get('ip', '127.0.0.1')
    direccion = str(getattr(datapoint, 'address', None) or datapoint.get('direccion', ''))
    
    # Obtener nombre de grupo
    grupo_obj = getattr(datapoint, 'group', None)
    if grupo_obj:
        grupo_nombre = grupo_obj.name
    elif isinstance(datapoint, dict) and 'grupo' in datapoint:
        grupo_nombre = datapoint['grupo']
    else:
        grupo_nombre = "default"

    event_id = getattr(new_event, 'id', None) or new_event.get('id', 0)
    return await enviar_email_async(event_id, nombre, grupo_nombre, ip, direccion)
