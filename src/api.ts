const DEV_SERVER_IP = '192.168.10.169';

export const API_BASE: string =
  window.location.hostname === 'localhost'
    ? `http://${DEV_SERVER_IP}/public_html/portal_web/api/index.php`
    : (process.env.PUBLIC_URL || '') + '/api/index.php';

export type AdminRole = 'Treballador/a' | 'Cap de departament' | 'Administrador' | 'Formacions' | 'Comunicacions' | 'SolicitudsDissabtes' | 'SolicitudsVacances';
export const ADMIN_ROLES: AdminRole[] = ['Treballador/a', 'Cap de departament', 'Administrador', 'Formacions', 'Comunicacions', 'SolicitudsDissabtes', 'SolicitudsVacances'];

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roles: string[];
  dept: string;
  phone: string;
  ext: string;
  location: string;
  avatar_url: string | null;
  visible_in_directory: number;
  onboarded: number;
  email_notifs: number;
  is_head: number;
  is_demo_admin: number;
  must_change_password: number;
  active: number;
  requires_prl: number;
  epi_grup: string | null;
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
  remember?: boolean; // client-side flag: true → localStorage, false → sessionStorage
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('tavil_token') ?? sessionStorage.getItem('tavil_token');
}

/** persist=true → localStorage (survives tab close); persist=false → sessionStorage (tab-only) */
export function setToken(token: string, persist = true): void {
  if (persist) {
    localStorage.setItem('tavil_token', token);
    sessionStorage.removeItem('tavil_token');
  } else {
    sessionStorage.setItem('tavil_token', token);
    localStorage.removeItem('tavil_token');
  }
}

export function clearToken(): void {
  localStorage.removeItem('tavil_token');
  sessionStorage.removeItem('tavil_token');
  localStorage.removeItem('tavil_session');
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

type OnUnauthorized = () => void;
let onUnauthorizedCallback: OnUnauthorized | null = null;
let onMustChangePasswordCallback: (() => void) | null = null;
let _impersonatingMode = false;

export function registerUnauthorizedHandler(cb: OnUnauthorized): void {
  onUnauthorizedCallback = cb;
}

export function registerMustChangePasswordHandler(cb: () => void): void {
  onMustChangePasswordCallback = cb;
}

export function setImpersonatingMode(v: boolean): void {
  _impersonatingMode = v;
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
    let detail: string | undefined;
    try { detail = (await res.json()).detail; } catch {}
    if (detail) throw new Error(detail);
    clearToken();
    onUnauthorizedCallback?.();
    throw new Error('No autoritzat');
  }

  if (res.status === 403) {
    let detail: unknown;
    try { detail = (await res.json()).detail; } catch {}
    if (detail === 'must_change_password') {
      if (!_impersonatingMode) onMustChangePasswordCallback?.();
      throw new Error('must_change_password');
    }
    throw new Error(typeof detail === 'string' ? detail : 'Error 403');
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

async function resizeImageFile(file: File, maxPx = 1400, quality = 0.88): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function apiUploadImage(file: File): Promise<string> {
  const toUpload = file.size > 1.5 * 1024 * 1024 ? await resizeImageFile(file) : file;
  const formData = new FormData();
  formData.append('file', toUpload);
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j.detail) detail = j.detail; } catch {}
    throw new Error('Error pujant: ' + detail);
  }
  const data = await res.json();
  return API_BASE + data.url;
}

/**
 * Upload an image OR a video. Returns absolute URL + detected kind.
 * Images are auto-resized (>1.5MB). Videos are sent as-is (50MB cap server-side).
 * onProgress fires with 0..1 during upload (XHR for progress events).
 */
export async function apiUploadMedia(
  file: File,
  onProgress?: (frac: number) => void,
): Promise<{ url: string; kind: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/');
  const toUpload = !isVideo && file.size > 1.5 * 1024 * 1024 ? await resizeImageFile(file) : file;
  const formData = new FormData();
  formData.append('file', toUpload);
  const token = getToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (onProgress) {
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: API_BASE + data.url, kind: data.kind ?? (isVideo ? 'video' : 'image') });
        } catch (e) { reject(new Error('Resposta invàlida del servidor')); }
      } else {
        let detail = `HTTP ${xhr.status}`;
        try { const j = JSON.parse(xhr.responseText); if (j.detail) detail = j.detail; } catch {}
        reject(new Error('Error pujant: ' + detail));
      }
    };
    xhr.onerror = () => reject(new Error('Error de xarxa pujant fitxer'));
    xhr.send(formData);
  });
}

export async function apiGetVideos(): Promise<{ url: string; name: string }[]> {
  return apiFetch('/api/upload/videos');
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

// User self-edit: only avatar, directory visibility, and notif prefs.
// Personal data (name/phone/ext/location/role/dept) must be edited by an admin.
export async function apiUpdateMe(fields: {
  email_notifs?: number;
  avatar_url?: string;
  visible_in_directory?: number;
}): Promise<User> {
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
  avatar_url?: string | null;
  is_head?: number;
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
  link: string;
  enrolled: number;
  past: number;
  image?: string;
}

export async function apiCreateActivity(fields: {
  title: string; category: string; description: string;
  date: string; time: string; location: string; capacity: number; link: string;
  image?: string;
}): Promise<Activity> {
  return apiFetch<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiUpdateActivity(id: number, fields: {
  title: string; category: string; description: string;
  date: string; time: string; location: string; capacity: number; link: string;
  image?: string;
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

export async function apiEnrollActivity(id: number): Promise<{ ok: boolean; status?: string }> {
  return apiFetch<{ ok: boolean; status?: string }>(`/api/activities/${id}/enroll`, { method: 'POST' });
}

export async function apiUnenrollActivity(id: number): Promise<void> {
  await apiFetch(`/api/activities/${id}/enroll`, { method: 'DELETE' });
}

export interface ActivityEnrollment {
  enrollment_id: number;
  user_id: number;
  name: string;
  email: string;
  dept: string;
  enrolled_at: string;
  status: 'confirmed' | 'waitlist' | 'cancelled';
}

export async function apiGetActivityEnrollments(id: number): Promise<ActivityEnrollment[]> {
  return apiFetch<ActivityEnrollment[]>(`/api/activities/${id}/enrollments`);
}

export async function apiGetMyActivityEnrollments(): Promise<{ activity_id: number; status: string }[]> {
  return apiFetch('/api/activities/my');
}

// ── Agenda ────────────────────────────────────────────────────────────────────

export interface AgendaEvent {
  id: number;
  title: string;
  day: number;
  month: number;
  year?: number;
  end_day?: number | null;
  end_month?: number | null;
  end_year?: number | null;
  time: string;
  time_end?: string | null;
  location: string;
  type: string;
  target_departments?: string[]; // null/undefined = visible to all
  activity_id?: number | null;
  quiz_id?: number | null;
}

export async function apiCreateAgendaEvent(fields: {
  title: string; day: number; month: number; year: number; time: string; time_end?: string;
  location: string; type: string; target_departments?: string[]; end_date?: string;
}): Promise<AgendaEvent> {
  return apiFetch<AgendaEvent>('/api/agenda', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiUpdateAgendaEvent(id: number, fields: {
  title: string; day: number; month: number; year: number; time: string; time_end?: string;
  location: string; type: string; target_departments?: string[]; end_date?: string;
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
  link_text: string;
  active: number;
  kind: 'warning' | 'danger' | 'neutral';
}

export async function apiGetNotices(): Promise<Notice[]> {
  return apiFetch<Notice[]>('/api/notices');
}

// ── News ──────────────────────────────────────────────────────────────────────

export type NewsLang = 'ca' | 'es' | 'en';
export type NewsTranslations = Partial<Record<NewsLang, { title?: string; summary?: string }>>;

export interface NewsArticle {
  id: number;
  category: string;
  title: string;            // canonical (CA)
  summary: string;          // canonical (CA)
  content: string;
  /** @deprecated kept for back-compat; not editable in admin. */
  author?: string;
  date: string;
  image: string;
  featured: number;
  active: number;
  translations?: NewsTranslations | null;
  created_at: string;
}

export interface NewsWritePayload {
  category: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  image: string;
  featured: number;
  active: number;
  translations?: NewsTranslations;
}

export async function apiGetNews(): Promise<NewsArticle[]> {
  return apiFetch<NewsArticle[]>('/api/news');
}

export async function apiCreateNews(fields: NewsWritePayload): Promise<NewsArticle> {
  return apiFetch<NewsArticle>('/api/news', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiGetNewsArticle(id: number): Promise<NewsArticle> {
  return apiFetch<NewsArticle>(`/api/news/${id}`);
}

export async function apiUpdateNews(id: number, fields: NewsWritePayload): Promise<void> {
  await apiFetch(`/api/news/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

/** Pick title/summary for given lang, falling back to canonical (CA). */
export function pickTranslation(article: NewsArticle, lang: NewsLang): { title: string; summary: string } {
  const t = article.translations?.[lang];
  return {
    title: (t?.title && t.title.trim()) || article.title,
    summary: (t?.summary && t.summary.trim()) || article.summary,
  };
}

/** Project an article so .title and .summary reflect the requested language. */
export function localizeNews(article: NewsArticle, lang: string): NewsArticle {
  const L = (['ca', 'es', 'en'].includes(lang) ? lang : 'ca') as NewsLang;
  const t = pickTranslation(article, L);
  if (t.title === article.title && t.summary === article.summary) return article;
  return { ...article, title: t.title, summary: t.summary };
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
  is_external: number;
  departments: string; // JSON array string e.g. '["Comercial","RRHH"]'
  target_users: number[];
  start_at: string | null;
  end_at: string | null;
  user_status: string;
  user_progress: number;
  certificate_status?: 'pending' | 'approved' | 'rejected' | null;
  certificate_id?: number | null;
}

// ── Certificates ──────────────────────────────────────────────────────────────

export interface Certificate {
  id: number;
  user_id: number;
  user_name: string;
  user_dept: string;
  course_id: number;
  course_title: string;
  filename: string;
  status: 'pending' | 'approved' | 'rejected';
  is_active: number;
  uploaded_at: string;
  reviewed_at: string | null;
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

export interface ExternalCoursePayload {
  title: string;
  description: string;
  url: string;
  category: string;
  hours: string;
  mandatory: number;
  cert?: number;
  departments: string[];
  target_users: number[];
  start_at?: string | null;
  end_at?: string | null;
}

export async function apiCreateExternalCourse(data: ExternalCoursePayload): Promise<{ id: number }> {
  return apiFetch<{ id: number }>('/api/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateExternalCourse(id: number, data: ExternalCoursePayload): Promise<void> {
  await apiFetch(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteExternalCourse(id: number): Promise<void> {
  await apiFetch(`/api/courses/${id}`, { method: 'DELETE' });
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

// ── Auth: change password ─────────────────────────────────────────────────────

export async function apiChangePassword(newPassword: string, currentPassword?: string): Promise<void> {
  await apiFetch('/api/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ new_password: newPassword, current_password: currentPassword }),
  });
}

// ── Admin: user management ────────────────────────────────────────────────────

export async function apiAdminListUsers(): Promise<User[]> {
  return apiFetch<User[]>('/api/users');
}

export async function apiAdminCreateUser(fields: {
  name: string; email: string; temp_password: string; roles: string[]; dept: string; requires_prl?: number;
}): Promise<User> {
  return apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiAdminUpdateUser(id: number, fields: {
  name?: string; email?: string; roles?: string[]; dept?: string; new_password?: string;
  phone?: string; ext?: string; location?: string; avatar_url?: string; email_notifs?: number;
  requires_prl?: number; epi_grup?: string | null;
}): Promise<User> {
  return apiFetch<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(fields) });
}

export async function apiAdminDeleteUser(id: number): Promise<void> {
  await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
}

export async function apiSetUserActive(id: number, active: boolean): Promise<void> {
  await apiFetch(`/api/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) });
}

// ── Admin: notices management ─────────────────────────────────────────────────

export async function apiGetAllNotices(): Promise<Notice[]> {
  return apiFetch<Notice[]>('/api/notices/all');
}

export async function apiCreateNotice(fields: { title: string; content: string; link: string; link_text: string; active: number; kind: string }): Promise<Notice> {
  return apiFetch<Notice>('/api/notices', { method: 'POST', body: JSON.stringify(fields) });
}

export async function apiUpdateNotice(id: number, fields: { title: string; content: string; link: string; link_text: string; active: number; kind: string }): Promise<Notice> {
  return apiFetch<Notice>(`/api/notices/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

export async function apiDeleteNotice(id: number): Promise<void> {
  await apiFetch(`/api/notices/${id}`, { method: 'DELETE' });
}

// ── Quizzes / Formacions ──────────────────────────────────────────────────────

export interface QuizOption {
  id: number;
  question_id: number;
  text: string;
  is_correct?: number;
  match_pair: string;
  position: number;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'matching' | 'open_text' | 'slide';
  question: string;
  explanation: string;
  points: number;
  position: number;
  media_url?: string;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  time_limit: number;
  passing_score: number;
  mandatory: number;
  active: number;
  start_at: string | null;
  end_at: string | null;
  target_departments: string[];
  target_users: number[];
  is_presential: number;
  location: string;
  created_at: string;
  questions: QuizQuestion[];
  question_count?: number;
  user_attempt?: { score: number; max_score: number; passed: number; completed_at: string } | null;
  in_progress?: boolean;
}

export interface QuizOptionIn {
  text: string;
  is_correct: number;
  match_pair: string;
  position: number;
}

export interface QuizQuestionIn {
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'matching' | 'open_text' | 'slide';
  question: string;
  explanation: string;
  points: number;
  position: number;
  media_url?: string;
  options: QuizOptionIn[];
}

export interface QuizIn {
  title: string;
  description: string;
  image: string;
  category: string;
  time_limit: number;
  passing_score: number;
  mandatory?: number;
  active: number;
  start_at: string | null;
  end_at: string | null;
  target_departments: string[];
  target_users: number[];
  is_presential?: number;
  location?: string;
  questions: QuizQuestionIn[];
}

export interface QuizResultRow {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_dept: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: number;
  completed_at: string;
}

export interface QuizAttemptResult {
  score: number;
  max_score: number;
  passed: boolean;
  percentage: number;
  results: Record<string, { correct: boolean | null; points: number; correct_id?: number; correct_map?: Record<string, string>; answer?: string }>;
}

export async function apiGetQuizzes(): Promise<Quiz[]> {
  return apiFetch<Quiz[]>('/api/quizzes');
}

export async function apiGetQuiz(id: number): Promise<Quiz> {
  return apiFetch<Quiz>(`/api/quizzes/${id}`);
}

export async function apiCreateQuiz(body: QuizIn): Promise<Quiz> {
  return apiFetch<Quiz>('/api/quizzes', { method: 'POST', body: JSON.stringify(body) });
}

export async function apiUpdateQuiz(id: number, body: QuizIn): Promise<Quiz> {
  return apiFetch<Quiz>(`/api/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function apiDeleteQuiz(id: number): Promise<void> {
  await apiFetch(`/api/quizzes/${id}`, { method: 'DELETE' });
}

export async function apiSetQuizMandatory(id: number, mandatory: boolean): Promise<{ ok: boolean; mandatory: number }> {
  return apiFetch(`/api/quizzes/${id}/mandatory`, {
    method: 'PUT',
    body: JSON.stringify({ mandatory: mandatory ? 1 : 0 }),
  });
}

export async function apiSubmitQuizAttempt(id: number, answers: Record<string, unknown>): Promise<QuizAttemptResult> {
  return apiFetch<QuizAttemptResult>(`/api/quizzes/${id}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function apiGetQuizResults(id: number): Promise<QuizResultRow[]> {
  return apiFetch<QuizResultRow[]>(`/api/quizzes/${id}/results`);
}

// ── Quiz progress (resume on reload) ──────────────────────────────────────────
export interface QuizProgress {
  quiz_id: number;
  current_question_idx: number;
  answers: Record<string, unknown>;
  updated_at: string;
}

export async function apiGetQuizProgress(id: number): Promise<QuizProgress | null> {
  try {
    return await apiFetch<QuizProgress>(`/api/quizzes/${id}/progress`);
  } catch (e: any) {
    if (/No progress|Not found/i.test(String(e?.message ?? ''))) return null;
    throw e;
  }
}

export async function apiSaveQuizProgress(
  id: number,
  current_question_idx: number,
  answers: Record<string, unknown>
): Promise<void> {
  await apiFetch(`/api/quizzes/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ current_question_idx, answers }),
  });
}

export async function apiClearQuizProgress(id: number): Promise<void> {
  await apiFetch(`/api/quizzes/${id}/progress`, { method: 'DELETE' });
}

export async function apiGetQuizInProgressCount(): Promise<number> {
  const r = await apiFetch<{ count: number }>('/api/quizzes/in-progress-count');
  return r.count;
}

export async function apiUploadCertificate(
  courseId: number,
  file: File
): Promise<{ id: number; course_id: number; status: string; uploaded_at: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('course_id', String(courseId));
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/certificates`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try { const j = await res.json(); if (j.detail) detail = j.detail; } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiGetCertificates(status?: 'pending' | 'approved' | 'rejected'): Promise<Certificate[]> {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<Certificate[]>(`/api/certificates${qs}`);
}

export async function apiReviewCertificate(id: number, action: 'approve' | 'reject'): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/certificates/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

export async function openCertificateFile(id: number): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/certificates/${id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export interface NonCompletersResult {
  non_completers: { id: number; name: string; email: string; dept: string }[];
  total_audience: number;
  completed: number;
}

export async function apiGetQuizNonCompleters(id: number): Promise<NonCompletersResult> {
  return apiFetch<NonCompletersResult>(`/api/quizzes/${id}/non-completers`);
}

// ── Formation user progress (Seguiment) ───────────────────────────────────────

export interface FormationUserProgress {
  id: number;
  name: string;
  dept: string;
  status: 'Completat' | 'En curs' | 'Pendent' | 'No aprovat';
  progress?: number;      // for external courses (0-100)
  score_pct?: number | null; // for quizzes
  completed_at?: string | null;
}

export async function apiGetCourseUsers(courseId: number): Promise<FormationUserProgress[]> {
  return apiFetch<FormationUserProgress[]>(`/api/courses/${courseId}/users`);
}

export async function apiGetQuizUsers(quizId: number): Promise<FormationUserProgress[]> {
  return apiFetch<FormationUserProgress[]>(`/api/quizzes/${quizId}/users`);
}

export async function apiImpersonate(userId: number): Promise<TokenOut> {
  return apiFetch<TokenOut>(`/api/auth/impersonate/${userId}`, { method: 'POST' });
}

// ── Prevention / PRL ──────────────────────────────────────────────────────────

export async function apiPreventionStatus(): Promise<{ pending: string[] }> {
  return apiFetch('/prevention/status');
}

export async function apiPreventionSign(document_key: string, signature_data: string, pdf_data?: string): Promise<{ ok: boolean }> {
  return apiFetch('/prevention/sign', {
    method: 'POST',
    body: JSON.stringify({ document_key, signature_data, ...(pdf_data ? { pdf_data } : {}) }),
  });
}
