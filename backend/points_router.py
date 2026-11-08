import io
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models import DataPoint, AlarmGroup, ProtocolType
from database import get_db 

router = APIRouter(prefix="/api/points", tags=["DataPoints"])


@router.get("/export")
async def export_points(db: AsyncSession = Depends(get_db)):
    """Exporta todos los DataPoints activos y sus grupos a un archivo CSV."""
    
    # Realizamos un JOIN para obtener también el nombre del grupo de alarma
    stmt = select(DataPoint, AlarmGroup).join(AlarmGroup)
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
            "Activo": dp.is_active
        })
    
    if not data:
        raise HTTPException(status_code=404, detail="No hay puntos para exportar.")

    # Convertir a DataFrame de Pandas
    df = pd.DataFrame(data)
    
    # Guardar en memoria como CSV con utf-8-sig para compatibilidad con Excel y acentos
    stream = io.BytesIO()
    df.to_csv(stream, index=False, encoding='utf-8-sig')
    stream.seek(0)
    
    return StreamingResponse(
        stream, 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=configuracion_puntos.csv"}
    )


@router.post("/import")
async def import_points(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Importa puntos desde un archivo CSV o Excel y crea los grupos si no existen."""
    
    contents = await file.read()
    filename = (file.filename or "").lower()
    
    # Determinar el tipo de archivo y cargarlo en pandas
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa .csv o .xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo el archivo: {str(e)}")

    # Validar columnas requeridas
    columnas_requeridas = {'Nombre', 'Protocolo', 'IP', 'Direccion', 'Grupo'}
    if not columnas_requeridas.issubset(df.columns):
        raise HTTPException(
            status_code=400, 
            detail=f"El archivo debe contener las columnas: {', '.join(columnas_requeridas)}"
        )

    puntos_importados = 0
    # Cache local en memoria para evitar consultas SQL repetitivas en cada fila
    grupos_cache = {}

    for index, row in df.iterrows():
        nombre_grupo = str(row['Grupo']).strip()
        
        # 1. Buscar en caché o en la base de datos. Si no existe, crearlo y hacer flush()
        if nombre_grupo in grupos_cache:
            grupo = grupos_cache[nombre_grupo]
        else:
            stmt = select(AlarmGroup).where(AlarmGroup.name == nombre_grupo)
            result = await db.execute(stmt)
            grupo = result.scalars().first()
            
            if not grupo:
                grupo = AlarmGroup(name=nombre_grupo)
                db.add(grupo)
                await db.flush()  # Flush genera el ID autonumérico sin consolidar la transacción todavía
            
            grupos_cache[nombre_grupo] = grupo
            
        # 2. Validar el protocolo
        protocolo_str = str(row['Protocolo']).strip().lower()
        if protocolo_str == ProtocolType.MODBUS.value:
            protocolo = ProtocolType.MODBUS
        elif protocolo_str == ProtocolType.BACNET.value:
            protocolo = ProtocolType.BACNET
        else:
            continue # Si el protocolo no es válido, saltamos esta fila

        # 3. Validar tipo BACnet (manejo de nulos en pandas)
        bacnet_type = None
        if pd.notna(row.get('Tipo_BACnet')) and str(row.get('Tipo_BACnet')).strip() != "":
            bacnet_type = str(row['Tipo_BACnet']).strip()

        # 4. Crear el DataPoint
        nuevo_punto = DataPoint(
            name=str(row['Nombre']).strip(),
            protocol=protocolo,
            ip_address=str(row['IP']).strip(),
            address=str(row['Direccion']).strip(),
            bacnet_type=bacnet_type,
            group_id=grupo.id,
            is_active=bool(row.get('Activo', True))
        )
        
        db.add(nuevo_punto)
        puntos_importados += 1

    # Guardar todos los cambios en la base de datos de una sola vez
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando en base de datos: {str(e)}")

    return {"message": f"Importación exitosa. {puntos_importados} puntos registrados."}

