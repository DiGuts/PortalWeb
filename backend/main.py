import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import auth, users, suggestions, incidencies, enquestes
from routers import employees, activities, agenda, notices, news, courses, solicituds, notifications, upload, vacances, quizzes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from database import run_migrations
    await run_migrations()
    yield


app = FastAPI(title="TAVIL Portal API", version="1.0.0", lifespan=lifespan)

_CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(suggestions.router)
app.include_router(incidencies.router)
app.include_router(enquestes.router)
app.include_router(employees.router)
app.include_router(activities.router)
app.include_router(agenda.router)
app.include_router(notices.router)
app.include_router(news.router)
app.include_router(courses.router)
app.include_router(solicituds.router)
app.include_router(notifications.router)
app.include_router(vacances.router)
app.include_router(upload.router)
app.include_router(quizzes.router)

UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
