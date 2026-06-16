from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("")
async def list_employees(
    dept: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if dept:
        rows = (await db.execute(
            text("SELECT * FROM employees WHERE dept = :dept ORDER BY name"),
            {"dept": dept},
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM employees ORDER BY name")
        )).mappings().all()
    return [dict(r) for r in rows]
