from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/agenda", tags=["agenda"])


@router.get("")
async def list_agenda(
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if month is not None:
        rows = (await db.execute(
            text("SELECT * FROM agenda_events WHERE month = :month ORDER BY day, time"),
            {"month": month},
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM agenda_events ORDER BY month, day, time")
        )).mappings().all()
    return [dict(r) for r in rows]
