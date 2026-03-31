from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user
from models import CourseProgressIn

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("")
async def list_courses(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM courses ORDER BY mandatory DESC, title")
    )).mappings().all()

    # Fetch this user's progress for all courses in one query
    progress_rows = (await db.execute(
        text("SELECT course_id, status, progress FROM user_course_progress WHERE user_id = :uid"),
        {"uid": current_user["id"]},
    )).mappings().all()
    progress_map = {r["course_id"]: r for r in progress_rows}

    result = []
    for r in rows:
        item = dict(r)
        p = progress_map.get(r["id"])
        item["user_status"] = p["status"] if p else "Pendent"
        item["user_progress"] = p["progress"] if p else 0
        result.append(item)
    return result


@router.patch("/{course_id}/progress")
async def update_progress(
    course_id: int,
    body: CourseProgressIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("""
            INSERT INTO user_course_progress (user_id, course_id, status, progress)
            VALUES (:uid, :cid, :status, :progress)
            ON CONFLICT(user_id, course_id) DO UPDATE SET
                status   = excluded.status,
                progress = excluded.progress
        """),
        {"uid": current_user["id"], "cid": course_id,
         "status": body.status, "progress": body.progress},
    )
    await db.commit()
    return {"ok": True}
