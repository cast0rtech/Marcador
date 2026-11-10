import asyncio
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.future import select

# Importaciones de nuestros módulos
from database import init_db, AsyncSessionLocal
from routes import router as points_router, router_alarms
from auth import router_auth, create_factory_root_user
from polling import procesar_punto
from models import DataPoint
from ws_manager import manager

# Variable global para mantener la referencia de la tarea en segundo plano
motor_task = None


async def motor_polling_dinamico():
    """
    Versión mejorada del motor de polling que lee los puntos activos directamente 
    desde la base de datos en cada ciclo, para que si subes un CSV nuevo, 
    los cambios se apliquen instantáneamente sin reiniciar el servidor.
    """
    while True:
        try:
            # Abrimos una sesión de BD específica para el motor de fondo
            async with AsyncSessionLocal() as session:
                # Consultamos solo los puntos que están activos
                stmt = select(DataPoint).where(DataPoint.is_active == True)
                result = await session.execute(stmt)
                puntos_activos = result.scalars().all()
                
                # Convertimos los objetos SQLAlchemy a diccionarios para procesar_punto()
                lista_puntos = [
                    {
                        "id": p.id,
                        "nombre": p.name,
                        "protocolo": p.protocol.value if hasattr(p.protocol, 'value') else str(p.protocol),
                        "ip": p.ip_address,
                        "direccion": int(p.address) if (hasattr(p.protocol, 'value') and p.protocol.value == 'modbus') or str(p.protocol) == 'modbus' else p.address,
                        "bacnet_type": p.bacnet_type,
                        "grupo": p.group.name if p.group else "General",
                        "tts_message": p.tts_message,
                    }
                    for p in puntos_activos
                ]

            if lista_puntos:
                # Ejecutamos las lecturas concurrentemente
                tareas = [procesar_punto(punto) for punto in lista_puntos]
                await asyncio.gather(*tareas)
                
        except Exception as e:
            print(f"Error en el ciclo de polling: {e}")
            
        # Espera 2 segundos antes de la siguiente lectura masiva
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Inicializar la base de datos (crear tablas si no existen) y usuario root
    print("Inicializando Base de Datos...")
    await init_db()
    await create_factory_root_user()
    
    # 2. Iniciar el motor de polling en segundo plano
    print("Arrancando el Motor de Polling (Modbus/BACnet)...")
    global motor_task
    motor_task = asyncio.create_task(motor_polling_dinamico())
    
    yield  # Aquí FastAPI cede el control para empezar a recibir tráfico web
    
    # 3. Apagado ordenado al detener el contenedor/servidor
    print("Deteniendo el BMS...")
    if motor_task:
        motor_task.cancel()
        try:
            await motor_task
        except asyncio.CancelledError:
            print("Motor de Polling detenido correctamente.")


# --- INICIALIZACIÓN DE LA APP ---
app = FastAPI(
    title="BMS Industrial API",
    description="Sistema de domótica y gestión técnica de alarmas por Modbus/BACnet",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuración de CORS para permitir peticiones desde el frontend en React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiar por la IP/Dominio de React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Integración de routers (autenticación, puntos, dashboard y registro de auditoría de alarmas)
app.include_router(router_auth)
app.include_router(points_router)
app.include_router(router_alarms)


@app.get("/")
async def root():
    """Endpoint de estado para verificar que el servicio está vivo (Health Check)"""
    return {
        "status": "online",
        "service": "BMS Core Engine",
        "polling_active": not motor_task.cancelled() if motor_task else False,
    }


@app.get("/dashboard")
async def get_dashboard():
    """Sirve el dashboard interactivo multilingüe directamente sin Vite."""
    path = os.path.join(os.path.dirname(__file__), "frontend", "standalone_dashboard.html")
    if not os.path.exists(path):
        path = os.path.join(os.path.dirname(__file__), "..", "frontend", "standalone_dashboard.html")
    if os.path.exists(path):
        return FileResponse(path)
    return {"message": "Dashboard file not found"}


@app.websocket("/ws/alarms")
@app.websocket("/ws")
async def websocket_alarms(websocket: WebSocket):
    """Canal WebSocket para telemetría en tiempo real hacia React."""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
