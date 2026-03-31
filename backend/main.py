from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, users, suggestions, incidencies, enquestes
from routers import employees, activities, agenda, notices, news, courses, solicituds, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="TAVIL Portal API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
