from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailIn(BaseModel):
    email: EmailStr
    code: str


class VerifyOTPIn(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationIn(BaseModel):
    email: EmailStr


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
    onboarded: int = 0
    email_notifs: int = 1
    is_head: int = 0


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
    title: str = Field(..., max_length=200)
    description: str = Field("", max_length=2000)
    category: str = Field("General", max_length=100)
    anonymous: bool = True


class SuggestionStatusIn(BaseModel):
    status: str


class SuggestionResponseIn(BaseModel):
    response: str


class SuggestionVoteIn(BaseModel):
    vote_type: str = "up"  # 'up' | 'down'


# ── Incidències ───────────────────────────────────────────────────────────────

class IncidenciaIn(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field("", max_length=2000)
    area: str = Field("General", max_length=100)
    priority: str = Field("Baixa", max_length=50)


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
    category: str = Field(..., max_length=100)
    title: str = Field(..., max_length=300)
    summary: str = Field("", max_length=500)
    content: str = Field("", max_length=20000)
    author: str = Field("", max_length=200)
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
    motive: str = Field("", max_length=500)
    comments: str = Field("", max_length=1000)


class SolicitudUpdateIn(BaseModel):
    status: str  # 'Aprovada' | 'Denegada'
    motive: str = ""


# ── Onboarding ────────────────────────────────────────────────────────────────

class OnboardingIn(BaseModel):
    dept: str
    is_head: bool = False


# ── Vacances ──────────────────────────────────────────────────────────────────

class VacancaIn(BaseModel):
    start_date: str
    end_date: str
    comments: str = ""


class VacancaHeadUpdateIn(BaseModel):
    status: str   # 'Aprovada' | 'Denegada'
    comment: str = ""


class VacancaRrhhUpdateIn(BaseModel):
    status: str   # 'Aprovada' | 'Denegada'
    comment: str = ""


# ── User extended ─────────────────────────────────────────────────────────────

class UserUpdateExtIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    ext: Optional[str] = None
    location: Optional[str] = None
    email_notifs: Optional[int] = None


class UserDeptIn(BaseModel):
    dept: str
    is_head: bool = False
