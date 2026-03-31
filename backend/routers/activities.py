from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("")
async def list_activities(
    past: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if past is not None:
        rows = (await db.execute(
            text("SELECT * FROM activities WHERE past = :past ORDER BY date"),
            {"past": past},
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM activities ORDER BY past, date")
        )).mappings().all()
    return [dict(r) for r in rows]


@router.post("/{activity_id}/enroll")
async def enroll(
    activity_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    row = (await db.execute(
        text("SELECT capacity, enrolled FROM activities WHERE id = :id"),
        {"id": activity_id},
    )).mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Activitat no trobada")
    if row["capacity"] > 0 and row["enrolled"] >= row["capacity"]:
        raise HTTPException(status_code=409, detail="Activitat completa")

    await db.execute(
        text("UPDATE activities SET enrolled = enrolled + 1 WHERE id = :id"),
        {"id": activity_id},
    )
    await db.commit()
    return {"ok": True}
