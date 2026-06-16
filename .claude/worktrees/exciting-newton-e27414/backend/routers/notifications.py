from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM notifications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 30"),
        {"uid": current_user["id"]},
    )).mappings().all()
    return [dict(r) for r in rows]


@router.patch("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE notifications SET `read` = 1 WHERE user_id = :uid"),
        {"uid": current_user["id"]},
    )
    await db.commit()
    return {"ok": True}


@router.delete("/clear-all", status_code=204)
async def clear_all_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("DELETE FROM notifications WHERE user_id = :uid"),
        {"uid": current_user["id"]},
    )
    await db.commit()


@router.patch("/{notif_id}/read")
async def mark_read(
    notif_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE notifications SET `read` = 1 WHERE id = :id AND user_id = :uid"),
        {"id": notif_id, "uid": current_user["id"]},
    )
    await db.commit()
    return {"ok": True}
