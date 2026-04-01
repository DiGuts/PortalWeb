from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_rrhh_or_admin
from models import IncidenciaIn, IncidenciaStatusIn

router = APIRouter(prefix="/api/incidencies", tags=["incidencies"])


@router.get("")
async def list_incidencies(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM incidencies ORDER BY created_at DESC")
    )).mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_incidencia(
    body: IncidenciaIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO incidencies (title, description, area, priority, author)
            VALUES (:title, :description, :area, :priority, :author)
        """),
        {"title": body.title, "description": body.description,
         "area": body.area, "priority": body.priority, "author": current_user["name"]},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM incidencies WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


@router.patch("/{incidencia_id}/status")
async def update_status(
    incidencia_id: int,
    body: IncidenciaStatusIn,
    _admin: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("""
            UPDATE incidencies
            SET status = :status, assigned_to = :assigned_to, resolution = :resolution
            WHERE id = :id
        """),
        {"status": body.status, "assigned_to": body.assigned_to,
         "resolution": body.resolution, "id": incidencia_id},
    )
    await db.commit()
    return {"ok": True}
