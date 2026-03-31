from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_rrhh_or_admin
from models import SolicitudIn, SolicitudUpdateIn

router = APIRouter(prefix="/api/solicituds", tags=["solicituds"])


async def _notify(db: AsyncConnection, user_id: int, title: str, body: str, tab: str = "") -> None:
    await db.execute(
        text("INSERT INTO notifications (user_id, title, body, tab) VALUES (:uid, :title, :body, :tab)"),
        {"uid": user_id, "title": title, "body": body, "tab": tab},
    )


@router.get("")
async def list_solicituds(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if current_user["role"] in ("Administrador/a", "Recursos humans"):
        rows = (await db.execute(
            text("SELECT * FROM solicituds ORDER BY created_at DESC")
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM solicituds WHERE author = :author ORDER BY created_at DESC"),
            {"author": current_user["email"]},
        )).mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_solicitud(
    body: SolicitudIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO solicituds (date, motive, comments, author)
            VALUES (:date, :motive, :comments, :author)
        """),
        {"date": body.date, "motive": body.motive,
         "comments": body.comments, "author": current_user["email"]},
    )

    # Notify all RRHH / Admin users
    staff = (await db.execute(
        text("SELECT id FROM users WHERE role IN ('Recursos humans')")
    )).mappings().all()
    for s in staff:
        await _notify(
            db, s["id"],
            "Nova petició rebuda",
            f"{current_user['name']} ha enviat una nova petició per al {body.date}.",
            tab="Solicituds",
        )

    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM solicituds WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


@router.patch("/{solicitud_id}")
async def update_solicitud(
    solicitud_id: int,
    body: SolicitudUpdateIn,
    _staff: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    # Fetch current solicitud to get author email
    row = (await db.execute(
        text("SELECT author, status FROM solicituds WHERE id = :id"),
        {"id": solicitud_id},
    )).mappings().first()

    await db.execute(
        text("UPDATE solicituds SET status = :status, motive = :motive WHERE id = :id"),
        {"status": body.status, "motive": body.motive, "id": solicitud_id},
    )

    # Notify the author if status changed from Pendent
    if row and row["status"] == "Pendent" and body.status != "Pendent":
        author = (await db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": row["author"]},
        )).mappings().first()
        if author:
            status_label = "aprovada" if body.status == "Aprovada" else "denegada"
            notif_body = f"La teva petició ha estat {status_label}."
            if body.motive:
                notif_body += f" Motiu: {body.motive}"
            await _notify(db, author["id"], f"Petició {body.status}", notif_body, tab="Solicituds")

    await db.commit()
    return {"ok": True}
