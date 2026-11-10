import io
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload

from database import get_db
from models import AlarmEvent, DataPoint
import models
import schemas
from pdf_exporter import generar_pdf_auditoria

router = APIRouter(tags=["DataPoints & Dashboard"])
router_alarms = APIRouter(prefix="/api/alarms", tags=["Alarms"])


# =========================================================================
# Registro de Auditoría y Trazabilidad de Alarmas
# =========================================================================

@router_alarms.get("/history")
@router.get("/api/alarms/history", include_in_schema=False)
async def get_alarm_history(db: AsyncSession = Depends(get_db)):
    """Obtiene los últimos 100 eventos de alarma con su trazabilidad de notificaciones."""
    
    # Consulta optimizada que pre-carga las tablas relacionadas
    stmt = (
        select(AlarmEvent)
        .options(
            joinedload(AlarmEvent.data_point).joinedload(DataPoint.group),
            selectinload(AlarmEvent.notifications)
        )
        .order_by(AlarmEvent.created_at.desc())
        .limit(100)
    )
    
    result = await db.execute(stmt)
    eventos = result.scalars().all()
    
    data = []
    for ev in eventos:
        # Formateamos el log de notificaciones en un array de strings legibles
        notificaciones_str = [
            f"{n.channel.value.upper() if hasattr(n.channel, 'value') else str(n.channel).upper()} -> {n.recipient} [{n.delivery_status}]" 
            for n in ev.notifications
        ]
        
        data.append({
            "id": ev.id,
            "fecha_inicio": ev.created_at.isoformat() if ev.created_at else None,
            "fecha_resolucion": ev.resolved_at.isoformat() if ev.resolved_at else None,
            "grupo": ev.data_point.group.name if (ev.data_point and ev.data_point.group) else "Sin Grupo",
            "punto": ev.data_point.name if ev.data_point else f"Punto #{ev.data_point_id}",
            "estado": ev.status.value if hasattr(ev.status, "value") else str(ev.status),
            "notificaciones": notificaciones_str
        })
        
    return data


@router_alarms.get("/export/pdf")
@router.get("/api/alarms/export/pdf", include_in_schema=False)
async def export_alarm_history_pdf(lang: str = Query("es", description="Idioma del reporte: es, en, de"), db: AsyncSession = Depends(get_db)):
    """Genera y descarga un PDF con el histórico completo de alarmas y notificaciones."""
    stmt = (
        select(AlarmEvent)
        .options(
            joinedload(AlarmEvent.data_point).joinedload(DataPoint.group),
            selectinload(AlarmEvent.notifications)
        )
        .order_by(AlarmEvent.created_at.desc())
        .limit(200)
    )
    result = await db.execute(stmt)
    eventos = result.scalars().all()
    
    pdf_buffer = generar_pdf_auditoria(eventos, lang=lang)
    
    filename = "Auditoria_BMS.pdf" if lang == "es" else "BMS_Audit_Report.pdf" if lang == "en" else "BMS_Auditbericht.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# =========================================================================
# 1. Endpoints de Importación y Exportación de Puntos (/api/points)
# =========================================================================

@router.get("/api/points/export", summary="Exportar puntos configurados a CSV")
@router.get("/export-points", include_in_schema=False)
async def export_points(db: AsyncSession = Depends(get_db)):
    """Exporta todos los DataPoints activos y sus grupos a un archivo CSV."""
    stmt = select(models.DataPoint, models.AlarmGroup).join(models.AlarmGroup)
    result = await db.execute(stmt)

    data = []
    for dp, group in result.all():
        data.append({
            "Nombre": dp.name,
            "Protocolo": dp.protocol.value if hasattr(dp.protocol, "value") else str(dp.protocol),
            "IP": dp.ip_address,
            "Direccion": dp.address,
            "Tipo_BACnet": dp.bacnet_type if dp.bacnet_type else "",
            "Grupo": group.name,
            "Activo": dp.is_active,
            "Texto_TTS": dp.tts_message if dp.tts_message else "",
        })

    if not data:
        raise HTTPException(status_code=404, detail="No hay puntos para exportar.")

    df = pd.DataFrame(data)
    stream = io.BytesIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=configuracion_puntos.csv"},
    )


@router.post("/api/points/import", summary="Importar puntos desde CSV o Excel")
@router.post("/upload-points", include_in_schema=False)
async def import_points(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Importa puntos desde un archivo CSV o Excel y crea los grupos si no existen."""
    contents = await file.read()
    filename = (file.filename or "").lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa .csv o .xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo el archivo: {str(e)}")

    columnas_requeridas = {"Nombre", "Protocolo", "IP", "Direccion", "Grupo"}
    if not columnas_requeridas.issubset(df.columns):
        raise HTTPException(
            status_code=400,
            detail=f"El archivo debe contener las columnas: {', '.join(columnas_requeridas)}",
        )

    puntos_importados = 0
    grupos_cache = {}

    for index, row in df.iterrows():
        nombre_grupo = str(row["Grupo"]).strip()

        if nombre_grupo in grupos_cache:
            grupo = grupos_cache[nombre_grupo]
        else:
            stmt = select(models.AlarmGroup).where(models.AlarmGroup.name == nombre_grupo)
            result = await db.execute(stmt)
            grupo = result.scalars().first()

            if not grupo:
                grupo = models.AlarmGroup(name=nombre_grupo)
                db.add(grupo)
                await db.flush()  # Asigna ID autonumérico sin consolidar commit aún

            grupos_cache[nombre_grupo] = grupo

        protocolo_str = str(row["Protocolo"]).strip().lower()
        if protocolo_str == models.ProtocolType.MODBUS.value:
            protocolo = models.ProtocolType.MODBUS
        elif protocolo_str == models.ProtocolType.BACNET.value:
            protocolo = models.ProtocolType.BACNET
        else:
            continue

        bacnet_type = None
        if pd.notna(row.get("Tipo_BACnet")) and str(row.get("Tipo_BACnet")).strip() != "":
            bacnet_type = str(row["Tipo_BACnet"]).strip()

        # Extraer texto TTS personalizado si existe en la columna
        tts_message = None
        for col_name in ["Texto_TTS", "Mensaje_TTS", "TTS", "tts_message", "Texto_Voz", "Mensaje_Voz"]:
            val = row.get(col_name)
            if pd.notna(val) and str(val).strip() != "":
                tts_message = str(val).strip()
                break

        nuevo_punto = models.DataPoint(
            name=str(row["Nombre"]).strip(),
            protocol=protocolo,
            ip_address=str(row["IP"]).strip(),
            address=str(row["Direccion"]).strip(),
            bacnet_type=bacnet_type,
            group_id=grupo.id,
            is_active=bool(row.get("Activo", True)),
            tts_message=tts_message,
        )

        db.add(nuevo_punto)
        puntos_importados += 1

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando en base de datos: {str(e)}")

    return {"message": f"Importación exitosa. {puntos_importados} puntos registrados."}


# =========================================================================
# 2. Endpoints para el Dashboard Frontend React
# =========================================================================

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary, tags=["Dashboard"])
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Métricas en tiempo real para las tarjetas y gráficos del dashboard."""
    groups = (await db.scalars(select(models.AlarmGroup))).all()
    all_datapoints = (await db.scalars(select(models.DataPoint))).all()

    active_alarms_query = select(models.AlarmEvent).where(
        models.AlarmEvent.resolved_at.is_(None),
        models.AlarmEvent.status != models.AlarmStatus.RESOLVED,
    )
    active_alarms = (await db.scalars(active_alarms_query)).all()
    active_dp_ids = {a.data_point_id for a in active_alarms}

    group_cards = []
    for g in groups:
        g_datapoints = [dp for dp in all_datapoints if dp.group_id == g.id]
        g_active_count = sum(1 for dp in g_datapoints if dp.id in active_dp_ids)
        group_cards.append(
            schemas.GroupStatusCard(
                id=g.id,
                name=g.name,
                description=g.description,
                total_points=len(g_datapoints),
                active_alarms=g_active_count,
                status="Alarma Activa" if g_active_count > 0 else "OK",
            )
        )

    cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_alarms_query = select(models.AlarmEvent).where(models.AlarmEvent.created_at >= cutoff_24h)
    recent_alarms = (await db.scalars(recent_alarms_query)).all()

    dp_map = {dp.id: dp for dp in all_datapoints}
    group_map = {g.id: g.name for g in groups}

    category_counts = {g.name: 0 for g in groups}
    for alarm in recent_alarms:
        dp = dp_map.get(alarm.data_point_id)
        if dp and dp.group_id in group_map:
            cat_name = group_map[dp.group_id]
            category_counts[cat_name] = category_counts.get(cat_name, 0) + 1
        else:
            category_counts["Sin Grupo"] = category_counts.get("Sin Grupo", 0) + 1

    chart_data = [
        schemas.ChartCategoryData(category=cat, count=cnt)
        for cat, cnt in category_counts.items()
    ]

    return schemas.DashboardSummary(
        total_groups=len(groups),
        total_points=len(all_datapoints),
        total_active_alarms=len(active_alarms),
        groups=group_cards,
        alarms_last_24h=chart_data,
    )


@router.get("/alarm-events/", response_model=List[schemas.AlarmEventRead], tags=["Alarm Events"])
async def list_alarm_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Listado histórico de alarmas para la tabla DataGrid de auditoría."""
    query = (
        select(models.AlarmEvent)
        .order_by(models.AlarmEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.scalars(query)
    return result.all()


@router.get("/dashboard", include_in_schema=False)
async def serve_dashboard_ui():
    """Sirve la SPA de React directamente en el navegador."""
    dashboard_path = os.path.join(os.path.dirname(__file__), "frontend", "standalone_dashboard.html")
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="Dashboard UI no encontrado.")

