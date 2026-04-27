// Priority order:
//   1. REACT_APP_API_URL env var (set at build time to point to any backend)
//   2. localhost dev → local backend
//   3. Same-origin (backend on same server)
export const API_BASE: string =
  process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/$/, '')
    : window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : '';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  dept: string;
  phone: string;
  ext: string;
  location: string;
  onboarded: number;
  email_notifs: number;
  is_head: number;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthOut {
  status: 'ok' | 'pending_verification' | 'pending_otp';
  email?: string;
  access_token?: string;
  token_type?: string;
  user?: User;
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
    let detail: unknown = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    // Conveni / complex errors come back as objects — flatten to a readable string.
    let msg: string;
    if (typeof detail === 'string') msg = detail;
    else if (detail && typeof detail === 'object' && 'conveni_errors' in (detail as any)) {
      msg = ((detail as any).conveni_errors as string[]).join('\n');
    } else msg = JSON.stringify(detail);
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Image upload ──────────────────────────────────────────────────────────────

export async function apiGetImages(): Promise<{ url: string; name: string }[]> {
  return apiFetch('/api/upload/images');
}

export async function apiDedupImages(): Promise<{ removed_count: number; deleted: string[] }> {
  return apiFetch('/api/upload/dedup', { method: 'DELETE' });
}

export async function apiDeleteImage(filename: string): Promise<void> {
  await apiFetch(`/api/upload/images/${encodeURIComponent(filename)}`, { method: 'DELETE' });
}

export async function apiUploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Error pujant la imatge');
  const data = await res.json();
  return API_BASE + data.url;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthOut> {
  return apiFetch<AuthOut>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(
  name: string,
  email: string,
  password: string
): Promise<AuthOut> {
  return apiFetch<AuthOut>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiVerifyEmail(email: string, code: string): Promise<AuthOut> {
  return apiFetch<AuthOut>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function apiVerifyOTP(email: string, code: string): Promise<AuthOut> {
  return apiFetch<AuthOut>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function apiResendVerification(email: string): Promise<void> {
  await apiFetch('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
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

export async function apiUpdateMe(fields: Partial<Pick<User, 'name' | 'phone' | 'ext' | 'location' | 'email_notifs'>>): Promise<User> {
  return apiFetch<User>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export async function apiCompleteOnboarding(dept: string, isHead: boolean): Promise<User> {
  return apiFetch<User>('/api/users/me/onboarding', {
    method: 'POST',
    body: JSON.stringify({ dept, is_head: isHead }),
  });
}

export async function apiGetDeptHead(dept: string): Promise<{ has_head: boolean }> {
  return apiFetch<{ has_head: boolean }>(`/api/users/dept-head/${encodeURIComponent(dept)}`);
}

export async function apiUpdateDept(dept: string, isHead: boolean): Promise<User> {
  return apiFetch<User>('/api/users/me/dept', {
    method: 'PATCH',
    body: JSON.stringify({ dept, is_head: isHead }),
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

export async function apiDeleteSolicitud(id: number): Promise<void> {
  await apiFetch(`/api/solicituds/${id}`, { method: 'DELETE' });
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
  user_vote: 'up' | 'down' | null;
  status: string;
  response: string;
  created_at: string;
  user_id: number;
}

export async function apiGetSuggestions(): Promise<Suggestion[]> {
  const data = await apiFetch<any[]>('/api/suggestions');
  return data.map(s => ({ ...s, anonymous: !!s.anonymous, user_vote: s.user_vote ?? null }));
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

export async function apiVoteSuggestion(id: number, voteType: 'up' | 'down'): Promise<void> {
  await apiFetch('/api/suggestions/' + id + '/vote', {
    method: 'POST',
    body: JSON.stringify({ vote_type: voteType }),
  });
}

export async function apiUpdateSuggestionStatus(id: number, status: string): Promise<void> {
  await apiFetch('/api/suggestions/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function apiAddSuggestionResponse(id: number, response: string): Promise<void> {
  await apiFetch('/api/suggestions/' + id + '/response', { method: 'PATCH', body: JSON.stringify({ response }) });
}

export async function apiDeleteSuggestion(id: number): Promise<void> {
  await apiFetch('/api/suggestions/' + id, { method: 'DELETE' });
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
  user_id: number;
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

export async function apiDeleteIncidencia(id: number): Promise<void> {
  await apiFetch('/api/incidencies/' + id, { method: 'DELETE' });
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

export async function apiCreateActivity(fields: {
  title: string; category: string; description: string;
  date: string; time: string; location: string; capacity: number;
}): Promise<Activity> {
  return apiFetch<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiUpdateActivity(id: number, fields: {
  title: string; category: string; description: string;
  date: string; time: string; location: string; capacity: number;
}): Promise<void> {
  await apiFetch(`/api/activities/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

export async function apiDeleteActivity(id: number): Promise<void> {
  await apiFetch(`/api/activities/${id}`, { method: 'DELETE' });
}

export async function apiGetActivities(past?: 0 | 1): Promise<Activity[]> {
  const qs = past !== undefined ? `?past=${past}` : '';
  return apiFetch<Activity[]>(`/api/activities${qs}`);
}

export async function apiEnrollActivity(id: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/activities/${id}/enroll`, { method: 'POST' });
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

export async function apiCreateAgendaEvent(fields: {
  title: string; day: number; month: number; time: string; location: string; type: string;
}): Promise<AgendaEvent> {
  return apiFetch<AgendaEvent>('/api/agenda', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiUpdateAgendaEvent(id: number, fields: {
  title: string; day: number; month: number; time: string; location: string; type: string;
}): Promise<void> {
  await apiFetch(`/api/agenda/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

export async function apiDeleteAgendaEvent(id: number): Promise<void> {
  await apiFetch(`/api/agenda/${id}`, { method: 'DELETE' });
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

export async function apiCreateNews(fields: {
  category: string; title: string; summary: string; content: string;
  author: string; date: string; image: string; featured: number;
}): Promise<NewsArticle> {
  return apiFetch<NewsArticle>('/api/news', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiGetNewsArticle(id: number): Promise<NewsArticle> {
  return apiFetch<NewsArticle>(`/api/news/${id}`);
}

export async function apiUpdateNews(id: number, fields: {
  category: string; title: string; summary: string; content: string;
  author: string; date: string; image: string; featured: number;
}): Promise<void> {
  await apiFetch(`/api/news/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

export async function apiDeleteNews(id: number): Promise<void> {
  await apiFetch(`/api/news/${id}`, { method: 'DELETE' });
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

export async function apiClearAllNotifications(): Promise<void> {
  await apiFetch('/api/notifications/clear-all', { method: 'DELETE' });
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
  url: string;
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

// ── Vacances ──────────────────────────────────────────────────────────────────

export interface Vacanca {
  id: number;
  user_id: number;
  author_name: string;
  author_dept: string;
  start_date: string;
  end_date: string;
  comments: string;
  status: string;
  head_status: string;
  head_comment: string;
  rrhh_status: string;
  rrhh_comment: string;
  created_at: string;
}

export async function apiGetVacances(): Promise<Vacanca[]> {
  return apiFetch<Vacanca[]>('/api/vacances');
}

export async function apiCreateVacanca(start_date: string, end_date: string, comments: string): Promise<Vacanca> {
  return apiFetch<Vacanca>('/api/vacances', {
    method: 'POST',
    body: JSON.stringify({ start_date, end_date, comments }),
  });
}

export async function apiUpdateVacancaHead(id: number, status: 'Aprovada' | 'Denegada', comment: string = ''): Promise<void> {
  await apiFetch(`/api/vacances/${id}/head`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comment }),
  });
}

export async function apiUpdateVacancaRrhh(id: number, status: 'Aprovada' | 'Denegada', comment: string = ''): Promise<void> {
  await apiFetch(`/api/vacances/${id}/rrhh`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comment }),
  });
}

export async function apiDeleteVacanca(id: number): Promise<void> {
  await apiFetch(`/api/vacances/${id}`, { method: 'DELETE' });
}
