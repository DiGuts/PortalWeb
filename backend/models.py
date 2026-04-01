from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "Treballador/a"
    dept: str = "General"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    dept: str
    phone: str
    ext: str
    location: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Users ─────────────────────────────────────────────────────────────────────

class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    ext: Optional[str] = None
    location: Optional[str] = None


class UserRoleIn(BaseModel):
    role: str


# ── Suggestions ───────────────────────────────────────────────────────────────

class SuggestionIn(BaseModel):
    title: str
    description: str = ""
    category: str = "General"
    anonymous: bool = True


class SuggestionStatusIn(BaseModel):
    status: str


class SuggestionResponseIn(BaseModel):
    response: str


# ── Incidències ───────────────────────────────────────────────────────────────

class IncidenciaIn(BaseModel):
    title: str
    description: str = ""
    area: str = "General"
    priority: str = "Baixa"


class IncidenciaStatusIn(BaseModel):
    status: str
    assigned_to: str = ""
    resolution: str = ""


# ── Enquestes ─────────────────────────────────────────────────────────────────

class EnquestaIn(BaseModel):
    title: str
    questions: int = 0
    deadline: str = ""
    total: int = 140


# ── News ──────────────────────────────────────────────────────────────────────

class NewsIn(BaseModel):
    category: str
    title: str
    summary: str = ""
    content: str = ""
    author: str = ""
    date: str = ""
    image: str = ""
    featured: int = 0


# ── Activities ────────────────────────────────────────────────────────────────

class ActivityIn(BaseModel):
    title: str
    category: str = ""
    description: str = ""
    date: str = ""
    time: str = ""
    location: str = ""
    capacity: int = 0


# ── Agenda ────────────────────────────────────────────────────────────────────

class AgendaEventIn(BaseModel):
    title: str
    day: int
    month: int
    time: str = ""
    location: str = ""
    type: str = "Sessió interna"


# ── Courses ───────────────────────────────────────────────────────────────────

class CourseProgressIn(BaseModel):
    status: str  # 'Pendent' | 'En curs' | 'Completat'
    progress: int = 0


# ── Solicituds ────────────────────────────────────────────────────────────────

class SolicitudIn(BaseModel):
    date: str
    motive: str
    comments: str = ""


class SolicitudUpdateIn(BaseModel):
    status: str  # 'Aprovada' | 'Denegada'
    motive: str = ""
