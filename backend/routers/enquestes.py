from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/enquestes", tags=["enquestes"])


@router.get("")
async def list_enquestes(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM enquestes ORDER BY created_at DESC")
    )).mappings().all()

    # Annotate each survey with whether this user has already responded
    completed_ids = set(
        r[0] for r in (await db.execute(
            text("SELECT enquesta_id FROM enquesta_responses WHERE user_email = :email"),
            {"email": current_user["email"]},
        )).all()
    )

    result = []
    for r in rows:
        item = dict(r)
        item["user_completed"] = r["id"] in completed_ids
        result.append(item)
    return result


@router.post("/{enquesta_id}/respond", status_code=201)
async def respond_enquesta(
    enquesta_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    try:
        await db.execute(
            text("""
                INSERT INTO enquesta_responses (enquesta_id, user_email)
                VALUES (:enquesta_id, :email)
            """),
            {"enquesta_id": enquesta_id, "email": current_user["email"]},
        )
        await db.execute(
            text("UPDATE enquestes SET responses = responses + 1 WHERE id = :id"),
            {"id": enquesta_id},
        )
        await db.commit()
    except Exception:
        raise HTTPException(status_code=409, detail="Ja has respost aquesta enquesta")
    return {"ok": True}
