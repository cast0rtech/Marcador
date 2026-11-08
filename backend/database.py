import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from models import Base 

# Cadena de conexión asíncrona a PostgreSQL. 
# Usamos variables de entorno preparadas para cuando dockericemos la aplicación.
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")  # En Docker Compose será el nombre del servicio, ej: "postgres" o "db"
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "bms_db")

# Permite usar directamente DATABASE_URL si está definida, o construirla a partir de las variables anteriores
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# 1. Creación del Engine Asíncrono
# Ajustamos el pool_size para soportar tanto las peticiones web de React como el motor de Polling en segundo plano.
is_sqlite = "sqlite" in DATABASE_URL
engine = create_async_engine(
    DATABASE_URL,
    echo=False,          # Cambia a True si quieres ver la salida de las sentencias SQL en consola
    pool_size=20 if not is_sqlite else 5,         # Número de conexiones persistentes en el pool
    max_overflow=10 if not is_sqlite else 10,     # Conexiones extra permitidas si el pool se llena
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

# 2. Generador de Sesiones
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Vital en asíncrono para leer objetos después de un commit sin re-consultar
    autoflush=False
)

# Alias de conveniencia
async_session_maker = AsyncSessionLocal


# 3. Función de Inicialización (Opcional, útil para desarrollo)
async def init_db():
    """Crea las tablas en la base de datos basándose en models.py"""
    async with engine.begin() as conn:
        # En producción se recomienda usar Alembic para migraciones en lugar de create_all
        await conn.run_sync(Base.metadata.create_all)


# 4. Inyección de Dependencias (Dependency Injection) para FastAPI
async def get_db():
    """
    Genera una sesión de BD aislada para cada petición de la API o tarea asíncrona.
    Se asegura de cerrarla (liberarla de vuelta al pool) cuando termina.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
