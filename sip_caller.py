import os
import time
import asyncio
import logging

logger = logging.getLogger("BMS_SIP_Caller")

try:
    from gtts import gTTS
    from pydub import AudioSegment
    from pyVoIP.VoIP import VoIPPhone, CallState
except ImportError as err:
    VoIPPhone = None
    CallState = None
    gTTS = None
    AudioSegment = None
    logger.warning("Librerías pyVoIP, gTTS o pydub no están instaladas en este entorno. Las llamadas SIP permanecerán inactivas.")

# Credenciales de la centralita SIP (PBX local)
SIP_SERVER = os.getenv("SIP_SERVER", "192.168.1.100")
SIP_PORT = int(os.getenv("SIP_PORT", 5060))
SIP_USER = os.getenv("SIP_USER", "101")      # Extensión del BMS
SIP_PASS = os.getenv("SIP_PASS", "password")


def generar_audio_voip(texto: str, filename: str = "alarma_voip.wav", lang: str = "es") -> str:
    """Genera el TTS y lo convierte al formato estricto de VoIP (8kHz, 16-bit, Mono)"""
    if gTTS is None or AudioSegment is None:
        raise RuntimeError("gTTS y pydub son requeridos para generar audio VoIP.")
        
    mp3_tmp = f"tmp_{int(time.time() * 1000)}_alarma.mp3"
    
    # 1. Generar voz (con soporte multilingüe, por defecto español)
    tts = gTTS(text=texto, lang=lang, slow=False)
    tts.save(mp3_tmp)
    
    # 2. Convertir a formato PCMU/WAV compatible con SIP
    audio = AudioSegment.from_mp3(mp3_tmp)
    audio = audio.set_frame_rate(8000).set_channels(1).set_sample_width(2)
    audio.export(filename, format="wav")
    
    if os.path.exists(mp3_tmp):
        os.remove(mp3_tmp)
    return filename


def ejecutar_llamada_sync(destino: str, texto: str, lang: str = "es") -> str:
    """Registra el SIP, llama al destino y reproduce el audio."""
    if VoIPPhone is None:
        logger.error("pyVoIP no está instalado. No se puede realizar la llamada.")
        return "failed: pyVoIP not installed"

    wav_file = f"alarma_voip_{int(time.time() * 1000)}.wav"
    try:
        generar_audio_voip(texto, wav_file, lang=lang)
    except Exception as e:
        logger.error(f"Error generando TTS VoIP: {e}")
        return f"failed_tts: {e}"
    
    # Iniciar el cliente SIP
    phone = VoIPPhone(SIP_SERVER, SIP_PORT, SIP_USER, SIP_PASS)
    phone.start()
    
    # Pausa breve para asegurar el registro SIP
    time.sleep(2) 
    
    estado_final = "failed"
    try:
        call = phone.call(destino)
        
        # Esperar a que el destino conteste (Timeout de 30 segundos)
        timeout = 30
        while call.state not in [CallState.ANSWERED, CallState.ENDED] and timeout > 0:
            time.sleep(1)
            timeout -= 1
            
        if call.state == CallState.ANSWERED:
            print(f"Llamada contestada por {destino}. Reproduciendo TTS...")
            logger.info(f"Llamada contestada por {destino}. Reproduciendo TTS...")
            estado_final = "answered"
            
            # Leer el archivo WAV a bytes (pyVoIP requiere los frames raw de PCM)
            with open(wav_file, "rb") as f:
                f.read(44)  # Saltar la cabecera del WAV
                audio_data = f.read()
            
            # Reproducir el mensaje 2 veces por seguridad
            for _ in range(2):
                if call.state == CallState.ANSWERED:
                    call.write_audio(audio_data)
                    time.sleep(len(audio_data) / 16000)  # Tiempo aprox de reproducción a 8kHz 16bit
                    time.sleep(1)  # Pausa entre repeticiones
                    
            call.hangup()
        else:
            print(f"Nadie contestó en {destino} o buzón de voz.")
            logger.warning(f"Nadie contestó en {destino} o buzón de voz.")
            estado_final = "no-answer"
            if call.state != CallState.ENDED:
                call.hangup()
                
    except Exception as e:
        print(f"Error en la llamada SIP: {e}")
        logger.error(f"Error en la llamada SIP: {e}")
        estado_final = f"failed: {e}"
    finally:
        try:
            phone.stop()
        except Exception:
            pass
        if os.path.exists(wav_file):
            try:
                os.remove(wav_file)
            except Exception:
                pass
            
    return estado_final


async def llamar_operario_async(destino: str, texto: str, lang: str = "es") -> str:
    """Envuelve la llamada SIP (que bloquea el hilo) en asyncio.to_thread"""
    return await asyncio.to_thread(ejecutar_llamada_sync, destino, texto, lang)

