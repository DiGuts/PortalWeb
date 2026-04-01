from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import AgendaEventIn

router = APIRouter(prefix="/api/agenda", tags=["agenda"])


@router.post("", status_code=201)
async def create_agenda_event(
    body: AgendaEventIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO agenda_events (title, day, month, time, location, type)
            VALUES (:title, :day, :month, :time, :location, :type)
        """),
        {"title": body.title, "day": body.day, "month": body.month,
         "time": body.time, "location": body.location, "type": body.type},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM agenda_events WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


@router.put("/{event_id}")
async def update_agenda_event(
    event_id: int,
    body: AgendaEventIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("""
            UPDATE agenda_events SET title=:title, day=:day, month=:month,
            time=:time, location=:location, type=:type WHERE id=:id
        """),
        {"title": body.title, "day": body.day, "month": body.month,
         "time": body.time, "location": body.location, "type": body.type, "id": event_id},
    )
    await db.commit()
    return {"ok": True}


@router.delete("/{event_id}", status_code=204)
async def delete_agenda_event(
    event_id: int,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(text("DELETE FROM agenda_events WHERE id=:id"), {"id": event_id})
    await db.commit()


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
