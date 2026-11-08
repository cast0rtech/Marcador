from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from models import ProtocolType, AlarmStatus, NotificationChannel


# --- AlarmGroup Schemas ---
class AlarmGroupBase(BaseModel):
    name: str = Field(..., max_length=50, description="Nombre descriptivo del grupo de alarma")
    description: Optional[str] = Field(None, max_length=200, description="Descripción opcional")


class AlarmGroupCreate(AlarmGroupBase):
    pass


class AlarmGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=200)


class AlarmGroupRead(AlarmGroupBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- NotificationLog Schemas ---
class NotificationLogBase(BaseModel):
    alarm_event_id: int
    recipient: str = Field(..., max_length=100)
    channel: NotificationChannel = NotificationChannel.EMAIL
    delivery_status: str = Field(..., max_length=50)


class NotificationLogCreate(NotificationLogBase):
    pass


class NotificationLogRead(NotificationLogBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# --- DataPoint Schemas ---
class DataPointBase(BaseModel):
    name: str = Field(..., max_length=100, description="Nombre del punto (ej. Temperatura Chiller 1)")
    protocol: ProtocolType = Field(..., description="Protocolo: modbus o bacnet")
    ip_address: str = Field(..., max_length=50, description="Dirección IP del equipo o PLC")
    bacnet_type: Optional[str] = Field(None, max_length=50, description="Tipo objeto BACnet (ej. binaryInput)")
    address: str = Field(..., max_length=50, description="Dirección Modbus o Instancia BACnet")
    group_id: int = Field(..., description="ID del grupo de alarma asociado")
    is_active: bool = Field(True, description="Habilitar/deshabilitar lectura")


class DataPointCreate(DataPointBase):
    pass


class DataPointUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    protocol: Optional[ProtocolType] = None
    ip_address: Optional[str] = Field(None, max_length=50)
    bacnet_type: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=50)
    group_id: Optional[int] = None
    is_active: Optional[bool] = None


class DataPointRead(DataPointBase):
    id: int
    group: Optional[AlarmGroupRead] = None

    model_config = ConfigDict(from_attributes=True)


# --- AlarmEvent Schemas ---
class AlarmEventBase(BaseModel):
    data_point_id: int
    status: AlarmStatus = AlarmStatus.GENERATED
    acknowledged_by: Optional[str] = None


class AlarmEventCreate(AlarmEventBase):
    pass


class AlarmEventUpdate(BaseModel):
    status: Optional[AlarmStatus] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None


class AlarmEventRead(AlarmEventBase):
    id: int
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    data_point: Optional[DataPointRead] = None
    notifications: List[NotificationLogRead] = []

    model_config = ConfigDict(from_attributes=True)


# --- Bulk Import/Export Response ---
class ImportSummary(BaseModel):
    imported_count: int
    errors: List[str] = []


class UploadPointsSummary(BaseModel):
    total_processed: int
    created_count: int
    updated_count: int
    errors: List[str] = []


# --- Dashboard Summary Schemas ---
class GroupStatusCard(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    total_points: int
    active_alarms: int
    status: str  # "OK" o "Alarma Activa"


class ChartCategoryData(BaseModel):
    category: str
    count: int


class DashboardSummary(BaseModel):
    total_groups: int
    total_points: int
    total_active_alarms: int
    groups: List[GroupStatusCard]
    alarms_last_24h: List[ChartCategoryData]
