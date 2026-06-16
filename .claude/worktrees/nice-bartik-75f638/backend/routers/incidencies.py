from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_rrhh_or_admin
from models import IncidenciaIn, IncidenciaStatusIn
from email_service import send_email

router = APIRouter(prefix="/api/incidencies", tags=["incidencies"])


async def _notify(db: AsyncConnection, user_id: int, title: str, body: str) -> None:
    await db.execute(
        text("INSERT INTO notifications (user_id, title, body, tab) VALUES (:uid, :title, :body, 'Veu/Incidències')"),
        {"uid": user_id, "title": title, "body": body},
    )


@router.get("")
async def list_incidencies(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT * FROM incidencies ORDER BY created_at DESC")
    )).mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_incidencia(
    body: IncidenciaIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""
            INSERT INTO incidencies (title, description, area, priority, author, user_id)
            VALUES (:title, :description, :area, :priority, :author, :user_id)
        """),
        {"title": body.title, "description": body.description,
         "area": body.area, "priority": body.priority, "author": current_user["name"],
         "user_id": current_user["id"]},
    )

    # Notify and email all "Manteniment" users
    maint_users = (await db.execute(
        text("SELECT id, email, email_notifs FROM users WHERE role = 'Manteniment'")
    )).mappings().all()

    for u in maint_users:
        await _notify(
            db, u["id"],
            f"Nova incidència: {body.title}",
            f"{current_user['name']} ha registrat una incidència a {body.area} (prioritat: {body.priority}).",
        )
        if u["email_notifs"]:
            await send_email(
                to=u["email"],
                subject=f"Nova incidència: {body.title}",
                html=f"""
                <p>Hola,</p>
                <p>S'ha registrat una nova incidència al portal TAVIL:</p>
                <ul>
                  <li><b>Títol:</b> {body.title}</li>
                  <li><b>Àrea:</b> {body.area}</li>
                  <li><b>Prioritat:</b> {body.priority}</li>
                  <li><b>Descripció:</b> {body.description}</li>
                  <li><b>Reportada per:</b> {current_user['name']}</li>
                </ul>
                <p>Accedeix al portal per gestionar-la.</p>
                """,
            )

    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM incidencies WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


@router.patch("/{incidencia_id}/status")
async def update_status(
    incidencia_id: int,
    body: IncidenciaStatusIn,
    _admin: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(
        text("""
            UPDATE incidencies
            SET status = :status, assigned_to = :assigned_to, resolution = :resolution
            WHERE id = :id
        """),
        {"status": body.status, "assigned_to": body.assigned_to,
         "resolution": body.resolution, "id": incidencia_id},
    )
    await db.commit()
    return {"ok": True}


@router.delete("/{incidencia_id}", status_code=204)
async def delete_incidencia(
    incidencia_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    row = (await db.execute(
        text("SELECT user_id FROM incidencies WHERE id = :id"), {"id": incidencia_id}
    )).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No trobat")
    is_admin = current_user["role"] in ("Administrador/a", "Recursos humans")
    if not is_admin and row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No autoritzat")
    await db.execute(text("DELETE FROM incidencies WHERE id = :id"), {"id": incidencia_id})
    await db.commit()
