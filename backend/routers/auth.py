import os
import secrets
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import hash_password, verify_password, create_access_token
from models import LoginIn, RegisterIn, UserOut, VerifyEmailIn, VerifyOTPIn, ResendVerificationIn
from email_service import send_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Feature flags ─────────────────────────────────────────────────────────────
# Enable in .env: EMAIL_VERIFY_ENABLED=true / LOGIN_2FA_ENABLED=true
EMAIL_VERIFY_ENABLED: bool = os.getenv("EMAIL_VERIFY_ENABLED", "false").lower() == "true"
LOGIN_2FA_ENABLED: bool = os.getenv("LOGIN_2FA_ENABLED", "false").lower() == "true"

OTP_EXPIRY_MINUTES = 10
VERIFY_EXPIRY_HOURS = 24

_USER_FIELDS = "id, name, email, role, dept, phone, ext, location, onboarded, email_notifs, is_head"


# ── Token helpers ─────────────────────────────────────────────────────────────

def _expires_str(minutes: int = 0, hours: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes, hours=hours)).strftime("%Y-%m-%d %H:%M:%S")


async def _store_code(db: AsyncConnection, email: str, code: str, purpose: str, **expiry) -> None:
    """Replace any existing code for email+purpose, insert new one."""
    await db.execute(
        text("DELETE FROM auth_tokens WHERE email = :email AND purpose = :purpose"),
        {"email": email, "purpose": purpose},
    )
    await db.execute(
        text("INSERT INTO auth_tokens (email, code, purpose, expires_at) VALUES (:email, :code, :purpose, :expires_at)"),
        {"email": email, "code": code, "purpose": purpose, "expires_at": _expires_str(**expiry)},
    )


async def _consume_code(db: AsyncConnection, email: str, code: str, purpose: str) -> bool:
    """Validate and delete a code. Returns True if valid and not expired."""
    row = (await db.execute(
        text("SELECT expires_at FROM auth_tokens WHERE email = :email AND code = :code AND purpose = :purpose"),
        {"email": email, "code": code, "purpose": purpose},
    )).first()
    if not row:
        return False
    expires = datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        return False
    await db.execute(
        text("DELETE FROM auth_tokens WHERE email = :email AND purpose = :purpose"),
        {"email": email, "purpose": purpose},
    )
    return True


async def _build_token_response(db: AsyncConnection, email: str) -> dict:
    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE email = :email"),
        {"email": email},
    )).mappings().first()
    token = create_access_token({"sub": row["email"], "id": row["id"], "role": row["role"]})
    user = UserOut(**{k: row[k] for k in UserOut.model_fields if k in row})
    return {"status": "ok", "access_token": token, "token_type": "bearer", "user": user.model_dump()}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login")
async def login(body: LoginIn, db: AsyncConnection = Depends(get_db)):
    extra = ", email_verified" if EMAIL_VERIFY_ENABLED else ""
    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS}, password{extra} FROM users WHERE email = :email"),
        {"email": body.email},
    )).mappings().first()

    if row is None or not verify_password(body.password, row["password"]):
        raise HTTPException(status_code=401, detail="Credencials incorrectes")

    if EMAIL_VERIFY_ENABLED and not row.get("email_verified", 1):
        raise HTTPException(status_code=403, detail="Verifica el teu correu electrònic abans d'accedir")

    if LOGIN_2FA_ENABLED:
        otp = str(random.randint(100000, 999999))
        await _store_code(db, body.email, otp, "otp", minutes=OTP_EXPIRY_MINUTES)
        await db.commit()
        await send_email(
            body.email,
            "Codi d'accés — TAVIL Portal",
            f"<p style='font-family:sans-serif'>El teu codi d'accés és:</p>"
            f"<p style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#dc2626'><strong>{otp}</strong></p>"
            f"<p style='font-family:sans-serif;color:#888'>Caduca en {OTP_EXPIRY_MINUTES} minuts.</p>",
        )
        return {"status": "pending_otp", "email": body.email}

    return await _build_token_response(db, body.email)


@router.post("/register", status_code=201)
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

    if EMAIL_VERIFY_ENABLED:
        result = await db.execute(
            text("""
                INSERT INTO users (name, email, password, role, dept, email_verified)
                VALUES (:name, :email, :password, :role, :dept, 0)
            """),
            {"name": body.name, "email": body.email, "password": hashed,
             "role": body.role, "dept": body.dept},
        )
        await db.commit()

        code = secrets.token_hex(4).upper()  # 8-char hex e.g. "A3F92BDE"
        await _store_code(db, body.email, code, "verify", hours=VERIFY_EXPIRY_HOURS)
        await db.commit()
        await send_email(
            body.email,
            "Confirma el teu correu — TAVIL Portal",
            f"<p style='font-family:sans-serif'>Benvingut/da al Portal TAVIL!</p>"
            f"<p style='font-family:sans-serif'>Introdueix aquest codi per verificar el teu compte:</p>"
            f"<p style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#dc2626'><strong>{code}</strong></p>"
            f"<p style='font-family:sans-serif;color:#888'>Caduca en {VERIFY_EXPIRY_HOURS} hores.</p>",
        )
        return {"status": "pending_verification", "email": body.email}

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
    return {"status": "ok", "access_token": token, "token_type": "bearer", "user": user.model_dump()}


@router.post("/verify-email")
async def verify_email(body: VerifyEmailIn, db: AsyncConnection = Depends(get_db)):
    ok = await _consume_code(db, body.email, body.code.strip().upper(), "verify")
    if not ok:
        raise HTTPException(status_code=400, detail="Codi invàlid o caducat")

    await db.execute(
        text("UPDATE users SET email_verified = 1 WHERE email = :email"),
        {"email": body.email},
    )
    await db.commit()
    return await _build_token_response(db, body.email)


@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPIn, db: AsyncConnection = Depends(get_db)):
    ok = await _consume_code(db, body.email, body.code.strip(), "otp")
    if not ok:
        raise HTTPException(status_code=400, detail="Codi invàlid o caducat")

    await db.commit()
    return await _build_token_response(db, body.email)


@router.post("/resend-verification")
async def resend_verification(body: ResendVerificationIn, db: AsyncConnection = Depends(get_db)):
    row = (await db.execute(
        text("SELECT email_verified FROM users WHERE email = :email"),
        {"email": body.email},
    )).first()

    # Silent success if email not found (don't leak existence)
    if not row or row[0] == 1:
        return {"status": "sent"}

    code = secrets.token_hex(4).upper()
    await _store_code(db, body.email, code, "verify", hours=VERIFY_EXPIRY_HOURS)
    await db.commit()
    await send_email(
        body.email,
        "Nou codi de verificació — TAVIL Portal",
        f"<p style='font-family:sans-serif'>El teu nou codi de verificació és:</p>"
        f"<p style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#dc2626'><strong>{code}</strong></p>"
        f"<p style='font-family:sans-serif;color:#888'>Caduca en {VERIFY_EXPIRY_HOURS} hores.</p>",
    )
    return {"status": "sent"}
