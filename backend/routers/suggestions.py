from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_rrhh_or_admin
from models import SuggestionIn, SuggestionStatusIn, SuggestionResponseIn, SuggestionVoteIn

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.get("")
async def list_suggestions(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM suggestions ORDER BY votes DESC, created_at DESC")
    )).mappings().all()
    suggestions = [dict(r) for r in rows]

    # Fetch current user's votes for all suggestions
    user_votes = (await db.execute(
        text("SELECT suggestion_id, vote_type FROM suggestion_votes WHERE user_id = :uid"),
        {"uid": current_user["id"]},
    )).mappings().all()
    vote_map = {v["suggestion_id"]: v["vote_type"] for v in user_votes}

    for s in suggestions:
        s["user_vote"] = vote_map.get(s["id"], None)
    return suggestions


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
    result_dict = dict(row)
    result_dict["user_vote"] = None
    return result_dict


@router.post("/{suggestion_id}/vote")
async def vote_suggestion(
    suggestion_id: int,
    body: SuggestionVoteIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    user_id = current_user["id"]
    vote_type = body.vote_type  # 'up' or 'down'

    # Check existing vote
    existing = (await db.execute(
        text("SELECT vote_type FROM suggestion_votes WHERE suggestion_id = :sid AND user_id = :uid"),
        {"sid": suggestion_id, "uid": user_id},
    )).mappings().first()

    if existing is None:
        # New vote
        await db.execute(
            text("INSERT INTO suggestion_votes (suggestion_id, user_id, vote_type) VALUES (:sid, :uid, :vt)"),
            {"sid": suggestion_id, "uid": user_id, "vt": vote_type},
        )
        delta = 1 if vote_type == "up" else -1
    elif existing["vote_type"] == vote_type:
        # Toggle off (same direction — remove vote)
        await db.execute(
            text("DELETE FROM suggestion_votes WHERE suggestion_id = :sid AND user_id = :uid"),
            {"sid": suggestion_id, "uid": user_id},
        )
        delta = -1 if vote_type == "up" else 1
    else:
        # Change direction
        await db.execute(
            text("UPDATE suggestion_votes SET vote_type = :vt WHERE suggestion_id = :sid AND user_id = :uid"),
            {"vt": vote_type, "sid": suggestion_id, "uid": user_id},
        )
        delta = 2 if vote_type == "up" else -2

    await db.execute(
        text("UPDATE suggestions SET votes = votes + :delta WHERE id = :id"),
        {"delta": delta, "id": suggestion_id},
    )
    await db.commit()
    return {"ok": True}


@router.patch("/{suggestion_id}/status")
async def update_status(
    suggestion_id: int,
    body: SuggestionStatusIn,
    _admin: dict = Depends(require_rrhh_or_admin),
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
    _admin: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("UPDATE suggestions SET response = :response WHERE id = :id"),
        {"response": body.response, "id": suggestion_id},
    )
    await db.commit()
    return {"ok": True}
