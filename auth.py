import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

# Compatibilidad passlib con bcrypt >= 4.0
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        bcrypt.__about__ = type("about", (), {"__version__": getattr(bcrypt, "__version__", "4.0.0")})
except Exception:
    pass

from passlib.context import CryptContext
from jose import JWTError, jwt

from database import get_db, AsyncSessionLocal
from models import User, UserRole

# Configuración de Seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "CLAVE_ULTRA_SECRETA_BMS_SES_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2 horas de inactividad máxima según normativa

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router_auth = APIRouter(prefix="/api/auth", tags=["Authentication"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str


class UserMeResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con el hash almacenado."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera el hash seguro bcrypt de la contraseña."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Genera un token JWT firmado con fecha de expiración."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router_auth.post("/login", response_model=TokenResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Valida credenciales (OAuth2 form-data) y emite un token Bearer JWT."""
    stmt = select(User).where(User.username == form_data.username)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo en el sistema",
        )

    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    access_token = create_access_token(
        data={"sub": user.username, "role": role_val}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_val,
        "username": user.username,
    }


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Valida el token JWT y recupera el usuario actual desde la base de datos."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación no válidas o expiradas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_roles(allowed_roles: List[UserRole]):
    """Filtro de autorización RBAC: solo permite el paso si el usuario tiene uno de los roles listados."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        allowed_str = [r.value if hasattr(r, "value") else str(r) for r in allowed_roles]
        if user_role_str not in allowed_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permisos insuficientes. Se requiere uno de los siguientes roles: {', '.join(allowed_str)}",
            )
        return current_user
    return role_checker


@router_auth.get("/me", response_model=UserMeResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Retorna el perfil del usuario autenticado."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "is_active": current_user.is_active,
    }


async def create_factory_root_user():
    """Garantiza la existencia del usuario de fábrica root / Marcadorroot."""
    async with AsyncSessionLocal() as session:
        try:
            stmt = select(User).where(User.username == "root")
            result = await session.execute(stmt)
            root_user = result.scalars().first()

            if not root_user:
                print("[RBAC] Creando usuario de fábrica 'root'...")
                root_user = User(
                    username="root",
                    hashed_password=get_password_hash("Marcadorroot"),
                    role=UserRole.ROOT,
                    is_active=True
                )
                session.add(root_user)
                await session.commit()
                print("[RBAC] Usuario de fábrica 'root' configurado exitosamente.")
            else:
                print("[RBAC] Usuario 'root' verificado en base de datos.")
        except Exception as e:
            await session.rollback()
            print(f"[RBAC] Error inicializando usuario de fábrica root: {e}")

