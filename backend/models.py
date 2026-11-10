from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
import enum


class Base(AsyncAttrs, DeclarativeBase):
    pass


# --- ENUMS PARA RESTRINGIR VALORES ---

class ProtocolType(str, enum.Enum):
    MODBUS = "modbus"
    BACNET = "bacnet"


class AlarmStatus(str, enum.Enum):
    GENERATED = "Generada"          # Disparada, sin atender
    ESCALATING = "En Escalado"      # Llamando/Enviando SMS
    ACKNOWLEDGED = "Aceptada"       # Un técnico confirmó la recepción
    RESOLVED = "Resuelta"           # El valor volvió a la normalidad física


class NotificationChannel(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    VOICE = "voice"


# --- TABLAS MAESTRAS (CONFIGURACIÓN) ---

class AlarmGroup(Base):
    __tablename__ = "alarm_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # Ej: "Climatización", "Incendios"
    description = Column(String(200), nullable=True)
    
    # Relación inversa: Un grupo tiene muchos DataPoints
    data_points = relationship("DataPoint", back_populates="group", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AlarmGroup(id={self.id}, name='{self.name}')>"


class DataPoint(Base):
    __tablename__ = "data_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    protocol = Column(Enum(ProtocolType), nullable=False)
    ip_address = Column(String(50), nullable=False)
    
    # BACnet requiere tipo de objeto (ej. 'binaryInput'), Modbus puede dejarlo nulo
    bacnet_type = Column(String(50), nullable=True)
    
    # Dirección Modbus (int) o Instancia BACnet (str/int)
    address = Column(String(50), nullable=False) 
    
    group_id = Column(Integer, ForeignKey("alarm_groups.id"), nullable=False)
    is_active = Column(Boolean, default=True)  # Para habilitar/deshabilitar lectura
    tts_message = Column(String(500), nullable=True)  # Texto personalizado para locución de voz TTS
    
    group = relationship("AlarmGroup", back_populates="data_points", lazy="selectin")
    events = relationship("AlarmEvent", back_populates="data_point", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DataPoint(id={self.id}, name='{self.name}', protocol='{self.protocol}')>"


# --- TABLAS TRANSACCIONALES (HISTÓRICO Y AUDITORÍA) ---

class AlarmEvent(Base):
    __tablename__ = "alarm_events"

    id = Column(Integer, primary_key=True, index=True)
    data_point_id = Column(Integer, ForeignKey("data_points.id"), nullable=False)
    
    status = Column(Enum(AlarmStatus), default=AlarmStatus.GENERATED, nullable=False)
    
    # Trazabilidad de tiempos (Timestamps)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoría humana
    acknowledged_by = Column(String(100), nullable=True)  # Usuario/Técnico que dio el ACK
    
    data_point = relationship("DataPoint", back_populates="events", lazy="selectin")
    notifications = relationship("NotificationLog", back_populates="event", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AlarmEvent(id={self.id}, data_point_id={self.data_point_id}, status='{self.status}')>"


class NotificationLog(Base):
    """Registra cada intento de aviso (Email, SMS, Llamada) para un evento de alarma"""
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    alarm_event_id = Column(Integer, ForeignKey("alarm_events.id"), nullable=False)
    
    recipient = Column(String(100), nullable=False)  # Ej: +41791234567 o email@empresa.com
    channel = Column(Enum(NotificationChannel), default=NotificationChannel.EMAIL, nullable=False)
    
    # Estado devuelto por el módem o la API (ej. 'delivered', 'no-answer', 'failed')
    delivery_status = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    event = relationship("AlarmEvent", back_populates="notifications", lazy="selectin")

    def __repr__(self) -> str:
        return f"<NotificationLog(id={self.id}, recipient='{self.recipient}', status='{self.delivery_status}')>"
