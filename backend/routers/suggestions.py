from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_admin
from models import SuggestionIn, SuggestionStatusIn, SuggestionResponseIn

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.get("")
async def list_suggestions(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM suggestions ORDER BY votes DESC, created_at DESC")
    )).mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_suggestion(
    body: SuggestionIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    author = "Anònim" if body.anonymous else current_user["name"]
    result = await db.execute(
        text("""
            INSERT INTO suggestions (title, description, category, anonymous, author)
            VALUES (:title, :description, :category, :anonymous, :author)
        """),
        {"title": body.title, "description": body.description,
         "category": body.category, "anonymous": int(body.anonymous), "author": author},
    )
    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM suggestions WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


@router.post("/{suggestion_id}/vote")
async def vote_suggestion(
    suggestion_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE suggestions SET votes = votes + 1 WHERE id = :id"),
        {"id": suggestion_id},
    )
    await db.commit()
    return {"ok": True}


@router.patch("/{suggestion_id}/status")
async def update_status(
    suggestion_id: int,
    body: SuggestionStatusIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE suggestions SET status = :status WHERE id = :id"),
        {"status": body.status, "id": suggestion_id},
    )
    await db.commit()
    return {"ok": True}


@router.patch("/{suggestion_id}/response")
async def add_response(
    suggestion_id: int,
    body: SuggestionResponseIn,
    _admin: dict = Depends(require_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE suggestions SET response = :response WHERE id = :id"),
        {"response": body.response, "id": suggestion_id},
    )
    await db.commit()
    return {"ok": True}
