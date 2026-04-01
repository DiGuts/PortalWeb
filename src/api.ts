const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  dept: string;
  phone: string;
  ext: string;
  location: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('tavil_token');
}

export function setToken(token: string): void {
  localStorage.setItem('tavil_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('tavil_token');
  localStorage.removeItem('tavil_session');
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

type OnUnauthorized = () => void;
let onUnauthorizedCallback: OnUnauthorized | null = null;

export function registerUnauthorizedHandler(cb: OnUnauthorized): void {
  onUnauthorizedCallback = cb;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    onUnauthorizedCallback?.();
    throw new Error('No autoritzat');
  }

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<TokenOut> {
  return apiFetch<TokenOut>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(
  name: string,
  email: string,
  password: string
): Promise<TokenOut> {
  return apiFetch<TokenOut>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiGetMe(): Promise<User> {
  return apiFetch<User>('/api/users/me');
}

export async function apiUpdateMyRole(role: string): Promise<User> {
  return apiFetch<User>('/api/users/me/role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function apiUpdateMe(fields: Partial<Pick<User, 'name' | 'phone' | 'ext' | 'location'>>): Promise<User> {
  return apiFetch<User>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

// ── Solicituds ────────────────────────────────────────────────────────────────

export interface Solicitud {
  id: number;
  date: string;
  comments: string;
  status: string;
  motive: string;
  author: string;
  created_at: string;
}

export async function apiGetSolicituds(): Promise<Solicitud[]> {
  return apiFetch<Solicitud[]>('/api/solicituds');
}

export async function apiCreateSolicitud(date: string, comments: string): Promise<Solicitud> {
  return apiFetch<Solicitud>('/api/solicituds', {
    method: 'POST',
    body: JSON.stringify({ date, motive: '', comments }),
  });
}

export async function apiUpdateSolicitud(id: number, status: 'Aprovada' | 'Denegada', motive: string = ''): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/solicituds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, motive }),
  });
}

// ── Suggestions ───────────────────────────────────────────────────────────────

export interface Suggestion {
  id: number;
  title: string;
  description: string;
  category: string;
  anonymous: boolean;
  author: string;
  votes: number;
  status: string;
  response: string;
  created_at: string;
}

export async function apiGetSuggestions(): Promise<Suggestion[]> {
  const data = await apiFetch<any[]>('/api/suggestions');
  return data.map(s => ({ ...s, anonymous: !!s.anonymous }));
}

export async function apiCreateSuggestion(
  title: string,
  description: string,
  category: string,
  anonymous: boolean
): Promise<Suggestion> {
  const s = await apiFetch<any>('/api/suggestions', {
    method: 'POST',
    body: JSON.stringify({ title, description, category, anonymous }),
  });
  return { ...s, anonymous: !!s.anonymous };
}

export async function apiVoteSuggestion(id: number): Promise<void> {
  await apiFetch('/api/suggestions/' + id + '/vote', { method: 'POST' });
}

export async function apiUpdateSuggestionStatus(id: number, status: string): Promise<void> {
  await apiFetch('/api/suggestions/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function apiAddSuggestionResponse(id: number, response: string): Promise<void> {
  await apiFetch('/api/suggestions/' + id + '/response', { method: 'PATCH', body: JSON.stringify({ response }) });
}

// ── Incidències ───────────────────────────────────────────────────────────────

export interface Incidencia {
  id: number;
  title: string;
  description: string;
  area: string;
  priority: string;
  author: string;
  status: string;
  assigned_to: string;
  resolution: string;
  created_at: string;
}

export async function apiGetIncidencies(): Promise<Incidencia[]> {
  return apiFetch<Incidencia[]>('/api/incidencies');
}

export async function apiCreateIncidencia(
  title: string,
  description: string,
  area: string,
  priority: string
): Promise<Incidencia> {
  return apiFetch<Incidencia>('/api/incidencies', {
    method: 'POST',
    body: JSON.stringify({ title, description, area, priority }),
  });
}

export async function apiUpdateIncidenciaStatus(
  id: number,
  status: string,
  assigned_to: string,
  resolution: string
): Promise<void> {
  await apiFetch('/api/incidencies/' + id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status, assigned_to, resolution }),
  });
}

// ── Enquestes ─────────────────────────────────────────────────────────────────

export interface Enquesta {
  id: number;
  title: string;
  questions: number;
  deadline: string;
  creator: string;
  total: number;
  responses: number;
  status: string;
  created_at: string;
  user_completed?: boolean;
}

export async function apiGetEnquestes(): Promise<Enquesta[]> {
  return apiFetch<Enquesta[]>('/api/enquestes');
}

export async function apiRespondreEnquesta(id: number): Promise<void> {
  await apiFetch(`/api/enquestes/${id}/respond`, { method: 'POST' });
}

// ── Employees ─────────────────────────────────────────────────────────────────

export interface Employee {
  id: number;
  name: string;
  role: string;
  dept: string;
  email: string;
  phone: string;
  ext: string;
  initials: string;
  color: string;
}

export async function apiGetEmployees(dept?: string): Promise<Employee[]> {
  const qs = dept ? `?dept=${encodeURIComponent(dept)}` : '';
  return apiFetch<Employee[]>(`/api/employees${qs}`);
}

// ── Activities ────────────────────────────────────────────────────────────────

export interface Activity {
  id: number;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  enrolled: number;
  past: number;
}

export async function apiGetActivities(past?: 0 | 1): Promise<Activity[]> {
  const qs = past !== undefined ? `?past=${past}` : '';
  return apiFetch<Activity[]>(`/api/activities${qs}`);
}

// ── Agenda ────────────────────────────────────────────────────────────────────

export interface AgendaEvent {
  id: number;
  title: string;
  day: number;
  month: number;
  time: string;
  location: string;
  type: string;
}

export async function apiGetAgendaEvents(month?: number): Promise<AgendaEvent[]> {
  const qs = month !== undefined ? `?month=${month}` : '';
  return apiFetch<AgendaEvent[]>(`/api/agenda${qs}`);
}

// ── Notices ───────────────────────────────────────────────────────────────────

export interface Notice {
  id: number;
  title: string;
  content: string;
  link: string;
  active: number;
}

export async function apiGetNotices(): Promise<Notice[]> {
  return apiFetch<Notice[]>('/api/notices');
}

// ── News ──────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: number;
  category: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  image: string;
  featured: number;
  created_at: string;
}

export async function apiGetNews(): Promise<NewsArticle[]> {
  return apiFetch<NewsArticle[]>('/api/news');
}

export async function apiGetNewsArticle(id: number): Promise<NewsArticle> {
  return apiFetch<NewsArticle>(`/api/news/${id}`);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  tab: string;
  read: number;
  created_at: string;
}

export async function apiGetNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/api/notifications');
}

export async function apiMarkNotifRead(id: number): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function apiMarkAllNotifsRead(): Promise<void> {
  await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
}

// ── Courses ───────────────────────────────────────────────────────────────────

export interface Course {
  id: number;
  title: string;
  category: string;
  description: string;
  hours: string;
  mandatory: number;
  cert: number;
  user_status: string;
  user_progress: number;
}

export async function apiGetCourses(): Promise<Course[]> {
  return apiFetch<Course[]>('/api/courses');
}

export async function apiUpdateCourseProgress(id: number, status: string, progress: number): Promise<void> {
  await apiFetch(`/api/courses/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ status, progress }),
  });
}
