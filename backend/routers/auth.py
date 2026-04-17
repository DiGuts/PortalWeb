from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import hash_password, verify_password, create_access_token
from models import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

_USER_FIELDS = "id, name, email, role, dept, phone, ext, location, onboarded, email_notifs"


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncConnection = Depends(get_db)):
    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS}, password FROM users WHERE email = :email"),
        {"email": body.email},
    )).mappings().first()

    if row is None or not verify_password(body.password, row["password"]):
        raise HTTPException(status_code=401, detail="Credencials incorrectes")

    token = create_access_token({"sub": row["email"], "id": row["id"], "role": row["role"]})
    user = UserOut(**{k: row[k] for k in UserOut.model_fields if k in row})
    return TokenOut(access_token=token, user=user)


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(body: RegisterIn, db: AsyncConnection = Depends(get_db)):
    if not body.email.lower().endswith('@tavil.net'):
        raise HTTPException(status_code=400, detail="Només es permeten correus @tavil.net")

    existing = (await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": body.email},
    )).first()
    if existing:
        raise HTTPException(status_code=409, detail="Aquest correu ja està registrat")

    hashed = hash_password(body.password)
    result = await db.execute(
        text("""
            INSERT INTO users (name, email, password, role, dept)
            VALUES (:name, :email, :password, :role, :dept)
        """),
        {"name": body.name, "email": body.email, "password": hashed,
         "role": body.role, "dept": body.dept},
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": result.lastrowid},
    )).mappings().first()

    token = create_access_token({"sub": row["email"], "id": row["id"], "role": row["role"]})
    user = UserOut(**{k: row[k] for k in UserOut.model_fields if k in row})
    return TokenOut(access_token=token, user=user)
