from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin, hash_password
from models import UserOut, UserUpdateIn, UserUpdateExtIn, UserRoleIn, OnboardingIn, UserDeptIn, AdminCreateUserIn, AdminUpdateUserIn

router = APIRouter(prefix="/api/users", tags=["users"])

_USER_FIELDS = "id, name, email, role, dept, phone, ext, location, onboarded, email_notifs, is_head, must_change_password"


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": current_user["id"]},
    )).mappings().first()
    return UserOut(**dict(row))


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdateExtIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        row = (await db.execute(
            text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
            {"id": current_user["id"]},
        )).mappings().first()
        return UserOut(**dict(row))

    _ALLOWED_UPDATE_COLS = {"name", "phone", "ext", "location", "email_notifs"}
    updates = {k: v for k, v in updates.items() if k in _ALLOWED_UPDATE_COLS}
    if not updates:
        row = (await db.execute(
            text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
            {"id": current_user["id"]},
        )).mappings().first()
        return UserOut(**dict(row))

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = current_user["id"]
    await db.execute(
        text(f"UPDATE users SET {set_clause} WHERE id = :id"),
        updates,
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": current_user["id"]},
    )).mappings().first()
    return UserOut(**dict(row))


@router.post("/me/onboarding", response_model=UserOut)
async def complete_onboarding(
    body: OnboardingIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE users SET dept = :dept, is_head = :is_head, onboarded = 1 WHERE id = :id"),
        {"dept": body.dept, "is_head": 1 if body.is_head else 0, "id": current_user["id"]},
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": current_user["id"]},
    )).mappings().first()
    return UserOut(**dict(row))


@router.patch("/me/role", response_model=UserOut)
async def update_my_role(
    body: UserRoleIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE users SET role = :role WHERE id = :id"),
        {"role": body.role, "id": current_user["id"]},
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": current_user["id"]},
    )).mappings().first()
    return UserOut(**dict(row))


@router.get("/dept-head/{dept}")
async def get_dept_head(
    dept: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    """Returns whether the given dept already has a head (is_head=1), excluding the current user."""
    row = (await db.execute(
        text("SELECT id FROM users WHERE dept = :dept AND is_head = 1 AND id != :uid LIMIT 1"),
        {"dept": dept, "uid": current_user["id"]},
    )).first()
    return {"has_head": row is not None}


@router.patch("/me/dept", response_model=UserOut)
async def update_my_dept(
    body: UserDeptIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    """Change own dept and head status. Refuses if dept already has another head."""
    if body.is_head:
        conflict = (await db.execute(
            text("SELECT id FROM users WHERE dept = :dept AND is_head = 1 AND id != :uid LIMIT 1"),
            {"dept": body.dept, "uid": current_user["id"]},
        )).first()
        if conflict:
            from fastapi import HTTPException
            raise HTTPException(status_code=409, detail="Aquest departament ja té un responsable assignat")

    await db.execute(
        text("UPDATE users SET dept = :dept, is_head = :is_head WHERE id = :id"),
        {"dept": body.dept, "is_head": 1 if body.is_head else 0, "id": current_user["id"]},
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": current_user["id"]},
    )).mappings().first()
    return UserOut(**dict(row))


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_role(
    user_id: int,
    body: UserRoleIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE users SET role = :role WHERE id = :id"),
        {"role": body.role, "id": user_id},
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": user_id},
    )).mappings().first()
    return UserOut(**dict(row))


# ── Admin: user management ────────────────────────────────────────────────────

@router.get("", response_model=list[UserOut])
async def list_users(
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users ORDER BY name")
    )).mappings().all()
    return [UserOut(**dict(r)) for r in rows]


@router.post("", response_model=UserOut, status_code=201)
async def admin_create_user(
    body: AdminCreateUserIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    existing = (await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": body.email},
    )).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ja existeix un usuari amb aquest correu")

    hashed = hash_password(body.temp_password)
    await db.execute(
        text("""INSERT INTO users (name, email, password, role, dept, must_change_password, onboarded, email_verified)
                VALUES (:name, :email, :password, :role, :dept, 1, 1, 1)"""),
        {"name": body.name, "email": body.email, "password": hashed,
         "role": body.role, "dept": body.dept},
    )
    await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE email = :email"),
        {"email": body.email},
    )).mappings().first()
    return UserOut(**dict(row))


@router.patch("/{user_id}", response_model=UserOut)
async def admin_update_user(
    user_id: int,
    body: AdminUpdateUserIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    updates = body.model_dump(exclude_none=True)
    if updates:
        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = user_id
        await db.execute(text(f"UPDATE users SET {set_clause} WHERE id = :id"), updates)
        await db.commit()

    row = (await db.execute(
        text(f"SELECT {_USER_FIELDS} FROM users WHERE id = :id"),
        {"id": user_id},
    )).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Usuari no trobat")
    return UserOut(**dict(row))


@router.delete("/{user_id}", status_code=204)
async def admin_delete_user(
    user_id: int,
    admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="No et pots eliminar a tu mateix")
    await db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
    await db.commit()
