from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import ActivityIn

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.post("", status_code=201)
async def create_activity(
    body: ActivityIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO activities (title, category, description, date, time, location, capacity, enrolled, past)
            VALUES (:title, :category, :description, :date, :time, :location, :capacity, 0, 0)
        """),
        {"title": body.title, "category": body.category, "description": body.description,
         "date": body.date, "time": body.time, "location": body.location, "capacity": body.capacity},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM activities WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


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


@router.put("/{activity_id}")
async def update_activity(
    activity_id: int,
    body: ActivityIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("""
            UPDATE activities SET title=:title, category=:category, description=:description,
            date=:date, time=:time, location=:location, capacity=:capacity
            WHERE id=:id
        """),
        {"title": body.title, "category": body.category, "description": body.description,
         "date": body.date, "time": body.time, "location": body.location,
         "capacity": body.capacity, "id": activity_id},
    )
    await db.commit()
    return {"ok": True}


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: int,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(text("DELETE FROM activities WHERE id=:id"), {"id": activity_id})
    await db.commit()
