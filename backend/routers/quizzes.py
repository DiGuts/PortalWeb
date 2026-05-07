import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from database import get_db
from auth import get_current_user, require_rrhh_or_admin
from models import QuizIn, QuizAttemptIn

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


async def _get_full_quiz(quiz_id: int, db: AsyncConnection, include_correct: bool = False) -> dict:
    quiz = (await db.execute(
        text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}
    )).mappings().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no trobat")

    questions = (await db.execute(
        text("SELECT * FROM quiz_questions WHERE quiz_id = :qid ORDER BY position, id"),
        {"qid": quiz_id},
    )).mappings().all()

    result_questions = []
    for q in questions:
        opts = (await db.execute(
            text("SELECT * FROM quiz_options WHERE question_id = :qid ORDER BY position, id"),
            {"qid": q["id"]},
        )).mappings().all()
        q_dict = dict(q)
        if include_correct:
            q_dict["options"] = [dict(o) for o in opts]
        else:
            q_dict["options"] = [
                {k: v for k, v in dict(o).items() if k != "is_correct"} for o in opts
            ]
        result_questions.append(q_dict)

    return {**dict(quiz), "questions": result_questions}


@router.get("")
async def list_quizzes(
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    is_admin = current_user["role"] in ("Administrador/a", "Recursos humans")
    if is_admin:
        rows = (await db.execute(
            text("SELECT * FROM quizzes ORDER BY created_at DESC")
        )).mappings().all()
    else:
        rows = (await db.execute(
            text("SELECT * FROM quizzes WHERE active = 1 ORDER BY created_at DESC")
        )).mappings().all()

    result = []
    for row in rows:
        attempt = (await db.execute(
            text("SELECT score, max_score, passed, completed_at FROM quiz_attempts WHERE quiz_id = :qid AND user_id = :uid"),
            {"qid": row["id"], "uid": current_user["id"]},
        )).mappings().first()
        q_count = (await db.execute(
            text("SELECT COUNT(*) AS cnt FROM quiz_questions WHERE quiz_id = :qid"),
            {"qid": row["id"]},
        )).mappings().first()
        d = dict(row)
        d["user_attempt"] = dict(attempt) if attempt else None
        d["question_count"] = q_count["cnt"] if q_count else 0
        result.append(d)
    return result


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    is_admin = current_user["role"] in ("Administrador/a", "Recursos humans")
    return await _get_full_quiz(quiz_id, db, include_correct=is_admin)


@router.post("", status_code=201)
async def create_quiz(
    body: QuizIn,
    _admin: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    result = await db.execute(
        text("""INSERT INTO quizzes (title, description, category, time_limit, passing_score, active)
                VALUES (:title, :description, :category, :time_limit, :passing_score, :active)"""),
        {"title": body.title, "description": body.description, "category": body.category,
         "time_limit": body.time_limit, "passing_score": body.passing_score, "active": body.active},
    )
    quiz_id = result.lastrowid
    await _insert_questions(quiz_id, body.questions, db)
    await db.commit()
    return await _get_full_quiz(quiz_id, db, include_correct=True)


@router.put("/{quiz_id}")
async def update_quiz(
    quiz_id: int,
    body: QuizIn,
    _admin: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    exists = (await db.execute(
        text("SELECT id FROM quizzes WHERE id = :id"), {"id": quiz_id}
    )).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Quiz no trobat")

    await db.execute(
        text("""UPDATE quizzes SET title=:title, description=:description, category=:category,
                time_limit=:time_limit, passing_score=:passing_score, active=:active WHERE id=:id"""),
        {"title": body.title, "description": body.description, "category": body.category,
         "time_limit": body.time_limit, "passing_score": body.passing_score,
         "active": body.active, "id": quiz_id},
    )
    # Replace questions (cascade handles options)
    await db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id})
    await _insert_questions(quiz_id, body.questions, db)
    await db.commit()
    return await _get_full_quiz(quiz_id, db, include_correct=True)


@router.delete("/{quiz_id}", status_code=204)
async def delete_quiz(
    quiz_id: int,
    _admin: dict = Depends(require_rrhh_or_admin),
    db: AsyncConnection = Depends(get_db),
):
    await db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id})
    await db.execute(text("DELETE FROM quiz_attempts WHERE quiz_id = :qid"), {"qid": quiz_id})
    await db.execute(text("DELETE FROM quizzes WHERE id = :id"), {"id": quiz_id})
    await db.commit()


@router.post("/{quiz_id}/attempt")
async def submit_attempt(
    quiz_id: int,
    body: QuizAttemptIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db),
):
    quiz = (await db.execute(
        text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}
    )).mappings().first()
    if not quiz:
        raise HTTPException(status_code=404)

    questions = (await db.execute(
        text("SELECT * FROM quiz_questions WHERE quiz_id = :qid ORDER BY position"),
        {"qid": quiz_id},
    )).mappings().all()

    score = 0
    max_score = 0
    results: dict = {}

    for q in questions:
        q_id = str(q["id"])
        max_score += q["points"]
        user_answer = body.answers.get(q_id)

        if q["type"] == "multiple_choice":
            correct_opt = (await db.execute(
                text("SELECT id FROM quiz_options WHERE question_id = :qid AND is_correct = 1"),
                {"qid": q["id"]},
            )).mappings().first()
            is_correct = bool(correct_opt and str(correct_opt["id"]) == str(user_answer))
            if is_correct:
                score += q["points"]
            results[q_id] = {"correct": is_correct, "points": q["points"] if is_correct else 0,
                             "correct_id": correct_opt["id"] if correct_opt else None}

        elif q["type"] == "matching":
            opts = (await db.execute(
                text("SELECT * FROM quiz_options WHERE question_id = :qid"),
                {"qid": q["id"]},
            )).mappings().all()
            all_correct = False
            if user_answer and isinstance(user_answer, dict) and opts:
                all_correct = all(
                    str(user_answer.get(str(o["id"]))) == o["match_pair"] for o in opts
                )
            if all_correct:
                score += q["points"]
            correct_map = {str(o["id"]): o["match_pair"] for o in opts}
            results[q_id] = {"correct": all_correct, "points": q["points"] if all_correct else 0,
                             "correct_map": correct_map}

        elif q["type"] == "open_text":
            results[q_id] = {"correct": None, "points": 0, "answer": str(user_answer or "")}

    passed = max_score > 0 and (score / max_score * 100) >= quiz["passing_score"]

    await db.execute(
        text("""INSERT INTO quiz_attempts (quiz_id, user_id, score, max_score, passed, answers_json)
                VALUES (:qid, :uid, :score, :max_score, :passed, :answers)
                ON CONFLICT(quiz_id, user_id) DO UPDATE SET
                    score=excluded.score, max_score=excluded.max_score,
                    passed=excluded.passed, answers_json=excluded.answers_json,
                    completed_at=datetime('now')"""),
        {"qid": quiz_id, "uid": current_user["id"], "score": score, "max_score": max_score,
         "passed": int(passed), "answers": json.dumps(results)},
    )
    await db.commit()

    return {
        "score": score,
        "max_score": max_score,
        "passed": passed,
        "percentage": round(score / max_score * 100) if max_score > 0 else 0,
        "results": results,
    }


async def _insert_questions(quiz_id: int, questions, db: AsyncConnection) -> None:
    for q in questions:
        qr = await db.execute(
            text("""INSERT INTO quiz_questions (quiz_id, type, question, explanation, points, position)
                    VALUES (:quiz_id, :type, :question, :explanation, :points, :position)"""),
            {"quiz_id": quiz_id, "type": q.type, "question": q.question,
             "explanation": q.explanation, "points": q.points, "position": q.position},
        )
        q_id = qr.lastrowid
        for opt in q.options:
            await db.execute(
                text("""INSERT INTO quiz_options (question_id, text, is_correct, match_pair, position)
                        VALUES (:qid, :text, :is_correct, :match_pair, :position)"""),
                {"qid": q_id, "text": opt.text, "is_correct": opt.is_correct,
                 "match_pair": opt.match_pair, "position": opt.position},
            )
