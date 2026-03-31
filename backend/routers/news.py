from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("")
async def list_news(
    featured: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if featured is not None:
        rows = (await db.execute(
            text("SELECT * FROM news WHERE featured = :featured ORDER BY created_at DESC"),
            {"featured": featured},
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM news ORDER BY created_at DESC")
        )).mappings().all()
    return [dict(r) for r in rows]


@router.get("/{news_id}")
async def get_news(
    news_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    row = (await db.execute(
        text("SELECT * FROM news WHERE id = :id"), {"id": news_id}
    )).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Notícia no trobada")
    return dict(row)
