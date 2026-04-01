from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import NewsIn

router = APIRouter(prefix="/api/news", tags=["news"])


@router.post("", status_code=201)
async def create_news(
    body: NewsIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO news (category, title, summary, content, author, date, image, featured)
            VALUES (:category, :title, :summary, :content, :author, :date, :image, :featured)
        """),
        {"category": body.category, "title": body.title, "summary": body.summary,
         "content": body.content, "author": body.author, "date": body.date,
         "image": body.image, "featured": body.featured},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM news WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


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


@router.put("/{news_id}")
async def update_news(
    news_id: int,
    body: NewsIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("""
            UPDATE news SET category=:category, title=:title, summary=:summary,
            content=:content, author=:author, date=:date, image=:image, featured=:featured
            WHERE id=:id
        """),
        {"category": body.category, "title": body.title, "summary": body.summary,
         "content": body.content, "author": body.author, "date": body.date,
         "image": body.image, "featured": body.featured, "id": news_id},
    )
    await db.commit()
    return {"ok": True}


@router.delete("/{news_id}", status_code=204)
async def delete_news(
    news_id: int,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(text("DELETE FROM news WHERE id=:id"), {"id": news_id})
    await db.commit()
