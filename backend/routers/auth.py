from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import hash_password, verify_password, create_access_token
from models import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncConnection = Depends(get_db)):
    row = (await db.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": body.email},
    )).mappings().first()

    if row is None or not verify_password(body.password, row["password"]):
        raise HTTPException(status_code=401, detail="Credencials incorrectes")

    token = create_access_token({"sub": row["email"], "id": row["id"], "role": row["role"]})
    user = UserOut(**{k: row[k] for k in UserOut.model_fields})
    return TokenOut(access_token=token, user=user)


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(body: RegisterIn, db: AsyncConnection = Depends(get_db)):
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
        text("SELECT * FROM users WHERE id = :id"),
        {"id": result.lastrowid},
    )).mappings().first()

    token = create_access_token({"sub": row["email"], "id": row["id"], "role": row["role"]})
    user = UserOut(**{k: row[k] for k in UserOut.model_fields})
    return TokenOut(access_token=token, user=user)
