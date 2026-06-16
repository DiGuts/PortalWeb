from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import NoticeIn

router = APIRouter(prefix="/api/notices", tags=["notices"])


@router.get("")
async def list_notices(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM notices WHERE active = 1 ORDER BY id")
    )).mappings().all()
    return [dict(r) for r in rows]


@router.get("/all")
async def list_all_notices(
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM notices ORDER BY id")
    )).mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_notice(
    body: NoticeIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("INSERT INTO notices (title, content, link, active) VALUES (:title, :content, :link, :active)"),
        {"title": body.title, "content": body.content, "link": body.link, "active": body.active},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM notices WHERE id = :id"),
        {"id": result.lastrowid},
    )).mappings().first()
    return dict(row)


@router.put("/{notice_id}")
async def update_notice(
    notice_id: int,
    body: NoticeIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE notices SET title=:title, content=:content, link=:link, active=:active WHERE id=:id"),
        {"title": body.title, "content": body.content, "link": body.link, "active": body.active, "id": notice_id},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM notices WHERE id = :id"), {"id": notice_id}
    )).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Avís no trobat")
    return dict(row)


@router.delete("/{notice_id}", status_code=204)
async def delete_notice(
    notice_id: int,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(text("DELETE FROM notices WHERE id = :id"), {"id": notice_id})
    await db.commit()
