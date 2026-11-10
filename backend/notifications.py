import os
try:
    import aiosmtplib
except ImportError:
    aiosmtplib = None
from email.message import EmailMessage
from database import AsyncSessionLocal
from models import NotificationLog, NotificationChannel
from sip_caller import llamar_operario_async
import logging

logger = logging.getLogger("BMS_Notifications")

# Configuración del servidor SMTP
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "tu_correo@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "tu_password_de_aplicacion")

# Configuración SIP / Operario por defecto
DEFAULT_SIP_PHONE = os.getenv("SIP_OPERATOR_PHONE", "+41791234567")
DEFAULT_NOTIFICATION_CHANNEL = os.getenv("DEFAULT_NOTIFICATION_CHANNEL", "email").lower()

# Mapeo básico de grupos a correos y teléfonos
CONTACTOS_POR_GRUPO = {
    "Climatización": "mantenimiento_clima@empresa.com",
    "Incendios": "seguridad@empresa.com",
    "default": "admin_bms@empresa.com"
}

TELEFONOS_POR_GRUPO = {
    "Climatización": os.getenv("SIP_PHONE_CLIMA", DEFAULT_SIP_PHONE),
    "Incendios": os.getenv("SIP_PHONE_INCENDIOS", DEFAULT_SIP_PHONE),
    "default": DEFAULT_SIP_PHONE
}


async def enviar_email_async(*args, **kwargs) -> str:
    """
    Envía un email asíncrono. Soporta dos firmas:
    1) enviar_email_async(destinatario, asunto, cuerpo) -> str ("delivered" o "failed: ...")
    2) enviar_email_async(alarm_event_id, nombre_punto, grupo_nombre, ip, direccion) -> bool
    """
    if len(args) == 3 and isinstance(args[0], str) and isinstance(args[1], str):
        destinatario, asunto, cuerpo = args
        return await _enviar_email_directo(destinatario, asunto, cuerpo)
        
    # Firma legacy con registro directo
    if len(args) >= 3:
        alarm_event_id = args[0]
        nombre_punto = args[1]
        grupo_nombre = args[2]
        ip = args[3] if len(args) > 3 else "127.0.0.1"
        direccion = args[4] if len(args) > 4 else ""
        
        destinatario = CONTACTOS_POR_GRUPO.get(grupo_nombre, CONTACTOS_POR_GRUPO["default"])
        asunto = f"🚨 ALERTA BMS: Disparo en {nombre_punto} ({grupo_nombre})"
        cuerpo = f"""ALERTA CRÍTICA DE SISTEMA BMS
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
        estado = await _enviar_email_directo(destinatario, asunto, cuerpo)
        
        # Guardar log en BD
        try:
            async with AsyncSessionLocal() as session:
                log_entry = NotificationLog(
                    alarm_event_id=alarm_event_id,
                    recipient=destinatario,
                    channel=NotificationChannel.EMAIL,
                    delivery_status=estado
                )
                session.add(log_entry)
                await session.commit()
        except Exception as db_err:
            logger.error(f"Error guardando NotificationLog en BD: {db_err}")
            
        return estado == "delivered"

    destinatario = kwargs.get("destinatario", CONTACTOS_POR_GRUPO["default"])
    asunto = kwargs.get("asunto", "Alerta BMS")
    cuerpo = kwargs.get("cuerpo", "Fallo detectado en BMS")
    return await _enviar_email_directo(destinatario, asunto, cuerpo)


async def _enviar_email_directo(destinatario: str, asunto: str, cuerpo: str) -> str:
    """Construye y envía el correo electrónico usando aiosmtplib."""
    if not aiosmtplib:
        logger.warning("aiosmtplib no está instalado. No se puede enviar el correo.")
        return "failed: aiosmtplib not installed"

    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = destinatario
    msg["Subject"] = asunto
    msg.set_content(cuerpo)

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
        logger.info(f"📧 [NOTIFICACIÓN] Email enviado exitosamente a {destinatario}")
    except Exception as e:
        estado_envio = f"failed: {str(e)[:40]}"
        logger.error(f"❌ [NOTIFICACIÓN ERROR] Fallo al enviar email a {destinatario}: {e}")

    return estado_envio


async def procesar_notificacion(
    evento_id: int, 
    nombre_punto: str, 
    nombre_grupo: str, 
    canal: NotificationChannel = NotificationChannel.EMAIL,
    telefono_destino: str = None,
    texto_tts: str = None
) -> str:
    """Procesa el aviso según el canal elegido (Email o Voz)."""
    
    if canal == NotificationChannel.VOICE:
        # Teléfono del técnico de guardia asignado al grupo
        telefono = telefono_destino or TELEFONOS_POR_GRUPO.get(nombre_grupo, DEFAULT_SIP_PHONE)
        
        # Usar el texto TTS configurado por Excel/CSV en el punto, o el formato por defecto
        if texto_tts and str(texto_tts).strip():
            mensaje_a_reproducir = str(texto_tts).strip()
        else:
            mensaje_a_reproducir = (
                f"Atención. Alarma crítica del sistema BMS en el edificio. "
                f"El punto de datos {nombre_punto}, correspondiente al grupo {nombre_grupo}, "
                f"ha reportado un fallo. Por favor, revise el panel de control inmediatamente."
            )
        
        # Ejecutamos la llamada SIP asíncrona
        logger.info(f"📞 Iniciando llamada SIP a {telefono} para evento #{evento_id} con TTS: '{mensaje_a_reproducir[:60]}...'")
        estado_envio = await llamar_operario_async(telefono, mensaje_a_reproducir)
        destinatario_log = telefono
        
    else:
        # Lógica de Email
        destinatario_log = CONTACTOS_POR_GRUPO.get(nombre_grupo, CONTACTOS_POR_GRUPO["default"])
        asunto = f"ALERTA CRÍTICA BMS: Fallo en {nombre_punto} ({nombre_grupo})"
        cuerpo = (
            f"Fallo detectado en: {nombre_punto}.\n"
            f"Grupo: {nombre_grupo}\n"
            f"ID de Evento: #{evento_id}\n\n"
            f"Por favor, revise el panel SCADA inmediatamente."
        )
        estado_envio = await _enviar_email_directo(destinatario_log, asunto, cuerpo)

    # Registro en Auditoría
    try:
        async with AsyncSessionLocal() as session:
            log = NotificationLog(
                alarm_event_id=evento_id,
                recipient=destinatario_log,
                channel=canal,
                delivery_status=estado_envio
            )
            session.add(log)
            await session.commit()
    except Exception as db_err:
        logger.error(f"Error guardando NotificationLog en BD: {db_err}")

    return estado_envio


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

    event_id = getattr(new_event, 'id', None) or (new_event.get('id', 0) if isinstance(new_event, dict) else 0)

    # Determinar canal según configuración global o del grupo
    if DEFAULT_NOTIFICATION_CHANNEL == "voice":
        canal = NotificationChannel.VOICE
    else:
        canal = NotificationChannel.EMAIL

    # Extraer texto TTS personalizado del datapoint si fue configurado por Excel/CSV
    texto_tts_custom = getattr(datapoint, 'tts_message', None)
    if not texto_tts_custom and isinstance(datapoint, dict):
        texto_tts_custom = (
            datapoint.get('tts_message') or 
            datapoint.get('Texto_TTS') or 
            datapoint.get('Mensaje_TTS') or 
            datapoint.get('texto_tts')
        )

    return await procesar_notificacion(
        event_id, 
        nombre, 
        grupo_nombre, 
        canal=canal, 
        texto_tts=texto_tts_custom
    )
