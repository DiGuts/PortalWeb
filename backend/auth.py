import os
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db

# ── Config ────────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production-use-a-long-random-string")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invàlid o caducat",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncConnection = Depends(get_db),
) -> dict:
    payload = decode_token(credentials.credentials)
    email: str | None = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token sense subjecte")

    row = (await db.execute(
        text("SELECT id, name, email, role, dept, phone, ext, location, is_head FROM users WHERE email = :email"),
        {"email": email},
    )).mappings().first()

    if row is None:
        raise HTTPException(status_code=401, detail="Usuari no trobat")

    return dict(row)


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "Administrador/a":
        raise HTTPException(status_code=403, detail="Acció reservada a administradors")
    return current_user


async def require_rrhh_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] not in ("Administrador/a", "Recursos humans"):
        raise HTTPException(status_code=403, detail="Acció reservada a RRHH o administradors")
    return current_user
