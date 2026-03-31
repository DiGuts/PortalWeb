from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

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
