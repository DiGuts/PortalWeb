from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import UserOut, UserUpdateIn, UserUpdateExtIn, UserRoleIn, OnboardingIn

router = APIRouter(prefix="/api/users", tags=["users"])

_USER_FIELDS = "id, name, email, role, dept, phone, ext, location, onboarded, email_notifs"


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
    new_role = "Responsable de departament" if body.is_head else current_user.get("role", "Treballador/a")
    await db.execute(
        text("UPDATE users SET dept = :dept, role = :role, onboarded = 1 WHERE id = :id"),
        {"dept": body.dept, "role": new_role, "id": current_user["id"]},
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
