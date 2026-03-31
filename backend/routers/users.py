from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import UserOut, UserUpdateIn, UserRoleIn

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(**current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return UserOut(**current_user)

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = current_user["id"]
    await db.execute(
        text(f"UPDATE users SET {set_clause} WHERE id = :id"),
        updates,
    )
    await db.commit()

    row = (await db.execute(
        text("SELECT id, name, email, role, dept, phone, ext, location FROM users WHERE id = :id"),
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
        text("SELECT id, name, email, role, dept, phone, ext, location FROM users WHERE id = :id"),
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
        text("SELECT id, name, email, role, dept, phone, ext, location FROM users WHERE id = :id"),
        {"id": user_id},
    )).mappings().first()
    return UserOut(**dict(row))
