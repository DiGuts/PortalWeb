from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user
from models import VacancaIn, VacancaHeadUpdateIn, VacancaRrhhUpdateIn
from email_service import send_email
from conveni import validate_vacanca, ExistingVacation
from datetime import datetime

router = APIRouter(prefix="/api/vacances", tags=["vacances"])


async def _notify(db: AsyncConnection, user_id: int, title: str, body: str) -> None:
    await db.execute(
        text("INSERT INTO notifications (user_id, title, body, tab) VALUES (:uid, :title, :body, 'Solicituds/Vacances')"),
        {"uid": user_id, "title": title, "body": body},
    )


@router.get("")
async def list_vacances(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    role = current_user["role"]
    uid = current_user["id"]
    dept = current_user.get("dept", "")

    if role in ("Administrador/a", "Recursos humans"):
        rows = (await db.execute(
            text("SELECT * FROM vacances ORDER BY created_at DESC")
        )).mappings().all()
    elif current_user.get("is_head", 0):
        # Own requests + dept requests pending head approval
        rows = (await db.execute(
            text("""
                SELECT * FROM vacances
                WHERE user_id = :uid
                   OR (author_dept = :dept AND head_status = 'Pendent')
                ORDER BY created_at DESC
            """),
            {"uid": uid, "dept": dept},
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM vacances WHERE user_id = :uid ORDER BY created_at DESC"),
            {"uid": uid},
        )).mappings().all()

    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_vacanca(
    body: VacancaIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    dept = current_user.get("dept", "")

    # Enforce conveni rules server-side (defence in depth; the React form does same checks).
    existing_rows = (await db.execute(
        text("SELECT start_date, end_date, status FROM vacances WHERE user_id = :uid"),
        {"uid": current_user["id"]},
    )).mappings().all()
    existing = [
        ExistingVacation(
            start_date=r["start_date"] if hasattr(r["start_date"], "year")
                        else datetime.strptime(str(r["start_date"]), "%Y-%m-%d").date(),
            end_date=r["end_date"] if hasattr(r["end_date"], "year")
                        else datetime.strptime(str(r["end_date"]), "%Y-%m-%d").date(),
            status=r["status"],
        )
        for r in existing_rows
    ]
    errors = validate_vacanca(body.start_date, body.end_date, existing)
    if errors:
        raise HTTPException(status_code=400, detail={"conveni_errors": errors})

    result = await db.execute(
        text("""
            INSERT INTO vacances (user_id, author_name, author_dept, start_date, end_date, comments)
            VALUES (:uid, :name, :dept, :start_date, :end_date, :comments)
        """),
        {
            "uid": current_user["id"],
            "name": current_user["name"],
            "dept": dept,
            "start_date": body.start_date,
            "end_date": body.end_date,
            "comments": body.comments,
        },
    )

    # Find and notify department head
    heads = (await db.execute(
        text("SELECT id, email, email_notifs FROM users WHERE is_head = 1 AND dept = :dept"),
        {"dept": dept},
    )).mappings().all()

    for head in heads:
        await _notify(
            db, head["id"],
            f"Nova sol·licitud de vacances — {current_user['name']}",
            f"{current_user['name']} ha sol·licitat vacances del {body.start_date} al {body.end_date}.",
        )
        if head["email_notifs"]:
            await send_email(
                to=head["email"],
                subject=f"Sol·licitud de vacances de {current_user['name']}",
                html=f"""
                <p>Hola,</p>
                <p><b>{current_user['name']}</b> ha sol·licitat vacances:</p>
                <ul>
                  <li><b>Del:</b> {body.start_date}</li>
                  <li><b>Al:</b> {body.end_date}</li>
                  {f'<li><b>Comentaris:</b> {body.comments}</li>' if body.comments else ''}
                </ul>
                <p>Accedeix al portal per aprovar o denegar la petició.</p>
                """,
            )

    await db.commit()
    row = (await db.execute(
        text("SELECT * FROM vacances WHERE id = :id"), {"id": result.lastrowid}
    )).mappings().first()
    return dict(row)


@router.patch("/{vacanca_id}/head")
async def update_head(
    vacanca_id: int,
    body: VacancaHeadUpdateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if current_user["role"] not in ("Administrador/a", "Recursos humans") and not current_user.get("is_head", 0):
        raise HTTPException(status_code=403, detail="No autoritzat")

    row = (await db.execute(
        text("SELECT * FROM vacances WHERE id = :id"), {"id": vacanca_id}
    )).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No trobat")

    await db.execute(
        text("UPDATE vacances SET head_status = :hs, head_comment = :hc WHERE id = :id"),
        {"hs": body.status, "hc": body.comment, "id": vacanca_id},
    )

    if body.status == "Aprovada":
        # Notify RRHH for second approval
        rrhh_users = (await db.execute(
            text("SELECT id, email, email_notifs FROM users WHERE role = 'Recursos humans'")
        )).mappings().all()
        for r in rrhh_users:
            await _notify(
                db, r["id"],
                f"Vacances pendents d'aprovació RRHH — {row['author_name']}",
                f"El responsable de {row['author_dept']} ha aprovat les vacances de {row['author_name']}. Cal la vostra aprovació final.",
            )
            if r["email_notifs"]:
                await send_email(
                    to=r["email"],
                    subject=f"Vacances pendents d'aprovació RRHH — {row['author_name']}",
                    html=f"""
                    <p>Hola,</p>
                    <p>El responsable de <b>{row['author_dept']}</b> ha aprovat les vacances de
                    <b>{row['author_name']}</b> del {row['start_date']} al {row['end_date']}.</p>
                    <p>Cal la vostra aprovació final. Accedeix al portal.</p>
                    """,
                )
    else:
        # Head denied — notify user and mark overall as Denegada
        await db.execute(
            text("UPDATE vacances SET status = 'Denegada' WHERE id = :id"),
            {"id": vacanca_id},
        )
        author = (await db.execute(
            text("SELECT id, email, email_notifs FROM users WHERE id = :uid"),
            {"uid": row["user_id"]},
        )).mappings().first()
        if author:
            await _notify(
                db, author["id"],
                "Sol·licitud de vacances denegada",
                f"El responsable ha denegat la teva sol·licitud de vacances del {row['start_date']} al {row['end_date']}."
                + (f" Motiu: {body.comment}" if body.comment else ""),
            )
            if author["email_notifs"]:
                await send_email(
                    to=author["email"],
                    subject="Sol·licitud de vacances denegada pel responsable",
                    html=f"""
                    <p>Hola {row['author_name']},</p>
                    <p>El teu responsable ha <b>denegat</b> la sol·licitud de vacances
                    del {row['start_date']} al {row['end_date']}.</p>
                    {f'<p><b>Motiu:</b> {body.comment}</p>' if body.comment else ''}
                    """,
                )

    await db.commit()
    return {"ok": True}


@router.patch("/{vacanca_id}/rrhh")
async def update_rrhh(
    vacanca_id: int,
    body: VacancaRrhhUpdateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    if current_user["role"] not in ("Recursos humans", "Administrador/a"):
        raise HTTPException(status_code=403, detail="No autoritzat")

    row = (await db.execute(
        text("SELECT * FROM vacances WHERE id = :id"), {"id": vacanca_id}
    )).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No trobat")

    final_status = "Aprovada" if body.status == "Aprovada" else "Denegada"
    await db.execute(
        text("UPDATE vacances SET rrhh_status = :rs, rrhh_comment = :rc, status = :st WHERE id = :id"),
        {"rs": body.status, "rc": body.comment, "st": final_status, "id": vacanca_id},
    )

    # Notify user of final decision
    author = (await db.execute(
        text("SELECT id, email, email_notifs FROM users WHERE id = :uid"),
        {"uid": row["user_id"]},
    )).mappings().first()
    if author:
        label = "aprovada" if body.status == "Aprovada" else "denegada"
        await _notify(
            db, author["id"],
            f"Vacances {final_status}",
            f"RRHH ha {label} la teva sol·licitud de vacances del {row['start_date']} al {row['end_date']}."
            + (f" Motiu: {body.comment}" if body.comment else ""),
        )
        if author["email_notifs"]:
            await send_email(
                to=author["email"],
                subject=f"Les teves vacances han estat {label}s per RRHH",
                html=f"""
                <p>Hola {row['author_name']},</p>
                <p>RRHH ha <b>{label}</b> la teva sol·licitud de vacances
                del {row['start_date']} al {row['end_date']}.</p>
                {f'<p><b>Motiu:</b> {body.comment}</p>' if body.comment else ''}
                """,
            )

    await db.commit()
    return {"ok": True}
