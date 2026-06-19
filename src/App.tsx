import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback, lazy, Suspense } from 'react';
import { LoginScreen } from './components/mobile/auth/LoginScreen';
import { MediaUploader } from './components/MediaUploader';
// AdminBackoffice → lazy (heavy admin bundle, minority of users)
import { CreateAgendaModal, EditAgendaModal } from './components/admin/CreateAgendaModal';
import { ConfirmModal as SharedConfirmModal, useConfirm } from './components/ConfirmDialog';
import { VerifyScreen } from './components/mobile/auth/VerifyScreen';
import { ForgotScreen } from './components/mobile/auth/ForgotScreen';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { initGraph, getGraphAccount, graphLogin, graphLogout, listGraphFolder, type SPFile } from './graphApi';
import {
  Home, Newspaper, Activity as ActivityIcon, Calendar, Users, Building2,
  GraduationCap, MessageSquare, UserCircle, Search, Bell,
  Moon, ChevronLeft, ChevronRight, ChevronDown, Mail, Database, FolderOpen,
  AlertTriangle, Info, ArrowRight, Sun, MapPin, Clock, Phone, FileText,
  BookOpen, Shield, ThumbsUp, ThumbsDown, Send, ExternalLink, CreditCard,
  CheckCircle, Star, LogOut, LayoutGrid, Check,
  Heart, Gift, Globe, Download, Video, Award, Settings, Eye, EyeOff, Lock, Pencil, Trash2,
  AlignLeft, Image as ImageIcon, Plus, GripVertical, X, Menu,
  BarChart3, ShieldCheck, KeyRound, PlayCircle, Target,
  Type as TypeIcon, Heading2, Quote, Minus, RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/cn';
import { timeAgo } from './lib/timeAgo';
import { scrollPageToTop, scrollIntoViewIfBelowFold, useScrollIntoViewWhen } from './lib/scroll';
import { useIsMobile } from './lib/useIsMobile';
import { usePersistedSubTab } from './lib/usePersistedSubTab';
import { setGlobalNavHidden, registerGlobalNavSetter } from './lib/globalNav';
import { tabPrefetch, tabPrefetchAt, isTabCacheFresh, prefetchTabData, resetTabPrefetch } from './lib/tabPrefetch';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonInici, SkeletonNoticies, SkeletonActivitats, SkeletonAgenda, SkeletonDirectori, SkeletonCampus } from './components/shared/Skeleton';
import { SidebarItem, SidebarSection } from './components/shared/Sidebar';
import { FilterChip } from './components/shared/FilterChip';
import { DropdownMultiselect } from './components/shared/DropdownMultiselect';
import { DatePicker, TimePicker } from './components/shared/AgendaPickers';
import { ToastProvider, useToast } from './components/shared/Toast';
import { AField, AInput, ATextarea, ASelect, AdminCreateModalShell } from './components/admin/primitives';
import { DeptSearch } from './components/admin/DeptSearch';
// AgendaTab, DirectoriTab, CampusTavilTab → lazy (see lazy declarations below)
import { UnderlineTab } from './components/shared/UnderlineTab';
import { EditModal } from './components/shared/EditModal';
import { ImageCropModal } from './components/shared/ImageCropModal';
import { Toggle } from './components/shared/Toggle';
import { resolveImg } from './lib/resolveImg';
import { DEPT_ORDER, avatarBg, deptLabel } from './lib/depts';
import { MobileAppHeader } from './components/mobile/MobileAppHeader';
import { MobileDrawer } from './components/mobile/MobileDrawer';
import { MesTab, MesSettingsGroup } from './components/mobile/MesTab';
import { BottomNavBar } from './components/mobile/BottomNavBar';
import { MobileNotificationsOverlay } from './components/mobile/MobileNotificationsOverlay';
// Auth pages + PreventionOnboarding → lazy (not seen once logged in)
import { validateVacanca, ANNUAL_QUOTA_DAYS, laboralDaysBetween } from './conveni';
import {
  User, AuthOut,
  apiLogin, apiVerifyEmail, apiVerifyOTP, apiResendVerification,
  apiGetMe, apiUpdateMe, apiUpdateMyRole,
  setToken, clearToken, getToken, registerUnauthorizedHandler, registerMustChangePasswordHandler,
  apiGetSuggestions, apiCreateSuggestion, apiVoteSuggestion, apiUpdateSuggestionStatus, apiAddSuggestionResponse, apiDeleteSuggestion, Suggestion,
  apiGetIncidencies, apiCreateIncidencia, apiUpdateIncidenciaStatus, apiDeleteIncidencia, Incidencia,
  apiGetEnquestes, apiRespondreEnquesta, Enquesta,
  apiGetSolicituds, apiCreateSolicitud, apiUpdateSolicitud, apiDeleteSolicitud, Solicitud,
  Notice, apiGetNotices,
  NewsArticle, NewsTranslations, apiGetNews, apiGetNewsArticle, apiCreateNews, apiUpdateNews, apiDeleteNews, localizeNews,
  Activity, apiGetActivities, apiCreateActivity, apiUpdateActivity, apiDeleteActivity, apiEnrollActivity, apiUnenrollActivity, apiGetMyActivityEnrollments,
  AgendaEvent, apiGetAgendaEvents, apiCreateAgendaEvent, apiUpdateAgendaEvent, apiDeleteAgendaEvent,
  apiUploadImage, apiUploadMedia, apiGetImages, API_BASE,
  Employee, apiGetEmployees,
  Course, apiGetCourses, ExternalCoursePayload, apiCreateExternalCourse, apiUpdateExternalCourse, apiDeleteExternalCourse,
  Notification, apiGetNotifications, apiMarkNotifRead, apiMarkAllNotifsRead, apiClearAllNotifications,
  apiGetDeptHead, apiUpdateDept,
  Vacanca, apiGetVacances, apiCreateVacanca, apiUpdateVacancaHead, apiUpdateVacancaRrhh, apiDeleteVacanca,
  apiChangePassword,
  apiPreventionStatus,
  apiAdminListUsers, apiAdminCreateUser, apiAdminUpdateUser, apiAdminDeleteUser,
  apiGetAllNotices, apiCreateNotice, apiUpdateNotice, apiDeleteNotice,
  Quiz, QuizIn, QuizAttemptResult, QuizResultRow,
  apiGetQuizzes, apiGetQuiz, apiCreateQuiz, apiUpdateQuiz, apiDeleteQuiz, apiSubmitQuizAttempt,
  apiGetQuizResults, apiGetQuizProgress, apiSaveQuizProgress, apiClearQuizProgress, apiGetQuizInProgressCount,
  apiGetQuizNonCompleters, NonCompletersResult,
  apiImpersonate,
  setImpersonatingMode,
} from './api';


// ── Lazy-loaded chunks ────────────────────────────────────────────────────────
const AgendaTab         = lazy(() => import('./components/tabs/AgendaTab').then(m => ({ default: m.AgendaTab })));
const DirectoriTab      = lazy(() => import('./components/tabs/DirectoriTab').then(m => ({ default: m.DirectoriTab })));
const CampusTavilTab    = lazy(() => import('./components/tabs/CampusTavilTab').then(m => ({ default: m.CampusTavilTab })));
const AdminBackoffice   = lazy(() => import('./components/admin/AdminBackoffice').then(m => ({ default: m.AdminBackoffice })));
const LoginPage         = lazy(() => import('./components/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const VerifyEmailPage   = lazy(() => import('./components/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const OTPPage           = lazy(() => import('./components/auth/OTPPage').then(m => ({ default: m.OTPPage })));
const ChangePasswordModal = lazy(() => import('./components/auth/ChangePasswordModal').then(m => ({ default: m.ChangePasswordModal })));
const PreventionOnboarding = lazy(() => import('./components/prevention/PreventionOnboarding').then(m => ({ default: m.PreventionOnboarding })));

// ── Inici Tab ─────────────────────────────────────────────────────────────────

const NEWS_CAT_COLORS: Record<string, string> = {
  "Notícies corporatives": "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  "Recursos humans":       "bg-pink-100 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400",
  "Seguretat":             "bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
  "Comunicats interns":    "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  "Esdeveniments":         "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  "Innovació":             "bg-violet-100 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
};
function InicialTab({ onNavigate, onNavigateToDate, onOpenDrawer, hasUnread, onOpenNotifs, currentUser: currentUserProp }: { onNavigate?: (tab: string) => void; onNavigateToDate?: (day: number, month: number, year: number) => void; onOpenDrawer?: () => void; hasUnread?: boolean; onOpenNotifs?: () => void; currentUser?: User | null }) {
  const [notices, setNotices] = useState<Notice[]>(() => tabPrefetch.notices ?? []);
  const [rawNews, setNews] = useState<NewsArticle[]>(() => tabPrefetch.news ?? []);
  const newsLang = i18n.language;
  const news = useMemo(() => rawNews.map(n => localizeNews(n, newsLang)), [rawNews, newsLang]);
  const [activities, setActivities] = useState<Activity[]>(() => tabPrefetch.activities ?? []);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>(() => tabPrefetch.agendaEvents ?? []);
  const [myEnrollments, setMyEnrollments] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(
    () => !(tabPrefetch.notices && tabPrefetch.news && tabPrefetch.activities && tabPrefetch.agendaEvents)
  );
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeDrawerOpen, setNoticeDrawerOpen] = useState(false);
  useEffect(() => { setGlobalNavHidden(noticeDrawerOpen); }, [noticeDrawerOpen]);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    let cancelled = false;
    const tasks: Promise<unknown>[] = [];
    if (!isTabCacheFresh('notices')) {
      tasks.push(apiGetNotices().then(d => { if (!cancelled) { setNotices(d); tabPrefetch.notices = d; tabPrefetchAt.notices = Date.now(); } }));
    }
    if (!isTabCacheFresh('news')) {
      tasks.push(apiGetNews().then(d => { if (!cancelled) { setNews(d); tabPrefetch.news = d; tabPrefetchAt.news = Date.now(); } }));
    }
    if (!isTabCacheFresh('activities')) {
      tasks.push(apiGetActivities(0).then(d => { if (!cancelled) { setActivities(d); tabPrefetch.activities = d; tabPrefetchAt.activities = Date.now(); } }));
    }
    if (!isTabCacheFresh('agendaEvents')) {
      tasks.push(apiGetAgendaEvents().then(d => { if (!cancelled) { setAgendaEvents(d); tabPrefetch.agendaEvents = d; tabPrefetchAt.agendaEvents = Date.now(); } }));
    }
    if (tasks.length === 0) { setLoading(false); return () => { cancelled = true; }; }
    setError(null);
    Promise.allSettled(tasks).then(results => {
      if (cancelled) return;
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) setError("No s'han pogut carregar les dades. Comprova la connexió.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    apiGetMyActivityEnrollments().then(list => { if (!cancelled) setMyEnrollments(new Map(list.map(e => [e.activity_id, e.status]))); }).catch(() => {});
    return () => { cancelled = true; };
  }, [retryCount]);

  const notice = notices[noticeIndex];
  const comunicats = news.filter(n => n.category === 'Comunicats interns');
  const featuredNews = news.filter(n => n.category !== 'Comunicats interns' && n.featured === 1);
  const featured = featuredNews[featuredIdx];

  // Auto-rotate featured carousel
  useEffect(() => {
    if (featuredNews.length < 2) return;
    const id = setInterval(() => setFeaturedIdx(i => (i + 1) % featuredNews.length), 6000);
    return () => clearInterval(id);
  }, [featuredNews.length]);

  // Grid: non-featured news (excl. comunicats) + activities, sort by date desc, cap 8
  type NovetatItem = { kind: 'news' | 'activity'; id: number; title: string; summary: string; date: string; image?: string; category?: string };
  const parseDate = (s: string): number => {
    if (!s) return 0;
    const d = new Date(s);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };
  const novetats: NovetatItem[] = [
    ...news.filter(n => n.category !== 'Comunicats interns' && n.featured !== 1).map(n => ({
      kind: 'news' as const, id: n.id, title: n.title, summary: n.summary, date: n.date, image: n.image, category: n.category,
    })),
    ...activities.map(a => ({
      kind: 'activity' as const, id: a.id, title: a.title, summary: a.description, date: a.date, image: undefined, category: a.category,
    })),
  ].sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 8);

  // Mini calendar cells
  const navigateCalMonth = (dir: 1 | -1) => {
    setCalMonth(m => {
      const nm = m + dir;
      if (nm > 12) { setCalYear(y => y + 1); return 1; }
      if (nm < 1) { setCalYear(y => y - 1); return 12; }
      return nm;
    });
  };
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const miniCells: (number | null)[] = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const miniEventDays = new Set(agendaEvents.filter(e => e.month === calMonth).map(e => e.day));
  const isCalToday = (d: number) => d === today.getDate() && calMonth === today.getMonth() + 1 && calYear === today.getFullYear();

  // Upcoming events this week (Mon-Sun)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon,...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() + diffToMon); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
  const upcomingThisWeek = agendaEvents
    .filter(ev => {
      const d = new Date(calYear, ev.month - 1, ev.day);
      return d >= weekStart && d <= weekEnd;
    })
    .sort((a, b) => (a.month - b.month) || (a.day - b.day))
    .slice(0, 4);

  const isMobileInici = useIsMobile();
  const { t } = useTranslation();
  const MONTH_NAMES = t('common.months', { returnObjects: true }) as string[];
  const MONTH_ABBR_ARR = t('common.monthsAbbr', { returnObjects: true }) as string[];
  const MONTH_ABBR: Record<number, string> = Object.fromEntries(MONTH_ABBR_ARR.map((m, i) => [i + 1, m]));
  const _daysAbbr = t('common.daysAbbr', { returnObjects: true }) as string[];
  const daysMonFirst = [..._daysAbbr.slice(1), _daysAbbr[0]];

  // Open article directly from home: store target id + origin so NoticiesTab
  // mounts straight into detail view, and back returns to Inici.
  const openArticleFromHome = (id: number) => {
    try {
      window.sessionStorage.setItem('tavil_selected_news_id', String(id));
      window.sessionStorage.setItem('tavil_news_origin', 'Inici');
    } catch {}
    onNavigate?.('Notícies');
  };

  if (isMobileInici) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('common.goodMorning') : hour < 19 ? t('common.goodAfternoon') : t('common.goodEvening');
    const firstName = (currentUserProp?.name ?? '').split(' ')[0] || 'Hola';
    const MONTH_NAMES = t('common.months', { returnObjects: true }) as string[];
    const quickItems = [
      { id: 'Solicituds', Icon: FileText, label: t('home.solicitudsQuick') },
      { id: 'Agenda', Icon: Calendar, label: t('nav.agenda') },
      { id: 'Campus', Icon: GraduationCap, label: t('nav.campus') },
    ];
    const moreNews = news.filter(n => n.category !== 'Comunicats interns').slice(featured ? 1 : 0, 4);

    return (
      <div style={{ paddingBottom: 96, background: 'var(--tavil-bg)' }}>
        {/* Top bar */}
        <MobileAppHeader
          onOpenDrawer={onOpenDrawer ?? (() => {})}
          onNotif={onOpenNotifs ?? (() => {})}
          onTabChange={onNavigate ?? (() => {})}
          hasUnread={hasUnread}
          isDarkMode={false}
        />

        {/* Greeting */}
        <div style={{ padding: '18px 20px 8px' }}>
          <div style={{ fontSize: 13, color: 'var(--tavil-muted)', marginBottom: 2 }}>{greeting},</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--tavil-text)',
          }}>{firstName}.</div>
        </div>

        {/* Urgent banner */}
        {notice && (() => {
          const nk = notice.kind ?? 'warning';
          const ms = nk === 'danger'
            ? { bg: '#fef2f2', color: '#7f1d1d', border: '1px solid #fecaca', iconColor: '#dc2626', NIcon: AlertTriangle }
            : nk === 'neutral'
            ? { bg: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', iconColor: '#6b7280', NIcon: Info }
            : { bg: '#fffbeb', color: '#222725', border: '1px solid #f59e0b', iconColor: '#92400e', NIcon: AlertTriangle };
          const isLong = !!(notice.content && notice.content.length > 80);
          return (
          <>
          <div style={{ padding: '14px 16px 0' }}>
            <div
              onClick={isLong ? () => setNoticeDrawerOpen(true) : undefined}
              style={{ background: ms.bg, color: ms.color, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, border: ms.border, cursor: isLong ? 'pointer' : 'default' }}
            >
              <ms.NIcon size={20} strokeWidth={1.8} style={{ flexShrink: 0, color: ms.iconColor, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{notice.title}</div>
                {notice.content && (
                  <div style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.35, marginTop: 2, opacity: 0.85, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                    {notice.content}
                  </div>
                )}
                {isLong ? (
                  <button
                    onClick={e => { e.stopPropagation(); setNoticeDrawerOpen(true); }}
                    style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: ms.iconColor, display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {t('common.showAll')} <ChevronDown size={11} />
                  </button>
                ) : notice.link && notice.link_text ? (
                  <button onClick={() => window.open(notice.link, '_blank', 'noopener,noreferrer')}
                    style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, color: ms.iconColor, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {notice.link_text} <ArrowRight size={11} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          {noticeDrawerOpen && createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
              <div onClick={() => setNoticeDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
              <div className="anim-sheet-enter" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '80vh', overflowY: 'auto', borderTop: `2px solid ${ms.iconColor}33` }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tavil-border)', margin: '0 auto 20px' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <ms.NIcon size={20} strokeWidth={1.8} style={{ flexShrink: 0, color: ms.iconColor, marginTop: 2 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: ms.color, lineHeight: 1.3 }}>{notice.title}</div>
                  </div>
                  <button onClick={() => setNoticeDrawerOpen(false)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 16, background: 'var(--tavil-faint)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
                {notice.content && (
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: ms.color, opacity: 0.85, whiteSpace: 'pre-line', marginBottom: notice.link && notice.link_text ? 20 : 0 }}>
                    {notice.content}
                  </p>
                )}
                {notice.link && notice.link_text && (
                  <button
                    onClick={() => { window.open(notice.link, '_blank', 'noopener,noreferrer'); setNoticeDrawerOpen(false); }}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, background: ms.iconColor, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
                  >
                    {notice.link_text} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>,
            document.body
          )}
          </>
          );
        })()}

        {/* Quick access */}
        <div style={{ padding: '24px 20px 4px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>{t('home.quickAccess')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {quickItems.map(q => (
              <button key={q.id} onClick={() => onNavigate?.(q.id)} style={{
                background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                borderRadius: 14, padding: '14px 6px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                color: 'var(--tavil-text)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(191,33,30,0.08)', color: 'var(--tavil-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><q.Icon size={18} strokeWidth={1.7} /></div>
                <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.2, color: 'var(--tavil-text)' }}>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured news */}
        {featured && (
          <>
            <div style={{ padding: '28px 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{t('news.featured')}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.05, letterSpacing: '0.01em', color: 'var(--tavil-text)' }}>{t('home.latestNews')}</div>
              </div>
              <button onClick={() => onNavigate?.('Notícies')} style={{ background: 'none', border: 'none', color: 'var(--tavil-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                {t('common.seeAll')} <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ padding: '0 16px' }}>
              <div
                onClick={() => openArticleFromHome(featured.id)}
                style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}
              >
                {featured.image ? (
                  <img src={resolveImg(featured.image)} alt={featured.title} loading="lazy"
                    style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--tavil-border)' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16/10', background: 'repeating-linear-gradient(135deg,rgba(191,33,30,0.07) 0 8px,rgba(191,33,30,0.03) 8px 16px)', borderBottom: '1px solid var(--tavil-border)' }} />
                )}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(191,33,30,0.08)', color: 'var(--tavil-accent)' }}>{featured.category}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 999, background: 'var(--tavil-bg-alt)', color: 'var(--tavil-muted)', border: '1px solid var(--tavil-border)' }}>{featured.date}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, lineHeight: 1.15, letterSpacing: '0.01em', color: 'var(--tavil-text)', marginBottom: 8 }}>{featured.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--tavil-muted)', lineHeight: 1.45 }}>{featured.summary}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--tavil-faint)' }}>
                    <span>{featured.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Upcoming agenda */}
        {upcomingThisWeek.length > 0 && (
          <>
            <div style={{ padding: '28px 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Agenda</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.05, letterSpacing: '0.01em', color: 'var(--tavil-text)' }}>{t('home.upcomingAgenda')}</div>
              </div>
              <button onClick={() => onNavigate?.('Agenda')} style={{ background: 'none', border: 'none', color: 'var(--tavil-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                {t('common.seeAll')} <ChevronRight size={14} />
              </button>
            </div>
            <div data-no-swipe style={{ padding: '0 0 0 16px', display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {upcomingThisWeek.map(ev => (
                <div key={ev.id} style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, padding: 14, minWidth: 220, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, fontWeight: 600, color: 'var(--tavil-accent)' }}>{ev.day}</div>
                    <div style={{ fontSize: 11, color: 'var(--tavil-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{MONTH_NAMES[ev.month - 1]}</div>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, color: 'var(--tavil-text)', marginBottom: 6 }}>{ev.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} />{ev.time ? (ev.time_end ? `${ev.time} – ${ev.time_end}` : ev.time) : ev.type}
                  </div>
                </div>
              ))}
              <div style={{ minWidth: 8, flexShrink: 0 }} />
            </div>
          </>
        )}

        {/* More news */}
        {moreNews.length > 0 && (
          <>
            <div style={{ padding: '28px 20px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{t('home.novetats')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.05, letterSpacing: '0.01em', color: 'var(--tavil-text)' }}>{t('home.moreNews')}</div>
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {moreNews.map(n => (
                <div key={n.id} onClick={() => openArticleFromHome(n.id)} style={{
                  background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, padding: 14, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, marginBottom: 4 }}><span style={{ color: 'var(--tavil-muted)', fontWeight: 600 }}>{n.category}</span><span style={{ color: 'var(--tavil-faint)' }}> · {n.date}</span></div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, color: 'var(--tavil-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</div>
                    </div>
                    {n.image ? (
                      <img src={resolveImg(n.image)} alt="" loading="lazy" style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, background: 'repeating-linear-gradient(135deg,rgba(120,132,117,0.1) 0 8px,rgba(120,132,117,0.05) 8px 16px)', border: '1px solid var(--tavil-border)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner — full width of main content area. Shimmer placeholder until image decodes. */}
      <div
        className="relative overflow-hidden mb-4 md:mb-6 h-40 md:h-[35vh] shadow-sm bg-gray-200 dark:bg-zinc-800"
      >
        {!heroLoaded && (
          <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />
        )}
        <img
          src={`${process.env.PUBLIC_URL}/tavil-header.jpg`}
          alt="TAVIL Headquarters"
          loading="eager"
          decoding="async"
          // @ts-ignore — fetchPriority valid HTML attr, React 18 accepts via fetchpriority
          fetchpriority="high"
          onLoad={() => setHeroLoaded(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out",
            heroLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ objectPosition: '70% 60%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="relative h-full flex flex-col justify-end px-5 md:px-10 pb-4 md:pb-8 max-w-7xl mx-auto">
          <img src={process.env.PUBLIC_URL + '/assets/images/TAVILhub.svg?v=3'} alt="TAVILhub" className="drop-shadow-lg" style={{ height: 'clamp(38px, 6vw, 63px)', width: 'auto', display: 'block', alignSelf: 'flex-start' }} />
          <p className="text-white/90 text-xs md:text-base mt-1 drop-shadow">{t('home.heroSubtitle')}</p>
        </div>
      </div>

      <div className="p-3 md:p-4 lg:p-8 max-w-7xl mx-auto">

      {/* Loading skeletons — shown only when all sources still empty (true first load) */}
      {loading && news.length === 0 && activities.length === 0 && agendaEvents.length === 0 && notices.length === 0 && <SkeletonInici />}

      {!loading && error && notices.length === 0 && news.length === 0 && (
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--tavil-muted)', fontSize: 14, marginBottom: '0.75rem' }}>{error}</p>
          <button
            onClick={() => { setError(null); setRetryCount(c => c + 1); }}
            style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--tavil-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.retry')}
          </button>
        </div>
      )}
      <>
      {/* Urgent notice (optional — only if notices exist) */}
      {notice && (() => {
        const nk = notice.kind ?? 'warning';
        const ns = nk === 'danger'
          ? { wrap: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40', icon: 'text-red-600 dark:text-red-400', title: 'text-red-900 dark:text-red-100', body: 'text-red-800/80 dark:text-red-200/80', link: 'text-red-700 dark:text-red-300', nav: 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300', counter: 'text-red-700 dark:text-red-300', NIcon: AlertTriangle }
          : nk === 'neutral'
          ? { wrap: 'bg-gray-100 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-700/40', icon: 'text-gray-500 dark:text-gray-400', title: 'text-gray-800 dark:text-gray-100', body: 'text-gray-600/80 dark:text-gray-300/80', link: 'text-gray-600 dark:text-gray-300', nav: 'hover:bg-gray-200 dark:hover:bg-zinc-700/30 text-gray-600 dark:text-gray-300', counter: 'text-gray-500 dark:text-gray-400', NIcon: Info }
          : { wrap: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40', icon: 'text-amber-600 dark:text-amber-400', title: 'text-amber-900 dark:text-amber-100', body: 'text-amber-800/80 dark:text-amber-200/80', link: 'text-amber-700 dark:text-amber-300', nav: 'hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300', counter: 'text-amber-700 dark:text-amber-300', NIcon: AlertTriangle };
        const isLongDesktop = !!(notice.content && notice.content.length > 120);
        return (
        <>
        <div
          className={`${ns.wrap} border rounded-xl p-4 mb-6 flex items-start gap-3 ${isLongDesktop ? 'cursor-pointer' : ''}`}
          onClick={isLongDesktop ? () => setNoticeDrawerOpen(true) : undefined}
        >
          <ns.NIcon size={16} className={`${ns.icon} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${ns.title} text-sm`}>{notice.title}</p>
            {notice.content && (
              <p className={`text-xs ${ns.body} mt-0.5`} style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                {notice.content}
              </p>
            )}
            {isLongDesktop ? (
              <button
                onClick={e => { e.stopPropagation(); setNoticeDrawerOpen(true); }}
                className={`${ns.link} text-xs font-medium mt-1 flex items-center gap-1 hover:underline`}
              >
                Veure tot <ChevronDown size={11} />
              </button>
            ) : notice.link && notice.link_text ? (
              <button
                onClick={() => window.open(notice.link, '_blank', 'noopener,noreferrer')}
                className={`${ns.link} text-xs font-medium mt-1 flex items-center gap-1 hover:underline`}
              >
                {notice.link_text} <ArrowRight size={11} />
              </button>
            ) : null}
          </div>
          {notices.length > 1 && (
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className={`text-xs ${ns.counter}`}>{noticeIndex + 1}/{notices.length}</span>
              <button onClick={e => { e.stopPropagation(); setNoticeIndex((noticeIndex - 1 + notices.length) % notices.length); }} className={`p-1 ${ns.nav} rounded`}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={e => { e.stopPropagation(); setNoticeIndex((noticeIndex + 1) % notices.length); }} className={`p-1 ${ns.nav} rounded`}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        {noticeDrawerOpen && createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
            <div onClick={() => setNoticeDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
            <div className="anim-sheet-enter" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: 560, margin: '0 auto', background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 28px 40px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tavil-border)', margin: '0 auto 20px' }} />
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <ns.NIcon size={20} className={`${ns.icon} flex-shrink-0 mt-0.5`} />
                  <p className={`font-bold text-base ${ns.title}`}>{notice.title}</p>
                </div>
                <button onClick={() => setNoticeDrawerOpen(false)} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                  <X size={16} />
                </button>
              </div>
              {notice.content && (
                <p className={`text-sm leading-relaxed ${ns.body}`} style={{ whiteSpace: 'pre-line' }}>{notice.content}</p>
              )}
              {notice.link && notice.link_text && (
                <button
                  onClick={() => { window.open(notice.link, '_blank', 'noopener,noreferrer'); setNoticeDrawerOpen(false); }}
                  className={`mt-4 flex items-center gap-2 text-sm font-semibold ${ns.link} hover:underline`}
                >
                  {notice.link_text} <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
        </>
        );
      })()}

      {/* Comunicats interns — horizontal banner */}
      {comunicats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-[15px] flex items-center gap-2">
              <FileText size={14} className="text-blue-600" /> {t('home.internalComms')}
            </h3>
            <button onClick={() => onNavigate?.('Notícies')} className="text-gray-400 dark:text-zinc-500 text-xs font-medium flex items-center gap-1 hover:underline">
              {t('home.seeAll2')} <ArrowRight size={11} />
            </button>
          </div>
          <div data-no-swipe className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {comunicats.map(c => (
              <div
                key={c.id}
                onClick={() => openArticleFromHome(c.id)}
                className="min-w-[280px] max-w-[320px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 cursor-pointer hover:border-red-200 dark:hover:border-red-900/40 transition-colors flex-shrink-0"
              >
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 uppercase">{t('news.badge.comunicat')}</span>
                <p className="font-semibold text-gray-900 dark:text-white text-sm mt-2 leading-snug line-clamp-2">{c.title}</p>
                {c.summary && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">{c.summary}</p>}
                <p className="text-[10px] text-gray-400 mt-2">{c.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content: Novetats (left, 2 cols) + Right column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Novetats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured news carousel */}
          {featured && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] flex items-center gap-2">
                  <Star size={14} className="text-amber-500" /> {t('home.featuredNews')}
                </h3>
                {featuredNews.length > 1 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{featuredIdx + 1}/{featuredNews.length}</span>
                    <button onClick={() => setFeaturedIdx((featuredIdx - 1 + featuredNews.length) % featuredNews.length)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"><ChevronLeft size={14} className="text-gray-500" /></button>
                    <button onClick={() => setFeaturedIdx((featuredIdx + 1) % featuredNews.length)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"><ChevronRight size={14} className="text-gray-500" /></button>
                  </div>
                )}
              </div>
              <div className="relative rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover-lift">
                <div
                  className="flex"
                  style={{
                    transform: `translateX(-${featuredIdx * 100}%)`,
                    transition: 'transform 420ms var(--ease-out-quint)',
                  }}
                >
                  {featuredNews.map(item => (
                    <div
                      key={item.id}
                      onClick={() => openArticleFromHome(item.id)}
                      className="min-w-full relative cursor-pointer"
                    >
                      {item.image ? (
                        <img src={resolveImg(item.image)} alt="" loading="lazy" className="w-full h-40 md:h-56 object-cover" />
                      ) : (
                        <div className="w-full h-40 md:h-56 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                          <Newspaper size={48} className="text-red-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", NEWS_CAT_COLORS[item.category] ?? "bg-gray-100 text-gray-600")}>{item.category}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/90 text-amber-900 uppercase flex items-center gap-0.5"><Star size={9} /> {t('news.badge.featured')}</span>
                        </div>
                        <h4 className="text-white text-lg font-bold leading-tight drop-shadow line-clamp-2">{item.title}</h4>
                        {item.summary && <p className="text-white/85 text-xs mt-1 line-clamp-2 drop-shadow">{item.summary}</p>}
                        <p className="text-white/70 text-[10px] mt-2">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Dots */}
              {featuredNews.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {featuredNews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFeaturedIdx(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === featuredIdx ? "w-6 bg-red-600" : "w-1.5 bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Novetats grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">{t('home.novetats')}</h3>
            </div>
            {novetats.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)' }}>
                <Newspaper size={28} style={{ margin: '0 auto 8px', color: 'var(--tavil-faint)' }} />
                <p className="text-sm" style={{ color: 'var(--tavil-muted)' }}>{t('home.noNovetats')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {novetats.map(item => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    onClick={() => item.kind === 'news' ? openArticleFromHome(item.id) : onNavigate?.('Activitats')}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-red-200 dark:hover:border-red-900/40 transition-colors flex flex-col"
                  >
                    <div className="hidden md:block">
                      {item.image ? (
                        <img src={resolveImg(item.image)} alt="" loading="lazy" className="w-full h-28 object-cover" />
                      ) : (
                        <div className={cn("w-full h-28 flex items-center justify-center", item.kind === 'news' ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20")}>
                          {item.kind === 'news'
                            ? <Newspaper size={28} className="text-red-400" />
                            : <ActivityIcon size={28} className="text-green-500" />
                          }
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                          item.kind === 'news' ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        )}>
                          {item.kind === 'news' ? t('news.badge.news') : t('news.badge.activity')}
                        </span>
                        {item.category && (
                          <span className="text-[9px] text-gray-500 dark:text-zinc-400 truncate">{item.category}</span>
                        )}
                        {item.kind === 'activity' && myEnrollments?.has(item.id) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center gap-0.5">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}><path d="M1.5 4l1.8 1.8L6.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {t('activities.enrolled')}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{item.title}</p>
                      {item.summary && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">{item.summary}</p>}
                      <p className="text-[10px] text-gray-400 mt-auto pt-2">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: mini calendar + upcoming week + shortcuts */}
        <div className="space-y-4">
          {/* Mini calendar — data widget, card justified */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{MONTH_NAMES[calMonth - 1]} {calYear}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => navigateCalMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"><ChevronLeft size={14} className="text-gray-500" /></button>
                <button onClick={() => navigateCalMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"><ChevronRight size={14} className="text-gray-500" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {daysMonFirst.map(d => (
                <div key={d} className="text-[10px] font-semibold text-gray-400 py-1">{d}</div>
              ))}
              {miniCells.map((d, i) => (
                <div key={i} className="aspect-square flex items-center justify-center">
                  {d && (
                    <button
                      onClick={() => onNavigateToDate?.(d, calMonth, calYear)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-xs relative transition-colors",
                        isCalToday(d)
                          ? "bg-red-600 text-white font-bold hover:bg-red-700"
                          : "text-gray-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 cursor-pointer"
                      )}
                    >
                      {d}
                      {miniEventDays.has(d) && !isCalToday(d) && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-red-500" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming this week — temporal data, card justified */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t("home.upcomingActivities")}</h3>
              <button onClick={() => onNavigate?.('Agenda')} className="text-gray-400 dark:text-zinc-500 text-xs font-medium flex items-center gap-1 hover:underline">
                Veure <ArrowRight size={11} />
              </button>
            </div>
            {upcomingThisWeek.length === 0 ? (
              <div className="flex flex-col items-center py-4 gap-1.5" style={{ color: 'var(--tavil-faint)' }}>
                <Calendar size={20} style={{ opacity: 0.5 }} />
                <p className="text-xs text-center" style={{ color: 'var(--tavil-faint)' }}>{t("home.noEventsThisWeek")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingThisWeek.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm leading-none">{String(ev.day).padStart(2, '0')}</span>
                      <span className="text-gray-400 text-[9px] font-medium uppercase">{MONTH_ABBR[ev.month]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-tight truncate">{ev.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ev.time ? (ev.time_end ? `${ev.time} – ${ev.time_end}` : ev.time) : '—'}{ev.location ? ` · ${ev.location}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dreceres — nav list, no card needed */}
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-2 px-1" style={{ color: 'var(--tavil-faint)' }}>{t("home.shortcuts")}</p>
            <div className="space-y-0.5">
              {[
                { icon: Building2, title: t('shortcuts.company'), color: "text-gray-500 dark:text-zinc-400", tab: "Empresa" },
                { icon: Mail, title: t('shortcuts.corporateEmail'), color: "text-gray-500 dark:text-zinc-400", tab: undefined },
                { icon: Database, title: t('shortcuts.erp'), color: "text-gray-500 dark:text-zinc-400", tab: undefined },
                { icon: FolderOpen, title: t('shortcuts.documentManager'), color: "text-gray-500 dark:text-zinc-400", tab: undefined },
                { icon: GraduationCap, title: t('shortcuts.campus'), color: "text-gray-500 dark:text-zinc-400", tab: "Campus" },
                { icon: Users, title: t('shortcuts.directory'), color: "text-gray-500 dark:text-zinc-400", tab: "Directori" },
                { icon: ActivityIcon, title: t('shortcuts.connect'), color: "text-gray-500 dark:text-zinc-400", tab: "Activitats" },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={() => item.tab && onNavigate?.(item.tab)}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors",
                    item.tab ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800" : "cursor-default opacity-60"
                  )}
                >
                  <item.icon size={15} className={cn("flex-shrink-0", item.color)} />
                  <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 flex-1 truncate">{item.title}</p>
                  {item.tab && <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      </div>{/* end padded content */}
    </div>
  );
}

// ── Notícies Tab ──────────────────────────────────────────────────────────────

const ConfirmModal = SharedConfirmModal;


// ── Rich Article ──────────────────────────────────────────────────────────────
type BlockSpan = 1 | 2 | 3;
type BlockType = 'heading' | 'text' | 'image' | 'video' | 'quote' | 'divider';

interface ArticleBlock {
  id: string;
  type: BlockType;
  span: BlockSpan;
  content?: string;
  level?: 1 | 2 | 3;
  textStyle?: 'lead' | 'body' | 'caption';
  url?: string;
  caption?: string;
  author?: string;
}


function isRichContent(s: string): boolean {
  return s.trimStart().startsWith('[');
}

function isTileArrayContent(s: string): boolean {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) && a.length > 0 && a[0]
      && typeof a[0].x === 'number' && typeof a[0].y === 'number'
      && typeof a[0].w === 'number' && typeof a[0].h === 'number'
      && typeof a[0].type === 'string';
  } catch { return false; }
}

function contentHasHeadline(s: string): boolean {
  try { return (JSON.parse(s) as any[]).some(t => t.type === 'headline'); }
  catch { return false; }
}

function parseBlocks(s: string): ArticleBlock[] {
  try { return JSON.parse(s) as ArticleBlock[]; }
  catch { return []; }
}

// Minimal markdown-lite renderer: # h1, ## h2, ### h3, > quote, --- divider,
// blank-line paragraphs, **bold**, *italic*.
function renderMarkdownLite(text: string): React.ReactNode {
  const inlineFmt = (s: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0; let m: RegExpExecArray | null; let key = 0;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('**')) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
      else parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
      last = m.index + tok.length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  };
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length === 0) return;
    out.push(<p key={`p${out.length}`} className="text-gray-700 dark:text-zinc-300 text-base leading-relaxed mb-4">{inlineFmt(para.join(' '))}</p>);
    para = [];
  };
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t === '') { flushPara(); return; }
    if (t === '---') { flushPara(); out.push(<hr key={`h${i}`} className="border-gray-200 dark:border-zinc-700 my-6" />); return; }
    if (t.startsWith('### ')) { flushPara(); out.push(<h3 key={`h${i}`} className="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-2">{inlineFmt(t.slice(4))}</h3>); return; }
    if (t.startsWith('## '))  { flushPara(); out.push(<h2 key={`h${i}`} className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3">{inlineFmt(t.slice(3))}</h2>); return; }
    if (t.startsWith('# '))   { flushPara(); out.push(<h1 key={`h${i}`} className="text-3xl font-black text-gray-900 dark:text-white mt-6 mb-3 tracking-tight">{inlineFmt(t.slice(2))}</h1>); return; }
    if (t.startsWith('> '))   { flushPara(); out.push(<blockquote key={`q${i}`} className="border-l-4 border-red-600 pl-5 py-2 my-4 italic text-gray-700 dark:text-zinc-300">{inlineFmt(t.slice(2))}</blockquote>); return; }
    para.push(t);
  });
  flushPara();
  return <div>{out}</div>;
}

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}

function RichBlockViewer({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
      {blocks.map(block => {
        const sc = block.span === 1 ? 'md:col-span-1' : block.span === 2 ? 'md:col-span-2' : 'md:col-span-3';
        return (
          <div key={block.id} className={sc}>
            {block.type === 'heading' && (
              <p className={cn('font-black text-gray-900 dark:text-white leading-tight',
                block.level === 1 ? 'text-3xl' : block.level === 3 ? 'text-lg' : 'text-2xl'
              )}>{block.content}</p>
            )}
            {block.type === 'text' && (
              <p
                className={
                  block.textStyle === 'lead'    ? "text-gray-700 dark:text-zinc-200 text-lg leading-relaxed whitespace-pre-wrap" :
                  block.textStyle === 'caption' ? "text-gray-500 dark:text-zinc-500 text-sm leading-relaxed whitespace-pre-wrap" :
                                                  "text-gray-600 dark:text-zinc-300 text-base leading-relaxed whitespace-pre-wrap"
                }
                style={{
                  fontWeight: block.textStyle === 'caption' ? 400 : 500,
                  marginBottom: block.textStyle !== 'caption' ? 24 : 12,
                }}
              >{block.content}</p>
            )}
            {block.type === 'image' && block.url && (
              <figure>
                <img src={block.url} alt={block.caption ?? ''} loading="lazy" className="w-full rounded-xl object-cover" />
                {block.caption && <figcaption className="text-[11px] text-gray-400 mt-2 text-center italic">{block.caption}</figcaption>}
              </figure>
            )}
            {block.type === 'quote' && (
              <blockquote className="border-l-4 border-red-600 pl-5 py-2">
                <p className="text-gray-700 dark:text-zinc-300 text-base italic leading-relaxed">&ldquo;{block.content}&rdquo;</p>
                {block.author && <footer className="text-xs text-gray-400 mt-2">— {block.author}</footer>}
              </blockquote>
            )}
            {block.type === 'video' && block.url && (() => {
              const embed = toEmbedUrl(block.url);
              return (
                <figure>
                  {embed ? (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe src={embed} className="absolute inset-0 w-full h-full rounded-xl" allowFullScreen title={block.caption ?? 'Vídeo'} />
                    </div>
                  ) : (
                    <video src={block.url} controls className="w-full rounded-xl" />
                  )}
                  {block.caption && <figcaption className="text-[11px] text-gray-400 mt-2 text-center italic">{block.caption}</figcaption>}
                </figure>
              );
            })()}
            {block.type === 'divider' && (
              <hr className="border-gray-200 dark:border-zinc-700 my-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Article Blocks Editor (drag-and-drop, dotted-grid canvas) ────────────────

function mkBlockId() { return Math.random().toString(36).slice(2, 10); }

interface ArticleBlocksEditorProps {
  value: string;
  onChange: (s: string) => void;
}

function ArticleBlocksEditor({ value, onChange }: ArticleBlocksEditorProps) {
  const [blocks, setBlocks] = useState<ArticleBlock[]>(() => {
    if (!value || !value.trim()) return [];
    if (isRichContent(value)) {
      const parsed = parseBlocks(value);
      return Array.isArray(parsed) ? parsed : [];
    }
    // Legacy markdown / plain text → wrap in single full-width text block
    return [{ id: mkBlockId(), type: 'text', span: 3, content: value }];
  });
  const dragRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const lastSyncRef = useRef<string>('');

  // Push serialized blocks upward whenever they change
  useEffect(() => {
    const s = JSON.stringify(blocks);
    if (s !== lastSyncRef.current) {
      lastSyncRef.current = s;
      onChange(s);
    }
  }, [blocks, onChange]);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const addBlock = (type: BlockType) => {
    const base: ArticleBlock = { id: mkBlockId(), type, span: 3 };
    const nb: ArticleBlock =
      type === 'heading' ? { ...base, content: '', level: 2 } :
      type === 'text'    ? { ...base, content: '' } :
      type === 'quote'   ? { ...base, content: '', author: '' } :
      type === 'image'   ? { ...base, url: '', caption: '' } :
      type === 'video'   ? { ...base, url: '', caption: '' } :
      base;
    setBlocks(b => [...b, nb]);
  };
  const updateBlock = (id: string, patch: Partial<ArticleBlock>) =>
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
  const removeBlock = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id));

  const onDragStart = (i: number) => { dragRef.current = i; };
  const onDragOver = (i: number, e: React.DragEvent) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i: number) => {
    const from = dragRef.current; dragRef.current = null; setDragOver(null);
    if (from === null || from === i) return;
    setBlocks(bs => { const arr = [...bs]; const [m] = arr.splice(from, 1); arr.splice(i, 0, m); return arr; });
  };

  const handleUpload = async (id: string, file: File) => {
    try {
      const url = await apiUploadImage(file);
      updateBlock(id, { url });
    } catch { /* silent */ }
  };

  const handleVideoUpload = async (id: string, file: File) => {
    setUploadProgress(p => ({ ...p, [id]: 0 }));
    try {
      const { url } = await apiUploadMedia(file, frac => setUploadProgress(p => ({ ...p, [id]: frac })));
      updateBlock(id, { url });
    } catch (e: any) { setUploadErr(e?.message ?? 'Error pujant el vídeo'); setTimeout(() => setUploadErr(null), 4000); }
    finally { setUploadProgress(p => { const n = { ...p }; delete n[id]; return n; }); }
  };

  const tools: Array<{ type: BlockType; label: string; Icon: any }> = [
    { type: 'heading', label: 'Capçalera', Icon: Heading2 },
    { type: 'text',    label: 'Text',      Icon: TypeIcon },
    { type: 'image',   label: 'Imatge',    Icon: ImageIcon },
    { type: 'video',   label: 'Vídeo',     Icon: Video },
    { type: 'quote',   label: 'Cita',      Icon: Quote },
    { type: 'divider', label: 'Separador', Icon: Minus },
  ];

  return (
    <div>
      {uploadErr && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 20px', borderRadius: 10, background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', pointerEvents: 'none' }}>
          {uploadErr}
        </div>
      )}
      {/* Palette */}
      <div className="flex flex-wrap gap-2 mb-3 p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg">
        {tools.map(({ type, label, Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
          >
            <Icon size={13} />
            <Plus size={11} />
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-[10px] text-gray-400">{blocks.length} bloc{blocks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Canvas with dotted-grid background */}
      <div
        className="rounded-xl p-4 min-h-[320px] grid grid-cols-3 gap-3 border border-gray-200 dark:border-zinc-700"
        style={{
          backgroundColor: 'var(--tavil-card, #fafafa)',
          backgroundImage: 'radial-gradient(circle, rgba(120,80,80,0.20) 1.2px, transparent 1.4px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0',
        }}
      >
        {blocks.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400 text-xs">
            <p className="mb-1">Comença a construir l'article.</p>
            <p>Afegeix blocs des de la barra superior i arrossega'ls per reordenar.</p>
          </div>
        )}
        {blocks.map((b, i) => {
          const spanCls = b.span === 1 ? 'col-span-1' : b.span === 2 ? 'col-span-2' : 'col-span-3';
          return (
            <div
              key={b.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(i, e)}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDrop(i)}
              className={`${spanCls} relative group bg-white dark:bg-zinc-900 rounded-lg border p-3 transition-colors ${dragOver === i ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-900/40' : 'border-gray-200 dark:border-zinc-700'}`}
            >
              {/* Header row: drag handle + type + span buttons + delete */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 font-semibold cursor-grab select-none">
                  <GripVertical size={12} />
                  {b.type}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateBlock(b.id, { span: s as BlockSpan })}
                      title={`Amplada ${s}/3`}
                      className={`w-6 h-5 rounded text-[10px] font-bold transition-colors ${b.span === s ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => removeBlock(b.id)}
                    title="Eliminar"
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Body */}
              {b.type === 'heading' && (
                <div className="space-y-1">
                  <select
                    value={b.level ?? 2}
                    onChange={e => updateBlock(b.id, { level: Number(e.target.value) as 1 | 2 | 3 })}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 border-none text-gray-600 dark:text-zinc-300"
                  >
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                  <input
                    value={b.content ?? ''}
                    onChange={e => updateBlock(b.id, { content: e.target.value })}
                    placeholder="Escriu el títol..."
                    className={`w-full bg-transparent border-none outline-none font-bold text-gray-900 dark:text-white ${b.level === 1 ? 'text-2xl' : b.level === 3 ? 'text-base' : 'text-xl'}`}
                  />
                </div>
              )}

              {b.type === 'text' && (
                <div className="space-y-1.5">
                  <select
                    value={b.textStyle ?? 'body'}
                    onChange={e => updateBlock(b.id, { textStyle: e.target.value as 'lead' | 'body' | 'caption' })}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 border-none text-gray-600 dark:text-zinc-300"
                  >
                    <option value="lead">Entradeta (gran)</option>
                    <option value="body">Cos (normal)</option>
                    <option value="caption">Peu de pàgina (petit)</option>
                  </select>
                  <textarea
                    value={b.content ?? ''}
                    onChange={e => updateBlock(b.id, { content: e.target.value })}
                    rows={4}
                    placeholder="Paràgraf de text..."
                    className={`w-full bg-transparent border-none outline-none resize-y leading-relaxed ${
                      (b.textStyle ?? 'body') === 'lead'    ? 'text-base font-medium text-gray-700 dark:text-zinc-200' :
                      (b.textStyle ?? 'body') === 'caption' ? 'text-xs text-gray-400 dark:text-zinc-500' :
                                                              'text-sm text-gray-700 dark:text-zinc-300'
                    }`}
                  />
                </div>
              )}

              {b.type === 'quote' && (
                <div className="space-y-1 border-l-4 border-red-600 pl-3">
                  <textarea
                    value={b.content ?? ''}
                    onChange={e => updateBlock(b.id, { content: e.target.value })}
                    rows={3}
                    placeholder="Cita destacada"
                    className="w-full text-sm italic bg-transparent border-none outline-none resize-y text-gray-700 dark:text-zinc-300"
                  />
                  <input
                    value={b.author ?? ''}
                    onChange={e => updateBlock(b.id, { author: e.target.value })}
                    placeholder="— Autor (opcional)"
                    className="w-full text-xs bg-transparent border-none outline-none text-gray-400"
                  />
                </div>
              )}

              {b.type === 'image' && (
                <div className="space-y-2">
                  {b.url ? (
                    <img src={resolveImg(b.url)} alt="" loading="lazy" className="w-full h-32 object-cover rounded" />
                  ) : (
                    <div className="w-full h-32 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 text-xs">
                      Sense imatge
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(b.id, f); }}
                    className="text-[10px] file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-red-50 file:text-red-700 file:font-semibold"
                  />
                  <input
                    value={b.caption ?? ''}
                    onChange={e => updateBlock(b.id, { caption: e.target.value })}
                    placeholder="Peu de foto (opcional)"
                    className="w-full text-xs bg-transparent border-none outline-none text-gray-500"
                  />
                </div>
              )}

              {b.type === 'video' && (
                <div className="space-y-2">
                  {b.url && (() => {
                    const embed = toEmbedUrl(b.url!);
                    return embed ? (
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe src={embed} className="absolute inset-0 w-full h-full rounded" allowFullScreen title="preview" />
                      </div>
                    ) : (
                      <video src={b.url} controls className="w-full h-32 rounded object-cover" />
                    );
                  })()}
                  {!b.url && (
                    <div className="w-full h-24 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center gap-2 text-gray-400 text-xs">
                      <Video size={16} /><span>Sense vídeo</span>
                    </div>
                  )}
                  <input
                    value={b.url ?? ''}
                    onChange={e => updateBlock(b.id, { url: e.target.value })}
                    placeholder="URL del vídeo (YouTube, Vimeo, o directe…)"
                    className="w-full text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 outline-none text-gray-700 dark:text-zinc-300"
                  />
                  {uploadProgress[b.id] !== undefined ? (
                    <div className="text-[10px] text-gray-500">Pujant… {Math.round(uploadProgress[b.id] * 100)}%</div>
                  ) : (
                    <input
                      type="file"
                      accept="video/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(b.id, f); }}
                      className="text-[10px] file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-red-50 file:text-red-700 file:font-semibold"
                    />
                  )}
                  <input
                    value={b.caption ?? ''}
                    onChange={e => updateBlock(b.id, { caption: e.target.value })}
                    placeholder="Peu de vídeo (opcional)"
                    className="w-full text-xs bg-transparent border-none outline-none text-gray-500"
                  />
                </div>
              )}

              {b.type === 'divider' && (
                <hr className="border-t-2 border-gray-300 dark:border-zinc-700 my-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




function NoticiesTab({ currentUser, onOpenDrawer, onNavigate }: { currentUser: User | null; onOpenDrawer?: () => void; onNavigate?: (tab: string) => void }) {
  const { t } = useTranslation();
  const [rawNews, setNews] = useState<NewsArticle[]>(() => tabPrefetch.news ?? []);
  const lang = i18n.language;
  const news = useMemo(() => rawNews.map(n => localizeNews(n, lang)), [rawNews, lang]);
  const [activeFilter, setActiveFilter] = useState('Totes');
  const [newsSearch, setNewsSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedNews, setSelectedNewsRaw] = useState<NewsArticle | null>(null);
  useEffect(() => { scrollPageToTop(); }, [selectedNews]);
  const setSelectedNews = (n: NewsArticle | null, origin?: string) => {
    if (n) {
      try {
        window.sessionStorage.setItem('tavil_selected_news_id', String(n.id));
        if (origin !== undefined) window.sessionStorage.setItem('tavil_news_origin', origin);
      } catch {}
    } else {
      try {
        window.sessionStorage.removeItem('tavil_selected_news_id');
        window.sessionStorage.removeItem('tavil_news_origin');
      } catch {}
    }
    setSelectedNewsRaw(n);
  };
  const closeArticleMobile = useIsMobile();
  const closeArticle = () => {
    let origin = '';
    try { origin = window.sessionStorage.getItem('tavil_news_origin') ?? ''; } catch {}
    setSelectedNews(null);
    if (closeArticleMobile) return;
    if (origin && origin !== 'Notícies' && onNavigate) onNavigate(origin);
  };
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [newsLoading, setNewsLoading] = useState(() => !tabPrefetch.news);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsRetryCount, setNewsRetryCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    // Restore selected article from localStorage (reload or cross-tab open).
    const restoreFromCache = (d: NewsArticle[]) => {
      try {
        const savedId = window.sessionStorage.getItem('tavil_selected_news_id');
        if (savedId) {
          const article = d.find(n => n.id === Number(savedId));
          if (article) setSelectedNewsRaw(article);
        }
      } catch {}
    };
    if (isTabCacheFresh('news')) {
      // Use fresh cache, skip refetch — avoids re-render flash on tab open.
      restoreFromCache(tabPrefetch.news!);
      setNewsLoading(false);
      return;
    }
    setNewsError(null);
    apiGetNews()
      .then(d => {
        if (cancelled) return;
        setNews(d);
        tabPrefetch.news = d;
        tabPrefetchAt.news = Date.now();
        restoreFromCache(d);
      })
      .catch(() => { if (!cancelled) setNewsError("No s'han pogut carregar les dades. Comprova la connexió."); })
      .finally(() => { if (!cancelled) setNewsLoading(false); });
    return () => { cancelled = true; };
  }, [newsRetryCount]);

  const filtered = (activeFilter === 'Totes' ? news : news.filter(n => n.category === activeFilter))
    .filter(n => !newsSearch || [n.title, n.summary, n.content].some(f => f.toLowerCase().includes(newsSearch.toLowerCase())));
  const featuredList = filtered.filter(n => n.featured === 1);
  const featuredItems = featuredList.length > 0 ? featuredList : filtered.slice(0, 1);
  const featured = featuredItems[featuredIndex % Math.max(featuredItems.length, 1)] ?? null;
  const grid = filtered;
  const isMobileNoticies = useIsMobile();
  const NEWS_CAT_LABELS: Record<string, string> = {
    'Totes': t('news.cat.all'),
    'Comunicats interns': t('news.cat.internalComms'),
    'Notícies corporatives': t('news.cat.corporate'),
    'Recursos humans': t('news.cat.hr'),
    'Esdeveniments': t('news.cat.events'),
    'Innovació': t('news.cat.innovation'),
    'Seguretat': t('news.cat.safety'),
  };

  const isAdmin = (() => {
    const r = currentUser?.role ?? '';
    const rs = currentUser?.roles ?? [];
    return ['Administrador', 'Administrador/a', 'Recursos humans', 'Comunicacions', 'Comunicació'].some(x => x === r || rs.includes(x));
  })();
  const { confirm, confirmNode } = useConfirm();
  const handleDeleteNews = async (id: number) => {
    const ok = await confirm({ title: 'Eliminar notícia?', message: 'Aquesta acció no es pot desfer.', confirmLabel: 'Eliminar', cancelLabel: 'Cancel·lar', destructive: true });
    if (!ok) return;
    try {
      await apiDeleteNews(id);
      setNews(prev => prev.filter(n => n.id !== id));
      tabPrefetch.news = tabPrefetch.news?.filter(n => n.id !== id);
    } catch (e) { console.error(e); }
  };
  const handleEditNews = (n: NewsArticle) => {
    try {
      window.sessionStorage.setItem('tavil_edit_news_id', String(n.id));
    } catch {}
    onNavigate?.('Backoffice');
  };

  // ── Mobile branch ────────────────────────────────────────────────────────
  if (isMobileNoticies) {
    const cats = ['Totes', ...Array.from(new Set(news.map(n => n.category).filter(Boolean)))];
    const mFiltered = (activeFilter === 'Totes' ? news : news.filter(n => n.category === activeFilter))
      .filter(n => !newsSearch || [n.title, n.summary].some(f => f?.toLowerCase().includes(newsSearch.toLowerCase())));
    const mFeatured = mFiltered[0] ?? null;
    const mRest = mFiltered.slice(1);

    if (selectedNews) {
      return (
        <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }} className="anim-page-enter-h-fwd">
          <div style={{ height: 82, background: 'var(--tavil-bg)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <button onClick={closeArticle} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--tavil-accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '8px 4px' }}>
              <ChevronLeft size={20} style={{ color: 'var(--tavil-accent)' }} />
              Notícies
            </button>
          </div>
          <div style={{ padding: '0 16px 24px' }}>
            {selectedNews.image && (
              <div style={{ margin: '0 -16px 16px', aspectRatio: '16/9', overflow: 'hidden' }}>
                <img src={resolveImg(selectedNews.image)} alt={selectedNews.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tavil-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(191,33,30,0.08)', borderRadius: 6, padding: '3px 8px' }}>{selectedNews.category}</span>
              <span style={{ fontSize: 10, color: 'var(--tavil-muted)', background: 'var(--tavil-faint)', borderRadius: 6, padding: '3px 8px' }}>{selectedNews.date}</span>
            </div>
            {!(isTileArrayContent(selectedNews.content) && contentHasHeadline(selectedNews.content)) && (
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '0em', color: 'var(--tavil-text)' }}>{selectedNews.title}</h1>
            )}
            {selectedNews.summary && <p style={{ fontSize: 15, color: 'var(--tavil-text)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 16px' }}>{selectedNews.summary}</p>}
            {selectedNews.content && (
              isTileArrayContent(selectedNews.content)
                ? <NewsTilesViewer content={selectedNews.content} lang={lang} />
                : isRichContent(selectedNews.content)
                  ? <RichBlockViewer blocks={parseBlocks(selectedNews.content)} />
                  : <div className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed font-normal">{renderMarkdownLite(selectedNews.content)}</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar */}
        <div style={{ height: 82, background: 'var(--tavil-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <button onClick={onOpenDrawer} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)' }}>
            <Menu size={18} />
          </button>
          <button
            onClick={() => { setMobileSearchOpen(v => !v); setTimeout(() => document.getElementById('noticies-search')?.focus(), 60); }}
            style={{ width: 40, height: 40, borderRadius: 20, background: mobileSearchOpen ? 'var(--tavil-text)' : 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: mobileSearchOpen ? 'var(--tavil-bg)' : 'var(--tavil-text)' }}
          >
            <Search size={18} />
          </button>
        </div>
        {/* Header text */}
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Comunicació interna</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, lineHeight: 1, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>{t('nav.noticies')}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('news.subtitle')}</p>
        </div>
        {/* Search bar — toggled by icon */}
        {(mobileSearchOpen || newsSearch) && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} style={{ position: 'absolute', left: 11, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
              <input
                id="noticies-search"
                type="search"
                value={newsSearch}
                onChange={e => setNewsSearch(e.target.value)}
                placeholder="Cercar notícies…"
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', height: 40, borderRadius: 10, border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)', color: 'var(--tavil-text)', fontSize: 14, padding: '0 36px 0 34px', outline: 'none', fontFamily: 'inherit' }}
              />
              {newsSearch && (
                <button onClick={() => setNewsSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--tavil-faint)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}
        {/* Filter chips */}
        <div data-no-swipe style={{ padding: '0 0 16px 16px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-sb">
          {cats.map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)} style={{
              padding: '7px 14px', borderRadius: 999,
              background: activeFilter === cat ? 'var(--tavil-text)' : 'var(--tavil-card)',
              color: activeFilter === cat ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
              border: `1px solid ${activeFilter === cat ? 'var(--tavil-text)' : 'var(--tavil-border)'}`,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
            }}>{cat}</button>
          ))}
          <div style={{ minWidth: 8, flexShrink: 0 }} />
        </div>
        {/* Error state */}
        {!newsLoading && newsError && news.length === 0 && (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--tavil-muted)', fontSize: 14, marginBottom: '0.75rem' }}>{newsError}</p>
            <button
              onClick={() => { setNewsError(null); setNewsRetryCount(c => c + 1); }}
              style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--tavil-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('common.retry')}
            </button>
          </div>
        )}
        {/* Featured article */}
        {newsLoading && !mFeatured && (
          <div style={{ padding: '0 16px 12px' }}><Skeleton style={{ width: '100%', height: 240, borderRadius: 16 }} /></div>
        )}
        {mFeatured && (
          <div style={{ padding: '0 16px 12px' }}>
            <div onClick={() => setSelectedNews(mFeatured, 'Notícies')} style={{ background: 'var(--tavil-card)', borderRadius: 16, border: '1px solid var(--tavil-border)', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ aspectRatio: '16/10', background: 'var(--tavil-faint)', overflow: 'hidden' }}>
                {mFeatured.image
                  ? <img src={resolveImg(mFeatured.image)} alt={mFeatured.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'var(--tavil-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Newspaper size={40} style={{ color: 'var(--tavil-muted)' }} /></div>
                }
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tavil-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(191,33,30,0.08)', borderRadius: 6, padding: '3px 8px' }}>{mFeatured.category}</span>
                  <span style={{ fontSize: 10, color: 'var(--tavil-muted)', background: 'var(--tavil-faint)', borderRadius: 6, padding: '3px 8px' }}>{mFeatured.date}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, lineHeight: 1.15, margin: 0, letterSpacing: '0.01em', color: 'var(--tavil-text)', textWrap: 'balance' } as React.CSSProperties}>{mFeatured.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '10px 0 0', lineHeight: 1.45 }}>{mFeatured.summary}</p>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--tavil-border)', marginTop: 12 }}>
                    <button onClick={e => { e.stopPropagation(); handleEditNews(mFeatured); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={12} /> Editar</button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteNews(mFeatured.id); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={12} /> Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Rest as list */}
        <div key={activeFilter} style={{ padding: '4px 16px' }}>
          {mRest.map((n, i) => (
            <div key={n.id} onClick={() => setSelectedNews(n, 'Notícies')} className="anim-item" style={{
              '--i': i + 1, padding: '14px 4px',
              borderBottom: '1px solid var(--tavil-border)',
              cursor: 'pointer',
            } as React.CSSProperties}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{n.category}</div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, lineHeight: 1.2, margin: 0, letterSpacing: '0.01em', color: 'var(--tavil-text)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{n.title}</h4>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)', marginTop: 8 }}><span>{n.date}</span></div>
                </div>
                <div style={{ width: 86, height: 86, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--tavil-faint)' }}>
                  {n.image
                    ? <img src={resolveImg(n.image)} alt={n.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Newspaper size={22} style={{ color: 'rgba(191,33,30,0.3)' }} /></div>
                  }
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--tavil-border)', marginTop: 10 }}>
                  <button onClick={e => { e.stopPropagation(); handleEditNews(n); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={12} /> Editar</button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteNews(n.id); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={12} /> Eliminar</button>
                </div>
              )}
            </div>
          ))}
          {newsLoading && mRest.length === 0 && mFeatured && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 4px', borderBottom: '1px solid var(--tavil-border)' }}>
              <div style={{ flex: 1 }}><Skeleton style={{ height: 14, borderRadius: 6, marginBottom: 8 }} /><Skeleton style={{ height: 40, borderRadius: 6 }} /></div>
              <Skeleton style={{ width: 86, height: 86, borderRadius: 10, flexShrink: 0 }} />
            </div>
          ))}
        </div>
        {confirmNode}
      </div>
    );
  }

  if (selectedNews) {
    return (
      <div className={cn("mx-auto", (isTileArrayContent(selectedNews.content) || isRichContent(selectedNews.content)) ? "max-w-5xl" : "max-w-3xl")}>
        <button
          onClick={closeArticle}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors mb-6"
        >
          <ChevronLeft size={16} className="flex-shrink-0" />
          {t('news.detail.backToNews')}
        </button>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          {selectedNews.image && (
            <img src={resolveImg(selectedNews.image)} alt={selectedNews.title} loading="lazy" className="w-full h-72 object-cover" />
          )}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider", NEWS_CAT_COLORS[selectedNews.category] ?? "bg-gray-100 text-gray-600")}>{selectedNews.category}</span>
              <span className="text-xs text-gray-400">{selectedNews.date}</span>
            </div>
            {!(isTileArrayContent(selectedNews.content) && contentHasHeadline(selectedNews.content)) && (
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">{selectedNews.title}</h1>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{selectedNews.date}</span></div>
            </div>
            {selectedNews.summary && <p className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed mb-6 font-medium">{selectedNews.summary}</p>}
            {selectedNews.content && (
              isTileArrayContent(selectedNews.content)
                ? <NewsTilesViewer content={selectedNews.content} lang={lang} />
                : isRichContent(selectedNews.content)
                  ? <RichBlockViewer blocks={parseBlocks(selectedNews.content)} />
                  : <div className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed font-normal">{renderMarkdownLite(selectedNews.content)}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('news.subtitle')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={newsSearch} onChange={e => setNewsSearch(e.target.value)} placeholder={t('news.searchPlaceholder')} className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Totes', 'Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat'].map(f => (
            <FilterChip key={f} label={NEWS_CAT_LABELS[f] ?? f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>

      {featured && (
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden mb-8">
          <div
            className="flex"
            style={{
              transform: `translateX(-${(featuredIndex % featuredItems.length) * 100}%)`,
              transition: 'transform 420ms var(--ease-out-quint)',
            }}
          >
            {featuredItems.map(item => (
              <div key={item.id} className="min-w-full flex flex-col md:flex-row md:min-h-[360px]">
                <div
                  className="w-full md:w-1/2 h-40 md:h-auto overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer"
                  onClick={() => setSelectedNews(item, 'Notícies')}
                >
                  {item.image ? (
                    <img src={resolveImg(item.image)} alt="Featured" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full min-h-[160px] md:min-h-[224px] bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                      <Newspaper size={56} className="text-red-300" />
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-4 md:p-8 flex flex-col justify-center">
                  <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-2 md:mb-4", NEWS_CAT_COLORS[item.category] ?? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300")}>{item.category}</span>
                  <h2
                    className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4 leading-tight cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => setSelectedNews(item, 'Notícies')}
                  >{item.title}</h2>
                  <p className="text-gray-500 dark:text-zinc-400 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{item.date}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Carousel controls — outside slide track, absolute positioned */}
          {featuredItems.length > 1 && (
            <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 flex items-center gap-3 z-10">
              <button
                onClick={() => setFeaturedIndex(i => (i - 1 + featuredItems.length) % featuredItems.length)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 transition-colors"
                title={t('home.featuredPrev')}
              ><ChevronLeft size={16} /></button>
              <div className="flex gap-1.5">
                {featuredItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeaturedIndex(i)}
                    className={cn("rounded-full transition-all duration-300", i === featuredIndex % featuredItems.length ? "w-5 h-2 bg-red-600" : "w-2 h-2 bg-gray-300 dark:bg-zinc-600 hover:bg-red-400")}
                  />
                ))}
              </div>
              <button
                onClick={() => setFeaturedIndex(i => (i + 1) % featuredItems.length)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 transition-colors"
                title={t('home.featuredNext')}
              ><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}

      {!newsLoading && newsError && news.length === 0 && (
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--tavil-muted)', fontSize: 14, marginBottom: '0.75rem' }}>{newsError}</p>
          <button
            onClick={() => { setNewsError(null); setNewsRetryCount(c => c + 1); }}
            style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--tavil-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.retry')}
          </button>
        </div>
      )}
      {newsLoading && news.length === 0 && <SkeletonNoticies />}
      <div key={activeFilter} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        {grid.map((item, i) => (
          <div key={i} className="group hover-lift bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden anim-item flex flex-col" style={{ '--i': i } as React.CSSProperties}>
            <div className="hidden md:block aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer" onClick={() => setSelectedNews(item, 'Notícies')}>
              {item.image ? (
                <img src={resolveImg(item.image)} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[600ms] ease-out" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                  <Newspaper size={40} className="text-red-300" />
                </div>
              )}
            </div>
            <div className="p-4 md:p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{item.category}</p>
                {item.featured === 1 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/90 text-amber-900 uppercase flex items-center gap-0.5"><Star size={8} /> {t('news.badge.featured')}</span>}
              </div>
              <div className="flex-1">
                <h3 className="line-clamp-2 cursor-pointer" style={{ fontWeight: 700, color: 'var(--tavil-text)', marginBottom: 6, fontSize: 15 }} onClick={() => setSelectedNews(item, 'Notícies')}>{item.title}</h3>
                <p className="mb-0 line-clamp-3" style={{ fontSize: 14, fontFamily: "'Barlow Semi Condensed', var(--font-ui)", color: 'var(--tavil-muted)', lineHeight: 1.6 }}>{item.summary}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--tavil-muted)', marginTop: 16 }}><Calendar size={13} /><span>{item.date}</span></div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--tavil-border)', marginTop: 10 }}>
                  <button onClick={e => { e.stopPropagation(); handleEditNews(item); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={12} /> Editar</button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteNews(item.id); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={12} /> Eliminar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {confirmNode}
    </div>
  );
}

// ── Activitats Tab ────────────────────────────────────────────────────────────

function ActivitatsTab({ currentUser, onBack }: { currentUser: User | null; onBack?: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [activities, setActivities] = useState<Activity[]>(() => tabPrefetch.activities ?? []);
  const [activeTab, setActiveTab] = usePersistedSubTab<string>('activitats', 'Properes', ['Properes', 'Passades'] as const);
  const [activeFilter, setActiveFilter] = useState('Totes');
  const [actSearch, setActSearch] = useState('');
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [actClosing, setActClosing] = useState(false);
  const [enrollConfirm, setEnrollConfirm] = useState<number | null>(null);
  const closeAct = () => { setActClosing(true); setEnrollConfirm(null); setTimeout(() => { setSelectedAct(null); setActClosing(false); }, 220); };
  useEffect(() => { scrollPageToTop(); }, [selectedAct]);
  const [myEnrollments, setMyEnrollments] = useState<Map<number, string>>(new Map());
  const [enrollError, setEnrollError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<number | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);
  const [unenrollConfirm, setUnenrollConfirm] = useState<number | null>(null);
  useEffect(() => {
    apiGetMyActivityEnrollments()
      .then(list => setMyEnrollments(new Map(list.map(e => [e.activity_id, e.status]))))
      .catch(() => {/* silently ignore — backend may not be deployed yet */});
  }, []);
  useEffect(() => { setGlobalNavHidden(!!selectedAct); }, [selectedAct]);
  const isAdmin = (() => {
    const r = currentUser?.role ?? '';
    const rs = currentUser?.roles ?? [];
    return ['Administrador', 'Administrador/a', 'Recursos humans', 'Comunicacions', 'Comunicació'].some(x => x === r || rs.includes(x));
  })();

  // New activity form state
  const [showActForm, setShowActForm] = useState(false);
  const [closingActForm, setClosingActForm] = useState(false);
  useEffect(() => { setGlobalNavHidden(!!selectedAct || showActForm); }, [selectedAct, showActForm]);
  const [aTitle, setATitle] = useState('');
  const [aCategory, setACategory] = useState('Esport');
  const [aDesc, setADesc] = useState('');
  const [aDate, setADate] = useState('');
  const [aTime, setATime] = useState('');
  const [aLocation, setALocation] = useState('');
  const [aCapacity, setACapacity] = useState('20');
  const [aUnlimited, setAUnlimited] = useState(false);
  const [aLink, setALink] = useState('');
  const [aImage, setAImage] = useState('');
  const [aImageFile, setAImageFile] = useState<File | null>(null);
  const aImageInputRef = React.useRef<HTMLInputElement>(null);
  const [aSaving, setASaving] = useState(false);
  const [aTitleTouched, setATitleTouched] = useState(false);
  const [aActError, setAActError] = useState<string | null>(null);

  const closeActForm = () => { setClosingActForm(true); setTimeout(() => { setShowActForm(false); setClosingActForm(false); resetActForm(); }, 220); };

  const resetActForm = () => {
    setATitle(''); setADesc(''); setADate(''); setATime(''); setALocation('');
    setACapacity('20'); setAUnlimited(false); setALink('');
    setAImage(''); setAImageFile(null);
    setATitleTouched(false); setAActError(null);
  };

  const handleCreateActivity = async () => {
    setATitleTouched(true);
    if (!aTitle.trim()) { setAActError('Cal indicar el títol.'); return; }
    setAActError(null);
    setASaving(true);
    try {
      let aImageUrl = aImage;
      if (aImageFile) aImageUrl = await apiUploadImage(aImageFile);
      await apiCreateActivity({ title: aTitle.trim(), category: aCategory, description: aDesc.trim(),
        date: aDate.trim(), time: aTime.trim(), location: aLocation.trim(),
        capacity: aUnlimited ? 0 : (parseInt(aCapacity) || 0),
        link: aLink.trim(), image: aImageUrl || undefined });
      tabPrefetch.agendaEvents = undefined;
      setActivities(await apiGetActivities());
      closeActForm();
    } catch (e: any) { setAActError(e?.message ?? 'Error creant activitat'); }
    finally { setASaving(false); }
  };

  // Edit activity state
  const [actEditId, setActEditId] = useState<number | null>(null);
  const [aeTitle, setAeTitle] = useState('');
  const [aeCategory, setAeCategory] = useState('Esport');
  const [aeDesc, setAeDesc] = useState('');
  const [aeDate, setAeDate] = useState('');
  const [aeTime, setAeTime] = useState('');
  const [aeLocation, setAeLocation] = useState('');
  const [aeCapacity, setAeCapacity] = useState('');
  const [aeUnlimited, setAeUnlimited] = useState(false);
  const [aeLink, setAeLink] = useState('');
  const [aeImage, setAeImage] = useState('');
  const [aeImageCropJson, setAeImageCropJson] = useState('');
  const [aeCropFile, setAeCropFile] = useState<File | null>(null);
  const aeImageInputRef = React.useRef<HTMLInputElement>(null);
  const [aeCropSrc, setAeCropSrc] = useState<string | null>(null);
  const [aeSaving, setAeSaving] = useState(false);
  const [inlineReframeActId, setInlineReframeActId] = useState<number | null>(null);
  const [inlineReframeSrc, setInlineReframeSrc] = useState<string | null>(null);
  const [inlineReframeCropJson, setInlineReframeCropJson] = useState<string | null>(null);
  const [inlineReframeSaving, setInlineReframeSaving] = useState(false);

  const openActEdit = (act: Activity) => {
    setActEditId(act.id);
    setAeTitle(act.title); setAeCategory(act.category); setAeDesc(act.description);
    setAeDate(act.date); setAeTime(act.time); setAeLocation(act.location);
    setAeUnlimited(act.capacity === 0);
    setAeCapacity(act.capacity > 0 ? String(act.capacity) : '20');
    setAeLink(act.link ?? '');
    setAeImage(act.image ?? ''); setAeImageCropJson(act.image_crop ?? ''); setAeCropFile(null);
  };

  const handleSaveActEdit = async () => {
    if (!actEditId || !aeTitle.trim()) return;
    setAeSaving(true);
    try {
      await apiUpdateActivity(actEditId, { title: aeTitle.trim(), category: aeCategory,
        description: aeDesc.trim(), date: aeDate.trim(), time: aeTime.trim(),
        location: aeLocation.trim(),
        capacity: aeUnlimited ? 0 : (parseInt(aeCapacity) || 0),
        link: aeLink.trim(), image: aeImage || undefined,
        image_crop: aeImageCropJson || undefined });
      tabPrefetch.agendaEvents = undefined;
      setActivities(await apiGetActivities());
      setActEditId(null);
    } catch (e) { console.error(e); }
    finally { setAeSaving(false); }
  };

  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleDeleteActivity = (id: number) => {
    setConfirmModal({
      message: t('activities.confirmDelete'),
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteActivity(id); tabPrefetch.agendaEvents = undefined; setActivities(await apiGetActivities()); }
        catch (e) { console.error(e); }
      },
    });
  };

  const [actLoading, setActLoading] = useState(() => !tabPrefetch.activities);
  const [actError, setActError] = useState<string | null>(null);
  const [actRetryCount, setActRetryCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (isTabCacheFresh('activities')) { setActLoading(false); return; }
    setActError(null);
    apiGetActivities()
      .then(d => { if (!cancelled) { setActivities(d); tabPrefetch.activities = d; tabPrefetchAt.activities = Date.now(); } })
      .catch(() => { if (!cancelled) setActError("No s'han pogut carregar les dades. Comprova la connexió."); })
      .finally(() => { if (!cancelled) setActLoading(false); });
    return () => { cancelled = true; };
  }, [actRetryCount]);

  const isMobileAct = useIsMobile();
  const ACT_CAT_LABELS: Record<string, string> = {
    'Totes': t('activities.cat.all'),
    'Esport': t('activities.cat.sport'),
    'Cultura': t('activities.cat.culture'),
    'Social': t('activities.cat.social'),
    'RSC': t('activities.cat.rsc'),
    'Benestar': t('activities.cat.wellness'),
  };
  const upcoming = [...activities.filter(a => a.past === 0)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = [...activities.filter(a => a.past === 1)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const source = activeTab === 'Properes' ? upcoming : past;
  const filtered = (activeFilter === 'Totes' ? source : source.filter(a => a.category === activeFilter))
    .filter(a => !actSearch || [a.title, a.description, a.location].some(f => f.toLowerCase().includes(actSearch.toLowerCase())));
  const isProperes = activeTab === 'Properes';

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobileAct) {
    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar: back button + centered title */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', pointerEvents: 'none' }}>Connect</span>
        </div>
        {/* Header kicker + title + subtitle */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{t('activities.kicker')}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>Connect</h1>
          <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('activities.mobileSubtitle')}</p>
        </div>
        {/* Segmented: Pròximes / Passades */}
        <div style={{ padding: '6px 20px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: 'var(--tavil-border)', borderRadius: 12 }}>
            {([`Properes`, `Passades`] as const).map(key => (
              <button key={key} onClick={() => { setActiveTab(key); setActiveFilter('Totes'); setActSearch(''); }} style={{
                padding: '9px 0', borderRadius: 9,
                background: activeTab === key ? 'var(--tavil-card)' : 'transparent',
                color: activeTab === key ? 'var(--tavil-text)' : 'var(--tavil-muted)',
                fontWeight: 500, fontSize: 13, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: activeTab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>{key === 'Properes' ? t('activities.upcoming') : t('activities.past')}</button>
            ))}
          </div>
        </div>
        {/* Cards */}
        {!actLoading && actError && activities.length === 0 ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--tavil-muted)', fontSize: 14, marginBottom: '0.75rem' }}>{actError}</p>
            <button
              onClick={() => { setActError(null); setActRetryCount(c => c + 1); }}
              style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--tavil-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('common.retry')}
            </button>
          </div>
        ) : actLoading && activities.length === 0 ? (
          <SkeletonActivitats />
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tavil-faint)' }}>
            <ActivityIcon size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 13.5 }}>{t('activities.noActivities')}</p>
          </div>
        ) : (
          <div key={`${activeTab}-${activeFilter}`} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((act, i) => {
              const full = act.capacity > 0 && act.enrolled >= act.capacity;
              const pct = act.capacity > 0 ? Math.min(Math.round((act.enrolled / act.capacity) * 100), 100) : 0;
              return (
              <div
                key={i}
                className="anim-item"
                style={{ '--i': i, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties}
              >
                <div style={{ display: 'flex' }}>
                  <div
                    onClick={() => isProperes && (setSelectedAct(act), setEnrollError(''))}
                    style={{ width: 96, flexShrink: 0, background: 'rgba(191,33,30,0.06)', borderRight: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProperes ? 'pointer' : 'default', minHeight: 110, overflow: 'hidden' }}
                  >
                    {act.image
                      ? <img src={resolveImg(act.image)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ActivityIcon size={28} style={{ color: 'rgba(191,33,30,0.3)' }} />}
                  </div>
                  <div style={{ flex: 1, padding: 14, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--tavil-bg)', color: 'var(--tavil-muted)', border: '1px solid var(--tavil-border)', padding: '2px 8px', borderRadius: 6 }}>{act.category}</span>
                      {full && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 6 }}>{t('activities.full')}</span>}
                      {!full && isProperes && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 6 }}>Oberta</span>}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25, color: 'var(--tavil-text)', marginBottom: 6, cursor: isProperes ? 'pointer' : 'default' }}
                      onClick={() => isProperes && (setSelectedAct(act), setEnrollError(''))}
                    >{act.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      <Clock size={11} /><span>{act.date}{act.time ? ` · ${act.time}` : ''}</span>
                    </div>
                    {act.capacity > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--tavil-faint)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '100%', transform: `scaleX(${pct / 100})`, transformOrigin: 'left', background: full ? '#f59e0b' : 'var(--tavil-accent)', transition: 'transform 400ms var(--ease-out-quint)' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--tavil-faint)', fontFeatureSettings: '"tnum"' }}>{act.enrolled}/{act.capacity}</span>
                      </div>
                    ) : isProperes ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontSize: 11, color: '#22c55e', fontWeight: 500 }}>
                        <Users size={11} /><span>Places lliures · {act.enrolled} inscrits</span>
                      </div>
                    ) : null}
                    {isProperes && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        {myEnrollments.has(act.id) ? (
                          <>
                            <span className={enrollSuccess === act.id ? 'anim-enroll-pop anim-enroll-ring' : ''} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                              ✓ Inscrit/a
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedAct(act); setEnrollError(''); setUnenrollConfirm(act.id); }}
                              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--tavil-border)', fontSize: 12, fontWeight: 600, background: 'none', color: 'var(--tavil-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              {t('common.cancel')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSelectedAct(act); setEnrollError('');
                            }}
                            disabled={full}
                            style={{
                              padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12.5, fontWeight: 600,
                              background: full ? 'var(--tavil-faint)' : 'var(--tavil-accent)',
                              color: full ? 'var(--tavil-muted)' : '#fff',
                              cursor: full ? 'default' : 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            {full ? 'Complet' : "M'inscric"}
                          </button>
                        )}
                      </div>
                    )}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--tavil-border)', marginTop: 6 }}>
                        <button onClick={e => { e.stopPropagation(); actEditId === act.id ? setActEditId(null) : openActEdit(act); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={12} /> Editar</button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteActivity(act.id); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={12} /> Eliminar</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Admin FAB */}
        {isAdmin && (
          <button
            onClick={() => setShowActForm(v => !v)}
            style={{
              position: 'fixed', bottom: 90, right: 20, width: 52, height: 52,
              borderRadius: 26, background: 'var(--tavil-accent)', color: '#fff',
              border: 'none', fontSize: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(191,33,30,0.35)', zIndex: 40,
            }}
          ><Plus size={22} /></button>
        )}

        {/* Admin form — bottom sheet (mobile) */}
        {isAdmin && showActForm && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${closingActForm ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeActForm}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: `20px 20px calc(env(safe-area-inset-bottom, 0px) + 80px)`, width: '100%', maxHeight: 'calc(92dvh - env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }} className={closingActForm ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 18 }}>Nova activitat</h3>
              {aActError && <p style={{ fontSize: 13, color: '#bf211e', background: 'rgba(191,33,30,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{aActError}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" value={aTitle} onChange={e => { setATitle(e.target.value); if (aActError) setAActError(null); }} onBlur={() => setATitleTouched(true)} placeholder="Títol *" style={{ borderRadius: 10, border: `1px solid ${aTitleTouched && !aTitle.trim() ? '#bf211e' : 'var(--tavil-border)'}`, padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <textarea value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="Descripció" rows={3} style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--tavil-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</div>
                    <DatePicker value={aDate} onChange={setADate} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--tavil-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hora <span style={{ textTransform: 'none', fontWeight: 400 }}>(opcional)</span></div>
                    <TimePicker value={aTime} onChange={setATime} optional />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8, fontWeight: 600 }}>Categoria</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Esport','Cultura','Social','RSC','Benestar'].map(cat => (
                      <button key={cat} type="button" onClick={() => setACategory(cat)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', background: aCategory === cat ? 'var(--tavil-text)' : 'var(--tavil-bg)', color: aCategory === cat ? 'var(--tavil-bg)' : 'var(--tavil-muted)', border: `1px solid ${aCategory === cat ? 'var(--tavil-text)' : 'var(--tavil-border)'}` }}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8, fontWeight: 600 }}>Aforament</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" onClick={() => setAUnlimited(v => !v)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, border: `1.5px solid ${aUnlimited ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`, background: aUnlimited ? 'var(--tavil-accent-light)' : 'var(--tavil-bg)', color: aUnlimited ? 'var(--tavil-accent)' : 'var(--tavil-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, transition: 'all 140ms' }}>∞</button>
                    {!aUnlimited
                      ? <input type="number" value={aCapacity} onChange={e => setACapacity(e.target.value)} style={{ flex: 1, borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                      : <span style={{ fontSize: 13, color: 'var(--tavil-accent)', fontWeight: 500 }}>Il·limitat</span>}
                  </div>
                </div>
                <input type="text" value={aLocation} onChange={e => setALocation(e.target.value)} placeholder="Ubicació" style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <input type="text" value={aLink} onChange={e => setALink(e.target.value)} placeholder="Enllaç extern (opcional)" style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8, fontWeight: 600 }}>Foto de portada <span style={{ fontWeight: 400 }}>(opcional)</span></div>
                  <input ref={aImageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setAImageFile(f); setAImage(''); } }} />
                  <div onClick={() => aImageInputRef.current?.click()} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, border: '1.5px dashed var(--tavil-border)', background: 'var(--tavil-bgAlt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {aImageFile ? <img src={URL.createObjectURL(aImageFile)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : aImage ? <img src={aImage} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--tavil-faint)' }}><ImageIcon size={24} /><span style={{ fontSize: 12 }}>Afegir foto</span></div>}
                  </div>
                  {(aImageFile || aImage) && (
                    <button type="button" onClick={() => { setAImageFile(null); setAImage(''); if (aImageInputRef.current) aImageInputRef.current.value = ''; }} style={{ marginTop: 6, fontSize: 12, color: 'var(--tavil-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={12} /> Elimina la foto
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={closeActForm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                  <button type="button" onClick={handleCreateActivity} disabled={!aTitle.trim() || aSaving} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!aTitle.trim() || aSaving) ? 0.5 : 1 }}>{aSaving ? 'Creant…' : 'Crear activitat'}</button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Detail modal (shared with desktop) */}
        {selectedAct && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${actClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeAct}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', width: '100%', maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }} className={actClosing ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--tavil-border)', color: 'var(--tavil-muted)', padding: '2px 8px', borderRadius: 6 }}>{selectedAct.category}</span>
                <button onClick={closeAct} style={{ background: 'none', border: 'none', color: 'var(--tavil-faint)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 8, lineHeight: 1.1 }}>{selectedAct.title}</h2>
              <p style={{ fontSize: 15, fontFamily: "'Barlow Semi Condensed', var(--font-ui)", color: 'var(--tavil-muted)', lineHeight: 1.65, marginBottom: 16 }}>{selectedAct.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--tavil-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tavil-muted)' }}><Calendar size={14} /><span>{selectedAct.date}{selectedAct.time ? ` · ${selectedAct.time}` : ''}</span></div>
                {selectedAct.location && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tavil-muted)' }}><MapPin size={14} /><span>{selectedAct.location}</span></div>}
              </div>
              {selectedAct.capacity > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tavil-muted)', marginBottom: 6 }}>
                    <span>{selectedAct.enrolled} / {selectedAct.capacity} places</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{Math.max(0, selectedAct.capacity - selectedAct.enrolled)} disponibles</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--tavil-border)' }}>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--tavil-accent)', width: `${Math.min((selectedAct.enrolled / selectedAct.capacity) * 100, 100)}%` }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e', fontWeight: 500, marginBottom: 20 }}>
                  <Users size={12} /><span>Places lliures · {selectedAct.enrolled} inscrits</span>
                </div>
              )}
              {enrollError && <p style={{ fontSize: 13, color: 'var(--tavil-accent)', background: 'rgba(191,33,30,0.06)', border: '1px solid rgba(191,33,30,0.22)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>{enrollError}</p>}
              {selectedAct.link ? (
                <a href={selectedAct.link} target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--tavil-accent)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                  Més informació i inscripció
                </a>
              ) : myEnrollments.has(selectedAct.id) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className={enrollSuccess === selectedAct.id ? 'anim-enroll-pop anim-enroll-ring' : ''} style={{ width: '100%', height: 50, borderRadius: 14, background: '#16a34a', color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    ✓ Inscrit/a
                  </div>
                  {unenrollConfirm === selectedAct.id ? (
                    <div className="anim-confirm-in" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)' }}>
                      <p style={{ fontSize: 13, color: 'var(--tavil-text)', fontWeight: 500, margin: 0, textAlign: 'center' }}>Segur que vols cancel·lar la inscripció?</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={async () => {
                          setUnenrollConfirm(null); setEnrollError('');
                          setUnenrolling(true);
                          const prev = new Map(myEnrollments);
                          setMyEnrollments(cur => { const n = new Map(cur); n.delete(selectedAct.id); return n; });
                          try {
                            await apiUnenrollActivity(selectedAct.id);
                            setActivities(await apiGetActivities());
                            toast.info("Inscripció cancel·lada");
                          } catch (e: any) { setMyEnrollments(prev); setEnrollError(e.message ?? 'Error en cancel·lar'); }
                          finally { setUnenrolling(false); }
                        }}
                        style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: unenrolling ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: unenrolling ? 0.7 : 1, transition: 'opacity 150ms' }}
                      >
                        {unenrolling ? <><span className="anim-spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />Cancel·lant…</> : 'Sí, cancel·la'}
                      </button>
                      <button
                        onClick={() => setUnenrollConfirm(null)}
                        style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  ) : (
                    <button
                      onClick={() => setUnenrollConfirm(selectedAct.id)}
                      style={{ width: '100%', height: 44, borderRadius: 14, border: '1.5px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              ) : enrollConfirm === selectedAct.id ? (
                <div className="anim-confirm-in" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)' }}>
                  <p style={{ fontSize: 14, color: 'var(--tavil-text)', fontWeight: 600, margin: 0, textAlign: 'center', lineHeight: 1.35 }}>
                    Confirmes la teva inscripció?
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={enrolling}
                      onClick={async () => {
                        setEnrollError('');
                        setEnrolling(true);
                        try {
                          const result = await apiEnrollActivity(selectedAct.id);
                          setEnrollConfirm(null);
                          setMyEnrollments(prev => new Map(prev).set(selectedAct.id, result.status ?? 'confirmed'));
                          setActivities(await apiGetActivities());
                          setEnrollSuccess(selectedAct.id);
                          setTimeout(() => setEnrollSuccess(null), 900);
                          toast.success("Inscripció confirmada!");
                          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#bf211e','#16a34a','#f59e0b','#3b82f6','#ffffff'] });
                        } catch (e: any) { setEnrollError(e.message ?? 'Error en la inscripció'); }
                        finally { setEnrolling(false); }
                      }}
                      style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: enrolling ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: enrolling ? 0.7 : 1, transition: 'opacity 150ms' }}
                    >
                      {enrolling ? <><span className="anim-spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />Inscrivint…</> : "Sí, m'inscric"}
                    </button>
                    <button
                      onClick={() => setEnrollConfirm(null)}
                      style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="press anim-enroll-btn"
                  onClick={() => { setEnrollConfirm(selectedAct.id); setEnrollError(''); }}
                  style={{
                    width: '100%', height: 50, borderRadius: 14, border: 'none',
                    background: 'var(--tavil-accent)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'transform 110ms var(--ease-out-cubic)',
                  }}
                >
                  Inscriure's
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
        {confirmModal && createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm anim-fade-in" onClick={() => setConfirmModal(null)}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 w-full max-w-xs mx-4 shadow-xl anim-scale-in" onClick={e => e.stopPropagation()}>
              <p className="text-sm text-gray-700 dark:text-zinc-300 mb-4">{confirmModal.message}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmModal(null)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400">{t('common.cancel')}</button>
                <button onClick={confirmModal.onConfirm} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg font-semibold">Eliminar</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('activities.connectSubtitle')}</p>
        {isAdmin && <button onClick={() => setShowActForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">+ Nova activitat</button>}
      </div>
      {isAdmin && (
        <AdminCreateModalShell
          open={showActForm} onClose={() => { setShowActForm(false); resetActForm(); }} onSubmit={handleCreateActivity}
          title="Crea una activitat" kicker="NOVA ACTIVITAT"
          saveLabel="Crea activitat" savingLabel="Creant…"
          saving={aSaving} error={aActError}
        >
          <AField label="Títol" required error={aTitleTouched && !aTitle.trim() ? 'El títol és obligatori.' : undefined}>
            <AInput value={aTitle} onChange={e => { setATitle(e.target.value); if (aActError) setAActError(null); }} onBlur={() => setATitleTouched(true)} placeholder="Nom de l'activitat" hasError={aTitleTouched && !aTitle.trim()} />
          </AField>
          <AField label="Descripció">
            <ATextarea rows={3} value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="Breu descripció" />
          </AField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AField label="Data">
              <DatePicker value={aDate} onChange={setADate} />
            </AField>
            <AField label="Hora">
              <TimePicker value={aTime} onChange={setATime} optional />
            </AField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AField label="Categoria">
              <ASelect value={aCategory} onChange={e => setACategory(e.target.value)} options={['Esport','Cultura','Social','RSC','Benestar']} />
            </AField>
            <AField label="Aforament">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={() => setAUnlimited(v => !v)} title={aUnlimited ? 'Il·limitat' : 'Limitat'} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, border: '1.5px solid', borderColor: aUnlimited ? 'var(--tavil-accent)' : 'var(--tavil-border)', background: aUnlimited ? 'var(--tavil-accent-light)' : 'var(--tavil-card)', color: aUnlimited ? 'var(--tavil-accent)' : 'var(--tavil-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 140ms' }}>∞</button>
                {!aUnlimited ? <AInput type="number" value={aCapacity} onChange={e => setACapacity(e.target.value)} /> : <span style={{ fontSize: 13, color: 'var(--tavil-accent)', fontWeight: 500 }}>Il·limitat</span>}
              </div>
            </AField>
          </div>
          <AField label="Ubicació">
            <AInput value={aLocation} onChange={e => setALocation(e.target.value)} placeholder="Sala, edifici, ciutat…" icon={MapPin} />
          </AField>
          <AField label="Enllaç extern" optional>
            <AInput value={aLink} onChange={e => setALink(e.target.value)} placeholder="https://…" />
          </AField>
          <AField label="Foto de portada" optional>
            <input ref={aImageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setAImageFile(f); setAImage(''); } }} />
            <div onClick={() => aImageInputRef.current?.click()} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, border: '1.5px dashed var(--tavil-border)', background: 'var(--tavil-bgAlt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'border-color 150ms' }}>
              {aImageFile ? <img src={URL.createObjectURL(aImageFile)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : aImage ? <img src={aImage} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--tavil-faint)' }}><ImageIcon size={24} /><span style={{ fontSize: 12 }}>Afegir foto de portada</span></div>}
            </div>
            {(aImageFile || aImage) && (
              <button type="button" onClick={() => { setAImageFile(null); setAImage(''); if (aImageInputRef.current) aImageInputRef.current.value = ''; }}
                style={{ marginTop: 6, fontSize: 12, color: 'var(--tavil-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Elimina la foto
              </button>
            )}
          </AField>
        </AdminCreateModalShell>
      )}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-5">
        {([
          { key: 'Properes', label: t('activities.upcomingCount', { count: upcoming.length }) },
          { key: 'Passades', label: t('activities.pastCount', { count: past.length }) },
        ]).map(tab => (
          <UnderlineTab key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => { setActiveTab(tab.key); setActiveFilter('Totes'); setActSearch(''); }} />
        ))}
      </div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={actSearch} onChange={e => setActSearch(e.target.value)} placeholder={t('activities.searchPlaceholder')} className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white w-56" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Totes', 'Esport', 'Cultura', 'Social', 'RSC', 'Benestar'].map(f => (
            <FilterChip key={f} label={ACT_CAT_LABELS[f] ?? f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>
      {!actLoading && actError && activities.length === 0 && (
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--tavil-muted)', fontSize: 14, marginBottom: '0.75rem' }}>{actError}</p>
          <button
            onClick={() => { setActError(null); setActRetryCount(c => c + 1); }}
            style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--tavil-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.retry')}
          </button>
        </div>
      )}
      {actLoading && activities.length === 0 && <SkeletonActivitats />}
      <div key={`${activeTab}-${activeFilter}`} className="grid grid-cols-1 md:grid-cols-2 gap-5 anim-tab">
        {filtered.map((act, i) => {
          const available = act.capacity > 0 ? act.capacity - act.enrolled : 0;
          return (
          <div key={i} className={`hover-lift rounded-xl flex flex-col ${inlineReframeActId === act.id ? '' : 'overflow-hidden'}`} style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)' }}>
            {inlineReframeActId === act.id && inlineReframeSrc ? (
              <ImageCropModal
                inline
                src={inlineReframeSrc}
                initialCrop={inlineReframeCropJson ? JSON.parse(inlineReframeCropJson) : undefined}
                onConfirm={async params => {
                  setInlineReframeSrc(null);
                  setInlineReframeSaving(true);
                  try {
                    const cropJson = JSON.stringify(params);
                    await apiUpdateActivity(act.id, {
                      title: act.title, category: act.category, description: act.description,
                      date: act.date, time: act.time, location: act.location,
                      capacity: act.capacity, link: act.link ?? '', image: act.image,
                      image_crop: cropJson,
                    });
                    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, image_crop: cropJson } : a));
                  } catch (e) { console.error(e); }
                  finally { setInlineReframeSaving(false); setInlineReframeActId(null); setInlineReframeCropJson(null); }
                }}
                onCancel={() => { setInlineReframeSrc(null); setInlineReframeActId(null); setInlineReframeCropJson(null); }}
              />
            ) : (
              <div className="hidden md:flex h-32 items-center justify-center overflow-hidden flex-shrink-0 relative group" style={{
                background: act.image ? 'transparent' : ((({
                  'Esport':   'rgba(34,197,94,0.08)',
                  'Cultura':  'rgba(139,92,246,0.08)',
                  'Social':   'rgba(59,130,246,0.08)',
                  'RSC':      'rgba(245,158,11,0.08)',
                  'Benestar': 'rgba(20,184,166,0.08)',
                } as Record<string,string>)[act.category]) ?? 'rgba(191,33,30,0.06)'),
              }}>
                {act.image
                  ? <img src={resolveImg(act.image)} alt="" loading="lazy" className="w-full h-full object-cover" style={act.image_crop ? (() => { try { const c = JSON.parse(act.image_crop); return { objectPosition: `${c.cx * 100}% ${c.cy * 100}%` }; } catch { return {}; } })() : undefined} />
                  : <ActivityIcon size={36} style={{
                      opacity: 0.25,
                      color: ({
                        'Esport':   '#16a34a',
                        'Cultura':  '#7c3aed',
                        'Social':   '#2563eb',
                        'RSC':      '#d97706',
                        'Benestar': '#0f766e',
                      } as Record<string,string>)[act.category] ?? '#bf211e'
                    }} />}
                {isAdmin && act.image && (
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      const res = await fetch(resolveImg(act.image!));
                      const blob = await res.blob();
                      setInlineReframeCropJson(act.image_crop ?? null);
                      setInlineReframeActId(act.id);
                      setInlineReframeSrc(URL.createObjectURL(blob));
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer' }}
                  >
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', background: 'rgba(0,0,0,0.45)', padding: '3px 10px', borderRadius: 6 }}>REENCUADRAR</span>
                  </button>
                )}
              </div>
            )}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-3">
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tavil-muted)', background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)', padding: '2px 8px', borderRadius: 6 }}>{act.category}</span>
                {myEnrollments.has(act.id)
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.2 2.2L8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Inscrit
                    </span>
                  : isProperes
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--tavil-accent)', padding: '2px 10px', borderRadius: 6 }}>Inscripció oberta</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tavil-muted)', background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)', padding: '2px 10px', borderRadius: 6 }}>Finalitzada</span>}
              </div>
              <div className="flex-1">
                <h3 style={{ fontWeight: 700, color: 'var(--tavil-text)', marginBottom: 6, fontSize: 15 }}>{act.title}</h3>
                <p className="mb-0 line-clamp-3" style={{ fontSize: 14, fontFamily: "'Barlow Semi Condensed', var(--font-ui)", color: 'var(--tavil-muted)', lineHeight: 1.6 }}>{act.description}</p>
              </div>
              <div className="space-y-1.5 mt-4 mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--tavil-muted)' }}><Calendar size={13} /><span>{act.date}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--tavil-muted)' }}><Clock size={13} /><span>{act.time}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--tavil-muted)' }}><MapPin size={13} /><span>{act.location}</span></div>
              </div>
              <div className="mt-auto">
                {act.capacity > 0 ? (
                  <div className={isProperes ? "mb-4" : ""}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--tavil-muted)', marginBottom: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{act.enrolled} / {act.capacity} places</span>
                      {isProperes && <span style={{ color: '#22c55e', fontWeight: 600 }}>{available} disponibles</span>}
                    </div>
                    <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'var(--tavil-border)' }}>
                      <div style={{ height: 5, borderRadius: 3, background: isProperes ? 'var(--tavil-accent)' : 'var(--tavil-muted)', width: `${(act.enrolled / act.capacity) * 100}%` }} />
                    </div>
                  </div>
                ) : isProperes ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e', fontWeight: 500, marginBottom: 16 }}>
                    <Users size={11} /><span>{act.enrolled} inscrits · Places lliures</span>
                  </div>
                ) : null}
                {isProperes && (
                  act.link ? (
                    <a href={act.link} target="_blank" rel="noopener noreferrer" style={{ color: myEnrollments.has(act.id) ? '#15803d' : 'var(--tavil-accent)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginTop: 14 }}>
                      {myEnrollments.has(act.id) ? 'Inscrit · Veure detalls' : "Veure detalls i inscriure's"} <ArrowRight size={14} />
                    </a>
                  ) : (
                    <button onClick={() => { setSelectedAct(act); setEnrollError(''); }} style={{ color: myEnrollments.has(act.id) ? '#15803d' : 'var(--tavil-accent)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginTop: 14 }}>
                      {myEnrollments.has(act.id) ? 'Inscrit · Veure detalls' : "Veure detalls i inscriure's"} <ArrowRight size={14} />
                    </button>
                  )
                )}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--tavil-border)' }}>
                    <button onClick={() => actEditId === act.id ? setActEditId(null) : openActEdit(act)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={12} /> Editar</button>
                    <button onClick={() => handleDeleteActivity(act.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={12} /> Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
      {selectedAct && createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${actClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeAct}>
          <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 w-full max-w-md mx-4 shadow-xl ${actClosing ? 'anim-scale-out' : 'anim-scale-in'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{selectedAct.category}</span>
              <button onClick={closeAct} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 text-sm px-1">✕</button>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{selectedAct.title}</h2>
            <p className="mb-4" style={{ fontSize: 15, fontFamily: "'Barlow Semi Condensed', var(--font-ui)", color: 'var(--tavil-muted)', lineHeight: 1.65 }}>{selectedAct.description}</p>
            <div className="space-y-2 mb-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><Calendar size={13} /><span>{selectedAct.date}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><Clock size={13} /><span>{selectedAct.time}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><MapPin size={13} /><span>{selectedAct.location}</span></div>
            </div>
            {selectedAct.capacity > 0 ? (
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1"><Users size={11} />{selectedAct.enrolled} / {selectedAct.capacity} places</span>
                  <span className="text-green-600 font-medium">{Math.max(0, selectedAct.capacity - selectedAct.enrolled)} disponibles</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.min((selectedAct.enrolled / selectedAct.capacity) * 100, 100)}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mb-5">
                <Users size={11} /><span>Places lliures · {selectedAct.enrolled} inscrits</span>
              </div>
            )}
            {enrollError && <p className="text-xs mb-3" style={{ color: 'var(--tavil-accent)', background: 'rgba(191,33,30,0.06)', border: '1px solid rgba(191,33,30,0.22)', borderRadius: 8, padding: '8px 12px' }}>{enrollError}</p>}
            {selectedAct.link ? (
              <a href={selectedAct.link} target="_blank" rel="noopener noreferrer" className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-1.5">
                Més informació i inscripció <ArrowRight size={14} />
              </a>
            ) : myEnrollments.has(selectedAct.id) ? (
              <div className="space-y-2">
                <div className={`w-full py-2.5 rounded-lg text-sm font-bold text-center${enrollSuccess === selectedAct.id ? ' anim-enroll-pop anim-enroll-ring' : ''}`} style={{ background: '#16a34a', color: '#fff' }}>
                  ✓ Inscrit/a
                </div>
                {unenrollConfirm === selectedAct.id ? (
                  <div className="anim-confirm-in rounded-xl p-3 space-y-2.5" style={{ background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)' }}>
                    <p className="text-xs text-center font-medium" style={{ color: 'var(--tavil-text)' }}>Segur que vols cancel·lar la inscripció?</p>
                    <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setUnenrollConfirm(null); setEnrollError('');
                        setUnenrolling(true);
                        const prev = new Map(myEnrollments);
                        setMyEnrollments(cur => { const n = new Map(cur); n.delete(selectedAct.id); return n; });
                        try {
                          await apiUnenrollActivity(selectedAct.id);
                          setActivities(await apiGetActivities());
                          toast.info("Inscripció cancel·lada");
                        } catch (e: any) { setMyEnrollments(prev); setEnrollError(e.message ?? 'Error en cancel·lar'); }
                        finally { setUnenrolling(false); }
                      }}
                      className="press flex-1 text-white font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-1.5"
                      style={{ background: 'var(--tavil-accent)', opacity: unenrolling ? 0.7 : 1 }}
                    >
                      {unenrolling ? <><span className="anim-spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />Cancel·lant…</> : 'Sí, cancel·la'}
                    </button>
                    <button
                      onClick={() => setUnenrollConfirm(null)}
                      className="press flex-1 font-semibold py-2 rounded-lg text-sm"
                      style={{ border: '1px solid var(--tavil-border)', color: 'var(--tavil-muted)', background: 'none' }}
                    >
                      No
                    </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setUnenrollConfirm(selectedAct.id)}
                    className="press w-full font-semibold py-2 rounded-lg transition-colors text-sm"
                    style={{ border: '1px solid var(--tavil-border)', color: 'var(--tavil-muted)', background: 'none' }}
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            ) : selectedAct.capacity > 0 && selectedAct.enrolled >= selectedAct.capacity ? (
              <button disabled className="w-full disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm" style={{ background: 'var(--tavil-accent)' }}>
                Activitat completa
              </button>
            ) : enrollConfirm === selectedAct.id ? (
              <div className="anim-confirm-in rounded-xl p-3.5 space-y-3" style={{ background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)' }}>
                <p className="text-sm text-center font-semibold" style={{ color: 'var(--tavil-text)' }}>Confirmes la teva inscripció?</p>
                <div className="flex gap-2">
                  <button
                    disabled={enrolling}
                    onClick={async () => {
                      setEnrollError('');
                      setEnrolling(true);
                      try {
                        const result = await apiEnrollActivity(selectedAct.id);
                        setEnrollConfirm(null);
                        setMyEnrollments(prev => new Map(prev).set(selectedAct.id, result.status ?? 'confirmed'));
                        setActivities(await apiGetActivities());
                        setEnrollSuccess(selectedAct.id);
                        setTimeout(() => setEnrollSuccess(null), 900);
                        toast.success("Inscripció confirmada!");
                        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#bf211e','#16a34a','#f59e0b','#3b82f6','#ffffff'] });
                      } catch (e: any) { setEnrollError(e.message ?? 'Error en la inscripció'); }
                      finally { setEnrolling(false); }
                    }}
                    className="press flex-1 text-white font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-1.5"
                    style={{ background: '#16a34a', opacity: enrolling ? 0.7 : 1, transition: 'opacity 150ms' }}
                  >
                    {enrolling ? <><span className="anim-spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />Inscrivint…</> : "Sí, m'inscric"}
                  </button>
                  <button
                    onClick={() => setEnrollConfirm(null)}
                    className="press flex-1 font-semibold py-2 rounded-lg text-sm"
                    style={{ border: '1px solid var(--tavil-border)', color: 'var(--tavil-muted)', background: 'none' }}
                  >
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEnrollConfirm(selectedAct.id); setEnrollError(''); }}
                className="press anim-enroll-btn w-full text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--tavil-accent)' }}
              >
                Inscriure's
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
      {actEditId !== null && (() => {
        const lCls = 'text-[10px] font-semibold text-[var(--tavil-accent)] uppercase tracking-widest block mb-1.5';
        const iCls = 'w-full border border-[var(--tavil-border)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--tavil-card)] text-[var(--tavil-text)] placeholder-[var(--tavil-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--tavil-accent)]/25 focus:border-[var(--tavil-accent)]';
        return (
          <EditModal title="" onClose={() => setActEditId(null)}>
            <div className="space-y-4 -mt-2">
              <div>
                <div className="text-[10px] font-bold text-[var(--tavil-accent)] uppercase tracking-[0.14em] mb-0.5">Editar activitat</div>
                <div className="text-xl font-bold text-[var(--tavil-text)]" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{aeTitle || 'Activitat'}</div>
              </div>
              <div>
                <label className={lCls}>Títol <span className="text-[var(--tavil-accent)]">*</span></label>
                <input value={aeTitle} onChange={e => setAeTitle(e.target.value)} className={iCls} placeholder="Nom de l'activitat" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>Categoria</label>
                  <select value={aeCategory} onChange={e => setAeCategory(e.target.value)} className={iCls}>
                    {['Esport','Cultura','Social','RSC','Benestar','Formació','Jornada','Salut','Voluntariat'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lCls}>Aforament</label>
                  <div className="flex gap-2 items-center">
                    <button type="button" onClick={() => setAeUnlimited(v => !v)} title={aeUnlimited ? 'Il·limitat' : 'Limitat'} className={`flex-shrink-0 w-11 h-11 rounded-xl border text-base flex items-center justify-center cursor-pointer transition-all ${aeUnlimited ? 'border-[var(--tavil-accent)] bg-[var(--tavil-accent-light)] text-[var(--tavil-accent)]' : 'border-[var(--tavil-border)] bg-[var(--tavil-card)] text-[var(--tavil-faint)]'}`}>∞</button>
                    {!aeUnlimited
                      ? <input type="number" value={aeCapacity} onChange={e => setAeCapacity(e.target.value)} className={iCls} placeholder="20" min={1} />
                      : <span className="text-sm font-medium text-[var(--tavil-accent)]">Il·limitat</span>}
                  </div>
                </div>
              </div>
              <div>
                <label className={lCls}>Data</label>
                <DatePicker value={aeDate} onChange={setAeDate} />
              </div>
              <div>
                <label className={lCls}>Hora inici</label>
                <TimePicker value={aeTime} onChange={setAeTime} />
              </div>
              <div>
                <label className={lCls}>Ubicació</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--tavil-faint)] pointer-events-none" />
                  <input value={aeLocation} onChange={e => setAeLocation(e.target.value)} className={`${iCls} pl-9`} placeholder="Sala, edifici, ciutat…" />
                </div>
              </div>
              <div>
                <label className={lCls}>Descripció</label>
                <textarea value={aeDesc} onChange={e => setAeDesc(e.target.value)} rows={3} className={`${iCls} resize-none`} placeholder="Breu descripció de l'activitat…" />
              </div>
              <div>
                <label className={lCls}>Enllaç extern <span className="font-normal normal-case tracking-normal opacity-60">(opcional)</span></label>
                <input value={aeLink} onChange={e => setAeLink(e.target.value)} className={iCls} placeholder="https://…" />
              </div>
              <div>
                <label className={lCls}>Foto de portada <span className="font-normal normal-case tracking-normal opacity-60">(opcional)</span></label>
                <input ref={aeImageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (!f) return; setAeCropFile(f); setAeCropSrc(URL.createObjectURL(f)); if (aeImageInputRef.current) aeImageInputRef.current.value = ''; }} />
                <div
                  onClick={async () => {
                    if (aeImage) {
                      const res = await fetch(resolveImg(aeImage));
                      const blob = await res.blob();
                      setAeCropFile(null);
                      setAeCropSrc(URL.createObjectURL(blob));
                    } else {
                      aeImageInputRef.current?.click();
                    }
                  }}
                  style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, border: '1.5px dashed var(--tavil-border)', background: 'var(--tavil-bgAlt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {aeImage ? <img src={resolveImg(aeImage)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--tavil-faint)' }}><ImageIcon size={24} /><span style={{ fontSize: 12 }}>Afegir foto de portada</span></div>}
                  {aeImage && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1') && (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 6 }}>Reencuadrar</span>
                    </div>
                  )}
                </div>
                {aeImage && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <button type="button" onClick={() => aeImageInputRef.current?.click()}
                      style={{ fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Canviar foto
                    </button>
                    <button type="button" onClick={() => { setAeCropFile(null); setAeImage(''); setAeImageCropJson(''); if (aeImageInputRef.current) aeImageInputRef.current.value = ''; }}
                      style={{ fontSize: 12, color: 'var(--tavil-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={12} /> Elimina la foto
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setActEditId(null)} className="press flex-1 py-2.5 rounded-xl border border-[var(--tavil-border)] text-sm text-[var(--tavil-muted)] hover:bg-[var(--tavil-bgAlt)] transition-colors">{t('common.cancel')}</button>
                <button onClick={handleSaveActEdit} disabled={!aeTitle.trim() || aeSaving}
                  className="press flex-1 py-2.5 rounded-xl bg-[var(--tavil-text)] text-[var(--tavil-bg)] text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-1.5">
                  {aeSaving ? 'Desant…' : <><span>✓</span> Desa canvis</>}
                </button>
              </div>
            </div>
          </EditModal>
        );
      })()}
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
      {aeCropSrc && (
        <ImageCropModal
          src={aeCropSrc}
          initialCrop={aeCropFile ? undefined : (aeImageCropJson ? JSON.parse(aeImageCropJson) : undefined)}
          onConfirm={async params => {
            setAeCropSrc(null);
            if (aeCropFile) {
              try {
                const url = await apiUploadImage(aeCropFile);
                setAeImage(url); setAeImageCropJson(JSON.stringify(params));
              } catch { /* ignore */ } finally { setAeCropFile(null); }
            } else {
              setAeImageCropJson(JSON.stringify(params));
            }
          }}
          onCancel={() => setAeCropSrc(null)}
        />
      )}
    </div>
  );
}

// ── Agenda Tab ────────────────────────────────────────────────────────────────
// AgendaTab is now in src/components/tabs/AgendaTab.tsx

const EVENT_COLORS: Record<string, string> = {
  "Sessió interna":    "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  "Festiu":            "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  "Activitat empresa": "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  "Visita comercial":  "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "Fira":              "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
};

// NOTE: FESTIUS_2026 and the AgendaTab function body live in src/components/tabs/AgendaTab.tsx.
// EVENT_COLORS is kept here because it is also used by AdminBackoffice inline forms.


// ── Espai Corporatiu Tab ──────────────────────────────────────────────────────

const SP_BASE = 'https://tavil.sharepoint.com/teams/PortalWeb/Documents%20compartits/Forms/AllItems.aspx?id=%2Fteams%2FPortalWeb%2FDocuments%20compartits%2FTavipedia';
const spFileUrl = (folderPath: string, file: string) =>
  'https://tavil.sharepoint.com/:b:/r/teams/PortalWeb/Documents%20compartits/' +
  folderPath.split('/').map(encodeURIComponent).join('/') + '/' +
  file.split('/').map(encodeURIComponent).join('/') +
  '?csf=1&web=1';

const ESPAI_CATS = [
  {
    icon: FileText, iconColor: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20",
    title: "Manual del treballador", desc: "Guia d'acollida i informació pràctica per al dia a dia", docs: 5,
    sharepointUrl: SP_BASE + '%2FManual%20del%20treballador',
    spFolderPath: 'Tavipedia/Manual del treballador',
    filters: ['Tots', 'Acollida', 'Calendari', 'Permisos'],
    documents: [
      { title: "Manual Acollida TAVIL (CAT)", desc: "Guia per als nous treballadors amb informació pràctica per al dia a dia.", tag: "Acollida", meta: "PDF", views: 342, file: "Manual Acollida TAVIL.pdf" },
      { title: "Manual Acogida TAVIL (ESP)", desc: "Guía para los nuevos trabajadores con información práctica para el día a día.", tag: "Acollida", meta: "PDF", views: 289, file: "Manual Acogida TAVIL.pdf" },
      { title: "TAVIL Handbook (ENG)", desc: "Employee handbook with practical information for day-to-day work.", tag: "Acollida", meta: "PDF", views: 156, file: "TAVIL Handbook.pdf" },
      { title: "Calendari Laboral 2026", desc: "Calendari oficial de dies laborals, festius i períodes vacacionals 2026.", tag: "Calendari", meta: "PDF", views: 421, file: "Calendari Laboral 2026.pdf" },
      { title: "Protocol Gestió Vacances 2026", desc: "Procediment i criteris per a la planificació i sol·licitud de vacances.", tag: "Permisos", meta: "PDF", views: 198, file: "Protocol Gestió Vacances 2026.pdf" },
    ],
  },
  {
    icon: Gift, iconColor: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/20",
    title: "Beneficis socials", desc: "Retribució flexible i assegurança de salut", docs: 4,
    sharepointUrl: SP_BASE + '%2FBeneficis%20socials',
    spFolderPath: 'Tavipedia/Beneficis socials',
    filters: ['Tots', 'Retribució Flexible', 'Salut'],
    documents: [
      { title: "Retribució Flexible Alan (CAT)", desc: "Guia de retribució flexible: menjar, transport, guarderia i altres beneficis.", tag: "Retribució Flexible", meta: "PDF", views: 312, file: "Alan Flex (CAT).pdf" },
      { title: "Retribución Flexible Alan (ESP)", desc: "Guía de retribución flexible: comida, transporte, guardería y otros beneficios.", tag: "Retribució Flexible", meta: "PDF", views: 278, file: "Alan Flex (ESP).pdf" },
      { title: "Assegurança de Salut (CAT)", desc: "Informació sobre la cobertura d'assegurança mèdica corporativa.", tag: "Salut", meta: "PDF", views: 256, file: "AssegurançaSalut.pdf" },
      { title: "Seguro de Salud (ESP)", desc: "Información sobre la cobertura de seguro médico corporativo.", tag: "Salut", meta: "PDF", views: 231, file: "SeguroSalud.pdf" },
    ],
  },
  {
    icon: BookOpen, iconColor: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20",
    title: "Manuals i procediments", desc: "Connexions remotes i seguretat vial per a desplaçaments", docs: 15,
    sharepointUrl: SP_BASE + '%2FManuals%20i%20procediments',
    spFolderPath: 'Tavipedia/Manuals i procediments',
    filters: ['Tots', 'Sistemes', 'Seguretat Vial'],
    documents: [
      { title: "Connexions Remotes (CAT)", desc: "Guia per connectar-se de forma remota als sistemes de TAVIL.", tag: "Sistemes", meta: "PDF", views: 467, file: "Connexions_Remotes_CAT.pdf" },
      { title: "Conexiones Remotas (ESP)", desc: "Guía para conectarse de forma remota a los sistemas de TAVIL.", tag: "Sistemes", meta: "PDF", views: 389, file: "Conexiones_Remotas_ESP.pdf" },
      { title: "Remote Connections (ENG)", desc: "Guide to connect remotely to TAVIL systems.", tag: "Sistemes", meta: "PDF", views: 201, file: "Remote_connections_ENG.pdf" },
      { title: "Seguretat Vial — Espanya (CAT)", desc: "Tríptic de seguretat vial per a desplaçaments a Espanya.", tag: "Seguretat Vial", meta: "PDF", views: 134, file: "Triptics Seguretat Vial/SEGURETAT VIAL/ESPANYA/Seguretat_Vial_ESPANYA_Català.pdf" },
      { title: "Seguridad Vial — España (ESP)", desc: "Tríptico de seguridad vial para desplazamientos en España.", tag: "Seguretat Vial", meta: "PDF", views: 128, file: "Triptics Seguretat Vial/SEGURETAT VIAL/ESPANYA/Seguretat_Vial_ESPANYA_Español.pdf" },
      { title: "Road Safety — Spain (ENG)", desc: "Road safety guide for travel in Spain.", tag: "Seguretat Vial", meta: "PDF", views: 87, file: "Triptics Seguretat Vial/SEGURETAT VIAL/ESPANYA/Seguretat_Vial_ESPANYA_Ingles.pdf" },
      { title: "Seguretat Vial — Europa (CAT)", desc: "Tríptic de seguretat vial per a desplaçaments per Europa.", tag: "Seguretat Vial", meta: "PDF", views: 112, file: "Triptics Seguretat Vial/SEGURETAT VIAL/EUROPA/Seguretat_Vial_EUROPA_Catala.pdf" },
      { title: "Road Safety — Europe (ENG)", desc: "Road safety guide for travel in Europe.", tag: "Seguretat Vial", meta: "PDF", views: 98, file: "Triptics Seguretat Vial/SEGURETAT VIAL/EUROPA/Seguretat_Vial_EUROPA_English.pdf" },
      { title: "Seguridad Vial — Europa (ESP)", desc: "Tríptico de seguridad vial para desplazamientos por Europa.", tag: "Seguretat Vial", meta: "PDF", views: 103, file: "Triptics Seguretat Vial/SEGURETAT VIAL/EUROPA/Seguretat_Vial_EUROPA_Español.pdf" },
      { title: "Seguretat Vial — Estats Units (CAT)", desc: "Tríptic de seguretat vial per a desplaçaments als EUA.", tag: "Seguretat Vial", meta: "PDF", views: 76, file: "Triptics Seguretat Vial/SEGURETAT VIAL/EEUU/Seguretat_vial_EstatsUnits_Català.pdf" },
      { title: "Road Safety — USA (ENG)", desc: "Road safety guide for travel in the United States.", tag: "Seguretat Vial", meta: "PDF", views: 82, file: "Triptics Seguretat Vial/SEGURETAT VIAL/EEUU/Seguretat_vial_EstatsUnits_Angles.pdf" },
      { title: "Seguridad Vial — EEUU (ESP)", desc: "Tríptico de seguridad vial para desplazamientos a EE. UU.", tag: "Seguretat Vial", meta: "PDF", views: 71, file: "Triptics Seguretat Vial/SEGURETAT VIAL/EEUU/Seguretat_vial_EstatsUnits_Español.pdf" },
      { title: "Seguretat Vial — Regne Unit (CAT)", desc: "Tríptic de seguretat vial per a desplaçaments al Regne Unit.", tag: "Seguretat Vial", meta: "PDF", views: 65, file: "Triptics Seguretat Vial/SEGURETAT VIAL/REGNE UNIT/Seguretat_Vial_Regne_Unit_Català.pdf" },
      { title: "Road Safety — United Kingdom (ENG)", desc: "Road safety guide for travel in the United Kingdom.", tag: "Seguretat Vial", meta: "PDF", views: 89, file: "Triptics Seguretat Vial/SEGURETAT VIAL/REGNE UNIT/Seguretat_Vial_Regne_Unit_Anglès.pdf" },
      { title: "Seguridad Vial — Reino Unido (ESP)", desc: "Tríptico de seguridad vial para desplazamientos al Reino Unido.", tag: "Seguretat Vial", meta: "PDF", views: 61, file: "Triptics Seguretat Vial/SEGURETAT VIAL/REGNE UNIT/Seguretat_Vial_Regne_Unit_Español.pdf" },
    ],
  },
  {
    icon: Shield, iconColor: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20",
    title: "Polítiques internes i protocols", desc: "Protocols d'actuació i plans d'igualtat i no-discriminació", docs: 7,
    sharepointUrl: SP_BASE + '%2FPol%C3%ADtiques%20internes%20i%20protocols',
    spFolderPath: 'Tavipedia/Politiques internes i protocols',
    filters: ['Tots', 'Igualtat', 'Assetjament', 'LGTBI'],
    documents: [
      { title: "Pla d'Igualtat TAVIL 2022", desc: "Mesures per garantir la igualtat de tracte i oportunitats a l'empresa.", tag: "Igualtat", meta: "PDF", views: 318, file: "PLA D'IGUALTAT TAVIL 2022_V2 (1).pdf" },
      { title: "Protocol Assetjament Sexual (CAT)", desc: "Protocol d'actuació davant situacions d'assetjament sexual.", tag: "Assetjament", meta: "PDF", views: 204, file: "Protocol assetjament sexual_Tavil_V2024CAT (1).pdf" },
      { title: "Protocolo Acoso Sexual (ESP)", desc: "Protocolo de actuación ante situaciones de acoso sexual.", tag: "Assetjament", meta: "PDF", views: 187, file: "Protocol assetjament sexual_Tavil_V2024ESP.pdf" },
      { title: "Protocol Assetjament Laboral (CAT)", desc: "Protocol d'actuació davant situacions d'assetjament laboral.", tag: "Assetjament", meta: "PDF", views: 231, file: "Protocol_AssatjamentLaboral_V2024CAT.pdf" },
      { title: "Protocolo Acoso Laboral (ESP)", desc: "Protocolo de actuación ante situaciones de acoso laboral.", tag: "Assetjament", meta: "PDF", views: 178, file: "Protocolo_AcosoLaboral_TAVIL_V2024ESP.pdf" },
      { title: "Protocol LGTBI TAVIL (CAT)", desc: "Protocol per a la protecció i inclusió de les persones LGTBI a l'empresa.", tag: "LGTBI", meta: "PDF", views: 265, file: "ProtocolAssetjamentLGTBI_TAVIL_CAT_V05032024.pdf" },
      { title: "Protocolo LGTBI TAVIL (ESP)", desc: "Protocolo para la protección e inclusión de las personas LGTBI en la empresa.", tag: "LGTBI", meta: "PDF", views: 241, file: "ProtocolAssetjamentLGTBI_TAVIL_ESP_V05032024.pdf" },
    ],
  },
  {
    icon: Building2, iconColor: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20",
    title: "Identitat", desc: "Recursos de marca, plantilles i materials corporatius", docs: 0,
    sharepointUrl: SP_BASE + '%2FIdentitat',
    spFolderPath: 'Tavipedia/Identitat',
    filters: ['Tots'],
    documents: [],
  },
];

function EspaiCorporatiuTab({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation();
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [espaiSearch, setEspaiSearch] = useState('');
  const isMobileEspai = useIsMobile();

  // Graph API state
  const [graphAccount, setGraphAccount] = useState(() => getGraphAccount());
  const [spFiles, setSpFiles] = useState<SPFile[] | null>(null);
  const [spLoading, setSpLoading] = useState(false);
  const [spError, setSpError] = useState<string | null>(null);

  // Init MSAL and detect post-redirect
  useEffect(() => {
    initGraph().then(account => {
      if (account) setGraphAccount(account);
    }).catch(() => {});
  }, []);

  // Fetch real files when entering a folder while authenticated
  useEffect(() => {
    if (!graphAccount || selectedCat === null) { setSpFiles(null); return; }
    const path = ESPAI_CATS[selectedCat].spFolderPath;
    setSpLoading(true);
    setSpError(null);
    setSpFiles(null);
    listGraphFolder(path)
      .then(files => { setSpFiles(files); setSpLoading(false); })
      .catch(err  => { setSpError(String(err)); setSpLoading(false); });
  }, [graphAccount, selectedCat]);

  const ftStyle = (meta: string): { bg: string; fg: string } => {
    const t = meta.split('·')[0].trim();
    if (t === 'PDF')  return { bg: '#fee2e2', fg: '#dc2626' };
    if (t === 'PPTX') return { bg: '#ffedd5', fg: '#ea580c' };
    if (t === 'DOCX') return { bg: '#dbeafe', fg: '#2563eb' };
    if (t === 'ZIP')  return { bg: '#fef9c3', fg: '#ca8a04' };
    if (t === 'HTML') return { bg: '#dcfce7', fg: '#16a34a' };
    return { bg: '#f4f4f5', fg: '#71717a' };
  };

  const [catFilter, setCatFilter] = useState('Tots');

  const cat = selectedCat !== null ? ESPAI_CATS[selectedCat] : null;

  const handleSelectCat = (i: number) => {
    if (selectedCat === i) { setSelectedCat(null); setCatFilter('Tots'); }
    else { setSelectedCat(i); setCatFilter('Tots'); }
  };

  const espaiSearchResults = espaiSearch
    ? ESPAI_CATS.flatMap(c => c.documents
        .filter(d => d.title.toLowerCase().includes(espaiSearch.toLowerCase()))
        .map(d => ({ ...d, catTitle: c.title })))
    : [];

  const visibleDocs = cat
    ? (catFilter === 'Tots' ? cat.documents : cat.documents.filter(d => d.tag === catFilter))
        .filter(d => !espaiSearch || d.title.toLowerCase().includes(espaiSearch.toLowerCase()))
    : [];

  // SP helpers
  const spFtStyle = (name: string): { bg: string; fg: string } => {
    const ext = name.split('.').pop()?.toUpperCase() ?? '';
    if (ext === 'PDF')  return { bg: '#fee2e2', fg: '#dc2626' };
    if (ext === 'PPTX' || ext === 'PPT') return { bg: '#ffedd5', fg: '#ea580c' };
    if (ext === 'DOCX' || ext === 'DOC') return { bg: '#dbeafe', fg: '#2563eb' };
    if (ext === 'XLSX' || ext === 'XLS') return { bg: '#dcfce7', fg: '#16a34a' };
    if (ext === 'ZIP'  || ext === 'RAR') return { bg: '#fef9c3', fg: '#ca8a04' };
    return { bg: '#f4f4f5', fg: '#71717a' };
  };
  const fmtSize = (b: number): string => b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;

  // ── Mobile ──────────────────────────────────────────────────────────────────
  if (isMobileEspai) {
    const allDocs = espaiSearch
      ? ESPAI_CATS.flatMap(c => c.documents.filter(d => d.title.toLowerCase().includes(espaiSearch.toLowerCase()) || c.title.toLowerCase().includes(espaiSearch.toLowerCase())).map(d => ({ ...d, section: c.title })))
      : [];
    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', pointerEvents: 'none' }}>Tavipedia</span>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{t('corporate.kicker')}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>Tavipedia</h1>
          <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('corporate.mobileSubtitle')}</p>
        </div>
        <div style={{ padding: '0 16px 16px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)', color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
          <input type="text" value={espaiSearch} onChange={e => setEspaiSearch(e.target.value)} placeholder={t('corporate.searchPlaceholder')}
            style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)', color: 'var(--tavil-text)', fontSize: 14, padding: '0 14px 0 40px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        {espaiSearch && allDocs.length > 0 ? (
          <div style={{ padding: '0 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{allDocs.length} resultat{allDocs.length !== 1 ? 's' : ''}</div>
            <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, overflow: 'hidden' }}>
              {allDocs.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < allDocs.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                  <div style={{ width: 38, height: 44, background: 'var(--tavil-bg)', border: '1px solid var(--tavil-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--tavil-accent)', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.04em' }}>{doc.tag.slice(0, 4).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.3 }}>{doc.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>{doc.meta} · {doc.section}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '0 16px 20px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>CATEGORIES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {ESPAI_CATS.map((c, i) => (
                  <div key={i} onClick={() => handleSelectCat(i)} style={{
                    background: 'var(--tavil-card)', border: `1px solid ${selectedCat === i ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                    borderRadius: 10, padding: '10px 6px 8px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--tavil-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <c.icon size={15} style={{ color: 'var(--tavil-muted)' }} />
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.2, marginBottom: 2 }}>{c.title.split(' ')[0]}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--tavil-faint)' }}>{c.docs} docs</div>
                  </div>
                ))}
              </div>
            </div>
            {(selectedCat !== null ? [ESPAI_CATS[selectedCat]] : ESPAI_CATS).map((c, ci) => {
              const catIdx = selectedCat !== null ? selectedCat : ci;
              const isLoading = spLoading && selectedCat === catIdx;
              const files = (selectedCat === catIdx && spFiles !== null) ? spFiles.filter(f => !f.folder) : null;
              return (
                <div key={ci} style={{ padding: '0 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{c.title.toUpperCase()}</div>
                    <a href={c.sharepointUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--tavil-accent)', textDecoration: 'none', padding: '4px 8px', borderRadius: 8, background: 'rgba(220,38,38,0.07)' }}>
                      <ExternalLink size={14} /> SharePoint
                    </a>
                  </div>
                  <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, overflow: 'hidden' }}>
                    {isLoading ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tavil-faint)', fontSize: 13 }}>Carregant…</div>
                    ) : files !== null ? files.map((f, fi) => {
                      const ext = f.name.split('.').pop()?.toUpperCase() ?? '';
                      const { bg, fg } = spFtStyle(f.name);
                      return (
                        <a key={fi} href={f.webUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: fi < files.length - 1 ? '1px solid var(--tavil-border)' : 'none', textDecoration: 'none' }}>
                          <div style={{ width: 38, height: 44, background: bg, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                            <FileText size={14} style={{ color: fg }} />
                            <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{ext}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/\.[^.]+$/, '')}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)' }}>{fmtSize(f.size)}</div>
                          </div>
                          <ExternalLink size={14} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                        </a>
                      );
                    }) : c.documents.map((doc, di) => {
                      const parts = doc.meta.split('·').map((s: string) => s.trim());
                      const type = parts[0];
                      const size = parts[1] ?? '';
                      const { bg, fg } = ftStyle(doc.meta);
                      return (
                        <a key={di} href={doc.file ? spFileUrl(c.spFolderPath, doc.file) : c.sharepointUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: di < c.documents.length - 1 ? '1px solid var(--tavil-border)' : 'none', textDecoration: 'none' }}>
                          <div style={{ width: 38, height: 44, background: bg, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                            <FileText size={14} style={{ color: fg }} />
                            <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{type}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.3, marginBottom: 2 }}>{doc.title}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)' }}>{size} · {doc.views} visualitzacions</div>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // ── Desktop ──────────────────────────────────────────────────────────────────
  const fmtDate = (d: string): string => new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('corporate.knowledgeBase')}</p>
        {graphAccount ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
              <CheckCircle size={13} /> {graphAccount.username}
            </span>
            <button onClick={() => graphLogout().catch(console.error)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Desconnectar</button>
          </div>
        ) : (
          <button onClick={() => graphLogin().catch(console.error)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-3 py-1.5 rounded-lg transition-colors">
            <Globe size={13} /> Connectar amb SharePoint
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" value={espaiSearch} onChange={e => setEspaiSearch(e.target.value)} placeholder={t('corporate.searchPlaceholderFull')} className="w-full max-w-lg bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm outline-none dark:text-white" />
      </div>

      {espaiSearchResults.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-3">{espaiSearchResults.length} resultat{espaiSearchResults.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {espaiSearchResults.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.title}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{d.catTitle} · {d.meta}</p>
                </div>
                <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-2 py-0.5 rounded">{d.tag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {ESPAI_CATS.map((c, i) => (
          <div key={i} onClick={() => handleSelectCat(i)}
            className={cn("hover-lift bg-white dark:bg-zinc-900 rounded-xl border-2 p-5 cursor-pointer group", selectedCat === i ? "border-red-500 shadow-md" : "border-gray-100 dark:border-zinc-800")}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", c.bg)}>
              <c.icon size={20} className={c.iconColor} />
            </div>
            <h3 className={cn("font-semibold text-sm mb-2 transition-colors", selectedCat === i ? "text-red-600" : "text-gray-900 dark:text-white")}>{c.title}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 leading-relaxed">{c.desc}</p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-400 font-medium">{c.docs} documents</p>
            </div>
          </div>
        ))}
      </div>

      {cat ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3 mb-4">
            {spFiles === null && cat.filters.map(f => (
              <FilterChip key={f} label={f} active={catFilter === f} onClick={() => setCatFilter(f)} />
            ))}
            {spFiles !== null && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle size={12} /> SharePoint en directe
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-zinc-400">
              {spFiles !== null ? spFiles.filter(f => !f.folder).length : visibleDocs.length} documents
            </span>
            <a href={cat.sharepointUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60">
              <ExternalLink size={14} /> Obrir a SharePoint
            </a>
          </div>

          {spLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
              <span className="text-sm">Carregant des de SharePoint…</span>
            </div>
          ) : spError ? (
            <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
              <AlertTriangle size={20} className="text-amber-400" />
              <p className="text-sm">{spError}</p>
              <button onClick={() => { setSpError(null); setSpLoading(true); listGraphFolder(cat.spFolderPath).then(f => { setSpFiles(f); setSpLoading(false); }).catch(e => { setSpError(String(e)); setSpLoading(false); }); }} className="text-xs text-red-600 hover:underline">Reintentar</button>
            </div>
          ) : spFiles !== null ? (
            <div className="space-y-1">
              {spFiles.filter(f => !f.folder).map((f, i) => {
                const ext = f.name.split('.').pop()?.toUpperCase() ?? 'FILE';
                const { bg, fg } = spFtStyle(f.name);
                return (
                  <a key={i} href={f.webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors no-underline anim-item" style={{ '--i': i } as React.CSSProperties}>
                    <div className="w-9 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 flex-shrink-0" style={{ background: bg }}>
                      <FileText size={15} style={{ color: fg }} />
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{ext}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name.replace(/\.[^.]+$/, '')}</p>
                      <p className="text-xs text-gray-400">{fmtSize(f.size)} · {fmtDate(f.lastModifiedDateTime)}</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {visibleDocs.map((doc, i) => {
                const { bg, fg } = ftStyle(doc.meta);
                return (
                  <a key={i} href={doc.file ? spFileUrl(cat.spFolderPath, doc.file) : cat.sharepointUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors anim-item no-underline" style={{ '--i': i } as React.CSSProperties}>
                    <div className="w-9 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 flex-shrink-0" style={{ background: bg }}>
                      <FileText size={15} style={{ color: fg }} />
                      <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{doc.meta.split('·')[0].trim()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{doc.title}</p>
                      <p className="text-xs text-gray-400 truncate">{doc.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{doc.meta} · {doc.views} visualitzacions</p>
                    </div>
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-700 text-gray-500 px-2 py-0.5 rounded">{doc.tag}</span>
                    <ExternalLink size={14} className="text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} className="text-amber-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('corporate.featuredDocuments')}</h3>
            <a href={SP_BASE} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
              <ExternalLink size={13} /> {t('corporate.openTavipedia')}
            </a>
          </div>
          <div className="space-y-1">
            {[
              { icon: FileText, color: "text-blue-500", title: "Protocol d'acollida (onboarding)", desc: "Guia completa per als nous treballadors...", meta: "PDF · 2.4 MB · 342 visualitzacions" },
              { icon: Shield, color: "text-purple-500", title: "Reglament de règim intern", desc: "Normativa interna que regula la convivència, els horaris i els permisos...", meta: "PDF · 1.8 MB · 518 visualitzacions" },
              { icon: AlertTriangle, color: "text-red-500", title: "Guia de seguretat i prevenció de riscos", desc: "Manual de prevenció de riscos laborals per a TAVIL.", meta: "PDF · 3.1 MB · 287 visualitzacions" },
              { icon: Building2, color: "text-green-500", title: "Política de viatges corporatius", desc: "Normes per a la reserva de viatges, allotjaments i dietes.", meta: "PDF · 890 KB · 195 visualitzacions" },
              { icon: Mail, color: "text-amber-500", title: "Manual de connexió a la xarxa interna", desc: "Pas a pas per connectar-se a la VPN i el correu corporatiu.", meta: "PDF · 1.2 MB · 421 visualitzacions" },
            ].map((doc, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <doc.icon size={15} className={doc.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{doc.title}</p>
                  <p className="text-xs text-gray-400 truncate">{doc.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{doc.meta}</p>
                </div>
                <Download size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



// ── Veu de l'Empleat Tab ──────────────────────────────────────────────────────

function VeuEmpleatTab({ currentUser, initialSubTab, onSubTabConsumed, onBack }: { currentUser: User | null; initialSubTab?: string | null; onSubTabConsumed?: () => void; onBack?: () => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = usePersistedSubTab<string>('veu', initialSubTab ?? 'Suggeriments', ['Suggeriments', 'Incidències', 'Enquestes'] as const);

  useEffect(() => {
    if (initialSubTab) { setActiveTab(initialSubTab); onSubTabConsumed?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubTab]);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');
  const [isAnon, setIsAnon] = useState(true);
  const [suggSubmitting, setSuggSubmitting] = useState(false);
  const [suggSuccess, setSuggSuccess] = useState(false);

  // Incidències state
  const [incidencies, setIncidencies] = useState<Incidencia[]>([]);
  const [incTitle, setIncTitle] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incArea, setIncArea] = useState('');
  const [incPriority, setIncPriority] = useState('');
  const [incSubmitting, setIncSubmitting] = useState(false);
  const [incSuccess, setIncSuccess] = useState(false);

  // RRHH admin state — suggestions
  const [suggAdminOpen, setSuggAdminOpen] = useState<number | null>(null);
  const [suggAdminStatus, setSuggAdminStatus] = useState('');
  const [suggAdminResponse, setSuggAdminResponse] = useState('');
  const [suggAdminSaving, setSuggAdminSaving] = useState(false);

  // RRHH admin state — incidencies
  const [incAdminOpen, setIncAdminOpen] = useState<number | null>(null);
  const [incAdminStatus, setIncAdminStatus] = useState('');
  const [incAdminAssigned, setIncAdminAssigned] = useState('');
  const [incAdminResolution, setIncAdminResolution] = useState('');
  const [incAdminSaving, setIncAdminSaving] = useState(false);

  // Confirm delete modal for Veu items (mobile and desktop)
  const [confirmVeuDelete, setConfirmVeuDelete] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const isRrhhOrAdmin = ['Administrador', 'Administrador/a', 'Recursos humans', 'SolicitudsVacances', 'SolicitudsDissabtes'].some(x => x === (currentUser?.role ?? '') || (currentUser?.roles ?? []).includes(x));

  const openSuggAdmin = (sug: Suggestion) => {
    setSuggAdminOpen(sug.id);
    setSuggAdminStatus(sug.status);
    setSuggAdminResponse(sug.response || '');
  };

  const saveSuggAdmin = async (id: number) => {
    setSuggAdminSaving(true);
    try {
      await apiUpdateSuggestionStatus(id, suggAdminStatus);
      if (suggAdminResponse.trim()) await apiAddSuggestionResponse(id, suggAdminResponse.trim());
      setSuggestions(await apiGetSuggestions());
      setSuggAdminOpen(null);
    } catch (e) { console.error(e); }
    finally { setSuggAdminSaving(false); }
  };

  const openIncAdmin = (inc: Incidencia) => {
    setIncAdminOpen(inc.id);
    setIncAdminStatus(inc.status);
    setIncAdminAssigned(inc.assigned_to || '');
    setIncAdminResolution(inc.resolution || '');
  };

  const saveIncAdmin = async (id: number) => {
    setIncAdminSaving(true);
    try {
      await apiUpdateIncidenciaStatus(id, incAdminStatus, incAdminAssigned, incAdminResolution);
      setIncidencies(await apiGetIncidencies());
      setIncAdminOpen(null);
    } catch (e) { console.error(e); }
    finally { setIncAdminSaving(false); }
  };

  // Enquestes state
  const [enquestes, setEnquestes] = useState<Enquesta[]>([]);
  const [enquestesError, setEnquestesError] = useState<string | null>(null);

  const fetchAll = () => {
    apiGetSuggestions().then(setSuggestions).catch(console.error);
    apiGetIncidencies().then(setIncidencies).catch(console.error);
    apiGetEnquestes().then(setEnquestes).catch(console.error);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const statusTagColor = (label: string) => {
    if (label === 'Acceptada') return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400';
    if (label === 'En revisió') return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
    if (label === 'Pendent') return 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
  };
  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      'Acceptada': t('veu.status.accepted'), 'En revisió': t('veu.status.inReview'),
      'Pendent': t('veu.status.pending'), 'Resolta': t('veu.status.resolved'),
      'En gestió': t('veu.status.inManagement'), 'Oberta': t('veu.status.open'),
    };
    return map[s] ?? s;
  };

  const catTagColor = () => 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400';

  const incStatusColor = (s: string) =>
    s === 'Resolta' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
    : s === 'En gestió' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    : s === 'Oberta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400';

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleVote = async (id: number, voteType: 'up' | 'down') => {
    try {
      await apiVoteSuggestion(id, voteType);
      const updated = await apiGetSuggestions();
      setSuggestions(updated);
    } catch (e) {
      console.error('Error voting:', e);
    }
  };

  const handleSuggSubmit = async () => {
    if (!newTitle.trim() || !newCat) return;
    setSuggSubmitting(true);
    try {
      await apiCreateSuggestion(newTitle.trim(), newDesc.trim(), newCat, isAnon);
      const updated = await apiGetSuggestions();
      setSuggestions(updated);
      setNewTitle(''); setNewDesc(''); setNewCat(''); setIsAnon(true);
      setSuggSuccess(true);
      setTimeout(() => setSuggSuccess(false), 3000);
    } catch (e) {
      console.error('Error creating suggestion:', e);
    } finally {
      setSuggSubmitting(false);
    }
  };

  const handleIncSubmit = async () => {
    if (!incTitle.trim() || !incArea || !incPriority) return;
    setIncSubmitting(true);
    try {
      await apiCreateIncidencia(incTitle.trim(), incDesc.trim(), incArea, incPriority);
      const updated = await apiGetIncidencies();
      setIncidencies(updated);
      setIncTitle(''); setIncDesc(''); setIncArea(''); setIncPriority('');
      setIncSuccess(true);
      setTimeout(() => setIncSuccess(false), 3000);
    } catch (e) {
      console.error('Error creating incidencia:', e);
    } finally {
      setIncSubmitting(false);
    }
  };

  const isMobileVeu = useIsMobile();

  const handleRespondre = async (id: number) => {
    try {
      await apiRespondreEnquesta(id);
      const updated = await apiGetEnquestes();
      setEnquestes(updated);
    } catch (e) {
      console.error('Error responding enquesta:', e);
      setEnquestesError(e instanceof Error ? e.message : 'Error en respondre l\'enquesta');
      setTimeout(() => setEnquestesError(null), 4000);
    }
  };

  const [mobileVeuForm, setMobileVeuForm] = useState<'sugg' | 'inc' | null>(null);
  const [veuClosing, setVeuClosing] = useState(false);
  const closeMobileVeuForm = () => { setVeuClosing(true); setTimeout(() => { setMobileVeuForm(null); setVeuClosing(false); }, 220); };
  // Hide bottom nav when voice forms open
  useEffect(() => { setGlobalNavHidden(!!mobileVeuForm); }, [mobileVeuForm]);

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobileVeu) {
    const tabs = [
      { key: 'Suggeriments', label: 'Suggeriments' },
      { key: 'Incidències', label: 'Incidències' },
    ];
    const statusStyleInline = (label: string): React.CSSProperties => {
      if (label === 'Acceptada') return { background: '#dcfce7', color: '#15803d' };
      if (label === 'En revisió') return { background: '#ffedd5', color: '#c2410c' };
      if (label === 'Pendent') return { background: 'var(--tavil-border)', color: 'var(--tavil-muted)' };
      return { background: '#dbeafe', color: '#1d4ed8' };
    };
    const incStatusInline = (s: string): React.CSSProperties => {
      if (s === 'Resolta') return { background: '#dcfce7', color: '#15803d' };
      if (s === 'En gestió') return { background: '#dbeafe', color: '#1d4ed8' };
      if (s === 'Oberta') return { background: '#fef3c7', color: '#b45309' };
      return { background: 'var(--tavil-border)', color: 'var(--tavil-muted)' };
    };

    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar: back + centered title */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', pointerEvents: 'none' }}>Veu Empleat</span>
        </div>
        {/* Header kicker + title + subtitle */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Personal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>Veu Empleat</h1>
          <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('veu.subtitle')}</p>
        </div>
        {/* Pill tabs */}
        <div data-no-swipe style={{ padding: '4px 16px 16px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-sb">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: activeTab === tab.key ? 'var(--tavil-text)' : 'var(--tavil-card)',
              color: activeTab === tab.key ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
              border: `1px solid ${activeTab === tab.key ? 'var(--tavil-text)' : 'var(--tavil-border)'}`,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'inherit', flexShrink: 0,
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Suggeriments */}
        {activeTab === 'Suggeriments' && (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.length === 0 && <p style={{ fontSize: 13, color: 'var(--tavil-faint)', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>Encara no hi ha suggeriments en aquesta categoria.</p>}
            {suggestions.map((s, i) => (
              <div key={i} className="anim-item" style={{ '--i': i, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, padding: '14px 14px' } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {s.category && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#dbeafe', color: '#1d4ed8', marginBottom: 5, display: 'inline-block' }}>{s.category}</span>}
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.25, marginTop: 3 }}>{s.title}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, flexShrink: 0, ...statusStyleInline(s.status) }}>{s.status}</span>
                </div>
                {s.description && <p style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginBottom: 10, lineHeight: 1.4 }}>{s.description}</p>}
                {s.response && (
                  <div style={{ background: 'var(--tavil-red-tint, #f9eceb)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, border: '1px solid rgba(191,33,30,0.15)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tavil-accent)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resposta RRHH</div>
                    <p style={{ fontSize: 12.5, color: 'var(--tavil-muted)' }}>{s.response}</p>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)' }}>
                    {s.anonymous ? 'Anònim' : s.author} · {formatDate(s.created_at)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => handleVote(s.id, 'up')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: s.user_vote === 'up' ? 'var(--tavil-accent)' : 'var(--tavil-muted)', background: 'var(--tavil-bg)', border: `1px solid ${s.user_vote === 'up' ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ThumbsUp size={13} /> {s.votes}
                    </button>
                    <button onClick={() => handleVote(s.id, 'down')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: s.user_vote === 'down' ? '#3b82f6' : 'var(--tavil-muted)', background: 'var(--tavil-bg)', border: `1px solid ${s.user_vote === 'down' ? '#3b82f6' : 'var(--tavil-border)'}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ThumbsDown size={13} />
                    </button>
                    {(isRrhhOrAdmin || s.user_id === currentUser?.id) && (
                      <button onClick={() => setConfirmVeuDelete({ message: t('news.confirmDelete'), onConfirm: async () => { setConfirmVeuDelete(null); await apiDeleteSuggestion(s.id); setSuggestions(await apiGetSuggestions()); } })} style={{ background: 'none', border: 'none', color: 'var(--tavil-accent)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                {isRrhhOrAdmin && (
                  <div style={{ paddingTop: 10, marginTop: 10, borderTop: '1px solid var(--tavil-border)' }}>
                    <button onClick={() => openSuggAdmin(s)} style={{ fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      Gestionar →
                    </button>
                    {suggAdminOpen === s.id && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select value={suggAdminStatus} onChange={e => setSuggAdminStatus(e.target.value)} style={{ borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '6px 10px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit' }}>
                          {['Pendent','En revisió','Acceptada','Rebutjada'].map(s => <option key={s}>{s}</option>)}
                        </select>
                        <textarea value={suggAdminResponse} onChange={e => setSuggAdminResponse(e.target.value)} placeholder="Resposta (opcional)" rows={2} style={{ borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '8px 10px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setSuggAdminOpen(null)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                          <button onClick={() => saveSuggAdmin(s.id)} disabled={suggAdminSaving} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--tavil-accent)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{suggAdminSaving ? 'Desant...' : 'Desar'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Incidències */}
        {activeTab === 'Incidències' && (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidencies.length === 0 && <p style={{ fontSize: 13, color: 'var(--tavil-faint)', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>Cap incidència registrada. Ben fet.</p>}
            {incidencies.map((inc, i) => (
              <div key={i} className="anim-item" style={{ '--i': i, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties}>
                <div style={{ height: 4, background: inc.status === 'Resolta' ? '#22c55e' : inc.status === 'En gestió' ? '#3b82f6' : '#f59e0b' }} />
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {inc.area && <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'var(--tavil-border)', color: 'var(--tavil-muted)', marginBottom: 5, display: 'inline-block' }}>{inc.area}</span>}
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.25, marginTop: 3 }}>{inc.title}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, flexShrink: 0, ...incStatusInline(inc.status) }}>{inc.status}</span>
                  </div>
                  {inc.description && <p style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginBottom: 8, lineHeight: 1.4 }}>{inc.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: inc.priority ? 6 : 0 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)' }}>
                      {inc.author} · {formatDate(inc.created_at)}
                      {inc.priority && <span style={{ marginLeft: 8, fontWeight: 600 }}>Prioritat: {inc.priority}</span>}
                    </div>
                    {(isRrhhOrAdmin || inc.user_id === currentUser?.id) && (
                      <button onClick={() => setConfirmVeuDelete({ message: t('veu.incidents') + ' — ' + t('news.confirmDelete'), onConfirm: async () => { setConfirmVeuDelete(null); await apiDeleteIncidencia(inc.id); setIncidencies(await apiGetIncidencies()); } })} style={{ background: 'none', border: 'none', color: 'var(--tavil-accent)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                    )}
                  </div>
                  {isRrhhOrAdmin && (
                    <div style={{ paddingTop: 10, marginTop: 6, borderTop: '1px solid var(--tavil-border)' }}>
                      <button onClick={() => openIncAdmin(inc)} style={{ fontSize: 12, color: 'var(--tavil-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        Gestionar →
                      </button>
                      {incAdminOpen === inc.id && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <select value={incAdminStatus} onChange={e => setIncAdminStatus(e.target.value)} style={{ borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '6px 10px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit' }}>
                            {['Oberta','En gestió','Resolta'].map(s => <option key={s}>{s}</option>)}
                          </select>
                          <input type="text" value={incAdminAssigned} onChange={e => setIncAdminAssigned(e.target.value)} placeholder="Assignat a" style={{ borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '6px 10px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                          <textarea value={incAdminResolution} onChange={e => setIncAdminResolution(e.target.value)} placeholder="Resolució" rows={2} style={{ borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '8px 10px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setIncAdminOpen(null)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                            <button onClick={() => saveIncAdmin(inc.id)} disabled={incAdminSaving} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--tavil-accent)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{incAdminSaving ? 'Desant...' : 'Desar'}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAB — hidden when creation form is open */}
        {!mobileVeuForm && createPortal(
          <button
            onClick={() => setMobileVeuForm(activeTab === 'Suggeriments' ? 'sugg' : 'inc')}
            style={{
              position: 'fixed', bottom: 90, right: 20, width: 52, height: 52,
              borderRadius: 26, background: 'var(--tavil-accent)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(191,33,30,0.35)', zIndex: 9000,
            }}
          ><Plus size={22} /></button>,
          document.body
        )}

        {/* New suggestion form */}
        {mobileVeuForm === 'sugg' && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${veuClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeMobileVeuForm}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', width: '100%', maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }} className={veuClosing ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--tavil-text)', marginBottom: 16 }}>Nou suggeriment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Títol *" style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Categoria *</option>
                  {['Millora operativa','Benestar laboral','Tecnologia','Cultura i valors','Altres'].map(c => <option key={c}>{c}</option>)}
                </select>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripció" rows={3} style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--tavil-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} />
                  Enviar de forma anònima
                </label>
                {suggSuccess && <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Suggeriment enviat!</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={closeMobileVeuForm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                  <button onClick={async () => { await handleSuggSubmit(); closeMobileVeuForm(); }} disabled={!newTitle.trim() || !newCat || suggSubmitting} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!newTitle.trim() || !newCat || suggSubmitting) ? 0.5 : 1 }}>
                    {suggSubmitting ? t('common.sending') : t('common.send')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* New incidència form */}
        {mobileVeuForm === 'inc' && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${veuClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeMobileVeuForm}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 80px)', width: '100%', maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }} className={veuClosing ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--tavil-text)', marginBottom: 16 }}>Nova incidència</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" value={incTitle} onChange={e => setIncTitle(e.target.value)} placeholder="Títol *" style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <select value={incArea} onChange={e => setIncArea(e.target.value)} style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Àrea *</option>
                  {['IT','Instal·lacions','RRHH','Seguretat','Altres'].map(a => <option key={a}>{a}</option>)}
                </select>
                <select value={incPriority} onChange={e => setIncPriority(e.target.value)} style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Prioritat *</option>
                  {['Baixa','Normal','Alta','Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
                <textarea value={incDesc} onChange={e => setIncDesc(e.target.value)} placeholder="Descripció" rows={3} style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
                {incSuccess && <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Incidència enviada!</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={closeMobileVeuForm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                  <button onClick={async () => { await handleIncSubmit(); closeMobileVeuForm(); }} disabled={!incTitle.trim() || !incArea || !incPriority || incSubmitting} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!incTitle.trim() || !incArea || !incPriority || incSubmitting) ? 0.5 : 1 }}>
                    {incSubmitting ? t('common.sending') : t('common.send')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
        {confirmVeuDelete && <ConfirmModal message={confirmVeuDelete.message} onConfirm={confirmVeuDelete.onConfirm} onCancel={() => setConfirmVeuDelete(null)} />}
      </div>
    );
  }

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('veu.subtitle')}</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {[
          { key: 'Suggeriments', label: t('veu.suggestions') },
          { key: 'Incidències', label: t('veu.incidents') },
        ].map(tab => (
          <UnderlineTab key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
        ))}
      </div>

      <div key={activeTab} className="anim-tab">

      {/* ── Suggeriments ── */}
      {activeTab === 'Suggeriments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">{t('veu.recentSuggestions', { count: suggestions.length })}</h3>
            <div className="space-y-3">
              {suggestions.map(sug => (
                <div key={sug.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1">
                      <button
                        onClick={() => handleVote(sug.id, 'up')}
                        title={t('veu.upvote')}
                        className={cn("p-1 rounded transition-colors", sug.user_vote === 'up' ? "text-red-600 bg-red-50 dark:bg-red-950/20" : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20")}
                      ><ThumbsUp size={14} /></button>
                      <span className={cn("text-sm font-bold leading-none", sug.votes > 0 ? "text-red-600" : sug.votes < 0 ? "text-blue-600" : "text-gray-500 dark:text-zinc-400")}>{sug.votes}</span>
                      <button
                        onClick={() => handleVote(sug.id, 'down')}
                        title={t('veu.downvote')}
                        className={cn("p-1 rounded transition-colors", sug.user_vote === 'down' ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20")}
                      ><ThumbsDown size={14} /></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{sug.title}</p>
                      {sug.description && <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">{sug.description}</p>}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", catTagColor())}>{sug.category}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusTagColor(sug.status))}>{statusLabel(sug.status)}</span>
                      </div>
                      {sug.response && (
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-zinc-400"><span className="font-semibold">Resposta:</span> {sug.response}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center self-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-zinc-500 italic">{sug.anonymous ? t('veu.anonymous_label') : sug.author}</span>
                      {isRrhhOrAdmin && (
                        <button onClick={() => suggAdminOpen === sug.id ? setSuggAdminOpen(null) : openSuggAdmin(sug)} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors">{t('veu.manage')}</button>
                      )}
                    </div>
                  </div>
                  {isRrhhOrAdmin && suggAdminOpen === sug.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                      <select value={suggAdminStatus} onChange={e => setSuggAdminStatus(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
                        <option>Pendent</option>
                        <option>En revisió</option>
                        <option>Acceptada</option>
                        <option>Denegada</option>
                      </select>
                      <textarea value={suggAdminResponse} onChange={e => setSuggAdminResponse(e.target.value)} placeholder="Resposta (opcional)" rows={2} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white resize-none" />
                      <button onClick={() => saveSuggAdmin(sug.id)} disabled={suggAdminSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                        {suggAdminSaving ? 'Desant...' : 'Desar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={15} className="text-gray-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Nou suggeriment</h3>
            </div>
            {suggSuccess && (
              <div className="mb-3 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                <CheckCircle size={13} /> Suggeriment enviat correctament.
              </div>
            )}
            <div className="space-y-3">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Títol del suggeriment" className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
              <div>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value.slice(0, 1000))} placeholder="Descriu la teva proposta amb detall..." rows={5} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none" />
                <p className="text-[10px] text-gray-400 text-right">{newDesc.length}/1000</p>
              </div>
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none dark:bg-zinc-800 dark:text-white">
                <option value="">Categoria</option>
                <option>Instal·lacions</option>
                <option>Sostenibilitat</option>
                <option>Benestar</option>
                <option>Organització</option>
              </select>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">Enviar de forma anònima</span>
                <button onClick={() => setIsAnon(!isAnon)} className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", isAnon ? "bg-red-600" : "bg-gray-200 dark:bg-zinc-700")}>
                  <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform" style={{ transform: isAnon ? 'translateX(18px)' : 'translateX(2px)' }} />
                </button>
              </div>
              <p className="text-[11px] text-red-600">L'equip de RRHH revisa els suggeriments setmanalment.</p>
              <button onClick={handleSuggSubmit} disabled={!newTitle.trim() || !newCat || suggSubmitting} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Send size={14} /> Enviar suggeriment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Incidències ── */}
      {activeTab === 'Incidències' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Incidències registrades ({incidencies.length})</h3>
            <div className="space-y-3">
              {incidencies.map(inc => (
                <div key={inc.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{inc.title}</p>
                      <p className="text-xs text-gray-400 mb-2">
                        {formatDate(inc.created_at)} · Prioritat: {inc.priority}
                        {inc.assigned_to && ` · Assignat a: ${inc.assigned_to}`}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400')}>{inc.area}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", incStatusColor(inc.status))}>{statusLabel(inc.status)}</span>
                      </div>
                      {inc.resolution && <div className="mt-2 bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-xs text-gray-600 dark:text-zinc-400"><span className="font-semibold">Resolució:</span> {inc.resolution}</div>}
                      {isRrhhOrAdmin && (
                        <button onClick={() => incAdminOpen === inc.id ? setIncAdminOpen(null) : openIncAdmin(inc)} className="mt-2 text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors">Gestionar</button>
                      )}
                      {isRrhhOrAdmin && incAdminOpen === inc.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                          <select value={incAdminStatus} onChange={e => setIncAdminStatus(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
                            <option>Oberta</option>
                            <option>En gestió</option>
                            <option>Resolta</option>
                            <option>Tancada</option>
                          </select>
                          <input type="text" value={incAdminAssigned} onChange={e => setIncAdminAssigned(e.target.value)} placeholder="Assignat a (nom)" className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                          <textarea value={incAdminResolution} onChange={e => setIncAdminResolution(e.target.value)} placeholder="Resolució (opcional)" rows={2} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white resize-none" />
                          <button onClick={() => saveIncAdmin(inc.id)} disabled={incAdminSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                            {incAdminSaving ? 'Desant...' : 'Desar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
            <div className="flex items-center gap-2 mb-4"><AlertTriangle size={15} className="text-orange-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Nova incidència</h3></div>
            {incSuccess && (
              <div className="mb-3 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                <CheckCircle size={13} /> Incidència registrada correctament.
              </div>
            )}
            <div className="space-y-3">
              <input type="text" value={incTitle} onChange={e => setIncTitle(e.target.value)} placeholder="Títol de la incidència" className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
              <textarea value={incDesc} onChange={e => setIncDesc(e.target.value)} placeholder="Descriu la incidència, ubicació i detalls rellevants..." rows={4} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none" />
              <select value={incArea} onChange={e => setIncArea(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none dark:bg-zinc-800 dark:text-white">
                <option value="">Àrea afectada</option>
                <option>Instal·lacions</option>
                <option>Equipament</option>
                <option>Sistemes</option>
                <option>Seguretat</option>
              </select>
              <select value={incPriority} onChange={e => setIncPriority(e.target.value)} className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none dark:bg-zinc-800 dark:text-white">
                <option value="">Prioritat</option>
                <option>Baixa</option>
                <option>Mitjana</option>
                <option>Alta</option>
              </select>
              <p className="text-[11px] text-gray-400">Les incidències s'identifiquen amb el teu perfil per facilitar-ne el seguiment.</p>
              <button onClick={handleIncSubmit} disabled={!incTitle.trim() || !incArea || !incPriority || incSubmitting} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Send size={14} /> Registrar incidència
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enquestes ── */}
      {activeTab === 'Enquestes' && (
        <div className="space-y-4">
          {enquestesError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2 text-xs">
              <AlertTriangle size={13} className="flex-shrink-0" /> {enquestesError}
            </div>
          )}
          {enquestes.map(enc => {
            const isCompleted = enc.user_completed || enc.status === 'Completada';
            const isClosed = enc.status === 'Tancada';
            const isAvailable = enc.status === 'Disponible' && !isCompleted;
            const pct = enc.total > 0 ? Math.round((enc.responses / enc.total) * 100) : 0;
            const scColor = isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : isClosed ? 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
              : 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400';
            const displayStatus = isCompleted && enc.status !== 'Tancada' ? 'Completada' : enc.status;
            return (
              <div key={enc.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <FileText size={15} className="text-gray-400 flex-shrink-0" />
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{enc.title}</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      {enc.questions} preguntes · Termini: {formatDate(enc.deadline)} · Creada per: {enc.creator} · <span className="font-medium">{enc.responses}/{enc.total} respostes ({pct}%)</span>
                    </p>
                    <div className="w-full max-w-xs bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded", scColor)}>{displayStatus}</span>
                    {isAvailable && (
                      <button onClick={() => handleRespondre(enc.id)} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
                        Respondre <ArrowRight size={13} />
                      </button>
                    )}
                    {isCompleted && !isClosed && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={14} /><span>Resposta enviada</span>
                      </div>
                    )}
                    {isClosed && (
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock size={14} /><span>Tancada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      {confirmVeuDelete && <ConfirmModal message={confirmVeuDelete.message} onConfirm={confirmVeuDelete.onConfirm} onCancel={() => setConfirmVeuDelete(null)} />}
    </div>
  );
}

// ── Solicituds Tab ────────────────────────────────────────────────────────────

const VAC_PERIODS = [
  { idx: 1, color: 'bg-pink-400',   dates: '01 Feb – 31 Maig',           dies: 'Mínim 8',  sol: '07 Gen – 30 Gen', conf: '13 Feb – 27 Feb' },
  { idx: 2, color: 'bg-green-400',  dates: '01 Juny – 10 Set',           dies: 'Màxim 15', sol: '04 Maig – 18 Maig', conf: '25 Maig – 5 Juny' },
  { idx: 3, color: 'bg-orange-400', dates: '14 Set – 30 Nov',            dies: 'Mínim 5',  sol: '01 Set – 10 Set',  conf: '21 Set – 5 Oct' },
  { idx: 4, color: 'bg-yellow-400', dates: '7 Des · 21 Des – 31 Des',    dies: 'Màxim 5',  sol: '02 Nov – 13 Nov',  conf: '23 Nov – 04 Des' },
];

const VAC_CLARIFICATIONS = [
  "Els dies sense marcar (en blanc) al calendari són dies que l'empresa ha decidit que NO es pot fer vacances.",
  "El mes de gener-2026 es poden realitzar els dies pendents del 2025.",
  "Durant les vacances de Nadal (període groc) s'han de fer setmanes completes: setmana de Nadal o setmana de Cap d'any (4 dies).",
  "Les 2 hores restants es posen: 1 hora el 02/04 (dijous Sant) i l'altra hora el 24/12 o el 31/12.",
  "Les vacances de l'any que ja estiguin entrades el mes de Febrer s'intentarà respectar-les.",
  "El màxim de dies seguits per fer són 3 setmanes (15 dies laborals).",
  "Les vacances del 2026 es poden realitzar fins al 31/01/2027.",
  "No es poden agafar més de 2 divendres/dilluns solts seguits de vacances.",
  "Si agafes vacances en una setmana, no pots agafar 4 dies de vacances i treballar només 1: has de fer la setmana complerta de vacances o treballar almenys 2 dies.",
  "Dilluns 7 de desembre 2026, addicionalment, es podrà marcar com a vacances, procurant sempre que el departament quedi cobert.",
];

const VAC_HOLIDAYS = [
  { date: '1 de Gener',    name: 'Any Nou',              weekday: 'dijous' },
  { date: '6 de Gener',    name: 'Reis',                 weekday: 'dimarts' },
  { date: '3 d\'Abril',    name: 'Divendres Sant',       weekday: 'divendres' },
  { date: '6 d\'Abril',    name: 'Dilluns de Pasqua',    weekday: 'dilluns' },
  { date: '1 de Maig',     name: 'Festa del treball',    weekday: 'divendres' },
  { date: '24 de Juny',    name: 'Sant Joan',            weekday: 'dimecres' },
  { date: '15 d\'Agost',   name: 'L\'Assumpció',         weekday: 'dissabte' },
  { date: '11 de Setembre',name: 'Diada de Catalunya',   weekday: 'divendres' },
  { date: '12 d\'Octubre', name: 'Festa Nacional d\'Espanya', weekday: 'dilluns' },
  { date: '1 de Novembre', name: 'Tots Sants',           weekday: 'diumenge' },
  { date: '6 de Desembre', name: 'La Constitució',       weekday: 'diumenge' },
  { date: '8 de Desembre', name: 'La Puríssima',         weekday: 'dimarts' },
  { date: '25 de Desembre',name: 'Nadal',                weekday: 'divendres' },
  { date: '26 de Desembre',name: 'Sant Esteve',          weekday: 'dissabte' },
];

function VacancesInfo() {
  return (
    <div className="space-y-5">
      {/* Períodes */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
          <Calendar size={15} className="text-red-600" /> Períodes de vacances 2026
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Període</th>
                <th className="py-2 pr-3 font-semibold">Dates</th>
                <th className="py-2 pr-3 font-semibold">Dies</th>
                <th className="py-2 pr-3 font-semibold">Sol·licitud</th>
                <th className="py-2 pr-3 font-semibold">Confirmació</th>
              </tr>
            </thead>
            <tbody>
              {VAC_PERIODS.map(p => (
                <tr key={p.idx} className="border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block w-3 h-3 rounded-sm", p.color)} />
                      <span className="font-bold text-gray-800 dark:text-zinc-200">{p.idx}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-gray-700 dark:text-zinc-300 font-medium">{p.dates}</td>
                  <td className="py-3 pr-3 text-gray-600 dark:text-zinc-400">{p.dies}</td>
                  <td className="py-3 pr-3 text-gray-600 dark:text-zinc-400">{p.sol}</td>
                  <td className="py-3 pr-3 text-gray-600 dark:text-zinc-400">{p.conf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-3 font-semibold">TOTAL DE DIES PER FER: 33 dies</p>
      </div>

      {/* Aclariments */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <FileText size={15} className="text-red-600" /> Aclariments
        </h3>
        <ul className="space-y-2">
          {VAC_CLARIFICATIONS.map((c, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
              <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Intensius */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Clock size={15} className="text-red-600" /> Intensius 2026
        </h3>
        <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed mb-2">
          Els divendres intensius començaran a partir del <strong>26 de Juny</strong> i finalitzaran el <strong>4 de Setembre</strong>. Fora d'aquest període no està permès realitzar-ne.
        </p>
        <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed mb-2">
          També es farà intensiu el <strong>2 d'abril</strong>, el <strong>23 de juny</strong>, el <strong>18 de desembre</strong>, el <strong>24 de desembre</strong>, el <strong>31 de desembre</strong> i el <strong>5 de gener 2027</strong>. El 18 de desembre està aprovat fer intensiu per assistir al dinar del departament; si es mou de dia, l'intensiu es pot canviar, però el dia 18 caldrà fer l'horari habitual.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/40 rounded-lg px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300 mt-2">
          Si és necessari fer un dia intensiu fora de les dates preestablertes, haurà d'estar comunicat, justificat i acceptat per Recursos Humans com a mínim amb <strong>una setmana d'antelació</strong>.
        </div>
      </div>

      {/* Novetat taviltime */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Mail size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">Novetat — gestions</p>
            <p className="text-xs text-gray-700 dark:text-zinc-300 mt-1 leading-relaxed">
              A partir de l'1 de Gener de 2026, totes les gestions relacionades amb vacances, registre de jornada, justificants de visites mèdiques, etc., cal enviar-les a:
            </p>
            <a href="mailto:taviltime@tavil.net" className="inline-block mt-2 font-mono text-sm font-semibold text-red-600 hover:underline">taviltime@tavil.net</a>
          </div>
        </div>
      </div>

      {/* Dies festius */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Star size={15} className="text-red-600" /> Dies festius 2026
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VAC_HOLIDAYS.map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex-shrink-0 w-1 h-8 rounded-full bg-red-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{h.date}</p>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">{h.name} <span className="text-gray-400">({h.weekday})</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Vacances range picker ────────────────────────────────────────────────────
// Multi-range vacation date selector. Two-month custom calendar, range mode,
// confirmed-range chips, per-range validation via validateVacanca.
type VacRange = { inici: string; final: string };

function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isoToDate(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}
function fmtDayMonth(iso: string): string {
  if (!iso) return '—';
  return isoToDate(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' });
}

function VacRangePicker({
  ranges,
  setRanges,
  existingVacances,
  minIso,
  maxIso,
}: {
  ranges: VacRange[];
  setRanges: (r: VacRange[]) => void;
  existingVacances: { start_date: string; end_date: string; status: string }[];
  minIso: string;
  maxIso: string;
}) {
  const { t: tVac } = useTranslation();
  const _vacDaysAbbr = tVac('common.daysAbbr', { returnObjects: true }) as string[];
  const daysMonFirst = [..._vacDaysAbbr.slice(1), _vacDaysAbbr[0]];
  const [open, setOpen] = useState(true);
  const [draftFrom, setDraftFrom] = useState<string | null>(null);
  const [draftTo, setDraftTo] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const months = [baseMonth, new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1)];

  // Confirmed days set across all ranges (for visual booked + disable)
  const confirmedSet = useMemo(() => {
    const s = new Set<string>();
    for (const r of ranges) {
      const cur = isoToDate(r.inici);
      const end = isoToDate(r.final);
      while (cur <= end) { s.add(toIsoLocal(cur)); cur.setDate(cur.getDate() + 1); }
    }
    return s;
  }, [ranges]);

  const draftRange: VacRange | null = (draftFrom && draftTo) ? { inici: draftFrom, final: draftTo } : null;
  // Basic checks only — no periodo rules (sense periodes mode).
  const draftError = (() => {
    if (!draftRange) return null;
    if (draftRange.final < draftRange.inici) return "La data final ha de ser posterior a la d'inici.";
    if (laboralDaysBetween(draftRange.inici, draftRange.final) === 0) return 'El rang no conté cap dia laboral.';
    // Overlap check with existing confirmed ranges
    for (const r of ranges) {
      if (!(draftRange.final < r.inici || draftRange.inici > r.final)) {
        return 'El rang es solapa amb un altre ja afegit.';
      }
    }
    return null;
  })();

  const totalDies = useMemo(() => ranges.reduce((acc, r) => acc + laboralDaysBetween(r.inici, r.final), 0), [ranges]);

  const handleDayClick = (iso: string, disabled: boolean) => {
    if (disabled) return;
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(iso); setDraftTo(null);
    } else {
      // Second click: same day = single-day range; earlier day = swap; later = end.
      if (iso < draftFrom) { setDraftFrom(iso); setDraftTo(draftFrom); }
      else { setDraftTo(iso); }
    }
  };

  const handleAfegir = () => {
    if (!draftRange || draftError) return;
    setRanges([...ranges, draftRange]);
    setDraftFrom(null); setDraftTo(null); setHover(null);
  };

  const handleRemove = (idx: number) => {
    setRanges(ranges.filter((_, i) => i !== idx));
  };

  const dayInRange = (iso: string): 'start' | 'end' | 'middle' | 'single' | null => {
    if (!draftFrom) return null;
    const to = draftTo ?? hover;
    if (!to) return iso === draftFrom ? 'single' : null;
    const lo = draftFrom <= to ? draftFrom : to;
    const hi = draftFrom <= to ? to : draftFrom;
    if (iso < lo || iso > hi) return null;
    if (iso === lo && iso === hi) return 'single';
    if (iso === lo) return 'start';
    if (iso === hi) return 'end';
    return 'middle';
  };

  return (
    <div ref={cardRef} className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors rounded-xl">
        <div className="text-left">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Selecció de dates</p>
          <p className="text-sm text-gray-900 dark:text-white mt-0.5">
            {ranges.length === 0 ? 'Cap rang seleccionat' : `${ranges.length} rang${ranges.length > 1 ? 's' : ''} · ${totalDies} dies laborals`}
          </p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-[400ms] ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-gray-200 dark:border-zinc-700 px-4 py-3">

            {/* Confirmed range chips */}
            {ranges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ranges.map((r, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700 rounded-full pl-2.5 pr-1 py-1">
                    {fmtDayMonth(r.inici)} – {fmtDayMonth(r.final)}
                    <span className="text-gray-400 ml-1">·</span>
                    <span className="text-gray-500 text-[10px]">{laboralDaysBetween(r.inici, r.final)}d</span>
                    <button onClick={() => handleRemove(idx)} aria-label="Eliminar rang" className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Calendar header */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setMonthOffset(o => o - 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md text-gray-500"><ChevronLeft size={14} /></button>
              <div className="flex gap-6 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                {months.map((m, i) => (
                  <span key={i} className="capitalize">{m.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}</span>
                ))}
              </div>
              <button type="button" onClick={() => setMonthOffset(o => o + 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md text-gray-500"><ChevronRight size={14} /></button>
            </div>

            {/* Two-month grid */}
            <div className="grid grid-cols-2 gap-3">
              {months.map((m, mi) => {
                const year = m.getFullYear();
                const month = m.getMonth();
                const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const cells: (number | null)[] = [];
                for (let i = 0; i < firstDow; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                while (cells.length % 7 !== 0) cells.push(null);
                return (
                  <div key={mi}>
                    <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-gray-400 dark:text-zinc-500 mb-1">
                      {daysMonFirst.map(d => <span key={d}>{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {cells.map((d, i) => {
                        if (d === null) return <span key={i} />;
                        const iso = toIsoLocal(new Date(year, month, d));
                        const date = new Date(year, month, d);
                        const dow = date.getDay();
                        const isWeekend = dow === 0 || dow === 6;
                        const isPast = iso < minIso;
                        const isAfterMax = iso > maxIso;
                        const isConfirmed = confirmedSet.has(iso);
                        const disabled = isWeekend || isPast || isAfterMax || isConfirmed;
                        const rangePos = dayInRange(iso);
                        let cls = 'h-8 text-xs flex items-center justify-center transition-colors select-none';
                        if (disabled) {
                          if (isConfirmed) cls += ' bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 cursor-not-allowed';
                          else cls += ' text-gray-300 dark:text-zinc-700 cursor-not-allowed';
                        } else {
                          cls += ' cursor-pointer text-gray-800 dark:text-zinc-200 hover:bg-gray-200/60 dark:hover:bg-zinc-700/60';
                        }
                        if (rangePos === 'single') cls += ' !bg-red-600 !text-white rounded-md';
                        else if (rangePos === 'start') cls += ' !bg-red-600 !text-white rounded-l-md';
                        else if (rangePos === 'end') cls += ' !bg-red-600 !text-white rounded-r-md';
                        else if (rangePos === 'middle') cls += ' !bg-red-100 dark:!bg-red-950/40 !text-red-700 dark:!text-red-300';
                        return (
                          <span key={i}
                            className={cls}
                            onClick={() => handleDayClick(iso, disabled)}
                            onMouseEnter={() => !disabled && setHover(iso)}
                            onMouseLeave={() => setHover(null)}
                          >{d}</span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Draft footer */}
            <div className="mt-3 flex items-center justify-between gap-3 min-h-[34px]">
              {!draftFrom && <p className="text-[11px] text-gray-500 dark:text-zinc-400">Selecciona la data d'inici</p>}
              {draftFrom && !draftTo && <p className="text-[11px] text-gray-500 dark:text-zinc-400">Selecciona la data final</p>}
              {draftRange && (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-gray-700 dark:text-zinc-300">
                      {fmtDayMonth(draftRange.inici)} – {fmtDayMonth(draftRange.final)} · {laboralDaysBetween(draftRange.inici, draftRange.final)} dies lab.
                    </span>
                    {draftError && <span className="text-[10.5px] text-red-600 dark:text-red-400">{draftError}</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => { setDraftFrom(null); setDraftTo(null); }} className="text-[11px] px-2.5 py-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800">Cancel·lar</button>
                    <button type="button" onClick={handleAfegir} disabled={!!draftError} className="text-[11px] px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold">+ Afegir rang</button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Vacances temporalment ocult: mantenim el codi però amaguem la UI.
const HIDE_VACANCES = false;
// Etiqueta visible per al tab intern 'Dies no ordinaris'.
const SOL_TAB_LABEL: Record<string, string> = { 'Dies no ordinaris': 'Dissabtes', 'Vacances': 'Vacances' };

function SolicitudsTab({ currentUser, onNotifChange, initialSubTab, onSubTabConsumed, onBack }: { currentUser: User | null; onNotifChange?: () => void; initialSubTab?: string | null; onSubTabConsumed?: () => void; onBack?: () => void }) {
  const { t } = useTranslation();
  const _solDaysAbbr = t('common.daysAbbr', { returnObjects: true }) as string[];
  const daysMonFirst = [..._solDaysAbbr.slice(1), _solDaysAbbr[0]];
  const [activeTab, setActiveTab] = usePersistedSubTab<string>('solicituds', initialSubTab ?? 'Dies no ordinaris', ['Dies no ordinaris', 'Vacances'] as const);

  useEffect(() => {
    if (initialSubTab) { setActiveTab(initialSubTab); onSubTabConsumed?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubTab]);

  // If vacances is hidden but persisted tab points to it, fall back.
  useEffect(() => {
    if (HIDE_VACANCES && activeTab === 'Vacances') setActiveTab('Dies no ordinaris');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const visibleTabs = HIDE_VACANCES ? ['Dies no ordinaris'] : ['Dies no ordinaris', 'Vacances'];
  const [diesNoOrdinaris, setDiesNoOrdinaris] = useState<Solicitud[]>(() => tabPrefetch.solicituds ?? []);
  const [selectedDate, setSelectedDate] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [denyingId, setDenyingId] = useState<number | null>(null);
  const [denyMotive, setDenyMotive] = useState('');
  const [closedCollapsed, setClosedCollapsed] = useState(false);
  const [vacClosedCollapsed, setVacClosedCollapsed] = useState(false);
  const [solConfirm, setSolConfirm] = useState<{ id: number; message: string; kind?: 'sol' | 'vac' } | null>(null);
  const [solToast, setSolToast] = useState<string | null>(null);
  const showSolToast = (msg: string) => { setSolToast(msg); setTimeout(() => setSolToast(null), 2500); };
  const handleSolDelete = async (id: number) => {
    try {
      await apiDeleteSolicitud(id);
      fetchSolicituds();
      showSolToast('Sol·licitud eliminada');
    } catch (e: any) {
      showSolToast(e?.message || 'Error en eliminar');
    }
  };
  const askDeleteSol = (id: number, dateLabel: string) => {
    setSolConfirm({ id, message: `Eliminar sol·licitud del ${dateLabel}?` });
  };
  const handleVacDelete = async (id: number) => {
    try {
      await apiDeleteVacanca(id);
      fetchVacances();
      showSolToast('Sol·licitud eliminada');
    } catch (e: any) {
      showSolToast(e?.message || 'Error en eliminar');
    }
  };
  const askDeleteVac = (id: number, rangeLabel: string) => {
    setSolConfirm({ id, kind: 'vac', message: `Eliminar sol·licitud de vacances (${rangeLabel})?` });
  };
  // Overall resolution of a vacanca request across the two-stage flow.
  const vacFinalStatus = (v: Vacanca): string =>
    v.rrhh_status === 'Aprovada' ? 'Aprovada'
      : (v.rrhh_status === 'Denegada' || v.head_status === 'Denegada') ? 'Denegada'
      : 'Pendent';
  const vacIsProcessed = (v: Vacanca): boolean => vacFinalStatus(v) !== 'Pendent';

  // Vacances state
  const [vacSubTab, setVacSubTab] = useState<'sol' | 'info'>('sol');
  const [vacances, setVacances] = useState<Vacanca[]>(() => tabPrefetch.vacances ?? []);
  const [vacStartDate, setVacStartDate] = useState('');
  const [vacEndDate, setVacEndDate] = useState('');
  const [vacRanges, setVacRanges] = useState<VacRange[]>([]);
  const [vacComments, setVacComments] = useState('');
  const [vacSubmitting, setVacSubmitting] = useState(false);
  const [vacSuccess, setVacSuccess] = useState(false);
  const [vacError, setVacError] = useState<string | null>(null);
  const [vacDenyingId, setVacDenyingId] = useState<number | null>(null);
  const [vacDenyStage, setVacDenyStage] = useState<'head' | 'rrhh'>('head');
  const [vacDenyComment, setVacDenyComment] = useState('');

  const isRRHH = ['Administrador', 'Administrador/a', 'Recursos humans', 'Aprovacions', 'SolicitudsVacances', 'SolicitudsDissabtes'].some(x => x === (currentUser?.role ?? '') || (currentUser?.roles ?? []).includes(x));
  const isHead = !!(currentUser?.is_head);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const fetchSolicituds = () => {
    return apiGetSolicituds().then(d => { setDiesNoOrdinaris(d); tabPrefetch.solicituds = d; tabPrefetchAt.solicituds = Date.now(); }).catch(console.error);
  };

  const fetchVacances = () => {
    return apiGetVacances().then(d => { setVacances(d); tabPrefetch.vacances = d; tabPrefetchAt.vacances = Date.now(); }).catch(console.error);
  };

  // Manual refresh with visible feedback: spin the icon while fetching, with a
  // small floor so the spin is perceptible even when the network is instant.
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchSolicituds(), fetchVacances(), new Promise(r => setTimeout(r, 650))]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isTabCacheFresh('solicituds')) fetchSolicituds();
    if (!isTabCacheFresh('vacances')) fetchVacances();
  }, [currentUser?.role]);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusColor = (s: string) =>
    s === 'Aprovada' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
    : s === 'Denegada' ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';

  // Id of the request row currently playing the approve/deny animation (one per entity).
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approvingVacId, setApprovingVacId] = useState<number | null>(null);
  const [denyOutId, setDenyOutId] = useState<number | null>(null);
  const [denyOutVacId, setDenyOutVacId] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    await new Promise(r => setTimeout(r, 480)); // let the row animation play
    try {
      await apiUpdateSolicitud(id, 'Aprovada');
      fetchSolicituds();
    } catch (e) {
      console.error('Error approving:', e);
    } finally {
      setApprovingId(null);
    }
  };

  const handleDenyConfirm = async (id: number) => {
    setDenyOutId(id);
    await new Promise(r => setTimeout(r, 480)); // let the row animation play
    try {
      await apiUpdateSolicitud(id, 'Denegada', denyMotive.trim());
      fetchSolicituds();
      setDenyingId(null);
      setDenyMotive('');
    } catch (e) {
      console.error('Error denying:', e);
    } finally {
      setDenyOutId(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setSubmitting(true);
    try {
      await apiCreateSolicitud(selectedDate, comments.trim());
      fetchSolicituds();
      onNotifChange?.();
      setSelectedDate('');
      setComments('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Error submitting solicitud:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const isMobileSol = useIsMobile();
  const [mobileSolForm, setMobileSolForm] = useState(false);
  const [mobileVacForm, setMobileVacForm] = useState(false);
  const [solClosing, setSolClosing] = useState(false);
  const [vacClosing, setVacClosing] = useState(false);
  const closeSolForm = () => { setSolClosing(true); setTimeout(() => { setMobileSolForm(false); setSolClosing(false); }, 220); };
  const closeVacForm = () => { setVacClosing(true); setTimeout(() => { setMobileVacForm(false); setVacClosing(false); }, 220); };
  // Hide bottom nav when form sheets open
  useEffect(() => { setGlobalNavHidden(mobileSolForm || mobileVacForm || mobileFormOpen); }, [mobileSolForm, mobileVacForm, mobileFormOpen]);
  const today = new Date().toISOString().split('T')[0];

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobileSol) {
    const statusInline = (s: string): React.CSSProperties => {
      if (s === 'Aprovada') return { background: '#dcfce7', color: '#15803d' };
      if (s === 'Denegada') return { background: '#fee2e2', color: '#dc2626' };
      return { background: '#fef3c7', color: '#b45309' };
    };
    const myVacances = isRRHH ? vacances : vacances.filter(v => v.user_id === currentUser?.id);
    const pendingVacances = vacances.filter(v => v.user_id !== currentUser?.id && (v.head_status === 'Pendent' || (v.head_status === 'Aprovada' && v.rrhh_status === 'Pendent')));
    const approvedDaysThisYear = vacances.filter(v => v.rrhh_status === 'Aprovada' && v.user_id === currentUser?.id)
      .reduce((acc, v) => acc + laboralDaysBetween(v.start_date, v.end_date), 0);
    const vacancesDisponibles = Math.max(0, ANNUAL_QUOTA_DAYS - approvedDaysThisYear);
    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar: back + centered title */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', pointerEvents: 'none' }}>Sol·licituds</span>
          <button onClick={handleRefresh} disabled={refreshing} aria-label="Refrescar" style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: refreshing ? 'wait' : 'pointer', color: refreshing ? 'var(--tavil-accent)' : 'var(--tavil-muted)', flexShrink: 0, zIndex: 1, marginLeft: 'auto', transition: 'color 150ms' }}>
            <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
          </button>
        </div>
        {/* Header kicker + title + subtitle */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>RRHH</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>Sol·licituds</h1>
          <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('solicituds.subtitle')}</p>
        </div>
        {/* Counter grid (no vacances mentre estigui ocult) */}
        {!isRRHH && !isHead && (
          <div style={{ padding: '6px 16px 18px', display: 'grid', gridTemplateColumns: HIDE_VACANCES ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
            {[
              ...(HIDE_VACANCES ? [] : [{ n: vacancesDisponibles, l: 'Vacances' }]),
              { n: diesNoOrdinaris.filter(d => d.status === 'Pendent' && !isRRHH && !isHead).length, l: 'Assumptes' },
              { n: 0, l: 'Teletreball' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--tavil-accent)' }}>{c.n}</div>
                <div style={{ fontSize: 10.5, color: 'var(--tavil-muted)', marginTop: 4, letterSpacing: '0.02em' }}>{c.l} · disponibles</div>
              </div>
            ))}
          </div>
        )}
        {/* Dissabtes description */}
        {activeTab === 'Dies no ordinaris' && (
          <div style={{ padding: '0 20px 14px' }}>
            <p style={{ fontSize: 12.5, color: 'var(--tavil-muted)', lineHeight: 1.45, margin: 0 }}>
              {t('solicituds.description')}
            </p>
          </div>
        )}
        {/* Nova sol·licitud button */}
        <div style={{ padding: '0 16px 14px' }}>
          <button
            onClick={() => (!HIDE_VACANCES && activeTab === 'Vacances') ? setMobileVacForm(true) : setMobileSolForm(true)}
            style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Plus size={18} /> Nova sol·licitud
          </button>
        </div>
        {/* Tab selector (només si hi ha més d'un tab visible) */}
        {visibleTabs.length > 1 && (
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6 }}>
            {visibleTabs.map(key => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                padding: '7px 14px', borderRadius: 999,
                background: activeTab === key ? 'var(--tavil-text)' : 'var(--tavil-card)',
                color: activeTab === key ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
                border: `1px solid ${activeTab === key ? 'var(--tavil-text)' : 'var(--tavil-border)'}`,
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>{SOL_TAB_LABEL[key] ?? key}</button>
            ))}
          </div>
        )}
        {/* Kicker */}
        <div style={{ padding: '2px 20px 8px', fontSize: 11, color: 'var(--tavil-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Sol·licitades · {activeTab === 'Dies no ordinaris' ? diesNoOrdinaris.length : (isRRHH ? vacances : vacances.filter(v => v.user_id === currentUser?.id)).length}
        </div>

        {/* Dies no ordinaris */}
        {activeTab === 'Dies no ordinaris' && (
          <div style={{ padding: '0 16px' }}>
            {/* Pending approvals for RRHH/head */}
            {(isRRHH || isHead) && diesNoOrdinaris.filter(d => d.status === 'Pendent' && d.author !== currentUser?.email).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="mobile-kicker" style={{ marginBottom: 8 }}>PENDENT APROVACIÓ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {diesNoOrdinaris.filter(d => d.status === 'Pendent' && d.author !== currentUser?.email).map((d, i) => (
                    <div key={i} className={cn(approvingId === d.id && "anim-approve-out", denyOutId === d.id && "anim-deny-out")} style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)' }}>{formatDate(d.date)}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#fef3c7', color: '#b45309' }}>Pendent</span>
                      </div>
                      {d.comments && <p style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginBottom: 8 }}>{d.comments}</p>}
                      <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)', marginBottom: 10 }}>{d.author}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprove(d.id)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: '#dcfce7', color: '#15803d', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Aprovar</button>
                        {denyingId !== d.id ? (
                          <button onClick={() => { setDenyingId(d.id); setDenyMotive(''); }} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Denegar</button>
                        ) : (
                          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input type="text" value={denyMotive} onChange={e => setDenyMotive(e.target.value)} placeholder="Motiu (opcional)" style={{ borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '7px 10px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setDenyingId(null)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                              <button onClick={() => handleDenyConfirm(d.id)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Confirmar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My requests */}
            <div className="mobile-kicker" style={{ marginBottom: 8 }}>LES MEVES SOL·LICITUDS</div>
            {(() => {
              const myReqs = diesNoOrdinaris.filter(d => !isRRHH && !isHead ? true : d.author === currentUser?.email);
              const activeReqs = myReqs.filter(d => d.status === 'Pendent');
              const closedReqs = myReqs.filter(d => d.status !== 'Pendent');
              if (myReqs.length === 0) return (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--tavil-faint)' }}>
                  <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                  <p style={{ fontSize: 13.5 }}>Sense sol·licituds</p>
                </div>
              );
              return (
                <>
                  {activeReqs.length > 0 && (
                    <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden', marginBottom: closedReqs.length > 0 ? 16 : 0 }}>
                      {activeReqs.map((d, i) => (
                        <div key={i} style={{ padding: '12px 14px', borderBottom: i < activeReqs.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 2 }}>{formatDate(d.date)}</div>
                              {d.comments && <div style={{ fontSize: 12, color: 'var(--tavil-muted)' }}>{d.comments}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, ...statusInline(d.status) }}>{d.status}</span>
                              {d.author === currentUser?.email && (
                                <button onClick={() => askDeleteSol(d.id, formatDate(d.date))} style={{ background: 'none', border: 'none', color: 'var(--tavil-accent)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {closedReqs.length > 0 && (
                    <>
                      <button onClick={() => setClosedCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className="mobile-kicker" style={{ opacity: 0.7 }}>SOL·LICITUDS PROCESSADES · {closedReqs.length}</span>
                        <ChevronDown size={12} className={cn("transition-transform duration-300", !closedCollapsed ? 'rotate-180' : '')} style={{ color: 'var(--tavil-faint)' }} />
                      </button>
                      <div className="sol-drawer" data-open={String(!closedCollapsed)}>
                      <div className="sol-drawer-inner">
                      <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden', opacity: 0.85 }}>
                        {closedReqs.map((d, i) => (
                          <div key={i} style={{ padding: '12px 14px', borderBottom: i < closedReqs.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tavil-muted)', marginBottom: 2 }}>{formatDate(d.date)}</div>
                                {d.comments && <div style={{ fontSize: 12, color: 'var(--tavil-faint)' }}>{d.comments}</div>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, ...statusInline(d.status) }}>{d.status}</span>
                                {(isRRHH || isHead) && (
                                  <button onClick={() => askDeleteSol(d.id, formatDate(d.date))} style={{ background: 'none', border: 'none', color: 'var(--tavil-faint)', cursor: 'pointer', padding: 0, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}><Trash2 size={15} /></button>
                                )}
                              </div>
                            </div>
                            {d.motive && <div style={{ fontSize: 12, color: 'var(--tavil-faint)', marginTop: 4, fontStyle: 'italic' }}>Motiu: {d.motive}</div>}
                          </div>
                        ))}
                      </div>
                      </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Vacances */}
        {activeTab === 'Vacances' && (
          <div style={{ padding: '0 16px' }}>
            {/* Quota summary */}
            {!isRRHH && !isHead && (() => {
              const approvedDays = vacances.filter(v => v.rrhh_status === 'Aprovada' && v.user_id === currentUser?.id)
                .reduce((acc, v) => acc + laboralDaysBetween(v.start_date, v.end_date), 0);
              const used = approvedDays;
              const pct = Math.min((used / ANNUAL_QUOTA_DAYS) * 100, 100);
              return (
                <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tavil-text)' }}>Dies de vacances</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tavil-accent)' }}>{used} / {ANNUAL_QUOTA_DAYS} dies</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--tavil-border)' }}>
                    <div style={{ height: 6, width: '100%', borderRadius: 3, background: 'var(--tavil-accent)', transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 600ms var(--ease-out-quint)' }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)', marginTop: 6 }}>{ANNUAL_QUOTA_DAYS - used} dies disponibles</div>
                </div>
              );
            })()}

            {/* RRHH pending approvals */}
            {(isRRHH || isHead) && pendingVacances.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="mobile-kicker" style={{ marginBottom: 8 }}>PENDENT APROVACIÓ ({pendingVacances.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendingVacances.map((v, i) => (
                    <div key={i} style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 4 }}>
                        {formatDate(v.start_date)} → {formatDate(v.end_date)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--tavil-muted)', marginBottom: 4 }}>{v.author_name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#fef3c7', color: '#b45309' }}>{v.head_status === 'Pendent' ? 'Pendent cap' : 'Pendent RRHH'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My vacances list */}
            <div className="mobile-kicker" style={{ marginBottom: 8 }}>LES MEVES VACANCES</div>
            {myVacances.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--tavil-faint)' }}>
                <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <p style={{ fontSize: 13.5 }}>Sense sol·licituds de vacances</p>
              </div>
            ) : (() => {
              const activeMine = myVacances.filter(v => !vacIsProcessed(v));
              const processedMine = myVacances.filter(v => vacIsProcessed(v));
              const row = (v: Vacanca, i: number, n: number, muted: boolean) => (
                <div key={v.id} style={{ padding: '12px 14px', borderBottom: i < n - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ fontSize: 13.5, fontWeight: muted ? 500 : 600, color: muted ? 'var(--tavil-muted)' : 'var(--tavil-text)' }}>
                      {formatDate(v.start_date)} – {formatDate(v.end_date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, ...statusInline(vacFinalStatus(v)) }}>{vacFinalStatus(v)}</span>
                      {(isRRHH || isHead || v.user_id === currentUser?.id) && (
                        <button onClick={() => askDeleteVac(v.id, `${formatDate(v.start_date)} – ${formatDate(v.end_date)}`)} style={{ background: 'none', border: 'none', color: muted ? 'var(--tavil-faint)' : 'var(--tavil-accent)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tavil-faint)' }}>{laboralDaysBetween(v.start_date, v.end_date)} dies laborables</div>
                </div>
              );
              return (
                <>
                  {activeMine.length > 0 && (
                    <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden', marginBottom: processedMine.length > 0 ? 16 : 0 }}>
                      {activeMine.map((v, i) => row(v, i, activeMine.length, false))}
                    </div>
                  )}
                  {processedMine.length > 0 && (
                    <>
                      <button onClick={() => setVacClosedCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className="mobile-kicker" style={{ opacity: 0.7 }}>SOL·LICITUDS PROCESSADES · {processedMine.length}</span>
                        <ChevronDown size={12} className={cn("transition-transform duration-300", !vacClosedCollapsed ? 'rotate-180' : '')} style={{ color: 'var(--tavil-faint)' }} />
                      </button>
                      <div className="sol-drawer" data-open={String(!vacClosedCollapsed)}>
                        <div className="sol-drawer-inner">
                          <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden', opacity: 0.85 }}>
                            {processedMine.map((v, i) => row(v, i, processedMine.length, true))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* New day-off form */}
        {mobileSolForm && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${solClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeSolForm}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%' }} className={solClosing ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--tavil-text)', marginBottom: 16 }}>Nova sol·licitud</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12.5, color: 'var(--tavil-muted)', display: 'block', marginBottom: 5 }}>Data</label>
                  <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={today} emphasizeSaturday />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: 'var(--tavil-muted)', display: 'block', marginBottom: 5 }}>Comentaris</label>
                  <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Motiu (opcional)" rows={3} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={closeSolForm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                  <button onClick={async () => { await handleSubmit(); closeSolForm(); }} disabled={!selectedDate || submitting} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!selectedDate || submitting) ? 0.5 : 1 }}>
                    {submitting ? 'Enviant…' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* New vacances form */}
        {mobileVacForm && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${vacClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeVacForm}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', width: '100%' }} className={vacClosing ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--tavil-text)', marginBottom: 16 }}>Sol·licitar vacances</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12.5, color: 'var(--tavil-muted)', display: 'block', marginBottom: 5 }}>Data inici</label>
                  <DatePicker value={vacStartDate} onChange={setVacStartDate} minDate={today} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: 'var(--tavil-muted)', display: 'block', marginBottom: 5 }}>Data fi</label>
                  <DatePicker value={vacEndDate} onChange={setVacEndDate} minDate={vacStartDate || today} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, color: 'var(--tavil-muted)', display: 'block', marginBottom: 5 }}>Comentaris</label>
                  <textarea value={vacComments} onChange={e => setVacComments(e.target.value)} placeholder="Opcional" rows={2} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '10px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={closeVacForm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                  <button
                    onClick={async () => {
                      if (!vacStartDate || !vacEndDate) return;
                      setVacSubmitting(true);
                      try {
                        await apiCreateVacanca(vacStartDate, vacEndDate, vacComments.trim());
                        fetchVacances();
                        onNotifChange?.();
                        setVacStartDate(''); setVacEndDate(''); setVacComments('');
                        setVacSuccess(true);
                        setTimeout(() => setVacSuccess(false), 3000);
                        closeVacForm();
                      } catch (e) { console.error(e); }
                      finally { setVacSubmitting(false); }
                    }}
                    disabled={!vacStartDate || !vacEndDate || vacSubmitting}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!vacStartDate || !vacEndDate || vacSubmitting) ? 0.5 : 1 }}
                  >
                    {vacSubmitting ? 'Enviant…' : 'Sol·licitar'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      {solConfirm && (
        <ConfirmModal
          message={solConfirm.message}
          onConfirm={() => { const { id, kind } = solConfirm; setSolConfirm(null); kind === 'vac' ? handleVacDelete(id) : handleSolDelete(id); }}
          onCancel={() => setSolConfirm(null)}
        />
      )}
      {solToast && createPortal(
        <div style={{ position: 'fixed', top: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10001, pointerEvents: 'none' }}>
          <div className="anim-pop" style={{ whiteSpace: 'nowrap', padding: '10px 22px', borderRadius: 999, fontSize: 13.5, fontWeight: 500, color: '#fff', background: 'rgba(34,110,54,0.96)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>✓</span>{solToast}
          </div>
        </div>,
        document.body
      )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('solicituds.subtitle')}</p>
        <button onClick={handleRefresh} disabled={refreshing} className={cn("flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:cursor-wait", refreshing ? "text-[var(--tavil-accent)]" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200")}>
          <RefreshCw size={12} className={cn(refreshing && "animate-spin")} /> {refreshing ? 'Refrescant…' : 'Refresca'}
        </button>
      </div>
      {visibleTabs.length > 1 && (
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
          {visibleTabs.map(tab => (
            <UnderlineTab key={tab} label={SOL_TAB_LABEL[tab] ?? tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
          ))}
        </div>
      )}
      {activeTab === 'Dies no ordinaris' && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">
          Si vols treballar un dissabte no laborable has de fer la sol·licitud a través d'aquest portal. Abans d'assignar-te'l te l'haurà de validar Depplan/RRHH.
        </p>
      )}

      <div key={activeTab} className="anim-tab">

      {activeTab === 'Dies no ordinaris' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">{t('solicituds.sentRequests', { count: diesNoOrdinaris.length })}</h3>
            {diesNoOrdinaris.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-8 text-center">
                <Calendar size={32} className="text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">{t('solicituds.noRequests')}</p>
                <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">{t('solicituds.noRequestsHint')}</p>
              </div>
            ) : (
              <>
                {/* Pending */}
                {diesNoOrdinaris.filter(d => d.status === 'Pendent').length > 0 && (
                  <div className="space-y-3">
                    {diesNoOrdinaris.filter(d => d.status === 'Pendent').map(d => (
                      <div key={d.id} className={cn("bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4", approvingId === d.id && "anim-approve-out", denyOutId === d.id && "anim-deny-out")}>
                        <div className="flex items-start gap-3">
                          <Calendar size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{formatDate(d.date)}</p>
                            <p className="text-xs text-gray-400 mb-2">Sol·licitat el {formatDate(d.created_at)} · Per: {d.author}</p>
                            {d.comments && <p className="text-xs text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2 mb-2">{d.comments}</p>}
                            {(isRRHH || isHead) && d.author !== currentUser?.email && denyingId === d.id && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={denyMotive}
                                  onChange={e => setDenyMotive(e.target.value)}
                                  placeholder="Motiu de la denegació..."
                                  rows={2}
                                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleDenyConfirm(d.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">{t('solicituds.confirmDeny')}</button>
                                  <button onClick={() => { setDenyingId(null); setDenyMotive(''); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">{t('common.cancel')}</button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusColor(d.status))}>{d.status}</span>
                            {(isRRHH || isHead) && d.author !== currentUser?.email && denyingId !== d.id && (
                              <>
                                <button onClick={() => handleApprove(d.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 transition-colors">{t('solicituds.approve')}</button>
                                <button onClick={() => { setDenyingId(d.id); setDenyMotive(''); }} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors">{t('solicituds.deny')}</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Closed (Aprovada / Denegada) */}
                {diesNoOrdinaris.filter(d => d.status !== 'Pendent').length > 0 && (
                  <div className={diesNoOrdinaris.filter(d => d.status === 'Pendent').length > 0 ? 'mt-6' : ''}>
                    <button onClick={() => setClosedCollapsed(c => !c)} className="flex items-center gap-2 mb-3 group">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Sol·licituds processades · {diesNoOrdinaris.filter(d => d.status !== 'Pendent').length}</span>
                      <ChevronDown size={12} className={cn("text-gray-400 dark:text-zinc-500 transition-transform duration-300", closedCollapsed ? '' : 'rotate-180')} />
                    </button>
                    <div className="sol-drawer" data-open={String(!closedCollapsed)}>
                      <div className="sol-drawer-inner">
                      <div className="space-y-2 pb-0.5">
                        {diesNoOrdinaris.filter(d => d.status !== 'Pendent').map(d => (
                          <div key={d.id} className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800/60 p-3.5 opacity-90">
                            <div className="flex items-start gap-3">
                              <Calendar size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-600 dark:text-zinc-300 text-sm mb-0.5">{formatDate(d.date)}</p>
                                <p className="text-xs text-gray-400 dark:text-zinc-500">Per: {d.author}</p>
                                {d.comments && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{d.comments}</p>}
                                {d.status === 'Denegada' && d.motive && (
                                  <p className="text-xs text-red-400 dark:text-red-500 mt-1"><span className="font-semibold">Motiu:</span> {d.motive}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusColor(d.status))}>{d.status}</span>
                                {(isRRHH || isHead) && (
                                  <button onClick={() => askDeleteSol(d.id, formatDate(d.date))} className="p-1 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} className="text-gray-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('solicituds.newRequest')}</h3>
            </div>
            {success && (
              <div className="mb-3 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                <CheckCircle size={13} /> {t('solicituds.sent')}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">{t('solicituds.requestedDay')}</label>
                <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={today} emphasizeSaturday />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">{t('solicituds.comments')}</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value.slice(0, 500))}
                  placeholder={t('solicituds.commentsPlaceholder')}
                  rows={5}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none"
                />
                <p className="text-[10px] text-gray-400 text-right">{comments.length}/500</p>
              </div>
              <p className="text-[11px] text-red-600">{t('solicituds.reviewNote')}</p>
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || submitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={14} /> {t('solicituds.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Dies no ordinaris' && createPortal(
        <button
          onClick={() => setMobileFormOpen(true)}
          className="md:hidden fixed right-4 bottom-20 z-[9998] w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{ position: 'fixed' }}
          title={t('solicituds.newRequest')}
        >
          <Plus size={24} />
        </button>,
        document.body
      )}

      {activeTab === 'Dies no ordinaris' && mobileFormOpen && createPortal(
        <div className="md:hidden">
          <div
            onClick={() => setMobileFormOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
            className="bg-black/50 backdrop-blur-sm anim-fade-in flex items-end justify-center"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto anim-slide-up"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('solicituds.newRequest')}</h3>
                </div>
                <button onClick={() => setMobileFormOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {success && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                    <CheckCircle size={13} /> {t('solicituds.sent')}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">{t('solicituds.requestedDay')}</label>
                  <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={today} emphasizeSaturday />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">{t('solicituds.comments')}</label>
                  <textarea value={comments} onChange={e => setComments(e.target.value.slice(0, 500))} placeholder={t('solicituds.commentsPlaceholder')} rows={5}
                    className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none" />
                  <p className="text-[10px] text-gray-400 text-right">{comments.length}/500</p>
                </div>
                <p className="text-[11px] text-red-600">{t('solicituds.reviewNote')}</p>
                <button
                  onClick={async () => { await handleSubmit(); setMobileFormOpen(false); }}
                  disabled={!selectedDate || submitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Send size={14} /> {t('solicituds.send')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeTab === 'Vacances' && (
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setVacSubTab('sol')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
              vacSubTab === 'sol'
                ? "bg-red-600 text-white border-red-600"
                : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
            )}
          >Les meves sol·licituds</button>
          <button
            onClick={() => setVacSubTab('info')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
              vacSubTab === 'info'
                ? "bg-red-600 text-white border-red-600"
                : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
            )}
          >Informació</button>
        </div>
      )}

      {activeTab === 'Vacances' && vacSubTab === 'info' && <VacancesInfo />}

      {activeTab === 'Vacances' && vacSubTab === 'sol' && (() => {
        const pendingHead = vacances.filter(v => v.head_status === 'Pendent');
        const pendingRrhh = vacances.filter(v => v.head_status === 'Aprovada' && v.rrhh_status === 'Pendent');
        const showForm = true;
        const reviewList = isHead ? pendingHead : isRRHH ? pendingRrhh : vacances;
        const showReviewPanel = isHead || isRRHH;

        const handleVacApprove = async (id: number) => {
          setApprovingVacId(id);
          await new Promise(r => setTimeout(r, 480)); // let the row animation play
          try {
            if (isHead) await apiUpdateVacancaHead(id, 'Aprovada');
            else await apiUpdateVacancaRrhh(id, 'Aprovada');
            fetchVacances(); onNotifChange?.();
          } catch {} finally {
            setApprovingVacId(null);
          }
        };
        const handleVacDenyConfirm = async (id: number) => {
          setDenyOutVacId(id);
          await new Promise(r => setTimeout(r, 480)); // let the row animation play
          try {
            if (vacDenyStage === 'head') await apiUpdateVacancaHead(id, 'Denegada', vacDenyComment.trim());
            else await apiUpdateVacancaRrhh(id, 'Denegada', vacDenyComment.trim());
            fetchVacances(); onNotifChange?.();
            setVacDenyingId(null); setVacDenyComment('');
          } catch {} finally {
            setDenyOutVacId(null);
          }
        };
        // Live conveni validation for current user's own existing vacances.
        const ownVacances = vacances.filter(v => v.user_id === currentUser?.id);
        const vacReport = (vacStartDate && vacEndDate && /^\d{4}-\d{2}-\d{2}$/.test(vacStartDate) && /^\d{4}-\d{2}-\d{2}$/.test(vacEndDate))
          ? validateVacanca(
              vacStartDate, vacEndDate,
              ownVacances.map(v => ({ start_date: v.start_date, end_date: v.end_date, status: v.status })),
            )
          : null;

        const handleVacSubmit = async () => {
          // Multi-range path (new picker) takes precedence over legacy single inputs.
          if (vacRanges.length > 0) {
            for (const r of vacRanges) {
              const rep = validateVacanca(r.inici, r.final, ownVacances.map(v => ({ start_date: v.start_date, end_date: v.end_date, status: v.status })));
              if (rep.errors.length > 0) {
                setVacError(`La sol·licitud (${r.inici} – ${r.final}) no compleix el conveni: ` + rep.errors.join('; '));
                return;
              }
            }
            setVacSubmitting(true); setVacError(null);
            try {
              for (const r of vacRanges) {
                await apiCreateVacanca(r.inici, r.final, vacComments.trim());
              }
              fetchVacances(); onNotifChange?.();
              setVacRanges([]); setVacComments('');
              setVacSuccess(true); setTimeout(() => setVacSuccess(false), 3000);
            } catch (e: any) {
              setVacError('La sol·licitud ha estat rebutjada: ' + (e?.message ?? 'Error desconegut'));
            } finally { setVacSubmitting(false); }
            return;
          }
          if (!vacStartDate || !vacEndDate) return;
          const report = validateVacanca(
            vacStartDate, vacEndDate,
            ownVacances.map(v => ({ start_date: v.start_date, end_date: v.end_date, status: v.status })),
          );
          if (report.errors.length > 0) {
            setVacError('La sol·licitud no compleix el conveni: ' + report.errors.join('; '));
            return;
          }
          setVacSubmitting(true); setVacError(null);
          try {
            await apiCreateVacanca(vacStartDate, vacEndDate, vacComments.trim());
            fetchVacances(); onNotifChange?.();
            setVacStartDate(''); setVacEndDate(''); setVacComments('');
            setVacSuccess(true); setTimeout(() => setVacSuccess(false), 3000);
          } catch (e: any) {
            setVacError('La sol·licitud ha estat rebutjada: ' + (e?.message ?? 'Error desconegut'));
          } finally { setVacSubmitting(false); }
        };

        return (
          <div className={`grid gap-6 ${showForm ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
            <div className={showForm ? 'md:col-span-2' : 'col-span-1'}>
              {showReviewPanel && reviewList.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
                    {isHead ? 'Peticions pendents d\'aprovació' : 'Peticions aprovades pel cap — pendent RRHH'}
                  </h3>
                  <div className="space-y-3">
                    {reviewList.map(v => (
                      <div key={v.id} className={cn("bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4", approvingVacId === v.id && "anim-approve-out", denyOutVacId === v.id && "anim-deny-out")}>
                        <div className="flex items-start gap-3">
                          <Calendar size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{v.author_name} <span className="text-gray-400 font-normal">— {v.author_dept}</span></p>
                            <p className="text-xs text-gray-400 mb-1">Del {formatDate(v.start_date)} al {formatDate(v.end_date)}</p>
                            {v.comments && <p className="text-xs text-gray-500 dark:text-zinc-400 italic mb-2">"{v.comments}"</p>}
                            {vacDenyingId === v.id && (
                              <div className="mt-2 space-y-2">
                                <textarea value={vacDenyComment} onChange={e => setVacDenyComment(e.target.value)} placeholder="Motiu de la denegació..." rows={2}
                                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none" />
                                <div className="flex gap-2">
                                  <button onClick={() => handleVacDenyConfirm(v.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Confirmar denegació</button>
                                  <button onClick={() => { setVacDenyingId(null); setVacDenyComment(''); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">{t('common.cancel')}</button>
                                </div>
                              </div>
                            )}
                          </div>
                          {vacDenyingId !== v.id && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => handleVacApprove(v.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 transition-colors">Aprovar</button>
                              <button onClick={() => { setVacDenyingId(v.id); setVacDenyStage(isHead ? 'head' : 'rrhh'); setVacDenyComment(''); }} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 transition-colors">Denegar</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Sol·licituds de vacances ({vacances.length})</h3>
              {vacances.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-8 text-center">
                  <Calendar size={32} className="text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-zinc-500">Cap sol·licitud de vacances</p>
                </div>
              ) : (() => {
                const activeVac = vacances.filter(v => !vacIsProcessed(v));
                const processedVac = vacances.filter(v => vacIsProcessed(v));
                return (
                  <>
                    {/* Active (encara en flux) */}
                    {activeVac.length > 0 && (
                      <div className="space-y-3">
                        {activeVac.map(v => (
                          <div key={v.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
                            <div className="flex items-start gap-3">
                              <Calendar size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                {(isRRHH || isHead) && <p className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{v.author_name} <span className="text-gray-400 font-normal text-xs">— {v.author_dept}</span></p>}
                                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Del {formatDate(v.start_date)} al {formatDate(v.end_date)}</p>
                                <p className="text-xs text-gray-400 mb-2">Sol·licitades el {formatDate(v.created_at)}</p>
                                {v.comments && <p className="text-xs text-gray-500 dark:text-zinc-400 italic mb-2">"{v.comments}"</p>}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-semibold text-gray-500">Cap:</span>
                                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusColor(v.head_status))}>{v.head_status}</span>
                                  <span className="text-[10px] font-semibold text-gray-500">RRHH:</span>
                                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusColor(v.rrhh_status))}>{v.rrhh_status}</span>
                                </div>
                                {v.head_comment && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Comentari cap: {v.head_comment}</p>}
                                {v.rrhh_comment && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Comentari RRHH: {v.rrhh_comment}</p>}
                              </div>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0", statusColor(v.status))}>{v.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Processades (Aprovada / Denegada) */}
                    {processedVac.length > 0 && (
                      <div className={activeVac.length > 0 ? 'mt-6' : ''}>
                        <button onClick={() => setVacClosedCollapsed(c => !c)} className="flex items-center gap-2 mb-3 group">
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Sol·licituds processades · {processedVac.length}</span>
                          <ChevronDown size={12} className={cn("text-gray-400 dark:text-zinc-500 transition-transform duration-300", vacClosedCollapsed ? '' : 'rotate-180')} />
                        </button>
                        <div className="sol-drawer" data-open={String(!vacClosedCollapsed)}>
                          <div className="sol-drawer-inner">
                            <div className="space-y-2 pb-0.5">
                              {processedVac.map(v => (
                                <div key={v.id} className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800/60 p-3.5 opacity-90">
                                  <div className="flex items-start gap-3">
                                    <Calendar size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      {(isRRHH || isHead) && <p className="font-medium text-gray-600 dark:text-zinc-300 text-sm mb-0.5">{v.author_name} <span className="text-gray-400 font-normal text-xs">— {v.author_dept}</span></p>}
                                      <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">Del {formatDate(v.start_date)} al {formatDate(v.end_date)}</p>
                                      {v.comments && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 italic">"{v.comments}"</p>}
                                      {v.head_comment && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Comentari cap: {v.head_comment}</p>}
                                      {v.rrhh_comment && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Comentari RRHH: {v.rrhh_comment}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusColor(vacFinalStatus(v)))}>{vacFinalStatus(v)}</span>
                                      {(isRRHH || isHead || v.user_id === currentUser?.id) && (
                                        <button onClick={() => askDeleteVac(v.id, `${formatDate(v.start_date)} – ${formatDate(v.end_date)}`)} className="p-1 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {showForm && mobileFormOpen && createPortal(
              <div className="md:hidden">
                <div
                  onClick={() => setMobileFormOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
                  className="bg-black/50 backdrop-blur-sm anim-fade-in flex items-end justify-center"
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    className="bg-white dark:bg-zinc-900 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto anim-slide-up"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Nova sol·licitud de vacances</h3>
                      </div>
                      <button onClick={() => setMobileFormOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      {vacSuccess && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                          <CheckCircle size={13} /> Sol·licitud enviada correctament
                        </div>
                      )}
                      {vacError && (
                        <div className="flex items-start gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2 text-xs">
                          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {vacError}
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Data d'inici</label>
                        <DatePicker value={vacStartDate} onChange={setVacStartDate} minDate={today} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Data de fi</label>
                        <DatePicker value={vacEndDate} onChange={setVacEndDate} minDate={vacStartDate || today} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Comentaris (opcional)</label>
                        <textarea value={vacComments} onChange={e => setVacComments(e.target.value.slice(0, 500))} placeholder="Motiu o informació addicional..." rows={3}
                          className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none" />
                      </div>
                      {vacReport && (
                        <div className="space-y-1.5">
                          {vacReport.laboralDays > 0 && (
                            <div className="text-[11px] text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                              <strong>{vacReport.laboralDays}</strong> dia{vacReport.laboralDays > 1 ? 's' : ''} laboral{vacReport.laboralDays > 1 ? 's' : ''}
                              {vacReport.period ? <> · {vacReport.period.label}</> : null}
                              {' · '}consum anual: {vacReport.annualUsedIfApproved}/{ANNUAL_QUOTA_DAYS}
                            </div>
                          )}
                          {vacReport.errors.map((e, i) => (
                            <div key={i} className="text-[11px] text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-300 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> <span>{e}</span>
                            </div>
                          ))}
                          {vacReport.warnings.map((w, i) => (
                            <div key={i} className="text-[11px] text-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-300 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-red-600">Requereix aprovació del cap i de RRHH</p>
                      <button onClick={async () => { await handleVacSubmit(); setMobileFormOpen(false); }} disabled={!vacStartDate || !vacEndDate || vacSubmitting || (vacReport?.errors.length ?? 0) > 0}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Send size={14} /> Enviar sol·licitud
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
            {showForm && createPortal(
              <button
                onClick={() => setMobileFormOpen(true)}
                style={{ position: 'fixed', right: '1rem', bottom: '5rem', zIndex: 9998 }}
                className="md:hidden w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                title="Nova sol·licitud"
              >
                <Plus size={24} />
              </button>,
              document.body
            )}
            {showForm && (
              <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={15} className="text-gray-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Nova sol·licitud de vacances</h3>
                </div>
                {vacSuccess && (
                  <div className="mb-3 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                    <CheckCircle size={13} /> Sol·licitud enviada correctament
                  </div>
                )}
                {vacError && (
                  <div className="mb-3 flex items-start gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2 text-xs">
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {vacError}
                  </div>
                )}
                <div className="space-y-3">
                  <VacRangePicker
                    ranges={vacRanges}
                    setRanges={setVacRanges}
                    existingVacances={ownVacances.map(v => ({ start_date: v.start_date, end_date: v.end_date, status: v.status }))}
                    minIso={today}
                    maxIso="2027-01-31"
                  />
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Comentaris (opcional)</label>
                    <textarea value={vacComments} onChange={e => setVacComments(e.target.value.slice(0, 500))} placeholder="Motiu o informació addicional..." rows={3}
                      className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none" />
                  </div>
                  {vacReport && (
                    <div className="space-y-1.5">
                      {vacReport.laboralDays > 0 && (
                        <div className="text-[11px] text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                          <strong>{vacReport.laboralDays}</strong> dia{vacReport.laboralDays > 1 ? 's' : ''} laboral{vacReport.laboralDays > 1 ? 's' : ''}
                          {vacReport.period ? <> · {vacReport.period.label}</> : null}
                          {' · '}consum anual: {vacReport.annualUsedIfApproved}/{ANNUAL_QUOTA_DAYS}
                        </div>
                      )}
                      {vacReport.errors.map((e, i) => (
                        <div key={i} className="text-[11px] text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-300 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> <span>{e}</span>
                        </div>
                      ))}
                      {vacReport.warnings.map((w, i) => (
                        <div key={i} className="text-[11px] text-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-300 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {vacRanges.length > 0 && (
                    <div className="text-[11px] text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
                      <strong>{vacRanges.reduce((acc, r) => acc + laboralDaysBetween(r.inici, r.final), 0)}</strong> dies laborals · {vacRanges.length} rang{vacRanges.length > 1 ? 's' : ''}
                    </div>
                  )}
                  <p className="text-[11px] text-red-600">Requereix aprovació del cap i de RRHH</p>
                  <button onClick={handleVacSubmit} disabled={(vacRanges.length === 0 && (!vacStartDate || !vacEndDate)) || vacSubmitting || (vacReport?.errors.length ?? 0) > 0}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Send size={14} /> Enviar sol·licitud
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      </div>
      {solConfirm && (
        <ConfirmModal
          message={solConfirm.message}
          onConfirm={() => { const { id, kind } = solConfirm; setSolConfirm(null); kind === 'vac' ? handleVacDelete(id) : handleSolDelete(id); }}
          onCancel={() => setSolConfirm(null)}
        />
      )}
      {solToast && createPortal(
        <div style={{ position: 'fixed', top: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10001, pointerEvents: 'none' }}>
          <div className="anim-pop" style={{ whiteSpace: 'nowrap', padding: '10px 22px', borderRadius: 999, fontSize: 13.5, fontWeight: 500, color: '#fff', background: 'rgba(34,110,54,0.96)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>✓</span>{solToast}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Perfil Tab ────────────────────────────────────────────────────────────────

function ProfileRow({ icon: Icon, label, value, editing, onChange }: {
  icon: React.ElementType;
  label: string;
  value?: string;
  editing?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon size={14} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
      <span className="text-[11px] uppercase tracking-wide font-medium text-gray-400 dark:text-zinc-500 w-20">{label}</span>
      {editing && onChange ? (
        <input value={value ?? ''} onChange={e => onChange(e.target.value)} className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
      ) : (
        <span className="text-sm text-gray-700 dark:text-zinc-300 truncate flex-1">{value || '—'}</span>
      )}
    </div>
  );
}

function PerfilTab({ currentUser, onUserUpdate, onNavigate, isDarkMode, toggleDarkMode, onLogout, notifications }: { currentUser: User | null; onUserUpdate: (u: User) => void; onNavigate?: (tab: string) => void; isDarkMode?: boolean; toggleDarkMode?: () => void; onLogout?: () => void; notifications?: Notification[] }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = usePersistedSubTab<string>('perfil', 'Informació', ['Informació', 'Configuració'] as const);
  const [notifCorreu, setNotifCorreu] = useState(currentUser?.email_notifs !== 0);
  const [notifPortal, setNotifPortal] = useState(true);

  const canEditDept = ['Administrador', 'Administrador/a'].some(x => x === (currentUser?.role ?? '') || (currentUser?.roles ?? []).includes(x));

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name ?? '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone ?? '');
  const [extInput, setExtInput] = useState(currentUser?.ext ?? '');
  const [locationInput, setLocationInput] = useState(currentUser?.location ?? '');
  const [deptInput, setDeptInput] = useState(currentUser?.dept ?? DEPT_ORDER[0]);
  const [isHeadInput, setIsHeadInput] = useState((currentUser?.is_head ?? 0) === 1);
  const [deptHasHead, setDeptHasHead] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editing) {
      apiGetDeptHead(deptInput).then(r => setDeptHasHead(r.has_head)).catch(() => {});
    }
  }, [deptInput, editing]);

  const [courses, setCourses] = useState<Course[]>(() => tabPrefetch.courses ?? []);

  useEffect(() => {
    if (isTabCacheFresh('courses')) return;
    apiGetCourses().then(d => { setCourses(d); tabPrefetch.courses = d; tabPrefetchAt.courses = Date.now(); }).catch(console.error);
  }, []);

  const profileCourses = courses.filter(c => c.user_status !== 'Pendent');
  const completedCount = courses.filter(c => c.user_status === 'Completat').length;
  const pendingCount = courses.filter(c => c.user_status === 'Pendent').length;
  const totalHoursStr = `${profileCourses.reduce((s, c) => s + (parseInt(c.hours) || 0), 0)}h`;

  const initials = (currentUser?.name ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  // Self-edit is disabled — personal data is admin-managed.
  const handleSave = () => { setEditing(false); };
  const handleCancel = () => { setEditing(false); };

  const [showNotifs, setShowNotifs] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [notifList, setNotifList] = useState<Notification[]>([]);

  useEffect(() => {
    if (showNotifs) {
      apiGetNotifications().then(setNotifList).catch(() => {});
    }
  }, [showNotifs]);

  // Avatar (user-editable; rest of personal data is admin-managed).
  // Staged: pending* only persists when user presses "Desa" on edit-profile modal.
  const savedAvatarUrl: string | null = currentUser?.avatar_url ?? null;
  const avatarImgStyle = (url: string | null): React.CSSProperties =>
    url?.startsWith('/assets/') ? { width: '100%', height: '100%', objectFit: 'contain', padding: '8%' } : { width: '100%', height: '100%', objectFit: 'cover' };
  const avatarBgStyle = (url: string | null) =>
    url?.startsWith('/assets/') ? '#ffffff' : 'var(--tavil-accent)';
  const [pendingAvatar, setPendingAvatar] = useState<string | null | undefined>(undefined); // undefined = no change
  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarUrl: string | null = pendingAvatar !== undefined ? (pendingAvatar || null) : savedAvatarUrl;
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [gallerySelected, setGallerySelected] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const galleryFromEditForm = useRef(false);
  const resolvedGalleryUrls = useRef<Record<string, string>>({});
  const commitAvatarUrl = async (url: string): Promise<boolean> => {
    setAvatarSaving(true);
    try {
      const updated = await apiUpdateMe({ avatar_url: url });
      onUserUpdate(updated);
      setPendingAvatar(undefined);
      return true;
    } catch (e: any) {
      setAvatarErr(e?.message ?? 'Error desant la foto'); setTimeout(() => setAvatarErr(null), 4000);
      return false;
    } finally {
      setAvatarSaving(false);
    }
  };
  const handleAvatarPick = async (file: File) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await apiUploadImage(file);
      const m = url.match(/(\/uploads\/[^?#]+)/);
      const rel = m ? m[1] : url;
      setPendingAvatar(rel);
    } catch (e: any) {
      setAvatarErr(e?.message ?? 'Error pujant la imatge'); setTimeout(() => setAvatarErr(null), 4000);
    } finally {
      setAvatarUploading(false);
    }
  };
  const handleAvatarRemove = () => {
    setPendingAvatar('');
  };
  const discardAvatarPending = () => setPendingAvatar(undefined);
  const commitAvatarPending = async (): Promise<boolean> => {
    if (pendingAvatar === undefined) return true;
    setAvatarSaving(true);
    try {
      const updated = await apiUpdateMe({ avatar_url: pendingAvatar ?? '' });
      onUserUpdate(updated);
      setPendingAvatar(undefined);
      return true;
    } catch (e: any) {
      setAvatarErr(e?.message ?? 'Error desant la foto'); setTimeout(() => setAvatarErr(null), 4000);
      return false;
    } finally {
      setAvatarSaving(false);
    }
  };

  // Edit-profile modal + directory visibility toggle + accordion + password modal.
  const [showEdit, setShowEdit] = useState(false);
  const [expandedRow, setExpandedRow] = useState<'notifs' | 'privacy' | 'support' | null>(null);
  useEffect(() => { setGlobalNavHidden(showAvatarGallery || showEdit); }, [showAvatarGallery, showEdit]);

  const [visInDir, setVisInDir] = useState<boolean>((currentUser?.visible_in_directory ?? 1) === 1);
  useEffect(() => {
    setVisInDir((currentUser?.visible_in_directory ?? 1) === 1);
  }, [currentUser?.visible_in_directory]);
  const toggleVisInDir = async () => {
    const next = !visInDir;
    setVisInDir(next);
    try {
      const u = await apiUpdateMe({ visible_in_directory: next ? 1 : 0 });
      onUserUpdate(u);
    } catch {
      setVisInDir(!next);
    }
  };

  // Preferències de comunicació per categoria — localStorage fins que tinguem backend.
  type NotifCats = { noticies: boolean; agenda: boolean; solicituds: boolean; campus: boolean };
  const notifCatsKey = `tavil_notif_cats_${currentUser?.id ?? 0}`;
  const [notifCats, setNotifCats] = useState<NotifCats>(() => {
    try {
      const raw = localStorage.getItem(notifCatsKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { noticies: true, agenda: true, solicituds: true, campus: true };
  });
  const toggleNotifCat = (k: keyof NotifCats) => {
    const next = { ...notifCats, [k]: !notifCats[k] };
    setNotifCats(next);
    try { localStorage.setItem(notifCatsKey, JSON.stringify(next)); } catch {}
  };
  // Push notifications — només UI, no implementat al backend encara.
  const [notifPush, setNotifPush] = useState<boolean>(() => {
    try { return localStorage.getItem(`tavil_notif_push_${currentUser?.id ?? 0}`) === '1'; } catch { return false; }
  });
  const toggleNotifPush = () => {
    const next = !notifPush;
    setNotifPush(next);
    try { localStorage.setItem(`tavil_notif_push_${currentUser?.id ?? 0}`, next ? '1' : '0'); } catch {}
  };

  const isMobilePerfil = useIsMobile();
  if (isMobilePerfil) {
    const name = currentUser?.name ?? '';
    const ini = name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

    // ── Configuració sub-view ──────────────────────────────
    if (showConfig) {
      return (
        <div className="anim-page-enter-h-fwd" style={{ margin: '0 -12px', paddingBottom: 96 }}>
          {/* Back header */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px 6px', gap: 4,
          }}>
            <button
              onClick={() => setShowConfig(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--tavil-accent)', fontFamily: 'inherit', fontSize: 16, padding: '4px 0',
              }}
            >
              <ChevronLeft size={20} strokeWidth={2} />
              Perfil
            </button>
          </div>
          <div style={{
            fontSize: 28, fontFamily: 'var(--font-display)',
            fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--tavil-text)',
            padding: '4px 24px 18px',
          }}>Configuració</div>

          <MesSettingsGroup label="COMUNICACIONS">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, color: 'var(--tavil-text)' }}>Per correu</div>
                <div style={{ fontSize: 12, color: 'var(--tavil-muted)', marginTop: 2 }}>Email per cada notificació nova.</div>
              </div>
              <Toggle on={notifCorreu} onToggle={async () => {
                const newVal = !notifCorreu;
                setNotifCorreu(newVal);
                try { const u = await apiUpdateMe({ email_notifs: newVal ? 1 : 0 }); onUserUpdate(u); }
                catch { setNotifCorreu(!newVal); }
              }} />
            </div>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, color: 'var(--tavil-text)' }}>Al portal</div>
                <div style={{ fontSize: 12, color: 'var(--tavil-muted)', marginTop: 2 }}>Mostra la campaneta amb les novetats.</div>
              </div>
              <Toggle on={notifPortal} onToggle={() => setNotifPortal(!notifPortal)} />
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, color: 'var(--tavil-text)' }}>Push al mòbil</div>
                <div style={{ fontSize: 12, color: 'var(--tavil-muted)', marginTop: 2 }}>Notificacions empenyedes al dispositiu.</div>
              </div>
              <Toggle on={notifPush} onToggle={toggleNotifPush} />
            </div>
          </MesSettingsGroup>

          <MesSettingsGroup label="CATEGORIES">
            {([
              { k: 'noticies', l: 'Notícies' },
              { k: 'agenda', l: 'Agenda' },
              { k: 'solicituds', l: 'Sol·licituds' },
              { k: 'campus', l: 'Campus' },
            ] as const).map((c, i, arr) => (
              <div key={c.k} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                <div style={{ flex: 1, fontSize: 14.5, color: 'var(--tavil-text)' }}>{c.l}</div>
                <Toggle on={notifCats[c.k]} onToggle={() => toggleNotifCat(c.k)} />
              </div>
            ))}
          </MesSettingsGroup>

          <MesSettingsGroup label={t('perfil.account').toUpperCase()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--tavil-muted)', flex: 1 }}>{t('perfil.corporateEmail')}</span>
              <span style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{currentUser?.email ?? '—'}</span>
            </div>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--tavil-muted)', flex: 1 }}>ID</span>
              <span style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{`TAV-0${String(currentUser?.id ?? 0).padStart(3, '0')}`}</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--tavil-muted)', flex: 1 }}>Rol</span>
              <span style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{currentUser?.role ?? '—'}</span>
            </div>
          </MesSettingsGroup>
        </div>
      );
    }

    // ── Notifications sub-view ─────────────────────────────
    if (showNotifs) {
      return (
        <div className="anim-page-enter-h-fwd" style={{ margin: '0 -12px', paddingBottom: 96 }}>
          {/* Back header */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px 6px', gap: 4,
          }}>
            <button
              onClick={() => setShowNotifs(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--tavil-accent)', fontFamily: 'inherit', fontSize: 16, padding: '4px 0',
              }}
            >
              <ChevronLeft size={20} strokeWidth={2} />
              {t('perfil.backToProfile')}
            </button>
          </div>
          <div style={{
            fontSize: 28, fontFamily: 'var(--font-display)',
            fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--tavil-text)',
            padding: '4px 24px 18px',
          }}>{t('perfil.notifications')}</div>

          <MesSettingsGroup label={notifList.length > 0 ? `${notifList.filter(n => !n.read).length} sense llegir` : 'RECENTS'}>
            {notifList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--tavil-faint)', fontSize: 13 }}>
                {t('perfil.noNotifications')}
              </div>
            ) : (
              notifList.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => {
                    apiMarkNotifRead(n.id).then(() => apiGetNotifications().then(setNotifList)).catch(() => {});
                  }}
                  className="anim-item"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--tavil-border)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    ['--i' as string]: i,
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: n.read ? 'var(--tavil-bg-alt)' : 'var(--tavil-accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bell size={16} style={{ color: n.read ? 'var(--tavil-muted)' : 'var(--tavil-accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, color: 'var(--tavil-text)',
                      fontWeight: n.read ? 400 : 600, lineHeight: 1.35,
                    }}>{n.title}</div>
                    {n.body && (
                      <div style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginTop: 2, lineHeight: 1.35 }}>{n.body}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)', marginTop: 4 }}>{timeAgo(n.created_at, t)}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--tavil-accent)', marginTop: 6, flexShrink: 0 }} />
                  )}
                </button>
              ))
            )}
          </MesSettingsGroup>

          {notifList.length > 0 && (
            <div style={{ padding: '0 16px' }}>
              <button
                onClick={() => apiMarkAllNotifsRead().then(() => apiGetNotifications().then(setNotifList)).catch(() => {})}
                style={{
                  width: '100%', padding: '13px 16px', background: 'var(--tavil-card)',
                  border: '1px solid var(--tavil-border)', borderRadius: 14,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                  color: 'var(--tavil-accent)', fontWeight: 500,
                }}
              >
                {t('perfil.markAllRead')}
              </button>
            </div>
          )}
        </div>
      );
    }

    // ── Main profile view ──────────────────────────────────
    return (
      <div style={{ margin: '0 -12px', paddingBottom: 96 }}>
        {/* Back header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 0', gap: 4 }}>
          <button
            onClick={() => onNavigate?.('Més')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--tavil-accent)', fontFamily: 'inherit', fontSize: 16, padding: '4px 0',
            }}
          >
            <ChevronLeft size={20} strokeWidth={2} />
            {t('nav.mes')}
          </button>
        </div>
        {/* Hero */}
        <div style={{ padding: '10px 20px 22px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { galleryFromEditForm.current = false; setGallerySelected(avatarUrl); setShowAvatarGallery(true); }}
            disabled={avatarUploading}
            aria-label="Canviar foto de perfil"
            style={{
              width: 84, height: 84, borderRadius: 42, margin: '0 auto 14px',
              background: avatarBgStyle(avatarUrl), color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 32, letterSpacing: '-0.01em',
              boxShadow: '0 6px 20px -8px rgba(0,0,0,0.18)',
              fontFamily: 'var(--font-display)',
              border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative',
            }}>
            {avatarUrl
              ? <img src={resolveImg(avatarUrl)} alt="" loading="lazy" style={avatarImgStyle(avatarUrl)} />
              : <span>{ini}</span>}
            <div style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, background: 'var(--tavil-card)', border: '2px solid var(--tavil-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tavil-text)' }}>
              <ImageIcon size={13} />
            </div>
          </button>
          <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarPick(f); e.currentTarget.value = ''; }} />
          {/* ── Avatar gallery picker ── */}
          {showAvatarGallery && createPortal((() => {
            const ext = currentUser?.ext ?? '';
            const PHOTOS_BASE = '/uploads/photos/';
            const hrPhoto = ext ? `${PHOTOS_BASE}${ext}.png` : null;

            const options: { url: string; label: string; candidates?: string[]; contain?: boolean; hideOnError?: boolean }[] = [
              ...(hrPhoto ? [{ url: hrPhoto, label: 'La meva foto', candidates: [`${PHOTOS_BASE}${ext}.png`, `${PHOTOS_BASE}${ext}.jpg`, `${PHOTOS_BASE}${ext}.jpeg`], hideOnError: true }] : []),
              { url: '/tavil-header.jpg', label: 'Nau Tavil' },
              { url: '/assets/images/tavilLogo.png', label: 'Logo Tavil', contain: true },
            ];
            return (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md anim-fade-in"
                onClick={e => { if (e.target === e.currentTarget) setShowAvatarGallery(false); }}
              >
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-sm mx-4 anim-scale-in"
                  style={{ boxShadow: '0 8px 32px rgba(34,39,37,0.18)', border: '1px solid var(--tavil-border)' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tavil-accent)] mb-1">Perfil</div>
                  <h3 className="font-bold text-[var(--tavil-text)] text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Canvia la foto de perfil</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {options.map(opt => {
                      const resolved = resolvedGalleryUrls.current[opt.url] ?? opt.url;
                      const isSelected = gallerySelected === resolved || gallerySelected === opt.url;
                      return (
                        <button key={opt.url} onClick={() => setGallerySelected(resolved)}
                          className="press flex flex-col items-center gap-1.5 focus:outline-none"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden"
                            style={{ border: isSelected ? '2.5px solid var(--tavil-text)' : '2px solid var(--tavil-border)', transition: 'border-color 140ms', background: opt.contain ? '#f5f5f0' : undefined }}>
                            <img
                              src={resolveImg(opt.url)}
                              alt={opt.label}
                              className={`w-full h-full ${opt.contain ? 'object-contain p-2' : 'object-cover'}`}
                              onError={e => {
                                const img = e.currentTarget;
                                const cands = opt.candidates;
                                if (cands && !img.dataset.tried) {
                                  img.dataset.tried = '1';
                                  const next = cands.find(c => resolveImg(c) !== img.src);
                                  if (next) {
                                    img.src = resolveImg(next);
                                    img.onload = () => {
                                      resolvedGalleryUrls.current[opt.url] = next;
                                      setGallerySelected(prev => prev === opt.url ? next : prev);
                                    };
                                    return;
                                  }
                                }
                                if (opt.hideOnError) { const btn = img.closest('button'); if (btn) btn.style.display = 'none'; }
                                else img.parentElement!.parentElement!.style.opacity = '0.35';
                              }}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-end justify-end p-1.5">
                                <div className="w-5 h-5 rounded-full bg-[var(--tavil-text)] flex items-center justify-center">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#f7f7f2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-[var(--tavil-muted)]">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { if (gallerySelected) { setPendingAvatar(gallerySelected); if (!galleryFromEditForm.current) commitAvatarUrl(gallerySelected); } setShowAvatarGallery(false); }}
                      disabled={!gallerySelected}
                      className="press w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--tavil-text)] text-[var(--tavil-bg)] disabled:opacity-40 transition-opacity"
                    >Confirmar</button>
                  </div>
                </div>
              </div>
            );
          })(), document.body)}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.01em', lineHeight: 1.1, color: 'var(--tavil-text)' }}>
            {name || 'Usuari'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--tavil-muted)', marginTop: 4 }}>
            {currentUser?.role}{currentUser?.dept ? ` · ${currentUser.dept}` : ''}
          </div>
          {(currentUser?.ext || currentUser?.email) && (
            <div style={{ fontSize: 12, color: 'var(--tavil-faint)', marginTop: 2 }}>
              {currentUser.ext ? `Codi ${currentUser.ext}` : ''}{currentUser.ext && currentUser.email ? ' · ' : ''}{currentUser.email ?? ''}
            </div>
          )}
        </div>

        {/* Aparença */}
        <MesSettingsGroup label={t('perfil.theme').toUpperCase()}>
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { dark: false, label: t('perfil.light'), Icon: Sun },
              { dark: true,  label: t('perfil.dark'),  Icon: Moon },
            ].map(o => {
              const active = (isDarkMode ?? false) === o.dark;
              return (
                <button
                  key={String(o.dark)}
                  onClick={toggleDarkMode}
                  style={{
                    padding: '14px 8px 12px', borderRadius: 12,
                    background: active ? 'var(--tavil-accent-light)' : 'transparent',
                    border: `1px solid ${active ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                    color: active ? 'var(--tavil-accent)' : 'var(--tavil-text)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontWeight: 500,
                  }}
                >
                  <o.Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {o.label}
                </button>
              );
            })}
          </div>
        </MesSettingsGroup>

        {/* Idioma */}
        <MesSettingsGroup label={t('perfil.language').toUpperCase()}>
          {[
            { code: 'ca', label: 'Català' },
            { code: 'es', label: 'Castellano' },
            { code: 'en', label: 'English' },
          ].map((l, i) => {
            const active = i18n.language === l.code;
            return (
              <button
                key={l.code}
                onClick={() => i18n.changeLanguage(l.code)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  padding: '14px 16px', background: 'transparent',
                  border: 'none', borderBottom: '1px solid var(--tavil-border)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5,
                  color: 'var(--tavil-text)',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{l.label}</span>
                {active && <Check size={16} style={{ color: 'var(--tavil-accent)' }} />}
              </button>
            );
          })}
        </MesSettingsGroup>

        {/* Compte */}
        <MesSettingsGroup label={t('perfil.account').toUpperCase()}>
          <button
            onClick={() => setShowNotifs(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'transparent',
              border: 'none', borderBottom: '1px solid var(--tavil-border)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5,
              color: 'var(--tavil-text)',
            }}
          >
            <Bell size={18} style={{ color: 'var(--tavil-muted)' }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{t('perfil.notifications')}</span>
            <ChevronRight size={16} style={{ color: 'var(--tavil-faint)' }} />
          </button>
          <button
            onClick={() => setShowConfig(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'transparent',
              border: 'none', borderBottom: '1px solid var(--tavil-border)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5,
              color: 'var(--tavil-text)',
            }}
          >
            <Settings size={18} style={{ color: 'var(--tavil-muted)' }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{t('perfil.settings')}</span>
            <ChevronRight size={16} style={{ color: 'var(--tavil-faint)' }} />
          </button>
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'transparent', border: 'none',
              borderBottom: '1px solid var(--tavil-border)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, color: 'var(--tavil-accent)',
            }}
          >
            <LogOut size={18} style={{ color: 'var(--tavil-accent)' }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{t('perfil.logout')}</span>
          </button>
        </MesSettingsGroup>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0 10px', fontSize: 11, color: 'var(--tavil-faint)', letterSpacing: '0.02em' }}>
          TAVIL · v2026.4
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="anim-tab">
      {true && (
        <>
          {/* Hero — cover band + overlapping avatar */}
          <div className="perfil-stag" style={{ ['--i' as any]: 0 }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  height: 180,
                  borderRadius: 14,
                  border: '1px solid var(--tavil-border)',
                  backgroundImage: `url(${process.env.PUBLIC_URL}/perfil-banner.png)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 35%',
                  overflow: 'hidden',
                }}
              />
              <button
                type="button"
                onClick={() => { galleryFromEditForm.current = false; setGallerySelected(avatarUrl); setShowAvatarGallery(true); }}
                aria-label="Canviar foto de perfil"
                style={{
                  position: 'absolute', left: 24, bottom: -56,
                  width: 112, height: 112, borderRadius: 999,
                  border: '5px solid var(--tavil-bg)',
                  boxShadow: '0 10px 24px -10px rgba(34, 39, 37, 0.18)',
                  overflow: 'hidden',
                  background: avatarBgStyle(avatarUrl), color: 'var(--tavil-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {avatarUrl
                  ? <img src={resolveImg(avatarUrl)} alt="" loading="lazy" style={avatarImgStyle(avatarUrl)} />
                  : <span>{initials}</span>}
              </button>
            </div>
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 24, paddingLeft: 154, paddingRight: 8, paddingTop: 10,
                marginBottom: 64,
              }}
            >
              <p style={{ fontSize: 14.5, color: 'var(--tavil-muted)', margin: 0 }}>
                {currentUser?.role ?? '—'} · {currentUser?.dept ?? '—'}
              </p>
              <button
                onClick={() => setShowEdit(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 40, padding: '0 16px', borderRadius: 8,
                  background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                  color: 'var(--tavil-text)', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                  cursor: 'pointer', transition: 'background 160ms var(--ease-out-cubic)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--tavil-bgAlt)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--tavil-card)'; }}
              >
                <Pencil size={14} /> {t('perfil.editProfile')}
              </button>
            </div>
          </div>

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 28, marginTop: 32 }}>
            {/* Left: Dades personals */}
            <div className="perfil-stag" style={{ ['--i' as any]: 1 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tavil-faint)' }}>{t('perfil.account')}</div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--tavil-text)', marginTop: 4 }}>{t('perfil.personalData')}</h2>
              </div>
              <div style={{ background: 'var(--tavil-card)', borderRadius: 14, border: '1px solid var(--tavil-border)' }}>
                {([
                  { I: Mail,     label: t('perfil.corporateEmail'), value: currentUser?.email ?? '—' },
                  { I: Phone,    label: t('perfil.phone'),           value: currentUser?.phone || '—' },
                  { I: Phone,    label: t('perfil.workerCode'),      value: currentUser?.ext || '—' },
                  { I: MapPin,   label: t('perfil.office'),          value: currentUser?.location || '—' },
                  { I: Calendar, label: t('perfil.joinDate'),        value: '12 setembre 2022' },
                ] as { I: React.ElementType; label: string; value: string }[]).map((r, i, arr) => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--tavil-bgAlt)', color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <r.I size={15} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tavil-faint)', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Accés ràpid */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tavil-faint)', marginBottom: 10 }}>{t('perfil.quickAccess')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => onNavigate?.('Solicituds')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 140ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--tavil-card)')}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--tavil-bgAlt)', color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tavil-text)' }}>Solicita un dissabte laborable</div>
                      <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 1 }}>Dies no ordinaris</div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                  </button>
                  <a
                    href="https://tavil.bizneohr.com/sessions/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 12, textDecoration: 'none', fontFamily: 'inherit', transition: 'background 140ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--tavil-card)')}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--tavil-bgAlt)', color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ExternalLink size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                      <img src={process.env.PUBLIC_URL + '/assets/images/logoBizneo.svg'} alt="Bizneo HR" style={{ height: 18, width: 'auto', display: 'block' }} />
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Preferències */}
            <div className="perfil-stag" style={{ ['--i' as any]: 2 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tavil-faint)' }}>{t('perfil.preferences')}</div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em', color: 'var(--tavil-text)', marginTop: 4 }}>{t('perfil.quickSettings')}</h2>
              </div>

              {/* Idioma */}
              <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: 20, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tavil-faint)', marginBottom: 14 }}>{t('perfil.language')}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([{ code: 'ca', label: 'Català' }, { code: 'es', label: 'Español' }, { code: 'en', label: 'English' }] as const).map(l => {
                    const a = i18n.language === l.code;
                    return (
                      <button key={l.code} onClick={() => i18n.changeLanguage(l.code)}
                        style={{
                          flex: 1, padding: 12, borderRadius: 10,
                          border: `1px solid ${a ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                          background: a ? 'var(--tavil-accent-light)' : 'var(--tavil-bgAlt)',
                          color: a ? 'var(--tavil-accent-dark)' : 'var(--tavil-text)',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          cursor: 'pointer', transition: 'all 160ms var(--ease-out-cubic)',
                        }}
                      >{l.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Tema */}
              <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: 20, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--tavil-faint)', marginBottom: 14 }}>{t('perfil.theme')}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([{ dark: false, label: t('perfil.light'), I: Sun }, { dark: true, label: t('perfil.dark'), I: Moon }] as const).map(o => {
                    const a = (isDarkMode ?? false) === o.dark;
                    return (
                      <button key={String(o.dark)} onClick={() => { if ((isDarkMode ?? false) !== o.dark) toggleDarkMode?.(); }}
                        style={{
                          flex: 1, padding: 14, borderRadius: 10,
                          border: `1px solid ${a ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                          background: a ? 'var(--tavil-accent-light)' : 'var(--tavil-bgAlt)',
                          color: a ? 'var(--tavil-accent-dark)' : 'var(--tavil-text)',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'all 160ms var(--ease-out-cubic)',
                        }}
                      ><o.I size={16} />{o.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Notificacions · Privacitat · Suport — accordion */}
              <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
                {([
                  { id: 'notifs',  I: Bell,     label: t('perfil.notifications') },
                  { id: 'privacy', I: Eye,      label: t('perfil.privacyAccess') },
                  { id: 'support', I: Settings, label: t('perfil.helpSupport') },
                ] as { id: 'notifs' | 'privacy' | 'support'; I: React.ElementType; label: string }[]).map((r, i, arr) => {
                  const open = expandedRow === r.id;
                  return (
                    <div key={r.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                      <button
                        onClick={() => setExpandedRow(open ? null : r.id)}
                        aria-expanded={open}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                          padding: '14px 18px',
                          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          transition: 'background 160ms var(--ease-out-cubic)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--tavil-bgAlt)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--tavil-bgAlt)', color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <r.I size={15} />
                        </div>
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--tavil-text)' }}>{r.label}</span>
                        <ChevronRight
                          size={15}
                          style={{
                            color: 'var(--tavil-faint)',
                            transform: open ? 'rotate(90deg)' : 'none',
                            transition: 'transform 200ms var(--ease-out-cubic)',
                          }}
                        />
                      </button>
                      {open && (
                        <div style={{ padding: '4px 18px 18px', borderTop: '1px solid var(--tavil-border)', background: 'var(--tavil-bgAlt)' }} className="anim-fade-in">
                          {r.id === 'notifs' && (
                            <div style={{ paddingTop: 14 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tavil-faint)', marginBottom: 10 }}>Canals</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {([
                                  { k: 'mail',   label: 'Per correu',    desc: 'Email per cada notificació nova.',        on: notifCorreu, toggle: async () => {
                                    const nv = !notifCorreu;
                                    setNotifCorreu(nv);
                                    try { const u = await apiUpdateMe({ email_notifs: nv ? 1 : 0 }); onUserUpdate(u); }
                                    catch { setNotifCorreu(!nv); }
                                  } },
                                  { k: 'portal', label: 'Al portal',     desc: 'Mostra la campaneta amb les novetats.',    on: notifPortal, toggle: () => setNotifPortal(!notifPortal) },
                                  { k: 'push',   label: 'Push al mòbil', desc: 'Notificacions empenyedes al dispositiu.', on: notifPush,   toggle: toggleNotifPush },
                                ] as { k: string; label: string; desc: string; on: boolean; toggle: () => void }[]).map(c => (
                                  <div key={c.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{c.label}</div>
                                      <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>{c.desc}</div>
                                    </div>
                                    <Toggle on={c.on} onToggle={c.toggle} />
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--tavil-border)' }}>
                                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tavil-faint)', marginBottom: 10 }}>Categories</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {([
                                    { k: 'noticies',   l: 'Notícies',    d: 'Comunicats i articles nous.' },
                                    { k: 'agenda',     l: 'Agenda',      d: 'Esdeveniments i recordatoris.' },
                                    { k: 'solicituds', l: 'Sol·licituds', d: 'Aprovacions i estat de peticions.' },
                                    { k: 'campus',     l: 'Campus',      d: 'Cursos nous i formacions assignades.' },
                                  ] as { k: keyof NotifCats; l: string; d: string }[]).map(c => (
                                    <div key={c.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{c.l}</div>
                                        <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>{c.d}</div>
                                      </div>
                                      <Toggle on={notifCats[c.k]} onToggle={() => toggleNotifCat(c.k)} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {r.id === 'privacy' && (
                            <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>Visible al directori</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>La resta de l'equip et podrà trobar a Qui és qui.</div>
                                </div>
                                <Toggle on={visInDir} onToggle={toggleVisInDir} />
                              </div>
                            </div>
                          )}
                          {r.id === 'support' && (
                            <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div>
                                <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>Contacte</div>
                                <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>
                                  Per a qualsevol incidència o suggeriment del portal, escriu a{' '}
                                  <a href="mailto:portalweb@tavil.net" style={{ color: 'var(--tavil-accent)', textDecoration: 'underline' }}>portalweb@tavil.net</a>.
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTop: '1px solid var(--tavil-border)' }}>
                                <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>Versió del portal</div>
                                <span style={{ fontSize: 12, color: 'var(--tavil-muted)', fontVariantNumeric: 'tabular-nums' }}>2026.05.25</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                style={{
                  width: '100%', marginTop: 18, padding: 14, borderRadius: 10,
                  border: '1px solid var(--tavil-accent)', background: 'transparent',
                  color: 'var(--tavil-accent)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 160ms var(--ease-out-cubic)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--tavil-accent-light)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <LogOut size={16} /> {t('perfil.logout')}
              </button>
            </div>
          </div>

          {/* Edit-profile modal */}
          {showEdit && createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center anim-fade-in"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => { discardAvatarPending(); setShowEdit(false); }}
              onKeyDown={e => { if (e.key === 'Escape') { discardAvatarPending(); setShowEdit(false); } }}
              tabIndex={-1}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  width: 620, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 48px)',
                  overflowY: 'auto',
                  background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                  borderRadius: 14, padding: 20,
                  boxShadow: '0 16px 48px -16px rgba(34,39,37,0.30)',
                }}
                className="anim-pop"
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tavil-text)', margin: 0 }}>{t('perfil.editProfile')}</h3>
                  <button onClick={() => { discardAvatarPending(); setShowEdit(false); }} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tavil-muted)' }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Avatar block */}
                <div style={{ display: 'flex', gap: 18, padding: '6px 0 18px', marginBottom: 18, borderBottom: '1px solid var(--tavil-border)' }}>
                  <div
                    style={{
                      width: 72, height: 72, borderRadius: 999, flexShrink: 0,
                      overflow: 'hidden', background: avatarBgStyle(avatarUrl), color: 'var(--tavil-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em',
                    }}
                  >
                    {avatarUrl ? <img src={resolveImg(avatarUrl)} alt="" loading="lazy" style={avatarImgStyle(avatarUrl)} /> : <span>{initials}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)' }}>Foto de perfil</div>
                    <div style={{ fontSize: 12, color: 'var(--tavil-muted)', marginTop: 4, marginBottom: 10 }}>
                      JPG o PNG, mínim 256×256 px. Es mostra a tot el portal.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { galleryFromEditForm.current = true; setGallerySelected(avatarUrl); setShowAvatarGallery(true); }}
                        disabled={avatarUploading}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 8,
                          background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                          color: 'var(--tavil-text)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                          cursor: avatarUploading ? 'wait' : 'pointer', opacity: avatarUploading ? 0.6 : 1,
                        }}
                      >
                        <Plus size={13} /> {avatarUploading ? 'Pujant…' : 'Canviar foto'}
                      </button>
                      <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarPick(f); e.currentTarget.value = ''; }} />
                      {avatarUrl && (
                        <button
                          onClick={handleAvatarRemove}
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            background: 'transparent', border: 'none',
                            color: 'var(--tavil-muted)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                          }}
                        >Elimina</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Read-only data grid */}
                <div style={{ background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                    {([
                      [t('perfil.personalData'),     currentUser?.name ?? '—'],
                      [t('perfil.corporateEmail'),   currentUser?.email ?? '—'],
                      ['Rol',                        currentUser?.role ?? '—'],
                      ['Departament',                currentUser?.dept ?? '—'],
                      [t('perfil.phone'),            currentUser?.phone || '—'],
                      [t('perfil.workerCode'),       currentUser?.ext || '—'],
                      [t('perfil.office'),           currentUser?.location || '—'],
                      [t('perfil.joinDate'),         '12 setembre 2022'],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tavil-faint)', marginBottom: 4 }}>{k}</div>
                        <div style={{ fontSize: 13.5, color: 'var(--tavil-text)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ gridColumn: '1 / -1', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={12} style={{ color: 'var(--tavil-faint)' }} />
                    <span style={{ fontSize: 11.5, color: 'var(--tavil-faint)' }}>
                      Totes les dades les gestiona l'administrador del portal.
                    </span>
                  </div>
                </div>

                {/* Directory toggle */}
                <div style={{ marginTop: 4, padding: '12px 14px', background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    role="switch"
                    aria-checked={visInDir}
                    onClick={toggleVisInDir}
                    style={{
                      position: 'relative', width: 38, height: 22, borderRadius: 11,
                      background: visInDir ? 'var(--tavil-accent)' : 'var(--tavil-border)',
                      border: 'none', cursor: 'pointer', flexShrink: 0,
                      transition: 'background 200ms var(--ease-out-cubic)', padding: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, left: visInDir ? 18 : 2,
                      width: 18, height: 18, borderRadius: 9, background: '#fff',
                      transition: 'left 200ms var(--ease-out-cubic)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                    }} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--tavil-text)' }}>Visible al directori</div>
                    <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>
                      La resta de l'equip et podrà trobar a Qui és qui.
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--tavil-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--tavil-faint)' }}>
                    Els canvis es desen al teu compte TAVIL.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { discardAvatarPending(); setShowEdit(false); }}
                      disabled={avatarSaving}
                      style={{
                        padding: '8px 14px', borderRadius: 8,
                        background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                        color: 'var(--tavil-text)', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: avatarSaving ? 'wait' : 'pointer',
                        opacity: avatarSaving ? 0.6 : 1,
                      }}
                    >{t('common.cancel')}</button>
                    <button
                      onClick={async () => { const ok = await commitAvatarPending(); if (ok) setShowEdit(false); }}
                      disabled={avatarSaving}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 8,
                        background: 'var(--tavil-accent)', border: 'none',
                        color: 'var(--tavil-bg)', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                        cursor: avatarSaving ? 'wait' : 'pointer', opacity: avatarSaving ? 0.7 : 1,
                      }}
                    ><Check size={14} /> {avatarSaving ? 'Desant…' : 'Desa els canvis'}</button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {false && (
        <div className="max-w-2xl space-y-4">
          {/* Aparença */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4"><Sun size={15} className="text-gray-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Aparença</h3></div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { dark: false, label: 'Clar', Icon: Sun },
                { dark: true,  label: 'Fosc', Icon: Moon },
              ] as const).map(o => {
                const active = (isDarkMode ?? false) === o.dark;
                return (
                  <button
                    key={String(o.dark)}
                    onClick={() => { if ((isDarkMode ?? false) !== o.dark) toggleDarkMode?.(); }}
                    className={cn(
                      'flex flex-col items-center gap-2 py-4 rounded-lg border transition-colors',
                      active
                        ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    )}
                  >
                    <o.Icon size={18} />
                    <span className="text-xs font-medium">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Idioma */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4"><Globe size={15} className="text-gray-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Idioma</h3></div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'ca', label: 'Català' },
                { code: 'es', label: 'Castellano' },
                { code: 'en', label: 'English' },
              ].map(l => {
                const active = i18n.language === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => i18n.changeLanguage(l.code)}
                    className={cn(
                      'py-2.5 rounded-lg border text-xs font-medium transition-colors',
                      active
                        ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    )}
                  >{l.label}</button>
                );
              })}
            </div>
          </div>

          {/* Comunicacions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4"><Bell size={15} className="text-gray-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Comunicacions</h3></div>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-800 dark:text-zinc-200">Per correu</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Rebràs un email per cada notificació nova.</div>
                </div>
                <Toggle on={notifCorreu} onToggle={async () => {
                  const newVal = !notifCorreu;
                  setNotifCorreu(newVal);
                  try { const u = await apiUpdateMe({ email_notifs: newVal ? 1 : 0 }); onUserUpdate(u); }
                  catch { setNotifCorreu(!newVal); }
                }} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-800 dark:text-zinc-200">Al portal</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Mostra la campaneta amb les novetats.</div>
                </div>
                <Toggle on={notifPortal} onToggle={() => setNotifPortal(!notifPortal)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-800 dark:text-zinc-200">Push al mòbil</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Notificacions empenyedes al dispositiu (quan estigui actiu).</div>
                </div>
                <Toggle on={notifPush} onToggle={toggleNotifPush} />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Categories</div>
              <div className="space-y-2.5">
                {([
                  { k: 'noticies', l: 'Notícies', d: 'Comunicats i articles nous.' },
                  { k: 'agenda', l: 'Agenda', d: 'Esdeveniments i recordatoris.' },
                  { k: 'solicituds', l: 'Sol·licituds', d: 'Aprovacions i estat de peticions.' },
                  { k: 'campus', l: 'Campus', d: 'Cursos nous i formacions assignades.' },
                ] as const).map(c => (
                  <div key={c.k} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-gray-800 dark:text-zinc-200">{c.l}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{c.d}</div>
                    </div>
                    <Toggle on={notifCats[c.k]} onToggle={() => toggleNotifCat(c.k)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compte */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4"><Shield size={15} className="text-gray-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Compte</h3></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-zinc-300">Correu</span>
                <span className="text-gray-500 dark:text-zinc-400">{currentUser?.email ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-zinc-300">Departament</span>
                <span className="text-gray-500 dark:text-zinc-400">{currentUser?.dept ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-zinc-300">Rol</span>
                <span className="text-gray-500 dark:text-zinc-400">{currentUser?.role ?? '—'}</span>
              </div>
              {onLogout && (
                <button onClick={onLogout} className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition-colors">
                  <LogOut size={14} /> Tancar sessió
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      {/* ── Avatar gallery picker (desktop) ── */}
      {showAvatarGallery && createPortal((() => {
        const ext = currentUser?.ext ?? '';
        const PHOTOS_BASE = '/uploads/photos/';
        const hrPhoto = ext ? `${PHOTOS_BASE}${ext}.png` : null;
        const options: { url: string; label: string; candidates?: string[]; contain?: boolean; hideOnError?: boolean }[] = [
          ...(hrPhoto ? [{ url: hrPhoto, label: 'La meva foto', candidates: [`${PHOTOS_BASE}${ext}.png`, `${PHOTOS_BASE}${ext}.jpg`, `${PHOTOS_BASE}${ext}.jpeg`], hideOnError: true }] : []),
          { url: '/tavil-header.jpg', label: 'Nau Tavil' },
          { url: '/assets/images/tavilLogo.png', label: 'Logo Tavil', contain: true },
        ];
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md anim-fade-in"
            onClick={e => { if (e.target === e.currentTarget) setShowAvatarGallery(false); }}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-sm mx-4 anim-scale-in"
              style={{ boxShadow: '0 8px 32px rgba(34,39,37,0.18)', border: '1px solid var(--tavil-border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tavil-accent)] mb-1">Perfil</div>
              <h3 className="font-bold text-[var(--tavil-text)] text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Canvia la foto de perfil</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {options.map(opt => {
                  const resolved = resolvedGalleryUrls.current[opt.url] ?? opt.url;
                  const isSelected = gallerySelected === resolved || gallerySelected === opt.url;
                  return (
                    <button key={opt.url} onClick={() => setGallerySelected(resolved)}
                      className="press flex flex-col items-center gap-1.5 focus:outline-none"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden"
                        style={{ border: isSelected ? '2.5px solid var(--tavil-text)' : '2px solid var(--tavil-border)', transition: 'border-color 140ms', background: opt.contain ? '#f5f5f0' : undefined }}>
                        <img
                          src={resolveImg(opt.url)}
                          alt={opt.label}
                          className={`w-full h-full ${opt.contain ? 'object-contain p-2' : 'object-cover'}`}
                          onError={e => {
                            const img = e.currentTarget;
                            const cands = opt.candidates;
                            if (cands && !img.dataset.tried) {
                              img.dataset.tried = '1';
                              const next = cands.find(c => resolveImg(c) !== img.src);
                              if (next) {
                                img.src = resolveImg(next);
                                img.onload = () => {
                                  resolvedGalleryUrls.current[opt.url] = next;
                                  setGallerySelected(prev => prev === opt.url ? next : prev);
                                };
                                return;
                              }
                            }
                            if (opt.hideOnError) { const btn = img.closest('button'); if (btn) btn.style.display = 'none'; }
                            else img.parentElement!.parentElement!.style.opacity = '0.35';
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-end justify-end p-1.5">
                            <div className="w-5 h-5 rounded-full bg-[var(--tavil-text)] flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#f7f7f2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-[var(--tavil-muted)]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { if (gallerySelected) { setPendingAvatar(gallerySelected); if (!galleryFromEditForm.current) commitAvatarUrl(gallerySelected); } setShowAvatarGallery(false); }}
                  disabled={!gallerySelected}
                  className="press w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--tavil-text)] text-[var(--tavil-bg)] disabled:opacity-40 transition-opacity"
                >Confirmar</button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
      {avatarErr && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 20px', borderRadius: 10, background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', pointerEvents: 'none' }}>
          {avatarErr}
        </div>
      )}
    </div>
  );
}

// ── Onboarding Modal ─────────────────────────────────────────────────────────



// ── Quiz Builder Modal ────────────────────────────────────────────────────────

type QBQuestion = {
  _key: string;
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'matching' | 'open_text' | 'slide';
  question: string;
  explanation: string;
  points: number;
  media_url?: string;
  options: QBOption[];
};
type QBOption = {
  _key: string;
  text: string;
  is_correct: number;
  match_pair: string;
};

function mkKey() { return Math.random().toString(36).slice(2); }

function QuizBuilderModal({ quiz, onClose, onSaved }: {
  quiz: Quiz | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!quiz;
  const [title, setTitle] = useState(quiz?.title ?? '');
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [category, setCategory] = useState(quiz?.category ?? '');
  const [timeLimit, setTimeLimit] = useState(quiz?.time_limit ?? 0);
  const [passingScore, setPassingScore] = useState(quiz?.passing_score ?? 70);
  const [active, setActive] = useState(quiz?.active ?? 1);
  const [image, setImage] = useState(quiz?.image ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  // date-only format: 'YYYY-MM-DD' — DB returns 'YYYY-MM-DD HH:MM:SS'
  const dbToLocal = (s: string | null | undefined) => s ? s.slice(0, 10) : '';
  const localToDb = (s: string) => s ? s + ' 00:00:00' : null;
  const [startAt, setStartAt] = useState(dbToLocal(quiz?.start_at));
  const [endAt, setEndAt] = useState(dbToLocal(quiz?.end_at));
  const [targetDepts, setTargetDepts] = useState<string[]>(quiz?.target_departments ?? []);
  const [targetUsersBO, setTargetUsersBO] = useState<number[]>((quiz?.target_users ?? []).map(Number));
  const [questions, setQuestions] = useState<QBQuestion[]>(() => {
    if (!quiz?.questions) return [];
    return quiz.questions.map(q => ({
      _key: mkKey(),
      type: q.type as QBQuestion['type'],
      question: q.question,
      explanation: q.explanation ?? '',
      points: q.points,
      options: (q.options ?? []).map(o => ({
        _key: mkKey(),
        text: o.text,
        is_correct: o.is_correct ?? 0,
        match_pair: o.match_pair ?? '',
      })),
    }));
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // On edit: list endpoint returns quizzes w/o questions. Fetch full quiz.
  useEffect(() => {
    if (!quiz?.id) return;
    if (questions.length > 0) return; // already populated
    setLoadingQuiz(true);
    apiGetQuiz(quiz.id)
      .then(full => {
        setTitle(full.title ?? '');
        setDescription(full.description ?? '');
        setCategory(full.category ?? '');
        setTimeLimit(full.time_limit ?? 0);
        setPassingScore(full.passing_score ?? 70);
        setActive(full.active ?? 1);
        setImage(full.image ?? '');
        setStartAt(dbToLocal(full.start_at));
        setEndAt(dbToLocal(full.end_at));
        setTargetDepts(full.target_departments ?? []);
        setQuestions((full.questions ?? []).map(q => ({
          _key: mkKey(),
          type: q.type as QBQuestion['type'],
          question: q.question,
          explanation: q.explanation ?? '',
          points: q.points,
          options: (q.options ?? []).map(o => ({
            _key: mkKey(),
            text: o.text,
            is_correct: o.is_correct ?? 0,
            match_pair: o.match_pair ?? '',
          })),
        })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingQuiz(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.id]);

  const addQuestion = (type: QBQuestion['type']) => {
    const defaultOpts: QBOption[] = type === 'multiple_choice'
      ? [{ _key: mkKey(), text: '', is_correct: 0, match_pair: '' },
         { _key: mkKey(), text: '', is_correct: 0, match_pair: '' },
         { _key: mkKey(), text: '', is_correct: 0, match_pair: '' },
         { _key: mkKey(), text: '', is_correct: 0, match_pair: '' }]
      : type === 'matching'
      ? [{ _key: mkKey(), text: '', is_correct: 0, match_pair: '' },
         { _key: mkKey(), text: '', is_correct: 0, match_pair: '' }]
      : [];
    setQuestions(qs => [...qs, {
      _key: mkKey(), type, question: '', explanation: '', points: 1, options: defaultOpts
    }]);
  };

  const updateQ = (key: string, patch: Partial<QBQuestion>) =>
    setQuestions(qs => qs.map(q => q._key === key ? { ...q, ...patch } : q));

  const removeQ = (key: string) =>
    setQuestions(qs => qs.filter(q => q._key !== key));

  const updateOpt = (qKey: string, oKey: string, patch: Partial<QBOption>) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: q.options.map(o => o._key === oKey ? { ...o, ...patch } : o) }
      : q));

  const addOpt = (qKey: string) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: [...q.options, { _key: mkKey(), text: '', is_correct: 0, match_pair: '' }] }
      : q));

  const removeOpt = (qKey: string, oKey: string) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: q.options.filter(o => o._key !== oKey) }
      : q));

  const setCorrect = (qKey: string, oKey: string) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: q.options.map(o => ({ ...o, is_correct: o._key === oKey ? 1 : 0 })) }
      : q));

  const moveQ = (idx: number, dir: -1 | 1) => {
    const nIdx = idx + dir;
    if (nIdx < 0 || nIdx >= questions.length) return;
    setQuestions(qs => {
      const arr = [...qs];
      [arr[idx], arr[nIdx]] = [arr[nIdx], arr[idx]];
      return arr;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('El títol és obligatori'); return; }
    setSaving(true); setError('');
    try {
      let imageUrl = image;
      if (imageFile) imageUrl = await apiUploadImage(imageFile);
      const payload: QuizIn = {
        title: title.trim(),
        description: description.trim(),
        image: imageUrl,
        category: category.trim(),
        time_limit: timeLimit,
        passing_score: passingScore,
        active,
        start_at: localToDb(startAt),
        end_at: localToDb(endAt),
        target_departments: targetDepts,
        target_users: targetUsersBO,
        questions: questions.map((q, qi) => ({
          type: q.type,
          question: q.question,
          explanation: q.explanation,
          points: q.points,
          position: qi,
          options: q.options.map((o, oi) => ({
            text: o.text,
            is_correct: o.is_correct,
            match_pair: o.match_pair,
            position: oi,
          })),
        })),
      };
      if (isEdit && quiz) {
        await apiUpdateQuiz(quiz.id, payload);
      } else {
        await apiCreateQuiz(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error desconegut');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30';
  const labelCls = 'text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1';
  // macOS-style datetime input: subtle border, rounded, monospaced numerics
  const dateCls = 'w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-gradient-to-b from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 font-medium tabular-nums shadow-sm';

  // Duration in days
  const startMs = startAt ? new Date(startAt).getTime() : NaN;
  const endMs   = endAt   ? new Date(endAt).getTime()   : NaN;
  const durationDays = (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs)
    ? Math.round((endMs - startMs) / 86400000) + 1
    : NaN;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center anim-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col anim-scale-in" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-red-600" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar formació' : 'Nova formació'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">{error}</p>}

          {/* Image upload (news pattern) */}
          <div>
            <label className={labelCls}>Imatge de portada</label>
            <div className="flex items-center gap-3">
              {(imageFile || image) && (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : image}
                  alt=""
                  className="w-24 h-16 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 flex-shrink-0"
                />
              )}
              <label className="flex-1 cursor-pointer text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/40 font-medium border border-dashed border-red-200 dark:border-red-800 text-center transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
                {imageFile ? imageFile.name : (image ? 'Canviar imatge' : 'Pujar imatge')}
              </label>
              {(imageFile || image) && (
                <button type="button" onClick={() => { setImageFile(null); setImage(''); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Treure</button>
              )}
            </div>
          </div>

          {/* macOS-style date pickers — informational */}
          <div className="rounded-2xl bg-gradient-to-br from-red-50 to-red-50 dark:from-red-950/20 dark:to-red-950/20 border border-red-100 dark:border-red-900/40 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-red-600" />
              <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-widest">Finestra de la formació</span>
              <span className="text-[10px] text-red-500 dark:text-red-400 ml-auto">informatiu</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Inici</label>
                <DatePicker value={startAt} onChange={setStartAt} />
              </div>
              <div>
                <label className={labelCls}>Final</label>
                <DatePicker value={endAt} onChange={setEndAt} />
              </div>
            </div>
            <div className="pt-2 border-t border-red-200/50 dark:border-red-800/40">
              <p className="text-[10px] text-red-500 dark:text-red-400 uppercase tracking-widest font-semibold">Durada</p>
              <p className="text-sm font-bold text-red-700 dark:text-red-300 tabular-nums">
                {isNaN(durationDays) ? '—' : `${durationDays} dia${durationDays !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Títol *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Nom de la formació" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Descripció</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls} rows={2} placeholder="Descripció opcional..." />
            </div>
            <div>
              <label className={labelCls}>Categoria</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className={inputCls} placeholder="Ex: Seguretat, RRHH..." />
            </div>
            <div>
              <label className={labelCls}>Límit de temps (min, 0 = sense límit)</label>
              <input type="number" min={0} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Puntuació mínima per aprovar (%)</label>
              <input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button type="button" onClick={() => setActive(a => a === 1 ? 0 : 1)} className={`relative inline-flex w-10 h-6 items-center rounded-full transition-colors ${active === 1 ? 'bg-red-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                  <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: active === 1 ? 'translateX(18px)' : 'translateX(2px)' }} />
                </button>
                <span className="text-sm text-gray-700 dark:text-zinc-300">Actiu (visible als empleats)</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Departaments destinataris</label>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2">
                {targetDepts.length === 0 ? 'Sense selecció: visible per a tothom.' : `${targetDepts.length} dep. seleccionat${targetDepts.length !== 1 ? 's' : ''}.`}
              </p>
              <div className="flex flex-wrap gap-2">
                {DEPT_ORDER.map(d => {
                  const on = targetDepts.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTargetDepts(prev => on ? prev.filter(x => x !== d) : [...prev, d])}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${on
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-red-400'}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div>
            {loadingQuiz && <div className="text-center py-4 text-gray-400 text-sm">Carregant preguntes...</div>}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{questions.length} pregunta{questions.length !== 1 ? 'es' : ''}</p>
              <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={() => addQuestion('multiple_choice')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 hover:bg-blue-100 transition-colors font-medium"><Plus size={12} />Opció múltiple</button>
                <button onClick={() => addQuestion('matching')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 hover:bg-amber-100 transition-colors font-medium"><Plus size={12} />Relacionar</button>
                <button onClick={() => addQuestion('open_text')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600 hover:bg-green-100 transition-colors font-medium"><Plus size={12} />Resposta oberta</button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, qi) => (
                <div key={q._key} className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4 space-y-3 bg-gray-50/50 dark:bg-zinc-800/30">
                  {/* Q header */}
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 pt-1">
                      <button onClick={() => moveQ(qi, -1)} disabled={qi === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"><GripVertical size={14} /></button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          q.type === 'multiple_choice' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' :
                          q.type === 'matching' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600' :
                          'bg-green-100 dark:bg-green-950/40 text-green-600'
                        }`}>
                          {q.type === 'multiple_choice' ? 'Opció múltiple' : q.type === 'matching' ? 'Relacionar' : 'Resposta oberta'}
                        </span>
                        <span className="text-[10px] text-gray-400">Pregunta {qi + 1}</span>
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => moveQ(qi, -1)} disabled={qi === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1 transition-colors text-xs">▲</button>
                          <button onClick={() => moveQ(qi, 1)} disabled={qi === questions.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1 transition-colors text-xs">▼</button>
                          <button onClick={() => removeQ(q._key)} className="text-red-400 hover:text-red-600 ml-2 transition-colors"><X size={14} /></button>
                        </div>
                      </div>
                      <input value={q.question} onChange={e => updateQ(q._key, { question: e.target.value })}
                        className={inputCls} placeholder="Text de la pregunta..." />
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Punts</label>
                    <input type="number" min={1} value={q.points} onChange={e => updateQ(q._key, { points: Number(e.target.value) })}
                      className="w-16 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm text-center bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none" />
                  </div>

                  {/* Options — multiple choice */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Opcions (marca la correcta)</p>
                      {q.options.map((o, oi) => (
                        <div key={o._key} className="flex items-center gap-2">
                          <button onClick={() => setCorrect(q._key, o._key)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${o.is_correct ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-zinc-600'}`}>
                            {o.is_correct ? <Check size={10} className="text-white" /> : null}
                          </button>
                          <span className="text-xs font-bold text-gray-400 w-4">{String.fromCharCode(65 + oi)}</span>
                          <input value={o.text} onChange={e => updateOpt(q._key, o._key, { text: e.target.value })}
                            className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                            placeholder={`Opció ${String.fromCharCode(65 + oi)}`} />
                          {q.options.length > 2 && (
                            <button onClick={() => removeOpt(q._key, o._key)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addOpt(q._key)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1 transition-colors"><Plus size={12} />Afegir opció</button>
                    </div>
                  )}

                  {/* Options — matching */}
                  {q.type === 'matching' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Parelles (esquerra → dreta)</p>
                      {q.options.map((o, oi) => (
                        <div key={o._key} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-4">{oi + 1}</span>
                          <input value={o.text} onChange={e => updateOpt(q._key, o._key, { text: e.target.value })}
                            className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder="Element esquerra..." />
                          <span className="text-gray-400">→</span>
                          <input value={o.match_pair} onChange={e => updateOpt(q._key, o._key, { match_pair: e.target.value })}
                            className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                            placeholder="Element dreta..." />
                          {q.options.length > 2 && (
                            <button onClick={() => removeOpt(q._key, o._key)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addOpt(q._key)} className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1 mt-1 transition-colors"><Plus size={12} />Afegir parella</button>
                    </div>
                  )}

                  {/* Open text — just preview */}
                  {q.type === 'open_text' && (
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-600">L'empleat respondrà amb text lliure. No es corregeix automàticament.</p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Explicació (opcional, es mostra al corregir)</label>
                    <input value={q.explanation} onChange={e => updateQ(q._key, { explanation: e.target.value })}
                      className={inputCls} placeholder="Explicació de la resposta correcta..." />
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                  Afegeix preguntes amb els botons de dalt
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">Cancel·lar</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            {saving ? 'Guardant...' : (isEdit ? 'Actualitzar' : 'Crear formació')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Quiz Results Drawer (inline, expands quiz card) ───────────────────────────

function QuizResultsDrawer({ quizId }: { quizId: number }) {
  const [rows, setRows] = useState<QuizResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNonCompleters, setShowNonCompleters] = useState(false);
  const [nc, setNc] = useState<NonCompletersResult | null>(null);
  const [ncLoading, setNcLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetQuizResults(quizId)
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  const loadNonCompleters = () => {
    if (nc) { setShowNonCompleters(v => !v); return; }
    setNcLoading(true);
    setShowNonCompleters(true);
    apiGetQuizNonCompleters(quizId)
      .then(setNc)
      .catch(e => setError(e.message))
      .finally(() => setNcLoading(false));
  };

  const total  = rows.length;
  const passed = rows.filter(r => r.passed).length;
  const avgPct = total ? Math.round(rows.reduce((s, r) => s + r.percentage, 0) / total) : 0;

  return (
    <div className="border-t border-gray-100 dark:border-zinc-800 mt-3 pt-3 anim-fade-in">
      {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 mb-2">{error}</p>}
      {loading ? <div className="text-center py-4 text-gray-400 text-xs">Carregant resultats...</div> : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2">
              <p className="text-[9px] text-red-600 dark:text-red-400 uppercase tracking-widest font-semibold">Total</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300 tabular-nums leading-tight">{total}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2">
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-semibold">Aprovats</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums leading-tight">{passed}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
              <p className="text-[9px] text-amber-600 dark:text-amber-400 uppercase tracking-widest font-semibold">Mitjana</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums leading-tight">{avgPct}%</p>
            </div>
          </div>
          {rows.length > 0 && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {rows.map(r => (
                <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/40">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                    {r.user_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{r.user_name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.user_dept} · {new Date(r.completed_at.replace(' ', 'T')).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold tabular-nums text-gray-900 dark:text-white leading-tight">{r.score}/{r.max_score}</p>
                    <p className={`text-[10px] font-semibold tabular-nums ${r.passed ? 'text-emerald-600' : 'text-red-500'}`}>{r.percentage}% {r.passed ? '✓' : '✗'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {rows.length === 0 && <p className="text-center py-2 text-gray-400 text-xs">Cap intent encara.</p>}

          {/* Non-completers filter */}
          <div className="pt-1">
            <button onClick={loadNonCompleters} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-zinc-400 hover:text-[#bf211e] transition-colors">
              <span>{showNonCompleters ? '▲' : '▼'}</span>
              Qui no ha fet la formació
              {nc && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">{nc.non_completers.length}</span>}
            </button>
            {showNonCompleters && (
              <div className="mt-2 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
                {ncLoading ? (
                  <p className="text-center py-3 text-gray-400 text-xs">Carregant...</p>
                ) : nc && nc.non_completers.length === 0 ? (
                  <p className="text-center py-3 text-emerald-600 text-xs">Tothom del públic objectiu ha completat la formació ✓</p>
                ) : nc ? (
                  <div className="max-h-48 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border-b border-gray-100 dark:border-zinc-800">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{nc.non_completers.length} de {nc.total_audience} pendents</p>
                    </div>
                    {nc.non_completers.map(u => (
                      <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-zinc-300 flex-shrink-0">
                          {u.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{u.dept}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Backoffice Tab ────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon, label, value, hint,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
}) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      className="rounded-xl border bg-white dark:bg-zinc-900 p-4 flex items-start gap-3 hover-lift"
      style={{ borderColor: hov ? 'var(--tavil-accent)' : 'var(--tavil-border)', transition: 'border-color 0.15s' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: hov ? 'var(--tavil-accent)' : 'var(--tavil-accent-light)', color: hov ? '#fff' : 'var(--tavil-accent)', transition: 'background 0.15s, color 0.15s' }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{label}</div>
        <div className="text-2xl font-bold tabular-nums leading-tight mt-0.5 text-gray-900 dark:text-white">{value}</div>
        {hint && <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{hint}</div>}
      </div>
    </div>
  );
}

// ── ExternalCourseModal ───────────────────────────────────────────────────────
const COURSE_CATEGORIES = ['Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Acollida', 'Producció', 'Habilitats', 'Idiomes', 'Altres'];

function ExternalCourseModal({ course, onClose, onSaved }: {
  course?: Course | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!course;
  const [title, setTitle] = useState(course?.title ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [url, setUrl] = useState(course?.url ?? '');
  const [category, setCategory] = useState(course?.category ?? '');
  const [hours, setHours] = useState(course?.hours ?? '');
  const [mandatory, setMandatory] = useState(!!(course?.mandatory));
  const [depts, setDepts] = useState<string[]>(() => {
    try { return JSON.parse(course?.departments || '[]'); } catch { return []; }
  });
  const [targetUsers, setTargetUsers] = useState<number[]>(course?.target_users ?? []);
  const [startAt, setStartAt] = useState(course?.start_at ?? '');
  const [endAt, setEndAt] = useState(course?.end_at ?? '');
  const [allUsers, setAllUsers] = useState<{ id: number; name: string; email: string; dept: string; avatar_url?: string | null }[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiAdminListUsers().then(us => setAllUsers(us.map(u => ({ id: u.id, name: u.name, email: u.email, dept: u.dept })))).catch(() => {});
  }, []);

  const toggleDept = (d: string) => setDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const removeTargetUser = (id: number) => setTargetUsers(prev => prev.filter(x => x !== id));
  const addTargetUser = (id: number) => { setTargetUsers(prev => prev.includes(id) ? prev : [...prev, id]); setUserSearch(''); };

  const filteredUsers = userSearch.trim().length > 0
    ? allUsers.filter(u => (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())) && !targetUsers.includes(u.id))
    : [];

  const handleSave = async () => {
    if (!title.trim()) { setErr('El títol és obligatori'); return; }
    if (!url.trim()) { setErr('L\'URL és obligatòria'); return; }
    setSaving(true); setErr('');
    const payload: ExternalCoursePayload = { title: title.trim(), description: description.trim(), url: url.trim(), category: category.trim(), hours: hours.trim(), mandatory: mandatory ? 1 : 0, departments: depts, target_users: targetUsers, start_at: startAt || null, end_at: endAt || null };
    try {
      if (isEdit) await apiUpdateExternalCourse(course!.id, payload);
      else await apiCreateExternalCourse(payload);
      onSaved();
    } catch (e: any) { setErr(e.message || 'Error desant'); setSaving(false); }
  };

  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';
  const inputCls = 'w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center backdrop-blur-sm bg-black/50 p-0 sm:p-6" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-md bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                <ExternalLink size={13} className="text-red-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{isEdit ? 'Editar formació externa' : 'Nova formació externa'}</h2>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 pl-8">El curs s'obre a una URL externa</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          {/* Títol */}
          <div className="space-y-1.5">
            <label className={labelCls}>Títol <span className="text-red-500">*</span></label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom de la formació" autoFocus />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label className={labelCls}>URL del curs <span className="text-red-500">*</span></label>
            <div className="relative">
              <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input className={`${inputCls} pl-8`} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." type="url" />
            </div>
          </div>

          {/* Categoria + Hores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Categoria</label>
              <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">— Cap —</option>
                {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Durada</label>
              <input className={inputCls} value={hours} onChange={e => setHours(e.target.value)} placeholder="p.ex. 4h" />
            </div>
          </div>

          {/* Descripció */}
          <div className="space-y-1.5">
            <label className={labelCls}>Descripció</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breu descripció del contingut..." />
          </div>

          {/* Obligatòria toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/50">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">Formació obligatòria</p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">Apareix destacada al catàleg</p>
            </div>
            <button type="button" onClick={() => setMandatory(m => !m)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${mandatory ? 'bg-red-600' : 'bg-gray-200 dark:bg-zinc-600'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${mandatory ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Data inici</label>
              <DatePicker value={startAt} onChange={setStartAt} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Data fi <span className="text-gray-400 font-normal">(opcional)</span></label>
              <DatePicker value={endAt} onChange={setEndAt} minDate={startAt || undefined} />
            </div>
          </div>

          {/* Departaments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Departaments destinataris</label>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                {depts.length === 0 ? 'Tots els departaments' : `${depts.length} seleccionat${depts.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEPT_ORDER.map(d => {
                const on = depts.includes(d);
                return (
                  <button key={d} type="button" onClick={() => toggleDept(d)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${on ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-red-300 hover:text-red-600'}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persones destinatàries */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Persones destinatàries</label>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                {targetUsers.length === 0 ? 'Cap persona específica' : `${targetUsers.length} persona${targetUsers.length !== 1 ? 'es' : ''}`}
              </span>
            </div>
            <div className="relative">
              <input
                className={inputCls}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Cerca per nom o email..."
              />
              {filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 max-h-44 overflow-y-auto">
                  {filteredUsers.slice(0, 8).map(u => (
                    <button key={u.id} type="button" onClick={() => addTargetUser(u.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-left transition-colors">
                      {u.avatar_url ? (
                        <img src={resolveImg(u.avatar_url)} alt="" loading="lazy" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {u.name.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{u.dept}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {targetUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {targetUsers.map(uid => {
                  const u = allUsers.find(x => x.id === uid);
                  return (
                    <span key={uid} className="inline-flex items-center gap-1 text-[11px] bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-full px-2 py-0.5">
                      {u?.name ?? `#${uid}`}
                      <button type="button" onClick={() => removeTargetUser(uid)} className="hover:text-red-900 dark:hover:text-red-100 leading-none">×</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {err && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg">
              <span className="text-xs text-red-600">{err}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-zinc-800 flex-shrink-0 bg-gray-50/50 dark:bg-zinc-900">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors">Cancel·lar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Desant…' : isEdit ? 'Desar canvis' : 'Crear formació'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BoAgendaPanel({ events, onRefresh, cardCls, inputCls, btnGhost }: {
  events: AgendaEvent[]; onRefresh: () => void;
  cardCls: string; inputCls: string; btnGhost: string;
}) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [aTitle, setATitle] = useState('');
  const [aDate, setADate] = useState('');
  const [aTime, setATime] = useState('');
  const [aTimeEnd, setATimeEnd] = useState('');
  const [aLocation, setALocation] = useState('');
  const [aType, setAType] = useState('Sessió interna');
  const [aDepts, setADepts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const reset = () => { setATitle(''); setADate(''); setATime(''); setATimeEnd(''); setALocation(''); setAType('Sessió interna'); setADepts([]); setEditId(null); setShowForm(false); };

  const openEdit = (ev: AgendaEvent) => {
    setEditId(ev.id); setATitle(ev.title);
    const y = new Date().getFullYear(); const mm = String(ev.month).padStart(2,'0'); const dd = String(ev.day).padStart(2,'0');
    setADate(`${y}-${mm}-${dd}`);
    setATime(ev.time || ''); setATimeEnd(ev.time_end || ''); setALocation(ev.location || ''); setAType(ev.type);
    setADepts(ev.target_departments ?? []);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!aTitle.trim() || !aDate) return;
    const [yStr,mStr,dStr] = aDate.split('-');
    const day = parseInt(dStr); const month = parseInt(mStr); const year = parseInt(yStr);
    if (!day || !month) return;
    setSaving(true);
    try {
      const fields = { title: aTitle.trim(), day, month, year, time: aTime.trim(), time_end: aTimeEnd.trim() || undefined, location: aLocation.trim(), type: aType, target_departments: aDepts };
      if (editId) await apiUpdateAgendaEvent(editId, fields);
      else await apiCreateAgendaEvent(fields);
      onRefresh(); reset();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try { await apiDeleteAgendaEvent(id); onRefresh(); } catch (e) { console.error(e); }
    setConfirmDel(null);
  };

  const labelCls = 'block text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1';

  const sorted = [...events].sort((a,b) => a.month !== b.month ? a.month - b.month : a.day - b.day);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-zinc-400">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
          <Plus size={14} /> Nou event
        </button>
      </div>

      {showForm && (
        <div className={`${cardCls} border-red-200 dark:border-red-800 space-y-3`}>
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{editId ? 'Editar event' : 'Nou event'}</p>
            <button onClick={reset} className={btnGhost}><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><label className={labelCls}>Títol *</label><input value={aTitle} onChange={e => setATitle(e.target.value)} className={inputCls} placeholder="Títol de l'event" /></div>
            <div className="md:col-span-2"><label className={labelCls}>Data *</label><DatePicker value={aDate} onChange={setADate} /></div>
            <div><label className={labelCls}>Hora inici</label><TimePicker value={aTime} onChange={setATime} optional /></div>
            <div><label className={labelCls}>Hora final <span className="normal-case text-gray-400">(opcional)</span></label><TimePicker value={aTimeEnd} onChange={setATimeEnd} optional /></div>
            <div className="md:col-span-2"><label className={labelCls}>Lloc</label><input value={aLocation} onChange={e => setALocation(e.target.value)} className={inputCls} placeholder="Sala, adreça..." /></div>
            <div><label className={labelCls}>Tipus</label>
              <select value={aType} onChange={e => setAType(e.target.value)} className={inputCls}>
                {Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Departaments {aDepts.length === 0 ? '(tots)' : `(${aDepts.length})`}</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {DEPT_ORDER.map(d => (
                <button key={d} type="button" onClick={() => setADepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${aDepts.includes(d) ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-red-300 hover:text-red-600'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={reset} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">Cancel·lar</button>
            <button onClick={handleSave} disabled={!aTitle.trim() || !aDate || saving} className="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">{saving ? 'Desant…' : editId ? 'Desar canvis' : 'Crear event'}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-8 flex flex-col items-center gap-2">
            <Calendar size={24} className="text-gray-300 dark:text-zinc-600" />
            <p className="text-sm text-gray-400 dark:text-zinc-500">Cap event</p>
          </div>
        )}
        {sorted.map(ev => (
          <div key={ev.id} className={`${cardCls} flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-red-600 leading-none">{String(ev.day).padStart(2,'0')}</span>
              <span className="text-[9px] text-red-400 uppercase tracking-wide">{['','gen','feb','mar','abr','mai','jun','jul','ago','set','oct','nov','des'][ev.month]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ev.title}</p>
              <p className="text-xs text-gray-400 truncate">{ev.type}{ev.location ? ` · ${ev.location}` : ''}{ev.time ? ` · ${ev.time}${ev.time_end ? `–${ev.time_end}` : ''}` : ''}</p>
              {ev.target_departments && ev.target_departments.length > 0 && (
                <p className="text-[10px] text-gray-400">{ev.target_departments.join(', ')}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(ev)} className={btnGhost}><Pencil size={14} /></button>
              {confirmDel === ev.id
                ? <><button onClick={() => handleDelete(ev.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg">Sí</button><button onClick={() => setConfirmDel(null)} className="text-xs px-2 py-1 border rounded-lg">No</button></>
                : <button onClick={() => setConfirmDel(ev.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackofficeTab({ currentUser, onImpersonate }: { currentUser: import('./api').User | null; onImpersonate?: (userId: number, userName: string) => void }) {
  const role = currentUser?.role ?? '';
  // Check both legacy `role` string (demo switcher) and new `roles` array
  const allRoles = new Set([role, ...(currentUser?.roles ?? [])]);
  const hr = (...r: string[]) => r.some(x => allRoles.has(x));

  const isAdmin             = hr('Administrador', 'Administrador/a');
  const isRrhhOrAdmin       = isAdmin || hr('Recursos humans', 'SolicitudsVacances', 'SolicitudsDissabtes');
  const canManageNews       = isAdmin || hr('Comunicacions', 'Comunicació', 'Recursos humans');
  const canManageAvisos     = isAdmin || hr('Comunicacions', 'Comunicació', 'Recursos humans');
  const canManageAgenda     = isAdmin || hr('Comunicacions', 'Comunicació', 'Formacions', 'Recursos humans');
  const canManageFormacions = isAdmin || hr('Formacions', 'Recursos humans');

  const defaultSubTab: 'usuaris' | 'avisos' | 'notícies' | 'formacions' | 'agenda' =
    isAdmin ? 'usuaris'
    : hr('Formacions') ? 'formacions'
    : hr('Comunicacions', 'Comunicació') ? 'notícies'
    : 'notícies';
  const [subTab, setSubTab] = usePersistedSubTab<'usuaris' | 'avisos' | 'notícies' | 'formacions' | 'agenda'>(
    'backoffice', defaultSubTab, ['usuaris', 'avisos', 'notícies', 'formacions', 'agenda'] as const,
  );
  const [users, setUsers] = useState<import('./api').User[]>([]);
  const [notices, setNotices] = useState<import('./api').Notice[]>([]);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editQuiz] = useState<Quiz | null>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // External courses
  const [externalCourses, setExternalCourses] = useState<Course[]>([]);
  const [showExtCourseModal, setShowExtCourseModal] = useState(false);
  const [editExtCourse, setEditExtCourse] = useState<Course | null>(null);

  // User creation form
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState<import('./api').User | null>(null);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRoles, setURoles] = useState<string[]>(['Treballador/a']);
  const [uDept, setUDept] = useState(DEPT_ORDER[0]);
  const [uNewPass, setUNewPass] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uExt, setUExt] = useState('');
  const [uLocation, setULocation] = useState('');
  const [uAvatarUrl, setUAvatarUrl] = useState('');
  const [uRequiresPrl, setURequiresPrl] = useState(true);
  const [uEpiGrup, setUEpiGrup] = useState('');
  const [uSaving, setUSaving] = useState(false);

  // Notice form
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [editNotice, setEditNotice] = useState<import('./api').Notice | null>(null);
  const [nTitle, setNTitle] = useState('');
  const [nContent, setNContent] = useState('');
  const [nLink, setNLink] = useState('');
  const [nLinkText, setNLinkText] = useState('');
  const [nActive, setNActive] = useState(1);
  const [nKind, setNKind] = useState<'warning'|'danger'|'neutral'>('warning');
  const [nSaving, setNSaving] = useState(false);

  // News form
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editNewsItem, setEditNewsItem] = useState<NewsArticle | null>(null);
  const [nnTitle, setNnTitle] = useState('');
  const [nnCategory, setNnCategory] = useState('Comunicats interns');
  const [nnSummary, setNnSummary] = useState('');
  const [nnContent, setNnContent] = useState('');
  const [nnDate, setNnDate] = useState('');
  const [nnImage, setNnImage] = useState('');
  const [nnImageFile, setNnImageFile] = useState<File | null>(null);
  const [nnFeatured, setNnFeatured] = useState(false);
  const [nnActive, setNnActive] = useState(true);
  const [nnSaving, setNnSaving] = useState(false);
  const NEWS_IMAGE_PRESETS = [
    { url: '/assets/images/carnet-test.png', label: 'Carnet empleat' },
    { url: '/tavil-header.jpg', label: 'Nau Tavil' },
    { url: '/assets/images/tavilLogo.png', label: 'Logo Tavil' },
  ];

  // Scroll-into-view refs for inline opens (forms + expanded drawers).
  // Tied to the *id* of the active row so they re-fire when switching between rows.
  const expandedQuizRef = useScrollIntoViewWhen<HTMLDivElement>(expandedQuizId, { threshold: 0.55, block: 'center', delay: 80 });
  const userFormRef = useScrollIntoViewWhen<HTMLDivElement>(showUserForm ? (editUser?.id ?? 'new') : null, { threshold: 0.5, block: 'center', delay: 60 });
  const noticeFormRef = useScrollIntoViewWhen<HTMLDivElement>(showNoticeForm ? (editNotice?.id ?? 'new') : null, { threshold: 0.5, block: 'center', delay: 60 });

  const loadUsers = () => {
    setLoading(true);
    apiAdminListUsers().then(setUsers).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
  };
  const loadNotices = () => {
    setLoading(true);
    apiGetAllNotices().then(setNotices).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
  };
  const loadNews = () => {
    setLoading(true);
    apiGetNews().then(setNewsItems).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
  };
  const loadQuizzes = () => {
    setLoading(true);
    apiGetQuizzes().then(setQuizzes).catch((e: any) => setError(e.message)).finally(() => setLoading(false));
  };
  const loadExternalCourses = () => {
    apiGetCourses().then(all => setExternalCourses(all.filter(c => c.is_external))).catch(console.error);
  };
  const [inProgressCount, setInProgressCount] = useState<number | null>(null);
  const [boAgendaEvents, setBoAgendaEvents] = useState<AgendaEvent[]>([]);
  const loadBoAgenda = () => { apiGetAgendaEvents().then(setBoAgendaEvents).catch(console.error); };

  useEffect(() => {
    if (subTab === 'usuaris') loadUsers();
    else if (subTab === 'avisos') loadNotices();
    else if (subTab === 'formacions') {
      loadQuizzes();
      loadExternalCourses();
      apiGetQuizInProgressCount().then(setInProgressCount).catch(() => setInProgressCount(null));
    }
    else if (subTab === 'agenda') loadBoAgenda();
    else loadNews();
  }, [subTab]);

  // Handoff from Notícies tab "Editar": switch to news subtab and open editor for the requested article.
  useEffect(() => {
    let pendingId: string | null = null;
    try { pendingId = window.sessionStorage.getItem('tavil_edit_news_id'); } catch {}
    if (pendingId && subTab !== 'notícies') setSubTab('notícies');
  }, []); // run once on mount
  useEffect(() => {
    if (subTab !== 'notícies') return;
    let pendingId: string | null = null;
    try { pendingId = window.sessionStorage.getItem('tavil_edit_news_id'); } catch {}
    if (!pendingId) return;
    const article = newsItems.find(n => n.id === Number(pendingId));
    if (article) {
      openEditNews(article);
      try { window.sessionStorage.removeItem('tavil_edit_news_id'); } catch {}
    }
  }, [subTab, newsItems]);

  // Refresh quiz list when editor tab posts back a save event.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if ((e.data as any)?.type === 'tavil-quiz-saved' && subTab === 'formacions') loadQuizzes();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [subTab]);

  const openCreateUser = () => { setEditUser(null); setUName(''); setUEmail(''); setUPass(''); setUNewPass(''); setURoles(['Treballador/a']); setUDept(DEPT_ORDER[0]); setUPhone(''); setUExt(''); setULocation(''); setUAvatarUrl(''); setURequiresPrl(true); setUEpiGrup(''); setShowUserForm(true); };
  const openEditUser = (u: import('./api').User) => { setEditUser(u); setUName(u.name); setUEmail(u.email); setUPass(''); setUNewPass(''); setURoles(u.roles && u.roles.length > 0 ? u.roles : ['Treballador/a']); setUDept(u.dept); setUPhone(u.phone ?? ''); setUExt(u.ext ?? ''); setULocation(u.location ?? ''); setUAvatarUrl(u.avatar_url ?? ''); setURequiresPrl(!!u.requires_prl); setUEpiGrup(u.epi_grup ?? ''); setShowUserForm(true); };

  const saveUser = async () => {
    setUSaving(true); setError('');
    try {
      if (editUser) {
        await apiAdminUpdateUser(editUser.id, {
          name: uName, email: uEmail, roles: uRoles, dept: uDept,
          phone: uPhone, ext: uExt, location: uLocation, avatar_url: uAvatarUrl,
          requires_prl: uRequiresPrl ? 1 : 0, epi_grup: uEpiGrup || null,
          ...(uNewPass ? { new_password: uNewPass } : {}),
        });
      } else {
        await apiAdminCreateUser({ name: uName, email: uEmail, temp_password: uPass, roles: uRoles, dept: uDept, requires_prl: uRequiresPrl ? 1 : 0 });
      }
      setShowUserForm(false); loadUsers(); showToast(editUser ? 'Usuari actualitzat correctament' : 'Usuari creat correctament');
    } catch (e: any) { setError(e.message); }
    finally { setUSaving(false); }
  };

  const deleteUser = (id: number) => {
    setConfirmModal({
      message: 'Segur que vols eliminar aquest usuari? Aquesta acció no es pot desfer.',
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiAdminDeleteUser(id); loadUsers(); showToast('Usuari eliminat correctament'); } catch (e: any) { setError(e.message); }
      },
    });
  };

  const openCreateNotice = () => { setEditNotice(null); setNTitle(''); setNContent(''); setNLink(''); setNLinkText(''); setNActive(1); setNKind('warning'); setShowNoticeForm(true); };
  const openEditNotice = (n: import('./api').Notice) => { setEditNotice(n); setNTitle(n.title); setNContent(n.content); setNLink(n.link); setNLinkText(n.link_text ?? ''); setNActive(n.active); setNKind((n.kind ?? 'warning') as 'warning'|'danger'|'neutral'); setShowNoticeForm(true); };

  const saveNotice = async () => {
    setNSaving(true); setError('');
    try {
      const fields = { title: nTitle, content: nContent, link: nLink, link_text: nLinkText, active: nActive, kind: nKind };
      if (editNotice) await apiUpdateNotice(editNotice.id, fields);
      else await apiCreateNotice(fields);
      setShowNoticeForm(false); loadNotices(); showToast(editNotice ? 'Avís actualitzat correctament' : 'Avís creat correctament');
    } catch (e: any) { setError(e.message); }
    finally { setNSaving(false); }
  };

  const deleteNotice = (id: number) => {
    setConfirmModal({
      message: 'Segur que vols eliminar aquest avís? Aquesta acció no es pot desfer.',
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteNotice(id); loadNotices(); showToast('Avís eliminat correctament'); } catch (e: any) { setError(e.message); }
      },
    });
  };

  const openCreateNews = () => { setEditNewsItem(null); setNnTitle(''); setNnCategory('Comunicats interns'); setNnSummary(''); setNnContent(''); setNnDate(''); setNnImage(''); setNnImageFile(null); setNnFeatured(false); setNnActive(true); setShowNewsForm(true); };
  const openEditNews = (n: NewsArticle) => { setEditNewsItem(n); setNnTitle(n.title); setNnCategory(n.category); setNnSummary(n.summary); setNnContent(n.content ?? ''); setNnDate(n.date); setNnImage(n.image || ''); setNnImageFile(null); setNnFeatured(n.featured === 1); setNnActive(n.active !== 0); setShowNewsForm(true); };
  const saveNews = async () => {
    setNnSaving(true); setError('');
    try {
      let imageUrl = nnImage;
      if (nnImageFile) imageUrl = await apiUploadImage(nnImageFile);
      const fields = { category: nnCategory, title: nnTitle.trim(), summary: nnSummary.trim(), content: nnContent, date: nnDate.trim(), image: imageUrl, featured: nnFeatured ? 1 : 0, active: nnActive ? 1 : 0 };
      if (editNewsItem) await apiUpdateNews(editNewsItem.id, fields);
      else await apiCreateNews(fields);
      setShowNewsForm(false); loadNews(); showToast(editNewsItem ? 'Notícia actualitzada correctament' : 'Notícia creada correctament');
    } catch (e: any) { setError(e.message); }
    finally { setNnSaving(false); }
  };
  const deleteNewsItem = (id: number) => {
    setConfirmModal({
      message: 'Segur que vols eliminar aquesta notícia? Aquesta acció no es pot desfer.',
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteNews(id); loadNews(); showToast('Notícia eliminada correctament'); } catch (e: any) { setError(e.message); }
      },
    });
  };

  const NEWS_CATS = ['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'];
  const ROLES = [
    { value: 'Treballador/a', label: 'Treballador/a' },
    { value: 'Cap de departament', label: 'Cap de departament' },
    { value: 'Administrador', label: 'Administrador' },
    { value: 'Formacions', label: 'Formacions' },
    { value: 'Comunicacions', label: 'Comunicacions' },
    { value: 'SolicitudsDissabtes', label: 'Sol·licituds dissabtes' },
    { value: 'SolicitudsVacances', label: 'Sol·licituds vacances (RRHH)' },
  ];
  const DEPTS = DEPT_ORDER;

  const cardCls = 'bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4';
  const inputCls = 'w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-red-400 transition-colors';
  const btnPrimary = 'bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50';
  const btnGhost = 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm px-3 py-2 rounded-lg transition-colors';

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {isAdmin && (
          <button onClick={() => setSubTab('usuaris')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'usuaris' ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'}`}>
            <Users size={15} /> Usuaris
          </button>
        )}
        {canManageAvisos && (
          <button onClick={() => setSubTab('avisos')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'avisos' ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'}`}>
            <Bell size={15} /> Avisos
          </button>
        )}
        {canManageNews && (
          <button onClick={() => setSubTab('notícies')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'notícies' ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'}`}>
            <Newspaper size={15} /> Notícies
          </button>
        )}
        {canManageAgenda && (
          <button onClick={() => setSubTab('agenda')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'agenda' ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'}`}>
            <Calendar size={15} /> Agenda
          </button>
        )}
        {canManageFormacions && (
          <button onClick={() => setSubTab('formacions')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'formacions' ? 'bg-red-600 text-white' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'}`}>
            <GraduationCap size={15} /> Formacions
          </button>
        )}
      </div>

      {/* ── Sub-tab content ── */}
      <div key={subTab} className="anim-tab">

      {/* ── Usuaris ── */}
      {subTab === 'usuaris' && (() => {
        const userFormBody = (embedded: boolean) => (
          <div className={`${embedded ? 'border-t border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10 px-4 py-3 rounded-b-xl' : `${cardCls} border-red-200 dark:border-red-800`} space-y-3 ${embedded ? '' : 'anim-slide-down'}`}>
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{editUser ? 'Editar usuari' : 'Nou usuari'}</p>
              <button onClick={() => setShowUserForm(false)} className={btnGhost}><X size={16} /></button>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Nom</label><input value={uName} onChange={e => setUName(e.target.value)} className={inputCls} placeholder="Nom complet" /></div>
              <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Correu</label><input value={uEmail} onChange={e => setUEmail(e.target.value)} className={inputCls} type="email" placeholder="nom@tavil.net" /></div>
              {!editUser && <div className="md:col-span-2"><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Contrasenya temporal</label><input value={uPass} onChange={e => setUPass(e.target.value)} className={inputCls} type="text" placeholder="L'usuari la canviarà al primer accés" /></div>}
              {editUser && <div className="md:col-span-2"><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Nova contrasenya <span className="normal-case font-normal">(deixar en blanc per no canviar)</span></label><input value={uNewPass} onChange={e => setUNewPass(e.target.value)} className={inputCls} type="password" placeholder="Mínim 8 caràcters" autoComplete="new-password" /></div>}
              <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Departament</label>
                <select value={uDept} onChange={e => setUDept(e.target.value)} className={inputCls}>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Rols del portal</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => {
                    const active = uRoles.includes(r.value);
                    return (
                      <button key={r.value} type="button"
                        onClick={() => setURoles(active ? uRoles.filter(x => x !== r.value) : [...uRoles, r.value])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-red-600 border-red-600 text-white' : 'bg-transparent border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-400'}`}
                      >{r.label}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Grup EPI</label>
                <select value={uEpiGrup} onChange={e => setUEpiGrup(e.target.value)} className={inputCls} style={{ fontFamily: 'inherit' }}>
                  <option value="">Sense assignar</option>
                  <option value="1">Grup 1</option>
                  <option value="2">Grup 2</option>
                  <option value="3">Grup 3</option>
                  <option value="3i">Grup 3 Internacional</option>
                  <option value="4">Grup 4</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-3 pt-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Firma PRL obligatòria</label>
                <input type="checkbox" checked={uRequiresPrl} onChange={e => setURequiresPrl(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <span className="text-[11px] text-gray-400">Activat = el treballador ha de signar documents PRL</span>
              </div>
              {editUser && (
                <>
                  <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Telèfon</label><input value={uPhone} onChange={e => setUPhone(e.target.value)} className={inputCls} placeholder="—" /></div>
                  <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Codi treballador</label><input value={uExt} onChange={e => setUExt(e.target.value)} className={inputCls} placeholder="—" /></div>
                  <div className="md:col-span-2"><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Ubicació</label><input value={uLocation} onChange={e => setULocation(e.target.value)} className={inputCls} placeholder="—" /></div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Foto de perfil</label>
                    <MediaUploader
                      value={uAvatarUrl}
                      kind="image"
                      accept="image"
                      resolveSrc={resolveImg}
                      onChange={(url) => {
                        const m = url.match(/(\/uploads\/[^?#]+)/);
                        setUAvatarUrl(m ? m[1] : url);
                      }}
                      onError={(msg) => setError(msg)}
                      placeholder="Arrossega la foto de perfil o clica"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowUserForm(false)} className={btnGhost}>Cancel·lar</button>
              <button onClick={saveUser} disabled={uSaving || !uName || !uEmail || (!editUser && !uPass)} className={btnPrimary}>{uSaving ? 'Guardant...' : 'Guardar'}</button>
            </div>
          </div>
        );

        const usrTotal = users.length;
        const usrMustChange = users.filter(u => u.must_change_password).length;
        const usrHeads = users.filter(u => u.is_head).length;
        const usrDepts = new Set(users.map(u => u.dept)).size;

        return (
        <div className="space-y-4">
          {/* Stats header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Users} label="Usuaris totals" value={usrTotal} hint={loading ? 'Carregant…' : `${usrDepts} departaments`} />
            <MetricCard icon={ShieldCheck} label="Caps de dept." value={usrHeads} hint={`${usrDepts} departaments actius`} />
            <MetricCard icon={KeyRound} label="Clau pendent" value={usrMustChange} hint={usrMustChange > 0 ? 'Han de canviar-la' : 'Tot en ordre'} />
            <MetricCard icon={Building2} label="Departaments" value={usrDepts} hint="Únics actius" />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{users.length} usuari{users.length !== 1 ? 's' : ''}</p>
            {(!showUserForm || editUser) && <button onClick={openCreateUser} className={btnPrimary}><Plus size={14} className="inline mr-1" />Nou usuari</button>}
          </div>
          {loading ? <div className="text-center py-8 text-gray-400 text-sm">Carregant…</div> : (
            <div className="space-y-2">
              {users.map(u => {
                const isEditing = showUserForm && editUser?.id === u.id;
                return (
                  <div key={u.id} className={isEditing ? 'rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-zinc-900 overflow-hidden' : ''}>
                    <div className={`${isEditing ? 'flex items-center gap-3 px-4 py-3' : `${cardCls} flex items-center gap-3`}`}>
                      {u.avatar_url ? (
                        <img src={resolveImg(u.avatar_url)} alt="" loading="lazy" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name.split(' ').slice(0,2).map((n:string) => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email} · {u.role} · {u.dept}</p>
                        {u.must_change_password ? <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Canvi de contrasenya pendent</span> : null}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {currentUser?.is_demo_admin === 1 && u.id !== currentUser?.id && (
                          <button onClick={() => onImpersonate?.(u.id, u.name)} className="text-xs px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors font-medium" title="Impersonar usuari">👤</button>
                        )}
                        <button onClick={() => isEditing ? setShowUserForm(false) : openEditUser(u)} className={btnGhost}><Pencil size={14} /></button>
                        {u.id !== currentUser?.id && <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                    {isEditing && (
                      <div ref={userFormRef} className="anim-drawer-down">
                        {userFormBody(true)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Avisos ── */}
      {subTab === 'avisos' && (
        <div className="space-y-4">
          {/* Stats header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Bell} label="Avisos totals" value={notices.length} hint={loading ? 'Carregant…' : 'Tots els registres'} />
            <MetricCard icon={CheckCircle} label="Actius" value={notices.filter(n => n.active).length} hint="Visibles als usuaris" />
            <MetricCard icon={EyeOff} label="Inactius" value={notices.filter(n => !n.active).length} hint="No visibles" />
            <MetricCard icon={ExternalLink} label="Amb enllaç" value={notices.filter(n => n.link).length} hint="Aporten URL" />
          </div>

          {/* Inline form */}
          {showNoticeForm && (
            <div ref={noticeFormRef} className={`${cardCls} border-red-200 dark:border-red-800 space-y-3 anim-slide-down`}>
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{editNotice ? 'Editar avís' : 'Nou avís'}</p>
                <button onClick={() => setShowNoticeForm(false)} className={btnGhost}><X size={16} /></button>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Títol</label><input value={nTitle} onChange={e => setNTitle(e.target.value)} className={inputCls} placeholder="Títol de l'avís" /></div>
              <div><label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Contingut</label><textarea value={nContent} onChange={e => setNContent(e.target.value)} className={inputCls} rows={3} placeholder="Text de l'avís (opcional)" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Text de l'enllaç (opcional)</label><input value={nLinkText} onChange={e => setNLinkText(e.target.value)} className={inputCls} placeholder="Més informació" /></div>
                <div><label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">URL de l'enllaç (opcional)</label><input value={nLink} onChange={e => setNLink(e.target.value)} className={inputCls} placeholder="https://..." /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide block mb-2">Tipus</label>
                <div className="flex gap-2">
                  {([
                    { v: 'warning', label: 'Avís', bg: 'bg-amber-100 dark:bg-amber-900/30', txt: 'text-amber-800 dark:text-amber-300', ring: 'ring-amber-400' },
                    { v: 'danger',  label: 'Perill', bg: 'bg-red-100 dark:bg-red-900/30', txt: 'text-red-800 dark:text-red-300', ring: 'ring-red-500' },
                    { v: 'neutral', label: 'Neutral', bg: 'bg-gray-100 dark:bg-zinc-700', txt: 'text-gray-700 dark:text-gray-300', ring: 'ring-gray-400' },
                  ] as const).map(({ v, label, bg, txt, ring }) => (
                    <button key={v} type="button" onClick={() => setNKind(v)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border-2 ${bg} ${txt} ${nKind === v ? `border-current ring-2 ${ring}` : 'border-transparent opacity-60 hover:opacity-90'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Actiu</label>
                <button type="button" onClick={() => setNActive(nActive ? 0 : 1)} className={`relative inline-flex w-10 h-6 items-center rounded-full transition-colors ${nActive ? 'bg-red-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                  <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: nActive ? 'translateX(18px)' : 'translateX(2px)' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowNoticeForm(false)} className={btnGhost}>Cancel·lar</button>
              <button onClick={saveNotice} disabled={nSaving || !nTitle} className={btnPrimary}>{nSaving ? 'Guardant...' : 'Guardar'}</button>
            </div>
          </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{notices.length} avís/avisos</p>
            {!showNoticeForm && <button onClick={openCreateNotice} className={btnPrimary}><Plus size={14} className="inline mr-1" />Nou avís</button>}
          </div>
          {loading ? <div className="text-center py-8 text-gray-400 text-sm">Carregant…</div> : (
            <div className="space-y-2">
              {notices.map(n => (
                <div key={n.id} className={`${cardCls} flex items-center gap-3 ${editNotice?.id === n.id ? 'border-red-300 dark:border-red-700' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${n.active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}>{n.active ? 'Actiu' : 'Inactiu'}</span>
                      {(n.kind === 'danger') && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">Perill</span>}
                      {(n.kind === 'neutral') && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">Neutral</span>}
                      {(!n.kind || n.kind === 'warning') && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Avís</span>}
                    </div>
                    {n.content && <p className="text-xs text-gray-400 truncate">{n.content}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEditNotice(n)} className={btnGhost}><Pencil size={14} /></button>
                    <button onClick={() => deleteNotice(n.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Notícies ── */}
      {subTab === 'notícies' && (
        <div className="space-y-4">
          {/* Stats header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Newspaper} label="Notícies" value={newsItems.length} hint={loading ? 'Carregant…' : 'Total publicades'} />
            <MetricCard icon={Star} label="Destacades" value={newsItems.filter(n => n.featured).length} hint="A la portada" />
            <MetricCard icon={ImageIcon} label="Amb imatge" value={newsItems.filter(n => n.image).length} hint="Visualment riques" />
            <MetricCard
              icon={Clock}
              label="Última"
              value={newsItems[0]?.date ?? '—'}
              hint={newsItems[0]?.title ? newsItems[0].title.slice(0, 32) : 'Cap entrada'}
            />
          </div>

          {showNewsForm && (
            <EditModal title={editNewsItem ? 'Editar notícia' : 'Nova notícia'} onClose={() => setShowNewsForm(false)}>
              {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 mb-3">{error}</p>}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Categoria</label>
                    <select value={nnCategory} onChange={e => setNnCategory(e.target.value)} className={inputCls}>
                      {NEWS_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end pb-0.5 gap-2">
                    <button
                      type="button"
                      onClick={() => setNnActive(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors flex-1 justify-center ${nnActive ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-green-300 hover:text-green-600'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${nnActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {nnActive ? 'Activa' : 'Inactiva'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNnFeatured(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors flex-1 justify-center ${nnFeatured ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400' : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-300 hover:text-amber-600'}`}
                    >
                      <Star size={12} className={nnFeatured ? 'fill-amber-500 text-amber-500' : ''} />
                      {nnFeatured ? 'Destacada' : 'Destacar'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Títol *</label>
                  <input value={nnTitle} onChange={e => setNnTitle(e.target.value)} className={inputCls} placeholder="Títol de la notícia" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Resum breu</label>
                  <textarea value={nnSummary} onChange={e => setNnSummary(e.target.value)} className={inputCls} rows={2} placeholder="Resum breu visible a la llista" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Data</label>
                  <DatePicker value={nnDate} onChange={setNnDate} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Imatge</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {NEWS_IMAGE_PRESETS.map(preset => {
                      const selected = nnImage === preset.url && !nnImageFile;
                      return (
                        <button key={preset.url} type="button"
                          onClick={() => { setNnImage(preset.url); setNnImageFile(null); }}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${selected ? 'border-red-500 shadow-sm' : 'border-gray-200 dark:border-zinc-700 hover:border-red-300'}`}>
                          <img src={resolveImg(preset.url)} alt={preset.label} loading="lazy" className="w-full h-16 object-cover" />
                          <p className="text-[9px] font-medium text-center py-1 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 truncate px-1">{preset.label}</p>
                          {selected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                              <Check size={9} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`${btnGhost} cursor-pointer text-xs`}>
                      <input type="file" accept="image/*" className="sr-only" onChange={e => { setNnImageFile(e.target.files?.[0] ?? null); setNnImage(''); }} />
                      Pujar nova
                    </label>
                    {nnImageFile && (
                      <div className="flex items-center gap-1.5">
                        <img src={URL.createObjectURL(nnImageFile)} alt="" loading="lazy" className="h-6 w-6 rounded object-cover flex-shrink-0" />
                        <span className="text-[10px] text-gray-500 dark:text-zinc-400 max-w-[100px] truncate">{nnImageFile.name}</span>
                        <button type="button" onClick={() => setNnImageFile(null)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"><X size={10} /></button>
                      </div>
                    )}
                    {!nnImageFile && nnImage && !NEWS_IMAGE_PRESETS.find(p => p.url === nnImage) && (
                      <div className="flex items-center gap-1.5">
                        <img src={resolveImg(nnImage)} alt="" loading="lazy" className="h-6 w-6 rounded object-cover flex-shrink-0" />
                        <button type="button" onClick={() => setNnImage('')} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"><X size={10} /></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <button onClick={() => setShowNewsForm(false)} className={btnGhost}>Cancel·lar</button>
                  <button onClick={saveNews} disabled={nnSaving || !nnTitle.trim()} className={btnPrimary}>{nnSaving ? 'Guardant...' : 'Guardar'}</button>
                </div>
              </div>
            </EditModal>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{newsItems.length} notícia{newsItems.length !== 1 ? 'es' : ''}</p>
            <div className="flex gap-2">
              <button onClick={() => window.open(`${window.location.pathname}?article=new`, '_blank')} className={btnGhost} title="Editor amb blocs visuals i drag-and-drop">
                <LayoutGrid size={14} className="inline mr-1" />Notícia extensa
              </button>
              <button onClick={openCreateNews} className={btnPrimary}><Plus size={14} className="inline mr-1" />Nova notícia</button>
            </div>
          </div>
          {loading ? <div className="text-center py-8 text-gray-400 text-sm">Carregant…</div> : (
            <div className="space-y-2">
              {newsItems.map(n => (
                <div key={n.id} className={`${cardCls} flex items-center gap-3 ${editNewsItem?.id === n.id ? 'border-red-300 dark:border-red-700' : ''}`}>
                  {n.image && <img src={resolveImg(n.image)} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
                      {n.featured === 1 && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Destacada</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{[n.category, n.date].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => window.open(`${window.location.pathname}?article=${n.id}`, '_blank')} className={btnGhost} title="Editor extens (blocs)"><LayoutGrid size={14} /></button>
                    <button onClick={() => openEditNews(n)} className={btnGhost} title="Edició ràpida"><Pencil size={14} /></button>
                    <button onClick={() => deleteNewsItem(n.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Formacions ── */}
      {subTab === 'formacions' && (
        <div className="space-y-4">
          {/* Stats header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={GraduationCap} label="Formacions" value={quizzes.length} hint={loading ? 'Carregant…' : 'Total registrades'} />
            <MetricCard icon={CheckCircle} label="Actives" value={quizzes.filter(q => q.active).length} hint="Disponibles per fer" />
            <MetricCard icon={PlayCircle} label="En curs" value={inProgressCount ?? '—'} hint="Usuaris a mig fer" />
            <MetricCard icon={Target} label="Nota mínima" value={`${Math.round(quizzes.reduce((s, q) => s + (q.passing_score || 0), 0) / Math.max(1, quizzes.length))}%`} hint="Llindar d'aprovació" />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{quizzes.length} formació{quizzes.length !== 1 ? 'ns' : ''}</p>
            <div className="flex gap-2">
              <button onClick={() => { setEditExtCourse(null); setShowExtCourseModal(true); }} className={btnGhost}><Plus size={14} className="inline mr-1" />Formació externa</button>
              <button onClick={() => window.open(`${window.location.pathname}?edit=new`, '_blank')} className={btnPrimary}><Plus size={14} className="inline mr-1" />Nova formació</button>
            </div>
          </div>
          {loading ? <div className="text-center py-8 text-gray-400 text-sm">Carregant…</div> : (
            <div className="space-y-2">
              {quizzes.map(q => {
                const fmtDate = (s: string | null) => s ? new Date(s.replace(' ', 'T')).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }) : null;
                const startStr = fmtDate(q.start_at);
                const endStr   = fmtDate(q.end_at);
                const expanded = expandedQuizId === q.id;
                return (
                <div key={q.id} className={cardCls}>
                  <div className="flex items-center gap-3">
                    {q.image ? (
                      <img src={resolveImg(q.image)} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100 dark:border-zinc-800" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 flex-shrink-0">
                        <GraduationCap size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{q.title}</p>
                        {q.active === 0 && <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium">Inactiu</span>}
                        {q.category && <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 px-1.5 py-0.5 rounded font-medium">{q.category}</span>}
                        {(startStr || endStr) && (
                          <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 px-1.5 py-0.5 rounded font-medium tabular-nums">
                            {startStr ?? '?'} → {endStr ?? '?'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {q.question_count ?? 0} preguntes · {q.passing_score}% per aprovar
                        {q.time_limit ? ` · ${q.time_limit} min` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setExpandedQuizId(expanded ? null : q.id)} className={`${btnGhost} ${expanded ? 'text-red-600 bg-red-50 dark:bg-red-950/20' : ''}`} title="Resultats"><BarChart3 size={14} /></button>
                      <button onClick={() => window.open(`${window.location.pathname}?edit=${q.id}`, '_blank')} className={btnGhost}><Pencil size={14} /></button>
                      <button onClick={() => setConfirmModal({ message: `Eliminar la formació "${q.title}"? Aquesta acció no es pot desfer.`, onConfirm: async () => { setConfirmModal(null); await apiDeleteQuiz(q.id); loadQuizzes(); } })} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {expanded && <div ref={expandedQuizRef}><QuizResultsDrawer quizId={q.id} /></div>}
                </div>
                );
              })}
              {quizzes.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-400 text-sm">Cap formació creada. Crea la primera!</div>
              )}
            </div>
          )}

          {/* External courses section */}
          {externalCourses.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink size={14} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Formacions externes al catàleg</p>
              </div>
              <div className="space-y-2">
                {externalCourses.map(c => {
                  let depts: string[] = [];
                  try { depts = JSON.parse(c.departments || '[]'); } catch { /* */ }
                  return (
                    <div key={c.id} className={cardCls}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 flex-shrink-0 border border-gray-100 dark:border-zinc-700">
                          <ExternalLink size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
                            {c.mandatory === 1 && <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 px-1.5 py-0.5 rounded font-medium">Obligatòria</span>}
                            {c.category && <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">{c.category}</span>}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {c.hours ? `${c.hours} · ` : ''}
                            {depts.length > 0 ? depts.join(', ') : 'Tots els departaments'}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => window.open(c.url, '_blank', 'noopener,noreferrer')} className={btnGhost} title="Obrir curs"><ExternalLink size={14} /></button>
                          <button onClick={() => { setEditExtCourse(c); setShowExtCourseModal(true); }} className={btnGhost}><Pencil size={14} /></button>
                          <button onClick={() => setConfirmModal({
                            message: `Segur que vols eliminar "${c.title}"? Aquesta acció no es pot desfer.`,
                            onConfirm: async () => {
                              setConfirmModal(null);
                              await apiDeleteExternalCourse(c.id);
                              loadExternalCourses();
                              showToast('Formació externa eliminada correctament');
                            },
                          })} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm px-2 py-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showQuizBuilder && (
            <QuizBuilderModal
              quiz={editQuiz}
              onClose={() => setShowQuizBuilder(false)}
              onSaved={() => { setShowQuizBuilder(false); loadQuizzes(); }}
            />
          )}
          {showExtCourseModal && (
            <ExternalCourseModal
              course={editExtCourse}
              onClose={() => { setShowExtCourseModal(false); setEditExtCourse(null); }}
              onSaved={() => { setShowExtCourseModal(false); setEditExtCourse(null); loadExternalCourses(); }}
            />
          )}
        </div>
      )}

      {/* ── Agenda ── */}
      {subTab === 'agenda' && (
        <BoAgendaPanel events={boAgendaEvents} onRefresh={loadBoAgenda} cardCls={cardCls} inputCls={inputCls} btnGhost={btnGhost} />
      )}

      </div>{/* end key={subTab} */}
      {toast && createPortal(
        <div style={{ position: 'fixed', top: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10001, pointerEvents: 'none' }}>
          <div className="anim-pop" style={{ whiteSpace: 'nowrap', padding: '10px 22px', borderRadius: 999, fontSize: 13.5, fontWeight: 500, color: '#fff', background: 'rgba(34,110,54,0.96)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>✓</span>{toast}
          </div>
        </div>,
        document.body
      )}
      {showUserForm && !editUser && (
        <EditModal title="Nou usuari" onClose={() => setShowUserForm(false)}>
          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 mb-3">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Nom</label><input value={uName} onChange={e => setUName(e.target.value)} className={inputCls} placeholder="Nom complet" /></div>
            <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Correu</label><input value={uEmail} onChange={e => setUEmail(e.target.value)} className={inputCls} type="email" placeholder="nom@tavil.net" /></div>
            <div className="md:col-span-2"><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Contrasenya temporal</label><input value={uPass} onChange={e => setUPass(e.target.value)} className={inputCls} type="text" placeholder="L'usuari la canviarà al primer accés" /></div>
            <div><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Departament</label>
              <select value={uDept} onChange={e => setUDept(e.target.value)} className={inputCls}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Rols del portal</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => {
                  const active = uRoles.includes(r.value);
                  return (
                    <button key={r.value} type="button"
                      onClick={() => setURoles(active ? uRoles.filter(x => x !== r.value) : [...uRoles, r.value])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-red-600 border-red-600 text-white' : 'bg-transparent border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-400'}`}
                    >{r.label}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button onClick={() => setShowUserForm(false)} className={btnGhost}>Cancel·lar</button>
            <button onClick={saveUser} disabled={uSaving || !uName || !uEmail || !uPass} className={btnPrimary}>{uSaving ? 'Guardant...' : 'Crear usuari'}</button>
          </div>
        </EditModal>
      )}
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}

// ── Sidebar data ──────────────────────────────────────────────────────────────

function useSidebarSections(role?: string, roles?: string[]) {
  const { t } = useTranslation();
  return [
    {
      title: t('nav.general'),
      items: [
        { id: 'Inici', label: t('nav.inici'), icon: Home },
        { id: 'Notícies', label: t('nav.noticies'), icon: Newspaper },
        { id: 'Agenda', label: t('nav.agenda'), icon: Calendar },
        { id: 'Activitats', label: t('nav.activitats'), icon: ActivityIcon },
      ]
    },
    {
      title: t('nav.empresa'),
      items: [
        { id: 'Espai', label: t('nav.espai'), icon: Building2 },
        { id: 'Directori', label: t('nav.directori'), icon: Users },
        { id: 'Campus', label: t('nav.campus'), icon: GraduationCap },
      ]
    },
    {
      title: t('nav.personal'),
      items: [
        { id: 'Perfil', label: t('nav.perfil'), icon: UserCircle },
      ]
    },
    ...(['Administrador', 'Administrador/a', 'Recursos humans', 'Comunicacions', 'Comunicació', 'Formacions', 'SolicitudsVacances', 'SolicitudsDissabtes'].some(r => (roles ?? []).includes(r) || role === r) ? [{
      title: 'Administració',
      isAdmin: true as const,
      items: [
        { id: 'admin-dashboard', label: 'Tauler', icon: LayoutGrid },
      ]
    }] : [])
  ];
}

// ── Empresa Landing (mobile-first list of company tabs) ──────────────────────

function EmpresaLandingTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const items: { id: string; label: string; icon: any; desc: string }[] = [
    { id: 'Espai', label: 'Tavipedia', icon: Building2, desc: 'Manual, polítiques, beneficis, identitat' },
    { id: 'Directori', label: 'Who is who?', icon: Users, desc: 'Troba companys per departament' },
    { id: 'Campus', label: 'Campus TAVIL', icon: GraduationCap, desc: 'Formació i cursos' },
    { id: 'Activitats', label: 'Connect', icon: ActivityIcon, desc: "Activitats i esdeveniments TAVIL" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-3">Accés ràpid a les seccions d'empresa</p>
      {items.map(({ id, label, icon: Icon, desc }) => (
        <button
          key={id}
          onClick={() => onNavigate?.(id)}
          className="w-full flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 hover:border-red-300 dark:hover:border-red-800 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 flex-shrink-0">
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{desc}</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ── Mobile swipe stack — Instagram-style lateral drag between tabs ────────────

function MobileSwipeStack({
  activeTab,
  setActiveTab,
  tabOrder,
  renderPageLayout,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  tabOrder: string[];
  renderPageLayout: (t: string) => React.ReactNode;
  enterClass?: string;
  exitingTab?: string | null;
  exitClass?: string;
}) {
  // Instagram-style permanent strip: every tab in tabOrder is mounted once,
  // hosted at a fixed slot. Switching tabs only changes which slot the
  // viewport shows — components never unmount, state/images persist, no flash.
  const [dragX, setDragXState] = useState(0);
  const dragXRef = useRef(0); // always-current ref to avoid stale closure in onTouchEnd
  const setDragX = (v: number) => { dragXRef.current = v; setDragXState(v); };
  const [snapping, setSnapping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number; t: number; axis: 'x' | 'y' | null } | null>(null);
  // Tabs that have ever been visited — only render content for these so we
  // don't pay the cost of mounting every tab up-front. Once mounted, never
  // unmount (state retained).
  const [visited, setVisited] = useState<Set<string>>(() => new Set([activeTab]));
  useEffect(() => {
    setVisited(prev => prev.has(activeTab) ? prev : new Set(prev).add(activeTab));
  }, [activeTab]);

  const activeIdx = tabOrder.indexOf(activeTab);
  const isOffStrip = activeIdx === -1; // sub-tab (Activitats, Espai, Campus, …)
  const safeActiveIdx = isOffStrip ? tabOrder.indexOf('Més') : activeIdx;
  const prevTab = !isOffStrip && safeActiveIdx > 0 ? tabOrder[safeActiveIdx - 1] : null;
  const nextTab = !isOffStrip && safeActiveIdx < tabOrder.length - 1 ? tabOrder[safeActiveIdx + 1] : null;


  const onTouchStart = (e: React.TouchEvent) => {
    if (snapping || e.touches.length !== 1) return;
    const tgt = e.target as HTMLElement;
    // Block on interactive elements and elements that need their own horizontal scroll
    if (tgt.closest('input, textarea, select, [data-no-swipe], [role="slider"]')) return;
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), axis: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!startRef.current) return;
    const dx = e.touches[0].clientX - startRef.current.x;
    const dy = e.touches[0].clientY - startRef.current.y;
    if (startRef.current.axis == null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // Require stronger horizontal intent (1.6×) to avoid stealing vertical scroll
      startRef.current.axis = Math.abs(dx) > Math.abs(dy) * 1.6 ? 'x' : 'y';
    }
    if (startRef.current.axis !== 'x') return;
    let eff = dx;
    if (!prevTab && eff > 0) eff *= 0.25;
    if (!nextTab && eff < 0) eff *= 0.25;
    setDragX(eff);
  };
  const onTouchEnd = () => {
    if (!startRef.current) return;
    const axis = startRef.current.axis;
    const t0 = startRef.current.t;
    startRef.current = null;
    if (axis !== 'x') { setDragX(0); return; }
    const w = containerRef.current?.clientWidth ?? window.innerWidth;
    const dx = dragXRef.current; // use ref, not state — avoids stale closure
    const elapsed = Math.max(1, Date.now() - t0);
    const velocity = Math.abs(dx) / elapsed;
    const threshold = w * 0.22; // lower from 28% → 22% (easier to trigger)
    setSnapping(true);
    if ((dx <= -threshold || (dx < -15 && velocity > 0.35)) && nextTab) {
      setDragX(-w);
      window.setTimeout(() => {
        setSnapping(false);
        setDragX(0);
        setActiveTab(nextTab);
      }, 300);
    } else if ((dx >= threshold || (dx > 15 && velocity > 0.35)) && prevTab) {
      setDragX(w);
      window.setTimeout(() => {
        setSnapping(false);
        setDragX(0);
        setActiveTab(prevTab);
      }, 300);
    } else {
      setDragX(0);
      window.setTimeout(() => setSnapping(false), 300);
    }
  };

  return (
    <div
      ref={containerRef}
      className="page-stack w-full"
      style={{ touchAction: 'pan-y', overflow: 'hidden', position: 'relative' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          // Active slot anchored at x=0; siblings positioned at ±N*100% via
          // each slot's own translateX. Drag adds dragX overlay.
          transform: `translate3d(${dragX}px, 0, 0)`,
          transition: snapping ? 'transform 300ms cubic-bezier(0.22,1,0.36,1)' : 'none',
          willChange: 'transform',
        }}
      >
        {tabOrder.map((tab, idx) => {
          const offset = idx - safeActiveIdx;
          const isStripActive = !isOffStrip && idx === safeActiveIdx;
          const isAdjacent = Math.abs(offset) === 1;
          // Render only visited tabs (lazy). Once visited, kept mounted forever
          // — state, scroll position, fetched data persist.
          const shouldRender = visited.has(tab);
          return (
            <div
              key={tab}
              aria-hidden={!isStripActive}
              style={{
                position: isStripActive ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: isStripActive ? undefined : `translateX(${offset * 100}%)`,
                visibility: isStripActive || (!isOffStrip && isAdjacent) ? 'visible' : 'hidden',
                pointerEvents: isStripActive ? 'auto' : 'none',
              }}
            >
              {shouldRender ? renderPageLayout(tab) : null}
            </div>
          );
        })}
        {/* Off-strip pages (sub-tabs reachable via "Més" or sidebar): render
            on top of the strip when active. Mounted lazily and kept after. */}
        {isOffStrip && (
          <div
            key={activeTab}
            style={{ position: 'relative', width: '100%', zIndex: 2 }}
          >
            {renderPageLayout(activeTab)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quiz Player Page (full-screen, presentation style) ───────────────────────

function QuizPlayerPage({ quizId }: { quizId: number }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'intro' | 'playing' | 'result'>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resumeOffer, setResumeOffer] = useState<{ idx: number; answers: Record<string, any>; updated_at: string } | null>(null);
  const progressLoadedRef = useRef(false);

  useEffect(() => {
    document.title = 'Formació · TAVIL';
    // sessionStorage isn't shared between tabs. If we have no token, try to
    // pull it from the tab that opened us (same-origin → allowed).
    try {
      const haveToken = localStorage.getItem('tavil_token') || sessionStorage.getItem('tavil_token');
      if (!haveToken && window.opener) {
        const op = (window.opener as Window | null);
        const inherited = op?.localStorage?.getItem('tavil_token')
          ?? op?.sessionStorage?.getItem('tavil_token')
          ?? null;
        if (inherited) sessionStorage.setItem('tavil_token', inherited);
      }
    } catch { /* cross-origin or null opener */ }
    // Resume on F5 in same tab (sessionStorage marker) OR explicit ?resume=1
    // from list "Continuar" button. sessionStorage is per-tab so new tab needs the
    // query flag. Otherwise fresh open clears server progress.
    const sessionKey = `quiz_active_${quizId}`;
    const isReload = sessionStorage.getItem(sessionKey) === '1';
    const explicitResume = new URLSearchParams(window.location.search).get('resume') === '1';
    const wantResume = isReload || explicitResume;
    Promise.all([
      apiGetQuiz(quizId),
      wantResume ? apiGetQuizProgress(quizId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([q, prog]) => {
        setQuiz(q);
        if (prog && prog.current_question_idx > 0) {
          setResumeOffer({ idx: prog.current_question_idx, answers: prog.answers as Record<string, any>, updated_at: prog.updated_at });
          if (explicitResume) sessionStorage.setItem(sessionKey, '1');
        } else if (!wantResume) {
          // Fresh visit — discard any stale server progress.
          apiClearQuizProgress(quizId).catch(() => {});
        }
      })
      .catch(e => setError(e.message ?? 'Error carregant la formació'))
      .finally(() => setLoading(false));
  }, [quizId]);

  // Auto-save progress (debounced) while playing.
  useEffect(() => {
    if (stage !== 'playing' || !quiz) return;
    if (!progressLoadedRef.current) { progressLoadedRef.current = true; return; }
    const t = window.setTimeout(() => {
      apiSaveQuizProgress(quiz.id, idx, answers).catch(() => { /* silent */ });
    }, 600);
    return () => window.clearTimeout(t);
  }, [stage, idx, answers, quiz]);

  // Keyboard: arrow nav while playing
  useEffect(() => {
    if (stage !== 'playing' || !quiz) return;
    const total = quiz.questions?.length ?? 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && idx < total - 1) setIdx(i => i + 1);
      if (e.key === 'ArrowLeft' && idx > 0) setIdx(i => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, idx, quiz]);

  const submit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const r = await apiSubmitQuizAttempt(quiz.id, answers);
      setResult(r);
      setStage('result');
      // Backend already clears progress on successful attempt; clear locally too in case of cache.
      apiClearQuizProgress(quiz.id).catch(() => {});
      sessionStorage.removeItem(`quiz_active_${quiz.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError(e.message ?? 'Error enviant respostes');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-surface fixed inset-0 flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--q-text-60)' }}>Carregant formació…</div>
      </div>
    );
  }
  if (error || !quiz) {
    return (
      <div className="quiz-surface fixed inset-0 flex items-center justify-center p-6">
        <div className="text-center max-w-md" style={{ color: 'var(--q-text)' }}>
          <p className="text-lg font-semibold mb-2">No s'ha pogut carregar la formació</p>
          <p className="text-sm mb-6" style={{ color: 'var(--q-text-55)' }}>{error || 'Quiz no disponible'}</p>
          <button onClick={() => window.close()} className="px-5 py-2 rounded-xl text-sm" style={{ background: 'var(--q-surface-10)', color: 'var(--q-text-80)' }}>Tancar</button>
        </div>
      </div>
    );
  }

  const total = quiz.questions?.length ?? 0;
  const q = quiz.questions?.[idx];
  const progress = total > 0 ? ((idx + 1) / total) * 100 : 0;
  const answered = q
    ? (q.type === 'slide'
        ? true
        : q.type === 'multiple_select'
          ? Array.isArray(answers[String(q.id)]) && (answers[String(q.id)] as any[]).length > 0
          : answers[String(q.id)] !== undefined && answers[String(q.id)] !== '')
    : false;
  const allAnswered = (quiz.questions ?? []).every(qq => {
    if (qq.type === 'slide') return true;
    const a = answers[String(qq.id)];
    if (qq.type === 'matching') return a && typeof a === 'object' && Object.keys(a).length === (qq.options?.length ?? 0);
    if (qq.type === 'multiple_select') return Array.isArray(a) && a.length > 0;
    return a !== undefined && a !== '';
  });

  const resumeQuiz = () => {
    if (!resumeOffer || !quiz) return;
    const safeIdx = Math.min(Math.max(0, resumeOffer.idx), Math.max(0, total - 1));
    sessionStorage.setItem(`quiz_active_${quiz.id}`, '1');
    setIdx(safeIdx);
    setAnswers(resumeOffer.answers || {});
    setResumeOffer(null);
    progressLoadedRef.current = true; // skip first auto-save trigger
    setStage('playing');
  };
  const restartQuiz = () => {
    if (!quiz) return;
    apiClearQuizProgress(quiz.id).catch(() => {});
    sessionStorage.setItem(`quiz_active_${quiz.id}`, '1');
    setResumeOffer(null);
    setIdx(0);
    setAnswers({});
    setStage('playing');
  };

  // ── Intro screen ──
  if (stage === 'intro') {
    return (
      <div className="quiz-surface fixed inset-0 overflow-y-auto">
        {resumeOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm" style={{ background: 'var(--q-overlay)' }}>
            <div className="max-w-md w-full rounded-2xl p-7 shadow-2xl border" style={{ background: 'var(--q-modal-bg)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--q-kicker)' }}>Reprendre formació</div>
              <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl leading-tight mb-3">
                Tens progrés guardat
              </h3>
              <p className="text-sm mb-1" style={{ color: 'var(--q-text-70)' }}>Vas arribar fins a la pregunta <span className="font-semibold" style={{ color: 'var(--q-text)' }}>{Math.min(resumeOffer.idx + 1, total)}</span> de {total}.</p>
              <p className="text-xs mb-6" style={{ color: 'var(--q-text-55)' }}>Última activitat: {resumeOffer.updated_at}</p>
              <div className="flex gap-3">
                <button
                  onClick={resumeQuiz}
                  className="w-full px-5 py-3 rounded-xl text-white font-semibold text-sm transition-colors hover:brightness-110"
                  style={{ background: '#bf211e' }}
                >
                  Continuar →
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center" style={{ color: 'var(--q-text)' }}>
            {quiz.image && (
              <img src={resolveImg(quiz.image)} alt="" loading="lazy" className="w-full h-64 object-cover rounded-2xl mb-8 shadow-2xl" />
            )}
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--q-kicker)' }}>
              {quiz.category || 'Formació TAVIL'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-5xl md:text-6xl font-normal leading-tight mb-6 tracking-tight">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--q-text-70)' }}>{quiz.description}</p>
            )}
            <div className="grid grid-cols-3 gap-4 mb-10 max-w-md mx-auto">
              {[
                { val: total, label: 'Preguntes' },
                { val: `${quiz.passing_score}%`, label: 'Per aprovar' },
                { val: quiz.time_limit || '∞', label: quiz.time_limit ? 'Minuts' : 'Sense límit' },
              ].map(({ val, label }) => (
                <div key={label} className="rounded-2xl p-4 border" style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}>
                  <div className="text-3xl font-bold tabular-nums">{val}</div>
                  <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--q-text-50)' }}>{label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (resumeOffer) { resumeQuiz(); return; }
                if (quiz) sessionStorage.setItem(`quiz_active_${quiz.id}`, '1');
                setStage('playing');
              }}
              className="px-10 py-4 rounded-full text-white font-semibold text-base transition-colors shadow-2xl shadow-red-900/30 hover:brightness-110"
              style={{ background: '#bf211e' }}
            >
              {resumeOffer ? 'Continuar formació →' : 'Començar formació →'}
            </button>
            <p className="text-xs mt-4" style={{ color: 'var(--q-text-55)' }}>Fes servir les fletxes ← → per navegar</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Result screen ──
  if (stage === 'result' && result) {
    const passed = result.passed;
    return (
      <div className={`fixed inset-0 overflow-y-auto ${passed ? 'quiz-surface-pass' : 'quiz-surface-fail'}`}>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="max-w-3xl w-full" style={{ color: 'var(--q-text)' }}>
            <div className="text-center mb-10">
              <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--q-text-60)' }}>Resultat final</div>
              <div style={{ fontFamily: 'var(--font-display)' }} className="text-8xl md:text-9xl font-normal mb-2 tabular-nums">
                {result.percentage}%
              </div>
              <p className="text-2xl font-semibold mb-2">{passed ? 'Aprovat' : 'No aprovat'}</p>
              <p className="text-sm" style={{ color: 'var(--q-text-60)' }}>{result.score} / {result.max_score} punts</p>
            </div>

            <div className="space-y-3 mb-10">
              {quiz.questions?.filter(qq => qq.type !== 'slide').map((qq, qi) => {
                const r = result.results[String(qq.id)];
                if (!r) return null;
                const ok = r.correct === true;
                const ko = r.correct === false;
                return (
                  <div key={qq.id} className="rounded-2xl p-5 border" style={{ background: ok ? 'var(--q-surface)' : ko ? 'var(--q-surface)' : 'var(--q-surface)', borderColor: ok ? 'var(--q-border-20)' : 'var(--q-border)' }}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold`} style={{ background: ok ? 'var(--q-text)' : 'var(--q-surface-10)', color: ok ? (passed ? '#16a34a' : '#fff') : 'var(--q-text-60)' }}>
                        {ok ? '✓' : ko ? '✗' : qi + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold mb-1">{qq.question}</p>
                        {r.correct === null && <p className="text-xs italic" style={{ color: 'var(--q-text-60)' }}>Resposta oberta: {r.answer}</p>}
                        {qq.explanation && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--q-text-60)' }}>{qq.explanation}</p>}
                      </div>
                      <div className="text-xs tabular-nums" style={{ color: 'var(--q-text-50)' }}>{r.points}/{qq.points} pts</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => window.close()}
                className="px-10 py-3 rounded-full text-sm font-semibold transition-colors w-full max-w-xs"
                style={{ background: passed ? '#14532d' : '#7f1d1d', color: '#fff' }}
              >
                Tancar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing — one question per slide ──
  if (!q) return null;
  return (
    <div className="quiz-surface fixed inset-0 flex flex-col">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-10" style={{ background: 'var(--q-progress-bg)' }}>
        <div className="h-full bg-gradient-to-r from-[#bf211e]/70 to-[#bf211e]/40 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-12 py-5 text-xs flex-shrink-0" style={{ color: 'var(--q-text-60)' }}>
        <span className="font-semibold tracking-widest uppercase">{quiz.title}</span>
        <span
          className="tabular-nums px-3 py-1.5 rounded-full font-semibold border"
          style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text-80)' }}
          title="Posició actual — el progrés es desa automàticament"
        >
          {idx + 1} / {total}
        </span>
      </div>

      {/* Question slide */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto" style={{ color: 'var(--q-text)' }}>
          <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--q-kicker)' }}>
            {q.type === 'slide' ? `Slide ${idx + 1}` : `Pregunta ${idx + 1}`}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl md:text-5xl font-normal leading-tight mb-10 tracking-tight">
            {q.question}
          </h2>

          {q.type === 'slide' && (
            <div className="space-y-6">
              {q.media_url && (
                /\.(mp4|webm|ogg|mov)(\?|$)/i.test(q.media_url) ? (
                  <video src={resolveImg(q.media_url)} controls className="w-full max-h-[60vh] rounded-2xl bg-black shadow-2xl" />
                ) : (
                  <img src={resolveImg(q.media_url)} alt="" loading="lazy" className="w-full max-h-[60vh] object-contain rounded-2xl bg-black/40 shadow-2xl" />
                )
              )}
              {q.explanation && (
                <p className="text-lg leading-relaxed" style={{ color: 'var(--q-text-80)' }}>{q.explanation}</p>
              )}
            </div>
          )}

          {q.type === 'multiple_choice' && (
            <div className="space-y-3">
              {q.options?.map((o, oi) => {
                const sel = answers[String(q.id)] === String(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => setAnswers(a => ({ ...a, [String(q.id)]: String(o.id) }))}
                    className="w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 scale-100 hover:scale-[1.01]"
                    style={sel ? { background: '#bf211e', borderColor: '#bf211e', color: '#fff' } : { background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={sel ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: 'var(--q-surface-10)', color: 'var(--q-text-70)' }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-base md:text-lg font-medium">{o.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'multiple_select' && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: 'var(--q-text-60)' }}>Selecciona totes les correctes</p>
              {q.options?.map((o, oi) => {
                const cur = (answers[String(q.id)] as any) ?? [];
                const arr: string[] = Array.isArray(cur) ? cur : [];
                const sel = arr.includes(String(o.id));
                return (
                  <button
                    key={o.id}
                    onClick={() => setAnswers(a => {
                      const c = (a[String(q.id)] as any) ?? [];
                      const list: string[] = Array.isArray(c) ? [...c] : [];
                      const idx2 = list.indexOf(String(o.id));
                      if (idx2 >= 0) list.splice(idx2, 1); else list.push(String(o.id));
                      return { ...a, [String(q.id)]: list };
                    })}
                    className="w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4"
                    style={sel ? { background: '#bf211e', borderColor: '#bf211e', color: '#fff' } : { background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold" style={sel ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: 'var(--q-surface-10)', color: 'var(--q-text-70)' }}>
                      {sel ? '✓' : oi + 1}
                    </span>
                    <span className="text-base md:text-lg font-medium">{o.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {q.options?.slice(0, 2).map(o => {
                const sel = answers[String(q.id)] === String(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => setAnswers(a => ({ ...a, [String(q.id)]: String(o.id) }))}
                    className="p-10 rounded-2xl border-2 transition-all text-3xl font-medium"
                    style={sel ? { background: '#bf211e', borderColor: '#bf211e', color: '#fff', fontFamily: 'var(--font-display)' } : { background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)', fontFamily: 'var(--font-display)' }}
                  >
                    {o.text}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'matching' && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: 'var(--q-text-60)' }}>Escriu el valor de la dreta que correspon a cada element</p>
              {q.options?.map(o => (
                <div key={o.id} className="flex items-center gap-3 rounded-2xl p-4 border" style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}>
                  <span className="flex-1 font-medium" style={{ color: 'var(--q-text-90)' }}>{o.text}</span>
                  <span style={{ color: 'var(--q-text-40)' }}>→</span>
                  <input
                    value={(answers[String(q.id)] as any)?.[String(o.id)] ?? ''}
                    onChange={e => setAnswers(a => ({
                      ...a,
                      [String(q.id)]: { ...((a[String(q.id)] as any) ?? {}), [String(o.id)]: e.target.value }
                    }))}
                    className="flex-1 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#bf211e]/40 border"
                    style={{ background: 'var(--q-surface-10)', borderColor: 'var(--q-border-20)', color: 'var(--q-text)' }}
                    placeholder="Resposta…"
                  />
                </div>
              ))}
            </div>
          )}

          {q.type === 'open_text' && (
            <textarea
              value={answers[String(q.id)] ?? ''}
              onChange={e => setAnswers(a => ({ ...a, [String(q.id)]: e.target.value }))}
              className="w-full rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#bf211e]/40 resize-none border-2"
              style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
              rows={6}
              placeholder="Escriu la teva resposta…"
            />
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 px-6 md:px-12 py-5 border-t flex items-center justify-between backdrop-blur-sm" style={{ borderColor: 'var(--q-border)', background: 'var(--q-footer-bg)' }}>
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="px-5 py-2.5 rounded-full disabled:opacity-30 text-sm font-semibold transition-colors"
          style={{ color: 'var(--q-text-70)' }}
        >
          ← Anterior
        </button>
        <div className="flex items-center gap-1.5">
          {(quiz.questions ?? []).map((qq, qi) => {
            const a = answers[String(qq.id)];
            const has = qq.type === 'matching'
              ? (a && typeof a === 'object' && Object.keys(a).length > 0)
              : (a !== undefined && a !== '');
            return (
              <button
                key={qq.id}
                onClick={() => setIdx(qi)}
                className="rounded-full transition-all"
                style={{
                  width: qi === idx ? 32 : 8, height: 8,
                  background: qi === idx ? 'var(--q-text)' : has ? '#bf211e' : 'var(--q-surface-10)',
                }}
                aria-label={`Anar a pregunta ${qi + 1}`}
              />
            );
          })}
        </div>
        {idx < total - 1 ? (
          <button
            onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
            disabled={!answered}
            className="px-6 py-2.5 rounded-full disabled:opacity-40 text-sm font-semibold transition-colors hover:brightness-110"
            style={{ background: '#bf211e', color: '#f7f7f2' }}
          >
            Següent →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || !allAnswered}
            className="px-6 py-2.5 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold transition-all hover:brightness-110 shadow-lg shadow-red-900/40"
            style={{ background: '#bf211e' }}
          >
            {submitting ? 'Enviant…' : 'Finalitzar ✓'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Quiz Editor Page (full-screen, presentation-style WYSIWYG) ───────────────

function QuizEditorPage({ initialQuizId }: { initialQuizId: number | null }) {
  // Token inherit from opener (sessionStorage isn't shared cross-tab)
  useEffect(() => {
    try {
      const have = localStorage.getItem('tavil_token') || sessionStorage.getItem('tavil_token');
      if (!have && window.opener) {
        const op = window.opener as Window | null;
        const t = op?.localStorage?.getItem('tavil_token') ?? op?.sessionStorage?.getItem('tavil_token') ?? null;
        if (t) sessionStorage.setItem('tavil_token', t);
      }
    } catch { /* cross-origin or null opener */ }
    document.title = 'Editor formació · TAVIL';
  }, []);

  const [quizId, setQuizId] = useState<number | null>(initialQuizId);
  const [loading, setLoading] = useState(initialQuizId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);

  const [title, setTitle] = useState('Nova formació');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [active, setActive] = useState(1);
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(0);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [targetDepts, setTargetDepts] = useState<string[]>([]);
  const [targetUsers, setTargetUsers] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [allUsers, setAllUsers] = useState<{ id: number; name: string; email: string; dept: string; avatar_url?: string | null }[]>([]);
  const [isPresential, setIsPresential] = useState(0);
  const [location, setLocation] = useState('');
  const [questions, setQuestions] = useState<QBQuestion[]>([]);
  const [selectedQ, setSelectedQ] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const dragIdxRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const dbToLocal = (s: string | null | undefined) => s ? s.slice(0, 10) : '';
  const localToDb = (s: string) => s ? s + ' 00:00:00' : null;

  useEffect(() => {
    if (initialQuizId === null) return;
    apiGetQuiz(initialQuizId).then(q => {
      setTitle(q.title || 'Nova formació');
      setDescription(q.description || '');
      setCategory(q.category || '');
      setImage(q.image || '');
      setActive(q.active ?? 1);
      setPassingScore(q.passing_score ?? 70);
      setTimeLimit(q.time_limit ?? 0);
      setStartAt(dbToLocal(q.start_at));
      setEndAt(dbToLocal(q.end_at));
      setTargetDepts(q.target_departments ?? []);
      setTargetUsers((q.target_users ?? []).map(Number));
      setIsPresential(q.is_presential ?? 0);
      setLocation(q.location ?? '');
      setQuestions((q.questions ?? []).map(qq => ({
        _key: mkKey(),
        type: qq.type as QBQuestion['type'],
        question: qq.question,
        explanation: qq.explanation ?? '',
        points: qq.points,
        media_url: qq.media_url ?? '',
        options: (qq.options ?? []).map(o => ({
          _key: mkKey(),
          text: o.text,
          is_correct: o.is_correct ?? 0,
          match_pair: o.match_pair ?? '',
        })),
      })));
    }).catch(e => setError(e.message ?? 'Error carregant'))
      .finally(() => setLoading(false));
  }, [initialQuizId]);

  useEffect(() => {
    apiAdminListUsers().then(us => setAllUsers(us.map(u => ({ id: u.id, name: u.name, email: u.email, dept: u.dept })))).catch(() => {});
  }, []);

  const addQuestion = (type: QBQuestion['type']) => {
    const blank = (text = '', is_correct = 0): QBOption =>
      ({ _key: mkKey(), text, is_correct, match_pair: '' });
    const defaultOpts: QBOption[] =
      type === 'multiple_choice'  ? [blank(), blank(), blank(), blank()] :
      type === 'multiple_select'  ? [blank(), blank(), blank(), blank()] :
      type === 'true_false'       ? [blank('Vertader'), blank('Fals')] :
      type === 'matching'         ? [blank(), blank()] :
      [];
    setQuestions(qs => {
      const next: QBQuestion[] = [...qs, {
        _key: mkKey(), type, question: '', explanation: '', points: type === 'slide' ? 0 : 1,
        media_url: '', options: defaultOpts,
      }];
      setSelectedQ(next.length - 1);
      return next;
    });
  };

  const updateQ = (key: string, patch: Partial<QBQuestion>) =>
    setQuestions(qs => qs.map(q => q._key === key ? { ...q, ...patch } : q));
  const removeQ = (key: string) => {
    setQuestions(qs => {
      const idx = qs.findIndex(q => q._key === key);
      const next = qs.filter(q => q._key !== key);
      setSelectedQ(s => Math.min(s, next.length - 1, idx > 0 ? idx - 1 : 0));
      return next;
    });
  };
  const updateOpt = (qKey: string, oKey: string, patch: Partial<QBOption>) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: q.options.map(o => o._key === oKey ? { ...o, ...patch } : o) } : q));
  const addOpt = (qKey: string) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: [...q.options, { _key: mkKey(), text: '', is_correct: 0, match_pair: '' }] } : q));
  const removeOpt = (qKey: string, oKey: string) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: q.options.filter(o => o._key !== oKey) } : q));
  const setCorrect = (qKey: string, oKey: string) =>
    setQuestions(qs => qs.map(q => q._key === qKey
      ? { ...q, options: q.options.map(o => ({ ...o, is_correct: o._key === oKey ? 1 : 0 })) } : q));

  const onDragStart = (i: number) => { dragIdxRef.current = i; };
  const onDragOver = (i: number, e: React.DragEvent) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = (i: number) => {
    const from = dragIdxRef.current;
    dragIdxRef.current = null;
    setDragOverIdx(null);
    if (from === null || from === i) return;
    setQuestions(qs => {
      const arr = [...qs];
      const [m] = arr.splice(from, 1);
      arr.splice(i, 0, m);
      return arr;
    });
    setSelectedQ(i);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('El títol és obligatori'); return; }
    setSaving(true); setError('');
    try {
      let imageUrl = image;
      if (imageFile) imageUrl = await apiUploadImage(imageFile);
      const payload: QuizIn = {
        title: title.trim(), description: description.trim(), image: imageUrl,
        category: category.trim(), time_limit: timeLimit, passing_score: passingScore,
        active, start_at: localToDb(startAt), end_at: localToDb(endAt),
        target_departments: targetDepts,
        target_users: targetUsers,
        is_presential: isPresential,
        location,
        questions: questions.map((q, qi) => ({
          type: q.type, question: q.question, explanation: q.explanation,
          points: q.points, position: qi,
          media_url: q.media_url ?? '',
          options: q.options.map((o, oi) => ({
            text: o.text, is_correct: o.is_correct, match_pair: o.match_pair, position: oi,
          })),
        })),
      };
      const saved = quizId !== null ? await apiUpdateQuiz(quizId, payload) : await apiCreateQuiz(payload);
      setQuizId(saved.id);
      setImageFile(null);
      setImage(saved.image || '');
      try { window.opener?.postMessage({ type: 'tavil-quiz-saved' }, window.location.origin); } catch {}
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        url.searchParams.set('edit', String(saved.id));
        window.history.replaceState({}, '', url.toString());
      } catch {}
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 2400);
    } catch (e: any) {
      setError(e.message ?? 'Error desconegut');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="quiz-editor-surface fixed inset-0 flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--q-text-60)' }}>Carregant…</div>
      </div>
    );
  }

  const q = questions[selectedQ];

  return (
    <div className="quiz-editor-surface fixed inset-0 flex flex-col">
      {/* Saved toast */}
      {savedToast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full text-sm font-medium text-white shadow-2xl flex items-center gap-2 backdrop-blur-md border border-white/20"
          style={{ background: 'rgba(22,163,74,0.95)', animation: 'fadeInDown 0.25s ease-out' }}
        >
          <span className="w-5 h-5 rounded-full bg-white/[0.12] flex items-center justify-center text-xs">✓</span>
          Formació guardada correctament
        </div>
      )}

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3.5 border-b backdrop-blur-md" style={{ borderColor: 'var(--q-border)', background: 'var(--q-topbar-bg)' }}>
        <button onClick={() => window.close()} className="text-sm flex-shrink-0 transition-colors" style={{ color: 'var(--q-text-60)' }}>← Tancar</button>
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-base font-medium tracking-tight focus:outline-none"
            style={{ color: 'var(--q-text)', caretColor: '#bf211e' }}
            placeholder="Títol de la formació…"
          />
        </div>
        {error && <span className="text-xs text-red-700 dark:text-red-200 bg-red-100 dark:bg-[#bf211e]/20 border border-red-300 dark:border-[#bf211e]/40 px-3 py-1.5 rounded-full flex-shrink-0">{error}</span>}
        <button onClick={() => setShowSettings(true)} className="px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0" style={{ color: 'var(--q-text-70)' }}>⚙ Configuració</button>
        <button onClick={handleSave} disabled={saving || !title.trim()} className="px-5 py-2 rounded-full text-white disabled:opacity-40 text-sm font-semibold transition-colors flex-shrink-0 shadow-lg shadow-[#bf211e]/25" style={{ background: '#bf211e' }}>
          {saving ? 'Guardant…' : (quizId !== null ? 'Guardar' : 'Crear')}
        </button>
      </div>

      {/* Presential mode placeholder */}
      {isPresential === 1 && (
        <div className="flex-1 flex items-center justify-center p-10" style={{ color: 'var(--q-text-55)' }}>
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">📍</div>
            <div className="text-base font-semibold mb-2" style={{ color: 'var(--q-text)' }}>Formació presencial</div>
            <p className="text-sm leading-relaxed">Aquesta formació és presencial i no necessita preguntes. Configura el lloc i les dates a <button onClick={() => setShowSettings(true)} className="underline font-medium" style={{ color: 'var(--q-kicker)' }}>Configuració</button>.</p>
          </div>
        </div>
      )}

      {/* Body: left rail + canvas */}
      {isPresential !== 1 && <div className="flex-1 flex min-h-0">
        {/* Left rail — slide thumbnails */}
        <div className="flex-shrink-0 w-64 border-r overflow-y-auto p-3 space-y-2" style={{ borderColor: 'var(--q-border)', background: 'var(--q-panel-bg)' }}>
          {questions.map((qq, i) => {
            const sel = i === selectedQ;
            const dragOver = dragOverIdx === i;
            return (
              <div
                key={qq._key}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(i, e)}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={() => onDrop(i)}
                onClick={() => setSelectedQ(i)}
                className={`cursor-grab active:cursor-grabbing rounded-xl p-3 border-2 transition-all ${dragOver ? 'scale-[1.02]' : ''}`}
                style={sel
                  ? { background: 'var(--q-surface-10)', borderColor: 'rgba(191,33,30,0.55)' }
                  : { background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--q-text-50)' }}>#{i + 1}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: 'var(--q-surface-10)', color: 'var(--q-text-60)' }}>
                    {qq.type === 'multiple_choice' ? 'Opció' :
                     qq.type === 'multiple_select' ? 'Multi' :
                     qq.type === 'true_false' ? 'V/F' :
                     qq.type === 'matching' ? 'Parella' :
                     qq.type === 'slide' ? 'Slide' :
                     'Oberta'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeQ(qq._key); }}
                    className="ml-auto text-xs transition-colors"
                    style={{ color: 'var(--q-text-55)' }}
                    aria-label="Eliminar pregunta"
                  >✕</button>
                </div>
                <p className="text-xs line-clamp-2 leading-snug" style={{ color: 'var(--q-text)' }}>
                  {qq.question || <span className="italic" style={{ color: 'var(--q-text-55)' }}>Sense text</span>}
                </p>
              </div>
            );
          })}

          {/* Add picker trigger */}
          <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--q-border)' }}>
            <button
              onClick={() => setShowAddPicker(true)}
              className="w-full text-sm px-3 py-2.5 rounded-lg text-white font-semibold transition-all hover:brightness-110 shadow-md shadow-[#bf211e]/25 flex items-center justify-center gap-2"
              style={{ background: '#bf211e' }}
            >
              <span className="text-lg leading-none">+</span> Afegir pregunta
            </button>
          </div>
          {questions.length === 0 && (
            <p className="text-[11px] text-center pt-4" style={{ color: 'var(--q-text-55)' }}>Comença afegint una pregunta</p>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-10">
          {!q ? (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--q-text-55)' }}>
              Afegeix una pregunta per començar →
            </div>
          ) : (
            <div className="max-w-3xl mx-auto" style={{ color: 'var(--q-text)' }}>
              <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--q-kicker)' }}>
                {q.type === 'slide' ? `Slide ${selectedQ + 1}` : `Pregunta ${selectedQ + 1}`}
              </div>
              <textarea
                value={q.question}
                onChange={e => updateQ(q._key, { question: e.target.value })}
                style={{ fontFamily: 'var(--font-display)', color: 'var(--q-text)' }}
                rows={2}
                className="w-full bg-transparent text-4xl md:text-5xl font-normal leading-tight mb-10 tracking-tight focus:outline-none resize-none"
                placeholder={q.type === 'slide' ? 'Títol del slide…' : 'Escriu la pregunta…'}
              />

              {q.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {q.options.map((o, oi) => (
                    <div key={o._key} className="flex items-center gap-4 p-5 rounded-2xl border-2 transition-colors"
                      style={o.is_correct ? { background: 'rgba(191,33,30,0.06)', borderColor: 'rgba(191,33,30,0.35)' } : { background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}>
                      <button
                        onClick={() => setCorrect(q._key, o._key)}
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                        style={o.is_correct ? { background: '#bf211e', color: '#fff' } : { background: 'var(--q-surface-10)', color: 'var(--q-text-70)' }}
                        title={o.is_correct ? 'Correcta' : 'Marcar com correcta'}
                      >
                        {String.fromCharCode(65 + oi)}
                      </button>
                      <input
                        value={o.text}
                        onChange={e => updateOpt(q._key, o._key, { text: e.target.value })}
                        className="flex-1 bg-transparent text-base md:text-lg focus:outline-none"
                        style={{ color: 'var(--q-text)' }}
                        placeholder={`Opció ${String.fromCharCode(65 + oi)}…`}
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOpt(q._key, o._key)} className="text-sm transition-colors" style={{ color: 'var(--q-text-55)' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addOpt(q._key)} className="text-xs mt-2 transition-colors" style={{ color: 'var(--q-text-55)' }}>+ Afegir opció</button>
                </div>
              )}

              {q.type === 'multiple_select' && (
                <div className="space-y-3">
                  <p className="text-xs mb-3" style={{ color: 'var(--q-text-55)' }}>Selecció múltiple — l'usuari pot triar diverses correctes.</p>
                  {q.options.map((o, oi) => (
                    <div key={o._key} className="flex items-center gap-4 p-5 rounded-2xl border-2 transition-colors"
                      style={o.is_correct ? { background: 'rgba(191,33,30,0.06)', borderColor: 'rgba(191,33,30,0.35)' } : { background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}>
                      <button
                        onClick={() => updateOpt(q._key, o._key, { is_correct: o.is_correct ? 0 : 1 })}
                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                        style={o.is_correct ? { background: '#bf211e', color: '#fff' } : { background: 'var(--q-surface-10)', color: 'var(--q-text-55)' }}
                        title={o.is_correct ? 'Correcta — clica per desmarcar' : 'Marcar com correcta'}
                      >
                        {o.is_correct ? '✓' : <span className="text-xs font-bold tabular-nums">{oi + 1}</span>}
                      </button>
                      <input
                        value={o.text}
                        onChange={e => updateOpt(q._key, o._key, { text: e.target.value })}
                        className="flex-1 bg-transparent text-base md:text-lg focus:outline-none"
                        style={{ color: 'var(--q-text)' }}
                        placeholder={`Opció ${oi + 1}…`}
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOpt(q._key, o._key)} className="text-sm transition-colors" style={{ color: 'var(--q-text-55)' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addOpt(q._key)} className="text-xs mt-2 transition-colors" style={{ color: 'var(--q-text-55)' }}>+ Afegir opció</button>
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {q.options.slice(0, 2).map((o) => (
                    <button
                      key={o._key}
                      onClick={() => setCorrect(q._key, o._key)}
                      className="p-8 rounded-2xl border-2 transition-all text-2xl font-medium"
                      style={o.is_correct
                        ? { background: 'rgba(191,33,30,0.08)', borderColor: 'rgba(191,33,30,0.45)', color: 'var(--q-text)' }
                        : { background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text-70)' }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span style={{ fontFamily: 'var(--font-display)' }}>{o.text || (o === q.options[0] ? 'Vertader' : 'Fals')}</span>
                        {o.is_correct
                          ? <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--q-kicker)' }}>Correcta</span>
                          : <span className="text-[10px]" style={{ color: 'var(--q-text-55)' }}>Clica per marcar</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'matching' && (
                <div className="space-y-3">
                  <p className="text-sm mb-3" style={{ color: 'var(--q-text-55)' }}>Parelles esquerra → dreta. L'usuari escriurà el valor correcte.</p>
                  {q.options.map(o => (
                    <div key={o._key} className="flex items-center gap-3 rounded-2xl p-4 border"
                      style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}>
                      <input
                        value={o.text}
                        onChange={e => updateOpt(q._key, o._key, { text: e.target.value })}
                        className="flex-1 bg-transparent focus:outline-none"
                        style={{ color: 'var(--q-text)' }}
                        placeholder="Element esquerra…"
                      />
                      <span style={{ color: 'var(--q-text-50)' }}>→</span>
                      <input
                        value={o.match_pair}
                        onChange={e => updateOpt(q._key, o._key, { match_pair: e.target.value })}
                        className="flex-1 rounded-xl px-4 py-2 focus:outline-none border transition-colors"
                        style={{ background: 'var(--q-surface-10)', borderColor: 'var(--q-border-12)', color: 'var(--q-text)' }}
                        placeholder="Resposta correcta…"
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOpt(q._key, o._key)} className="text-sm transition-colors" style={{ color: 'var(--q-text-55)' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addOpt(q._key)} className="text-xs mt-2 transition-colors" style={{ color: 'var(--q-text-55)' }}>+ Afegir parella</button>
                </div>
              )}

              {q.type === 'open_text' && (
                <div className="border-2 border-dashed rounded-2xl p-8 text-center text-sm"
                  style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text-55)' }}>
                  L'empleat respondrà amb text lliure. No es corregeix automàticament.
                </div>
              )}

              {q.type === 'slide' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--q-kicker)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#bf211e]" /> Slide d'explicació · sense pregunta
                  </div>
                  {q.media_url ? (
                    <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--q-border)', background: 'rgba(191,33,30,0.04)' }}>
                      {/\.(mp4|webm|ogg|mov)(\?|$)/i.test(q.media_url) ? (
                        <video src={resolveImg(q.media_url)} controls className="w-full max-h-[420px] object-contain bg-black" />
                      ) : (
                        <img src={resolveImg(q.media_url)} alt="" loading="lazy" className="w-full max-h-[420px] object-contain bg-black" />
                      )}
                      <button
                        onClick={() => updateQ(q._key, { media_url: '' })}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs backdrop-blur transition-colors hover:brightness-110"
                        style={{ background: '#bf211e', color: '#fff' }}
                      >Treure</button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-2xl p-8 text-center space-y-3"
                      style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)' }}>
                      <p className="text-sm" style={{ color: 'var(--q-text-55)' }}>Imatge o vídeo per il·lustrar el contingut</p>
                      <label className="inline-block cursor-pointer text-xs px-4 py-2 rounded-full text-white font-semibold transition-all hover:brightness-110 shadow-md shadow-[#bf211e]/25" style={{ background: '#bf211e' }}>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={async e => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const full = await apiUploadImage(f);
                              const m = full.match(/(\/uploads\/[^?#]+)/);
                              updateQ(q._key, { media_url: m ? m[1] : full });
                            } catch (err: any) {
                              setError(err.message ?? 'Error pujant');
                            }
                          }}
                        />
                        Pujar fitxer
                      </label>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'var(--q-text-55)' }}>URL del fitxer (opcional, manual)</label>
                    <input
                      value={q.media_url ?? ''}
                      onChange={e => updateQ(q._key, { media_url: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border transition-colors"
                      style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
                      placeholder="https://… o /uploads/…"
                    />
                  </div>
                </div>
              )}

              {/* Explanation + points (hidden for slide — purely informational) */}
              {q.type !== 'slide' && (
                <div className="mt-10 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4" style={{ borderColor: 'var(--q-border)' }}>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'var(--q-text-55)' }}>Explicació (mostrada al corregir)</label>
                    <input
                      value={q.explanation}
                      onChange={e => updateQ(q._key, { explanation: e.target.value })}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none border transition-colors"
                      style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
                      placeholder="Explicació opcional…"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'var(--q-text-55)' }}>Punts</label>
                    <input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={e => updateQ(q._key, { points: Number(e.target.value) || 1 })}
                      className="w-full rounded-xl px-4 py-2.5 text-sm tabular-nums focus:outline-none border transition-colors"
                      style={{ background: 'var(--q-surface)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>}

      {/* Settings drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end backdrop-blur-md" style={{ background: 'var(--q-overlay)' }} onClick={() => setShowSettings(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg h-full border-l overflow-y-auto shadow-2xl shadow-black/15" style={{ background: 'var(--q-settings-bg)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b backdrop-blur-md" style={{ background: 'var(--q-topbar-bg)', borderColor: 'var(--q-border)' }}>
              <div>
                <h3 className="text-base font-semibold tracking-tight">Configuració</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--q-text-50)' }}>Detalls i visibilitat de la formació</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.06]" style={{ color: 'var(--q-text-50)' }} aria-label="Tancar">✕</button>
            </div>

            <div className="px-8 py-6 space-y-10">
              {/* SECTION 1: Detalls */}
              <section>
                <header className="mb-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--q-text-50)' }}>Detalls</h4>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--q-text-55)' }}>Informació bàsica que veuran els empleats.</p>
                </header>
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-1 items-start">
                    <label className="text-xs pt-2" style={{ color: 'var(--q-text-70)' }}>Imatge portada</label>
                    <div className="flex items-center gap-3">
                      {(imageFile || image) && (
                        <img src={imageFile ? URL.createObjectURL(imageFile) : resolveImg(image)} alt="" loading="lazy" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" style={{ border: '1px solid var(--q-border)' }} />
                      )}
                      <label className="flex-1 cursor-pointer text-xs px-3 py-2 rounded-lg border border-dashed text-center transition-colors" style={{ background: 'var(--q-surface-08)', borderColor: 'var(--q-border-20)', color: 'var(--q-text-70)' }}>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
                        {imageFile ? imageFile.name : (image ? 'Canviar' : 'Pujar imatge')}
                      </label>
                      {(imageFile || image) && (
                        <button onClick={() => { setImageFile(null); setImage(''); }} className="text-xs hover:text-red-500 px-2 transition-colors" style={{ color: 'var(--q-text-60)' }}>Treure</button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-1 items-start">
                    <label className="text-xs pt-2" style={{ color: 'var(--q-text-70)' }}>Descripció</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 resize-none transition-colors" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)', color: 'var(--q-text)' }} placeholder="Què aprendran a aquesta formació…" />
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-1 items-center">
                    <label className="text-xs" style={{ color: 'var(--q-text-70)' }}>Categoria</label>
                    <input value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)', color: 'var(--q-text)' }} placeholder="Seguretat, RRHH, Tècnica…" />
                  </div>

                  {/* Presential toggle */}
                  <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)' }}>
                    <div>
                      <div className="text-sm font-medium">Formació presencial</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--q-text-50)' }}>{isPresential ? 'Sense preguntes — mostra data i lloc' : 'Formació amb preguntes (quiz)'}</div>
                    </div>
                    <button type="button" onClick={() => setIsPresential(p => p === 1 ? 0 : 1)} className="relative inline-flex w-11 h-6 items-center rounded-full transition-colors flex-shrink-0" style={{ background: isPresential ? '#bf211e' : 'var(--q-border-20)' }}>
                      <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: isPresential ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </button>
                  </div>

                  {isPresential === 1 && (
                    <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-1 items-center">
                      <label className="text-xs" style={{ color: 'var(--q-text-70)' }}>Lloc</label>
                      <input value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)', color: 'var(--q-text)' }} placeholder="Sala de reunions, planta 2…" />
                    </div>
                  )}
                </div>
              </section>

              {/* SECTION 2: Visibilitat */}
              <section>
                <header className="mb-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--q-text-50)' }}>Visibilitat</h4>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--q-text-55)' }}>Qui pot veure i fer aquesta formació.</p>
                </header>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)' }}>
                    <div>
                      <div className="text-sm font-medium">Activa</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--q-text-50)' }}>{active === 1 ? 'Visible al portal' : 'Esborrany — només admins'}</div>
                    </div>
                    <button type="button" onClick={() => setActive(a => a === 1 ? 0 : 1)} className="relative inline-flex w-11 h-6 items-center rounded-full transition-colors flex-shrink-0" style={{ background: active === 1 ? '#bf211e' : 'var(--q-border-20)' }}>
                      <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: active === 1 ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs block mb-2" style={{ color: 'var(--q-text-70)' }}>Departaments destinataris</label>
                    <DeptSearch value={targetDepts} onChange={setTargetDepts} />
                  </div>

                  {/* Persones concretes */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <label className="text-xs" style={{ color: 'var(--q-text-70)' }}>Persones concretes</label>
                      <span className="text-[11px]" style={{ color: 'var(--q-text-55)' }}>{targetUsers.length === 0 ? 'Cap' : `${targetUsers.length} persona${targetUsers.length !== 1 ? 'es' : ''}`}</span>
                    </div>
                    {/* Selected chips */}
                    {targetUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {targetUsers.map(uid => {
                          const u = allUsers.find(x => x.id === uid);
                          return (
                            <span key={uid} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md" style={{ background: '#bf211e', color: '#fff' }}>
                              {u ? u.name : `#${uid}`}
                              <button onClick={() => setTargetUsers(prev => prev.filter(x => x !== uid))} className="opacity-70 hover:opacity-100 leading-none" aria-label="Treure">×</button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Search input */}
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Cerca per nom o correu…"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors mb-1"
                      style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)', color: 'var(--q-text)' }}
                    />
                    {/* Results dropdown */}
                    {userSearch.trim().length > 0 && (
                      <div className="rounded-lg overflow-hidden border max-h-44 overflow-y-auto" style={{ borderColor: 'var(--q-border)', background: 'var(--q-surface-08)' }}>
                        {allUsers
                          .filter(u => {
                            const q = userSearch.toLowerCase();
                            return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && !targetUsers.includes(u.id);
                          })
                          .slice(0, 20)
                          .map(u => (
                            <button
                              key={u.id}
                              onClick={() => { setTargetUsers(prev => [...prev, u.id]); setUserSearch(''); }}
                              className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors hover:bg-[#bf211e]/[0.08]"
                            >
                              <span className="font-medium truncate">{u.name}</span>
                              <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--q-text-50)' }}>{u.dept}</span>
                            </button>
                          ))
                        }
                        {allUsers.filter(u => {
                          const q = userSearch.toLowerCase();
                          return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && !targetUsers.includes(u.id);
                        }).length === 0 && (
                          <p className="px-3 py-2 text-sm" style={{ color: 'var(--q-text-50)' }}>Sense resultats</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION 3: Avaluació */}
              <section>
                <header className="mb-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--q-text-50)' }}>Avaluació</h4>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--q-text-55)' }}>Criteris per superar la formació.</p>
                </header>
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-1 items-center">
                    <label className="text-xs" style={{ color: 'var(--q-text-70)' }}>Aprovat</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value) || 0)} className="w-24 rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)', color: 'var(--q-text)' }} />
                      <span className="text-xs" style={{ color: 'var(--q-text-50)' }}>% mínim</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-1 items-center">
                    <label className="text-xs" style={{ color: 'var(--q-text-70)' }}>Temps límit</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value) || 0)} className="w-24 rounded-lg px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors" style={{ background: 'var(--q-surface-08)', border: '1px solid var(--q-border)', color: 'var(--q-text)' }} />
                      <span className="text-xs" style={{ color: 'var(--q-text-50)' }}>minuts {timeLimit === 0 && '(sense límit)'}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Disponibilitat */}
              <section>
                <header className="mb-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--q-text-50)' }}>Disponibilitat</h4>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--q-text-55)' }}>Finestra durant la qual la formació està oberta. Buit = sempre.</p>
                </header>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] block mb-1.5" style={{ color: 'var(--q-text-50)' }}>Inici</label>
                    <DatePicker value={startAt} onChange={setStartAt} />
                  </div>
                  <div>
                    <label className="text-[11px] block mb-1.5" style={{ color: 'var(--q-text-50)' }}>Final</label>
                    <DatePicker value={endAt} onChange={setEndAt} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Add-question picker */}
      {showAddPicker && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-6 backdrop-blur-md"
          style={{ background: 'var(--q-overlay)' }}
          onClick={() => setShowAddPicker(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl shadow-black/15"
            style={{ background: 'var(--q-settings-bg)', borderColor: 'var(--q-border)', color: 'var(--q-text)' }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-5 border-b backdrop-blur-md" style={{ background: 'var(--q-topbar-bg)', borderColor: 'var(--q-border)' }}>
              <div>
                <h3 className="text-base font-semibold tracking-tight">Quin tipus de pregunta?</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--q-text-50)' }}>Triar el format afecta com l'usuari respon i com es corregeix.</p>
              </div>
              <button onClick={() => setShowAddPicker(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.06]" style={{ color: 'var(--q-text-50)' }} aria-label="Tancar">✕</button>
            </div>

            <div className="px-7 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                {
                  type: 'multiple_choice' as const, title: 'Opció múltiple', desc: 'Una sola resposta correcta entre vàries opcions.',
                  preview: (
                    <div className="space-y-1.5">
                      {['A','B','C','D'].map((l, i) => (
                        <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded-md border ${i === 1 ? 'bg-[#bf211e]/[0.07] border-[#bf211e]/30' : 'border-[var(--q-border)]'}`}>
                          <span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${i === 1 ? 'bg-[#bf211e]/85 text-white' : 'bg-[var(--q-surface-10)] text-[var(--q-text-50)]'}`}>{l}</span>
                          <span className="h-1.5 rounded bg-[var(--q-surface-10)] flex-1" />
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  type: 'multiple_select' as const, title: 'Selecció múltiple', desc: 'Diverses respostes correctes; cal marcar-les totes.',
                  preview: (
                    <div className="space-y-1.5">
                      {[true,false,true,false].map((on, i) => (
                        <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-md border ${on ? 'bg-[#bf211e]/[0.07] border-[#bf211e]/30' : 'border-[var(--q-border)]'}`}>
                          <span className={`w-4 h-4 rounded text-[8px] flex items-center justify-center font-bold ${on ? 'bg-[#bf211e]/85 text-white' : 'bg-[var(--q-surface-10)] text-[var(--q-text-50)]'}`}>{on ? '✓' : ''}</span>
                          <span className="h-1.5 rounded bg-[var(--q-surface-10)] flex-1" />
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  type: 'true_false' as const, title: 'Vertader / Fals', desc: 'Pregunta binària, dues úniques opcions.',
                  preview: (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="py-3 rounded-md border-2 border-[#bf211e]/40 bg-[#bf211e]/[0.07] text-center text-xs font-medium text-[#bf211e]" style={{ fontFamily: 'var(--font-display)' }}>Vertader</div>
                      <div className="py-3 rounded-md border text-center text-xs" style={{ fontFamily: 'var(--font-display)', borderColor: 'var(--q-border)', color: 'var(--q-text-50)' }}>Fals</div>
                    </div>
                  ),
                },
                {
                  type: 'matching' as const, title: 'Relacionar parelles', desc: 'Element esquerra → resposta dreta. L\'usuari escriu.',
                  preview: (
                    <div className="space-y-1.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md border" style={{ borderColor: 'var(--q-border)' }}>
                          <span className="h-1.5 rounded flex-1" style={{ background: 'var(--q-surface-20)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--q-text-50)' }}>→</span>
                          <span className="h-4 rounded border flex-1" style={{ background: 'var(--q-surface-10)', borderColor: 'var(--q-border)' }} />
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  type: 'open_text' as const, title: 'Resposta oberta', desc: 'Text lliure. Revisió manual per admin (no auto-puntua).',
                  preview: (
                    <div className="space-y-1.5">
                      <div className="rounded-md p-2 space-y-1 border" style={{ background: 'var(--q-surface-08)', borderColor: 'var(--q-border)' }}>
                        <span className="block h-1.5 rounded w-5/6" style={{ background: 'var(--q-surface-10)' }} />
                        <span className="block h-1.5 rounded w-4/6" style={{ background: 'var(--q-surface-10)' }} />
                        <span className="block h-1.5 rounded w-3/6" style={{ background: 'var(--q-surface-10)' }} />
                      </div>
                      <p className="text-[10px] text-[#a36a16] italic">Pendent de correcció</p>
                    </div>
                  ),
                },
                {
                  type: 'slide' as const, title: 'Slide explicació', desc: 'Imatge o vídeo amb text. No puntua, només informa.',
                  preview: (
                    <div className="space-y-1.5">
                      <div className="aspect-video rounded-md border flex items-center justify-center" style={{ borderColor: 'var(--q-border)', background: 'var(--q-surface-10)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--q-text-50)' }}><polygon points="5 3 19 12 5 21" /></svg>
                      </div>
                      <span className="block h-1.5 rounded w-4/6" style={{ background: 'var(--q-surface-10)' }} />
                    </div>
                  ),
                },
              ]).map(card => (
                <button
                  key={card.type}
                  onClick={() => { addQuestion(card.type); setShowAddPicker(false); }}
                  className="text-left p-4 rounded-xl border transition-all flex flex-col gap-3 group hover:border-[#bf211e]/30"
                  style={{ background: 'var(--q-surface-08)', borderColor: 'var(--q-border)' }}
                >
                  <div className="aspect-[5/3] rounded-lg p-3 overflow-hidden transition-colors" style={{ background: 'rgba(191,33,30,0.04)', border: '1px solid var(--q-border)' }}>
                    {card.preview}
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight">{card.title}</div>
                    <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--q-text-50)' }}>{card.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── News Editor Page (12-col freeform grid composer, editorial theme) ────────
// Implements design handoff: drag from palette → drop on 12×row grid, tiles can
// move/resize, inline edit on dblclick. Pointer events, not HTML5 DnD.

const NEWS_CATS_FULL = ['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'];

type NewsTileType =
  | 'headline'|'subhead'|'byline'|'paragraph'|'pullquote'|'list'|'caption'
  | 'image'|'gallery'|'video'|'audio'|'embed'
  | 'stat'|'chart'|'table'
  | 'link'
  | 'divider'|'spacer';

type NewsTileCat = 'Text'|'Media'|'Data'|'Structure';

interface NewsTile {
  id: string;
  type: NewsTileType;
  x: number; y: number; w: number; h: number;
  content?: string;
  url?: string;     // image upload (TAVIL extension; null on first drop)
  translations?: Partial<Record<'es'|'en', string>>;
}

const NEWS_TYPES: Record<NewsTileType, { label: string; icon: string; cat: NewsTileCat; w: number; h: number; content?: string }> = {
  headline:  { label: 'Titular',         icon: 'H₁', cat: 'Text',      w: 12, h: 2, content: 'Titular sense definir que travessa tota la pàgina' },
  subhead:   { label: 'Subtítol',        icon: 'H₂', cat: 'Text',      w: 9,  h: 1, content: 'Una entradeta breu que situa la història' },
  byline:    { label: 'Firma',           icon: '✎',  cat: 'Text',      w: 12, h: 1, content: 'Per Nom Cognom · 8 maig 2026 · 12 min lectura' },
  paragraph: { label: 'Paràgraf',        icon: '¶',  cat: 'Text',      w: 7,  h: 4, content: 'El primer paràgraf situa el lector: què passa, on, per què importa ara. Llenguatge senzill; després l\'estructura fa la resta.' },
  pullquote: { label: 'Cita destacada',  icon: '"',  cat: 'Text',      w: 4,  h: 3, content: '"No s\'esperaven que la temporada canviés tan ràpid."' },
  list:      { label: 'Llista',          icon: '☰',  cat: 'Text',      w: 4,  h: 4, content: 'Tres coses\nQue han passat\nEn ordre\nAquesta setmana' },
  caption:   { label: 'Peu de foto',     icon: '—',  cat: 'Text',      w: 6,  h: 1, content: 'Foto de — · Peu opcional aquí.' },
  image:     { label: 'Imatge',          icon: '▦',  cat: 'Media',     w: 6,  h: 5 },
  gallery:   { label: 'Galeria',         icon: '⊞',  cat: 'Media',     w: 12, h: 4 },
  video:     { label: 'Vídeo',           icon: '▶',  cat: 'Media',     w: 8,  h: 5 },
  audio:     { label: 'Àudio',           icon: '♪',  cat: 'Media',     w: 6,  h: 2 },
  embed:     { label: 'Embed',           icon: '⊕',  cat: 'Media',     w: 6,  h: 3, content: 'Embed' },
  stat:      { label: 'Xifra',           icon: '#',  cat: 'Data',      w: 3,  h: 3, content: '37%|del personal enquestat' },
  chart:     { label: 'Gràfic',          icon: '⌁',  cat: 'Data',      w: 6,  h: 4 },
  table:     { label: 'Taula',           icon: '⊟',  cat: 'Data',      w: 8,  h: 4 },
  link:      { label: 'Enllaç',          icon: '↗',  cat: 'Text',      w: 6,  h: 1, content: 'Visita TAVIL|https://tavil.net|button' },
  divider:   { label: 'Separador',       icon: '⎯',  cat: 'Structure', w: 12, h: 1 },
  spacer:    { label: 'Espai',           icon: '∅',  cat: 'Structure', w: 12, h: 1 },
};

const NEWS_TYPE_CATS: NewsTileCat[] = ['Text','Media','Data','Structure'];

const NG_COLS = 12;
const NG_ROW_H = 44;
const NG_GAP = 8;

// Editorial theme tokens — cream/bone (per design handoff).
const NT = {
  bg: 'var(--nt-bg)',
  panel: 'var(--nt-panel)',
  surface: 'var(--nt-surface)',
  ink: 'var(--nt-ink)',
  mute: 'var(--nt-mute)',
  soft: 'var(--nt-soft)',
  accent: 'var(--tavil-accent)',
  accentInk: '#ffffff',
  grid: 'var(--nt-grid)',
  headlineFont: 'var(--font-display)',
  bodyFont: "'Barlow Semi Condensed', var(--font-ui)",
  uiFont: '"Inter", ui-sans-serif, system-ui, sans-serif',
  radius: 4,
  tileRadius: 10,
  headlineWeight: 500,
};

const newsTileBox = (t: { x:number;y:number;w:number;h:number }, cw: number, rh: number) => ({
  left: t.x * (cw + NG_GAP),
  top: t.y * (rh + NG_GAP),
  width: t.w * cw + (t.w - 1) * NG_GAP,
  height: t.h * rh + (t.h - 1) * NG_GAP,
});

const newsClamp = (t: NewsTile): NewsTile => ({
  ...t,
  x: Math.max(0, Math.min(NG_COLS - 1, t.x)),
  w: Math.max(1, Math.min(NG_COLS - t.x, t.w)),
  h: Math.max(1, t.h),
  y: Math.max(0, t.y),
});

const newsRectsOverlap = (a: {x:number;y:number;w:number;h:number}, b: {x:number;y:number;w:number;h:number}) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const newsWouldOverlap = (tiles: NewsTile[], candidate: {x:number;y:number;w:number;h:number}, excludeId?: string) =>
  tiles.some(t => t.id !== excludeId && newsRectsOverlap(candidate, t));

// Push-down gravity: pinned tile stays fixed; all others are pushed down to avoid overlaps.
// Iterates until stable (max 200 passes → no infinite loop).
function newsResolveOverlaps(tiles: NewsTile[], pinnedId?: string): NewsTile[] {
  const pinned = pinnedId ? tiles.find(t => t.id === pinnedId) : null;
  const others = tiles.filter(t => t.id !== pinnedId).map(t => ({ ...t }));
  others.sort((a, b) => a.y - b.y || a.x - b.x);
  const placed: NewsTile[] = pinned ? [{ ...pinned }] : [];
  for (const tile of others) {
    let y = tile.y;
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of placed) {
        if (newsRectsOverlap({ ...tile, y }, p)) {
          y = p.y + p.h;
          changed = true;
        }
      }
    }
    placed.push({ ...tile, y });
  }
  return placed;
}

const newsUid = () => Math.random().toString(36).slice(2, 9);

// ─── Striped media placeholder ───────────────────────────────────────────────
function NewsStriped({ label, mediaType }: { label: string; mediaType: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: `repeating-linear-gradient(135deg, ${NT.soft}, ${NT.soft} 1px, transparent 1px, transparent 12px)`,
      border: `1px dashed ${NT.soft}`,
      borderRadius: NT.tileRadius, overflow: 'hidden',
      display: 'grid', placeItems: 'center',
    }}>
      <div style={{
        fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
        fontSize: 10, color: NT.mute, letterSpacing: '0.06em',
        background: NT.panel, padding: '4px 8px', borderRadius: 999,
        border: `1px solid ${NT.soft}`,
      }}>
        ⌖ drop {mediaType} · {label}
      </div>
    </div>
  );
}

// ─── Editable text helper — ref-based to prevent React overwriting user input ─
const EditableText = React.memo(function EditableText({ initialContent, style, onChange }: {
  initialContent: string;
  style?: React.CSSProperties;
  onChange: (v: string) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  React.useEffect(() => {
    const el = ref.current;
    if (el) el.textContent = initialContent;
    // Flush latest text on unmount — protects against parent clearing
    // editingId via outside-click before onBlur can fire.
    return () => {
      if (el) onChangeRef.current(el.innerText);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      style={{ outline: 'none', cursor: 'text', background: 'rgba(191,33,30,0.06)', borderRadius: 4, whiteSpace: 'pre-wrap', ...style }}
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      onPointerDown={(e) => e.stopPropagation()}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const frag = document.createDocumentFragment();
        text.split('\n').forEach((line, i) => {
          if (i > 0) frag.appendChild(document.createElement('br'));
          if (line) frag.appendChild(document.createTextNode(line));
        });
        range.insertNode(frag);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        onChange(e.currentTarget.innerText);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); return; }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const br = document.createElement('br');
            range.insertNode(br);
            if (!br.nextSibling) {
              br.parentNode?.insertBefore(document.createElement('br'), null);
            }
            range.setStartAfter(br);
            range.setEndAfter(br);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          onChange(e.currentTarget.innerText);
        }
      }}
    />
  );
});

// ─── Rich paragraph editor — supports bold, italic, underline, colors ────────
// Stores HTML in tile content; uses execCommand for formatting.
// A floating mini-toolbar appears when text is selected.
function isHtmlContent(s: string) { return /<\/?(b|strong|em|i|u|s|br|span)[\s>\/]/i.test(s); }

function sanitizeParaHtml(html: string): string {
  // Allow only b/strong/em/i/u/s/br/span — strip all other tags and all attributes
  // except style on span. This prevents event-handler injection on any element.
  return html
    .replace(/<\/div>\s*<div[^>]*>/gi, '<br>')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    // Strip disallowed tags entirely
    .replace(/<(?!\/?(?:b|strong|em|i|u|s|br|span)[\s>\/])[^>]+>/gi, '')
    // Strip all attributes from inline tags except style on span
    .replace(/<(b|strong|em|i|u|s|br)(\s[^>]*)?>/, '<$1>')
    .replace(/(<span)(\s+style="[^"]*")?(\s[^>]*)?>/gi, (_m, _tag, style) => `<span${style ?? ''}>`)
    // Remove any remaining on* event handlers that slipped through
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
}

const PARA_COLORS = ['#000000','#bf211e','#1a56db','#057a55','#c27803','#6c2bd9','#ffffff'];
const PARA_BG_COLORS = ['transparent','#fef9c3','#dcfce7','#fee2e2','#dbeafe','#f3e8ff','#ffedd5'];
const PARA_FONT_SIZES = [
  { label: 'S', px: '13px' },
  { label: 'M', px: '16px' },
  { label: 'L', px: '20px' },
  { label: 'XL', px: '26px' },
];
const PARA_FONT_FAMILIES = [
  { label: 'Sans', value: 'var(--font-ui), system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: '"Courier New", Courier, monospace' },
];

const RichParaEditor = React.memo(function RichParaEditor({ initialContent, style, onChange }: {
  initialContent: string;
  style?: React.CSSProperties;
  onChange: (v: string) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const [toolbar, setToolbar] = React.useState<{ x: number; y: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = React.useState<'text' | 'bg' | null>(null);
  const savedRange = React.useRef<Range | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Use innerHTML so stored HTML renders correctly
    el.innerHTML = isHtmlContent(initialContent) ? initialContent : (initialContent || '');
    return () => {
      if (el) onChangeRef.current(sanitizeParaHtml(el.innerHTML));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitChange = () => {
    const el = ref.current;
    if (el) onChangeRef.current(sanitizeParaHtml(el.innerHTML));
  };

  const wrapSelection = (styleKey: 'fontSize' | 'fontFamily', value: string) => {
    const el = ref.current;
    if (!el) return;
    const sel = window.getSelection();
    if (savedRange.current && (!sel || sel.isCollapsed)) {
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    }
    const activeSel = window.getSelection();
    if (!activeSel || activeSel.isCollapsed || activeSel.rangeCount === 0) return;
    const range = activeSel.getRangeAt(0);
    const frag = range.extractContents();
    const span = document.createElement('span');
    span.style[styleKey] = value;
    span.appendChild(frag);
    range.insertNode(span);
    range.selectNodeContents(span);
    activeSel.removeAllRanges();
    activeSel.addRange(range);
    emitChange();
    setShowColorPicker(null);
  };

  const checkSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToolbar(null);
      setShowColorPicker(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) {
      setToolbar(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setToolbar({ x: rect.left + rect.width / 2, y: rect.top - 6 });
  };

  const fmt = (cmd: string, value?: string) => {
    const el = ref.current;
    if (!el) return;
    // Restore saved range if selection was lost when clicking toolbar
    const sel = window.getSelection();
    if (savedRange.current && (!sel || sel.isCollapsed)) {
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    }
    document.execCommand(cmd, false, value);
    emitChange();
    setShowColorPicker(null);
    // Recheck toolbar position
    setTimeout(checkSelection, 0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        style={{ outline: 'none', cursor: 'text', background: 'rgba(191,33,30,0.06)', borderRadius: 4, whiteSpace: 'pre-wrap', ...style }}
        onInput={emitChange}
        onBlur={() => { emitChange(); setToolbar(null); setShowColorPicker(null); }}
        onPointerDown={(e) => e.stopPropagation()}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const frag = document.createDocumentFragment();
          text.split('\n').forEach((line, i) => {
            if (i > 0) frag.appendChild(document.createElement('br'));
            if (line) frag.appendChild(document.createTextNode(line));
          });
          range.insertNode(frag);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          emitChange();
        }}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.stopPropagation(); setToolbar(null); return; }
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              range.deleteContents();
              const br = document.createElement('br');
              range.insertNode(br);
              if (!br.nextSibling) {
                br.parentNode?.insertBefore(document.createElement('br'), null);
              }
              range.setStartAfter(br);
              range.setEndAfter(br);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            emitChange();
          }
          // Save selection before keyboard shortcut
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
          }
          // Keyboard shortcuts
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            if (e.key === 'b') { e.preventDefault(); fmt('bold'); }
            if (e.key === 'i') { e.preventDefault(); fmt('italic'); }
            if (e.key === 'u') { e.preventDefault(); fmt('underline'); }
          }
        }}
        onMouseDown={() => {
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
          }
        }}
      />
      {toolbar && (
        <div
          style={{
            position: 'fixed',
            left: toolbar.x, top: toolbar.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 2,
            background: '#1a1a1a', border: '1px solid #333',
            borderRadius: 8, padding: '4px 6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            userSelect: 'none',
          }}
          onMouseDown={(e) => {
            // Save selection before toolbar click steals focus
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
              savedRange.current = sel.getRangeAt(0).cloneRange();
            }
            e.preventDefault();
          }}
        >
          {/* Bold */}
          <button
            title="Negreta (Ctrl+B)"
            onClick={() => fmt('bold')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}
          >B</button>
          {/* Italic */}
          <button
            title="Cursiva (Ctrl+I)"
            onClick={() => fmt('italic')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontStyle: 'italic', fontSize: 13, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}
          >I</button>
          {/* Underline */}
          <button
            title="Subratllat (Ctrl+U)"
            onClick={() => fmt('underline')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textDecoration: 'underline', fontSize: 13, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}
          >U</button>
          <div style={{ width: 1, height: 16, background: '#444', margin: '0 2px' }} />
          {/* Text color */}
          <button
            title="Color de text"
            onClick={() => setShowColorPicker(v => v === 'text' ? null : 'text')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, padding: '2px 6px', borderRadius: 4, lineHeight: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
          >
            <span style={{ fontSize: 12 }}>A</span>
            <span style={{ width: 14, height: 3, background: '#bf211e', borderRadius: 2 }} />
          </button>
          {/* Background/highlight color */}
          <button
            title="Color de fons / ressaltat"
            onClick={() => setShowColorPicker(v => v === 'bg' ? null : 'bg')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, padding: '2px 6px', borderRadius: 4, lineHeight: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
          >
            <span style={{ fontSize: 12 }}>✏</span>
            <span style={{ width: 14, height: 3, background: '#fef9c3', borderRadius: 2, border: '1px solid #999' }} />
          </button>
          <div style={{ width: 1, height: 16, background: '#444', margin: '0 2px' }} />
          {/* Font sizes */}
          {PARA_FONT_SIZES.map(({ label, px }) => (
            <button
              key={label}
              title={`Mida ${label} (${px})`}
              onMouseDown={(e) => { e.preventDefault(); const sel = window.getSelection(); if (sel && !sel.isCollapsed && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange(); }}
              onClick={() => wrapSelection('fontSize', px)}
              style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: label === 'XL' ? 13 : label === 'L' ? 11 : 9, fontWeight: 600, padding: '2px 4px', borderRadius: 4, lineHeight: 1 }}
            >{label}</button>
          ))}
          <div style={{ width: 1, height: 16, background: '#444', margin: '0 2px' }} />
          {/* Font families */}
          {PARA_FONT_FAMILIES.map(({ label, value }) => (
            <button
              key={label}
              title={`Tipografia ${label}`}
              onMouseDown={(e) => { e.preventDefault(); const sel = window.getSelection(); if (sel && !sel.isCollapsed && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange(); }}
              onClick={() => wrapSelection('fontFamily', value)}
              style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 10, fontWeight: label === 'Serif' ? undefined : 600, fontStyle: label === 'Serif' ? 'italic' : undefined, fontFamily: label === 'Mono' ? 'monospace' : undefined, padding: '2px 5px', borderRadius: 4, lineHeight: 1 }}
            >{label}</button>
          ))}
          {/* Color swatches dropdown */}
          {showColorPicker && (
            <div style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              marginTop: 6, background: '#1a1a1a', border: '1px solid #333',
              borderRadius: 8, padding: 8, display: 'flex', gap: 6, zIndex: 10000,
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            }}>
              {(showColorPicker === 'text' ? PARA_COLORS : PARA_BG_COLORS).map(c => (
                <button
                  key={c}
                  title={c}
                  onClick={() => fmt(showColorPicker === 'text' ? 'foreColor' : 'hiliteColor', c)}
                  style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: c === 'transparent' ? 'none' : c,
                    border: c === 'transparent' ? '1.5px dashed #666' : c === '#ffffff' ? '1px solid #666' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {c === 'transparent' && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 10 }}>×</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Stat tile (needs refs for two-part content, must be its own component) ───
function StatTileContent({ tile, editable, onChange }: { tile: NewsTile; editable: boolean; onChange: (v: string) => void }) {
  const parts = String(tile.content || '|').split('|');
  const num = parts[0] ?? '';
  const lab = parts[1] ?? '';
  const numRef = React.useRef<string>(num);
  const labRef = React.useRef<string>(lab);
  if (!editable) { numRef.current = num; labRef.current = lab; }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      {editable
        ? <EditableText key={tile.id + '-num'} initialContent={num} onChange={(v) => { numRef.current = v; onChange(`${v}|${labRef.current}`); }} style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1, color: NT.accent, letterSpacing: '-0.03em' }} />
        : <div style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1, color: NT.accent, letterSpacing: '-0.03em' }}>{num}</div>
      }
      {editable
        ? <EditableText key={tile.id + '-lab'} initialContent={lab} onChange={(v) => { labRef.current = v; onChange(`${numRef.current}|${v}`); }} style={{ fontFamily: NT.uiFont, fontSize: 11, lineHeight: 1.3, color: NT.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }} />
        : <div style={{ fontFamily: NT.uiFont, fontSize: 11, lineHeight: 1.3, color: NT.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lab}</div>
      }
    </div>
  );
}

// ─── URL helpers + inline markdown link rendering ────────────────────────────
const SAFE_URL_RE = /^(https?:\/\/|mailto:)/i;
function safeUrl(u: string): string | null {
  const t = (u || '').trim();
  return SAFE_URL_RE.test(t) ? t : null;
}
function renderInlineLinks(text: string): React.ReactNode[] {
  // Parse [label](url) — sanitize URLs (http/https/mailto only).
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const href = safeUrl(m[2]);
    if (href) {
      nodes.push(
        <a key={m.index} href={href} target="_blank" rel="noopener noreferrer"
           style={{ color: NT.accent, textDecoration: 'underline' }}>{m[1]}</a>
      );
    } else {
      nodes.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function detectVideoEmbed(url: string): string | null {
  const u = safeUrl(url); if (!u) return null;
  let m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = u.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

// ─── Tile content (per type) ─────────────────────────────────────────────────
function NewsTileContent({ tile, editable, activeLang, onChange, onRequestImage, onRequestVideo }: {
  tile: NewsTile;
  editable: boolean;
  activeLang: 'ca'|'es'|'en';
  onChange: (content: string) => void;
  onRequestImage: () => void;
  onRequestVideo?: () => void;
}) {
  const tc = activeLang === 'ca' ? (tile.content ?? '') : (tile.translations?.[activeLang] ?? tile.content ?? '');
  const edKey = `${tile.id}-${activeLang}`;
  switch (tile.type) {
    case 'headline':
      return editable
        ? <EditableText key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: NT.ink }} />
        : <div style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: NT.ink }}>{renderInlineLinks(tc)}</div>;
    case 'subhead':
      return editable
        ? <EditableText key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: NT.headlineFont, fontWeight: 400, fontSize: 'clamp(16px, 1.6vw, 22px)', lineHeight: 1.3, color: NT.mute }} />
        : <div style={{ fontFamily: NT.headlineFont, fontWeight: 400, fontSize: 'clamp(16px, 1.6vw, 22px)', lineHeight: 1.3, color: NT.mute }}>{renderInlineLinks(tc)}</div>;
    case 'byline':
      return editable
        ? <EditableText key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: NT.uiFont, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: NT.mute }} />
        : <div style={{ fontFamily: NT.uiFont, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: NT.mute }}>{renderInlineLinks(tc)}</div>;
    case 'paragraph':
      return editable
        ? <RichParaEditor key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: 'var(--font-ui)', fontSize: 16, lineHeight: 1.625, color: '#4E524F', fontWeight: 500 }} />
        : isHtmlContent(tc)
          ? <div className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed font-medium" style={{ fontFamily: 'var(--font-ui)', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: sanitizeParaHtml(tc) }} />
          : <div className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed font-medium" style={{ fontFamily: 'var(--font-ui)', whiteSpace: 'pre-wrap' }}>{renderInlineLinks(tc)}</div>;
    case 'pullquote':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
          <div style={{ width: 32, height: 2, background: NT.accent }} />
          {editable
            ? <EditableText key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: NT.headlineFont, fontWeight: 500, fontSize: 'clamp(18px, 1.8vw, 24px)', lineHeight: 1.25, color: NT.ink, fontStyle: 'italic', flex: 1 }} />
            : <div style={{ fontFamily: NT.headlineFont, fontWeight: 500, fontSize: 'clamp(18px, 1.8vw, 24px)', lineHeight: 1.25, color: NT.ink, fontStyle: 'italic', flex: 1, whiteSpace: 'pre-wrap' }}>{tc}</div>}
        </div>
      );
    case 'list': {
      const items = tc.split('\n').filter(Boolean);
      return editable
        ? <EditableText key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: NT.bodyFont, fontSize: 14, lineHeight: 1.6, color: NT.ink }} />
        : (
          <div style={{ fontFamily: NT.bodyFont, fontSize: 14, lineHeight: 1.6, color: NT.ink }}>
            {items.map((li, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '2px 0' }}>
                <span style={{ color: NT.accent, fontFamily: NT.uiFont, fontSize: 12, minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
                <span>{renderInlineLinks(li)}</span>
              </div>
            ))}
          </div>
        );
    }
    case 'caption':
      return editable
        ? <EditableText key={edKey} initialContent={tc} onChange={onChange} style={{ fontFamily: NT.bodyFont, fontSize: 12, lineHeight: 1.5, color: NT.mute, fontStyle: 'italic' }} />
        : <div style={{ fontFamily: NT.bodyFont, fontSize: 12, lineHeight: 1.5, color: NT.mute, fontStyle: 'italic' }}>{renderInlineLinks(tc)}</div>;
    case 'image':
      if (tile.url) {
        return <img src={resolveImg(tile.url)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
      }
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }} onDoubleClick={(e) => { e.stopPropagation(); onRequestImage(); }}>
          <NewsStriped label="Imatge" mediaType="image" />
          {editable && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRequestImage(); }}
              style={{
                position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)',
                background: NT.accent, color: NT.accentInk, border: 0,
                padding: '6px 12px', borderRadius: 999,
                fontFamily: NT.uiFont, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >Pujar imatge</button>
          )}
        </div>
      );
    case 'gallery':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, height: '100%' }}>
          {[0,1,2,3].map(i => <NewsStriped key={i} label={`#${i+1}`} mediaType="img" />)}
        </div>
      );
    case 'video': {
      const extUrl = (tile.content || '').trim();
      const embed = extUrl ? detectVideoEmbed(extUrl) : null;
      if (embed) {
        return <iframe src={embed} title="video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 0, borderRadius: NT.tileRadius }} />;
      }
      if (tile.url) {
        return <video src={resolveImg(tile.url)} controls style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }} />;
      }
      if (extUrl && safeUrl(extUrl)) {
        return <video src={extUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }} />;
      }
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <NewsStriped label="Vídeo" mediaType="video" />
          {editable && (
            <div style={{ position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRequestVideo?.(); }}
                style={{ background: NT.accent, color: NT.accentInk, border: 0, padding: '6px 12px', borderRadius: 999, fontFamily: NT.uiFont, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >Pujar vídeo</button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); const u = prompt('URL del vídeo (YouTube, Vimeo o mp4 directe):', ''); if (u && safeUrl(u)) onChange(u.trim()); }}
                style={{ background: NT.surface, color: NT.ink, border: `1px solid ${NT.soft}`, padding: '6px 12px', borderRadius: 999, fontFamily: NT.uiFont, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >URL externa</button>
            </div>
          )}
        </div>
      );
    }
    case 'link': {
      const parts = (tile.content || '').split('|');
      const text = parts[0] || 'Enllaç';
      const url  = parts[1] || '';
      const style = (parts[2] || 'button').trim();
      const href = safeUrl(url);
      if (editable) {
        return (
          <div style={{ display: 'flex', gap: 6, height: '100%', alignItems: 'center', fontFamily: NT.uiFont, fontSize: 12 }}>
            <input value={text} onChange={e => onChange(`${e.target.value}|${url}|${style}`)}
              placeholder="Text" style={{ flex: 1, minWidth: 0, border: `1px solid ${NT.soft}`, padding: '6px 8px', borderRadius: 6, background: NT.surface, color: NT.ink, fontFamily: NT.uiFont, fontSize: 12 }} />
            <input value={url} onChange={e => onChange(`${text}|${e.target.value}|${style}`)}
              placeholder="https://…" style={{ flex: 2, minWidth: 0, border: `1px solid ${NT.soft}`, padding: '6px 8px', borderRadius: 6, background: NT.surface, color: NT.ink, fontFamily: NT.uiFont, fontSize: 12 }} />
            <select value={style} onChange={e => onChange(`${text}|${url}|${e.target.value}`)}
              style={{ border: `1px solid ${NT.soft}`, padding: '6px 8px', borderRadius: 6, background: NT.surface, color: NT.ink, fontFamily: NT.uiFont, fontSize: 12 }}>
              <option value="button">Botó</option>
              <option value="inline">Inline</option>
            </select>
          </div>
        );
      }
      if (!href) return <div style={{ color: NT.mute, fontStyle: 'italic', fontSize: 13 }}>(enllaç incomplet)</div>;
      if (style === 'inline') {
        return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: NT.accent, textDecoration: 'underline', fontFamily: NT.bodyFont, fontSize: 15 }}>{text}</a>;
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
           style={{ display: 'inline-block', background: NT.accent, color: NT.accentInk, padding: '8px 16px', borderRadius: 999, fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>{text} ↗</a>
      );
    }
    case 'audio':
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, height: '100%',
          padding: '0 14px', background: NT.soft, borderRadius: NT.tileRadius,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: NT.accent, color: NT.accentInk, display: 'grid', placeItems: 'center' }}>▶</div>
          <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%', background: NT.accent, borderRadius: 2 }} />
          </div>
          <div style={{ fontFamily: NT.uiFont, fontSize: 11, color: NT.mute, fontVariantNumeric: 'tabular-nums' }}>2:14 / 6:42</div>
        </div>
      );
    case 'embed':
      return <NewsStriped label="Embed" mediaType="embed" />;
    case 'stat':
      return <StatTileContent tile={tile} editable={editable} onChange={onChange} />;
    case 'chart':
      return (
        <div style={{ height: '100%', position: 'relative', padding: '8px 4px 4px' }}>
          <svg viewBox="0 0 200 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <polyline fill="none" stroke={NT.accent} strokeWidth="1.5"
              points="0,60 20,55 40,42 60,48 80,30 100,35 120,18 140,22 160,12 180,16 200,8" />
            <polyline fill={NT.accent} fillOpacity="0.08" stroke="none"
              points="0,60 20,55 40,42 60,48 80,30 100,35 120,18 140,22 160,12 180,16 200,8 200,80 0,80" />
          </svg>
        </div>
      );
    case 'table':
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: NT.uiFont, fontSize: 12 }}>
          {[['Regió','Llars','Variació'],['Costa','1.240','−18%'],['Interior','3.810','+4%'],['Total','5.050','−2%']].map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8,
              padding: '6px 8px', borderBottom: `1px solid ${NT.soft}`,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? NT.mute : NT.ink,
              fontSize: i === 0 ? 10 : 12,
              letterSpacing: i === 0 ? '0.06em' : 0,
              textTransform: i === 0 ? 'uppercase' : 'none',
            }}>
              {r.map((c, j) => <div key={j} style={{ textAlign: j === 0 ? 'left' : 'right', fontVariantNumeric: 'tabular-nums' }}>{c}</div>)}
            </div>
          ))}
        </div>
      );
    case 'divider':
      return (
        <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: '100%', height: 1, background: NT.ink, opacity: 0.6 }} />
        </div>
      );
    case 'spacer':
      return null;
    default:
      return null;
  }
}

// ─── Read-only tiles viewer (used in news article view) ──────────────────────
function NewsTilesViewer({ content, lang = 'ca' }: { content: string; lang?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [cw, setCw] = useState(80);
  const activeLang = (['ca','es','en'].includes(lang) ? lang : 'ca') as 'ca'|'es'|'en';
  const tiles: NewsTile[] = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((t: any) => ({
        id: t.id || newsUid(),
        type: t.type, x: t.x|0, y: t.y|0, w: t.w|0, h: t.h|0,
        content: t.content, url: t.url, translations: t.translations,
      } as NewsTile));
    } catch { return []; }
  }, [content]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current; if (!el) return;
      const w = el.clientWidth;
      setCw((w - NG_GAP * (NG_COLS - 1)) / NG_COLS);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const minRows = tiles.length ? Math.max(1, ...tiles.map(t => t.y + t.h)) : 1;
  const totalH = minRows * NG_ROW_H + (minRows - 1) * NG_GAP;

  return (
    <div ref={ref} style={{
      position: 'relative', width: '100%', height: totalH,
      fontFamily: NT.bodyFont, color: NT.ink, marginTop: 12,
    }}>
      {tiles.map(t => {
        const padded = !['image','video','gallery','embed','spacer','divider','audio'].includes(t.type);
        return (
          <div key={t.id} style={{
            position: 'absolute', ...newsTileBox(t, cw, NG_ROW_H),
            padding: padded ? '6px 4px' : 0, overflow: 'hidden',
          }}>
            <NewsTileContent tile={t} editable={false} activeLang={activeLang} onChange={() => {}} onRequestImage={() => {}} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Tile chrome ─────────────────────────────────────────────────────────────
function NewsTileEl({ tile, selected, editing, gridLines, activeLang, onSelect, onEdit, onStopEdit, onChange, onDelete, onPointerDown, onResizePointerDown, onRequestImage, onRequestVideo }: {
  tile: NewsTile; selected: boolean; editing: string | null; gridLines: boolean;
  activeLang: 'ca'|'es'|'en';
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onStopEdit: () => void;
  onChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, t: NewsTile) => void;
  onResizePointerDown: (e: React.PointerEvent, t: NewsTile, dir: 'se'|'sw'|'e'|'s') => void;
  onRequestImage: (id: string) => void;
  onRequestVideo: (id: string) => void;
}) {
  const def = NEWS_TYPES[tile.type];
  const padded = !['image','video','gallery','embed','spacer','divider','audio'].includes(tile.type);
  return (
    <div
      data-tile={tile.id}
      onPointerDown={(e) => onPointerDown(e, tile)}
      onClick={(e) => { e.stopPropagation(); onSelect(tile.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(tile.id); }}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        background: tile.type === 'spacer' ? 'transparent' : NT.surface,
        border: selected
          ? `1.5px solid ${NT.accent}`
          : (gridLines || tile.type === 'spacer' ? `1px dashed ${NT.soft}` : `1px solid ${NT.soft}`),
        borderRadius: NT.tileRadius,
        padding: padded ? '14px 16px' : 0,
        boxShadow: selected
          ? '0 8px 28px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 1px 4px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.04)',
        cursor: editing === tile.id ? 'text' : 'grab',
        userSelect: editing === tile.id ? 'text' : 'none',
        touchAction: 'none',
        overflow: 'hidden',
        transition: 'box-shadow .12s, border-color .12s',
        boxSizing: 'border-box',
      }}
    >
      <NewsTileContent
        tile={tile}
        editable={editing === tile.id}
        activeLang={activeLang}
        onChange={(v) => onChange(tile.id, v)}
        onRequestImage={() => onRequestImage(tile.id)}
        onRequestVideo={() => onRequestVideo(tile.id)}
      />
      {selected && (
        <>
          <div style={{ position: 'absolute', top: -1, right: -1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <div style={{
              background: NT.accent, color: NT.accentInk,
              fontFamily: NT.uiFont, fontSize: 10, fontWeight: 500,
              padding: '3px 8px',
              borderRadius: `0 ${NT.tileRadius}px 0 4px`,
              letterSpacing: '0.02em',
            }}>{def.label} · {tile.w}×{tile.h}</div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete(tile.id); }}
              style={{
                background: NT.accent, color: NT.accentInk,
                border: 0, padding: '3px 8px', fontSize: 12, lineHeight: 1,
                cursor: 'pointer', borderRadius: '0 0 0 4px',
              }}
            >✕</button>
          </div>
          {/* Edit / Save buttons for text tiles */}
          {['headline','subhead','byline','paragraph','pullquote','list','caption'].includes(tile.type) && (
            editing === tile.id ? (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onStopEdit(); }}
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: '#057a55', color: '#fff',
                  border: 0, padding: '5px 12px',
                  borderRadius: 999, fontFamily: NT.uiFont,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  boxShadow: '0 2px 8px rgba(5,122,85,0.3)',
                  zIndex: 10,
                }}
              >✓ Desa</button>
            ) : (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEdit(tile.id); }}
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: NT.accent, color: NT.accentInk,
                  border: 0, padding: '5px 12px',
                  borderRadius: 999, fontFamily: NT.uiFont,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  zIndex: 10,
                }}
              >✏ Edita</button>
            )
          )}
          <div onPointerDown={(e) => onResizePointerDown(e, tile, 'se')}
            style={{ position: 'absolute', right: -12, bottom: -12, width: 28, height: 28, cursor: 'nwse-resize', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 14, height: 14, background: NT.accent, borderRadius: '50%', boxShadow: '0 0 0 2px white', pointerEvents: 'none' }} />
          </div>
          <div onPointerDown={(e) => onResizePointerDown(e, tile, 'sw')}
            style={{ position: 'absolute', left: -12, bottom: -12, width: 28, height: 28, cursor: 'nesw-resize', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 14, height: 14, background: NT.accent, borderRadius: '50%', boxShadow: '0 0 0 2px white', pointerEvents: 'none' }} />
          </div>
          <div onPointerDown={(e) => onResizePointerDown(e, tile, 'e')}
            style={{ position: 'absolute', right: -10, top: '50%', width: 20, height: 44, transform: 'translateY(-50%)', cursor: 'ew-resize', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 6, height: 28, background: NT.accent, borderRadius: 3, pointerEvents: 'none' }} />
          </div>
          <div onPointerDown={(e) => onResizePointerDown(e, tile, 's')}
            style={{ position: 'absolute', bottom: -10, left: '50%', width: 44, height: 20, transform: 'translateX(-50%)', cursor: 'ns-resize', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 28, height: 6, background: NT.accent, borderRadius: 3, pointerEvents: 'none' }} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sidebar palette ─────────────────────────────────────────────────────────
function NewsPalette({ onPointerDownItem }: { onPointerDownItem: (e: React.PointerEvent, type: NewsTileType) => void }) {
  const grouped = useMemo(() => {
    const HIDDEN: NewsTileType[] = ['audio', 'stat', 'chart', 'table'];
    const by: Record<string, Array<[NewsTileType, typeof NEWS_TYPES[NewsTileType]]>> = { Text: [], Media: [], Data: [], Structure: [] };
    (Object.entries(NEWS_TYPES) as Array<[NewsTileType, typeof NEWS_TYPES[NewsTileType]]>).forEach(([k, v]) => {
      if (HIDDEN.includes(k)) return;
      by[v.cat].push([k, v]);
    });
    return by;
  }, []);
  return (
    <div style={{
      width: 240, flexShrink: 0, background: NT.panel,
      borderRight: `1px solid ${NT.soft}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${NT.soft}` }}>
        <div style={{ fontFamily: NT.uiFont, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>
          Llibreria
        </div>
        <div style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 18, color: NT.ink, lineHeight: 1.15 }}>
          Components
        </div>
        <div style={{ fontFamily: NT.uiFont, fontSize: 11, color: NT.mute, marginTop: 6, lineHeight: 1.4 }}>
          Arrossega qualsevol bloc al canvas. Redimensiona des de la cantonada.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>
        {NEWS_TYPE_CATS.filter(c => grouped[c].length > 0).map((c) => (
          <div key={c} style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: NT.uiFont, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: NT.mute, padding: '0 4px 6px',
            }}>{c}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {grouped[c].map(([k, v]) => (
                <div
                  key={k}
                  data-palette={k}
                  onPointerDown={(e) => onPointerDownItem(e, k)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = NT.soft; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: 'transparent', border: `1px solid ${NT.soft}`, borderRadius: NT.radius,
                    color: NT.ink, cursor: 'grab', userSelect: 'none', touchAction: 'none',
                    fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500,
                    transition: 'background .12s, transform .12s',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: NT.soft, borderRadius: Math.max(2, NT.radius - 2),
                    fontSize: 12, fontFamily: NT.bodyFont, color: NT.ink,
                  }}>{v.icon}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsEditorPage({ initialId }: { initialId: number | null }) {
  useEffect(() => {
    try {
      const have = localStorage.getItem('tavil_token') || sessionStorage.getItem('tavil_token');
      if (!have && window.opener) {
        const op = window.opener as Window | null;
        const tok = op?.localStorage?.getItem('tavil_token') ?? op?.sessionStorage?.getItem('tavil_token') ?? null;
        if (tok) sessionStorage.setItem('tavil_token', tok);
      }
    } catch { /* cross-origin */ }
    document.title = 'Editor article · TAVIL';
  }, []);

  const [articleId, setArticleId] = useState<number | null>(initialId);
  const [loading, setLoading] = useState(initialId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preview, setPreview] = useState(false);

  // Article metadata (settings modal)
  const [title, setTitle] = useState('Esborrany sense títol');
  const [category, setCategory] = useState(NEWS_CATS_FULL[0]);
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [coverImage, setCoverImage] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [featured, setFeatured] = useState(false);
  const [articleActive, setArticleActive] = useState(true);
  const [translations, setTranslations] = useState<NewsTranslations>({});
  const [editorLang, setEditorLang] = useState<'ca'|'es'|'en'>('ca');

  // Composer state
  const [tiles, setTiles] = useState<NewsTile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<any>(null);
  const [hoverGrid, setHoverGrid] = useState<{x:number;y:number;w:number;h:number} | null>(null);
  const [metrics, setMetrics] = useState({ cw: 80, rh: NG_ROW_H });

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageId = useRef<string | null>(null);
  const pendingVideoId = useRef<string | null>(null);

  // Load existing article
  useEffect(() => {
    if (initialId === null) return;
    apiGetNewsArticle(initialId)
      .then(a => {
        setTitle(a.title || 'Esborrany sense títol');
        setCategory(a.category || NEWS_CATS_FULL[0]);
        setSummary(a.summary || '');
        setDate((a.date || '').slice(0, 10));
        setCoverImage(a.image || '');
        setFeatured(a.featured === 1);
        setArticleActive(a.active !== 0);
        setTranslations((a.translations as NewsTranslations) ?? {});
        const c = (a.content || '').trim();
        if (!c) { setTiles([]); return; }
        // Try parse new tile-array format
        try {
          const parsed = JSON.parse(c);
          if (Array.isArray(parsed) && parsed.length && parsed[0] && typeof parsed[0].x === 'number' && typeof parsed[0].type === 'string') {
            setTiles(parsed.map(t => newsClamp({ ...t, id: t.id || newsUid() })));
            return;
          }
        } catch { /* not JSON or wrong shape — fall through */ }
        // Legacy fallback: dump as single paragraph
        setTiles([{ id: newsUid(), type: 'paragraph', x: 0, y: 0, w: 12, h: 4, content: c.replace(/<[^>]+>/g, '') }]);
      })
      .catch(e => setError(e.message ?? 'Error carregant article'))
      .finally(() => setLoading(false));
  }, [initialId]);

  // Recompute cell width on resize
  useLayoutEffect(() => {
    const measure = () => {
      const el = canvasRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const cw = (w - NG_GAP * (NG_COLS - 1)) / NG_COLS;
      setMetrics({ cw, rh: NG_ROW_H });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const minRows = useMemo(
    () => Math.max(20, ...tiles.map(t => t.y + t.h + 4)),
    [tiles],
  );

  // Live projected positions while dragging/resizing — shows where tiles will land
  const projectedTiles = useMemo<NewsTile[] | null>(() => {
    if (!drag) return null;
    if (drag.kind === 'move' && hoverGrid) {
      const moved = tiles.map(tt => tt.id === drag.id
        ? newsClamp({ ...tt, x: hoverGrid.x, y: hoverGrid.y })
        : tt);
      return newsResolveOverlaps(moved, drag.id);
    }
    if (drag.kind === 'resize') {
      return newsResolveOverlaps(tiles, drag.id);
    }
    return null;
  }, [drag, hoverGrid, tiles]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const startPaletteDrag = useCallback((e: React.PointerEvent, type: NewsTileType) => {
    e.preventDefault();
    const def = NEWS_TYPES[type];
    setDrag({ kind: 'palette', type, w: def.w, h: def.h, x: e.clientX, y: e.clientY });
  }, []);

  const startTileDrag = useCallback((e: React.PointerEvent, tile: NewsTile) => {
    if (editingId === tile.id) return;
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrag({
      kind: 'move', id: tile.id,
      offX: e.clientX - r.left, offY: e.clientY - r.top,
      x: e.clientX, y: e.clientY, w: tile.w, h: tile.h,
    });
    setSelectedId(tile.id);
  }, [editingId]);

  const startResize = useCallback((e: React.PointerEvent, tile: NewsTile, dir: 'se'|'sw'|'e'|'s') => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({
      kind: 'resize', id: tile.id, dir,
      x: e.clientX, y: e.clientY,
      origin: { x: tile.x, y: tile.y, w: tile.w, h: tile.h },
    });
    setSelectedId(tile.id);
  }, []);

  // ── Pointer move/up while drag is active ──────────────────────────────────
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const c = canvasRef.current;
      if (drag.kind === 'palette') {
        setDrag((d: any) => ({ ...d, x: e.clientX, y: e.clientY }));
        if (!c) return;
        const r = c.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          const localX = e.clientX - r.left - (drag.w * metrics.cw) / 2;
          const localY = e.clientY - r.top;
          const gx = Math.round(localX / (metrics.cw + NG_GAP));
          const gy = Math.round(localY / (metrics.rh + NG_GAP));
          setHoverGrid({ x: Math.max(0, Math.min(NG_COLS - drag.w, gx)), y: Math.max(0, gy), w: drag.w, h: drag.h });
        } else setHoverGrid(null);
      } else if (drag.kind === 'move') {
        if (!c) return;
        const r = c.getBoundingClientRect();
        const localX = e.clientX - r.left - drag.offX;
        const localY = e.clientY - r.top - drag.offY;
        const gx = Math.round(localX / (metrics.cw + NG_GAP));
        const gy = Math.round(localY / (metrics.rh + NG_GAP));
        const tile = tiles.find(t => t.id === drag.id);
        if (!tile) return;
        const nx = Math.max(0, Math.min(NG_COLS - tile.w, gx));
        const ny = Math.max(0, gy);
        setHoverGrid({ x: nx, y: ny, w: tile.w, h: tile.h });
      } else if (drag.kind === 'resize') {
        const dx = (e.clientX - drag.x) / (metrics.cw + NG_GAP);
        const dy = (e.clientY - drag.y) / (metrics.rh + NG_GAP);
        const o = drag.origin;
        let nx = o.x, nw = o.w, nh = o.h;
        if (drag.dir === 'sw') {
          // Right edge fixed; left edge moves
          nx = Math.max(0, Math.min(o.x + o.w - 1, Math.round(o.x + dx)));
          nw = Math.max(1, o.x + o.w - nx);
          nh = Math.max(1, Math.round(o.h + dy));
        } else {
          if (drag.dir.includes('e')) nw = Math.round(o.w + dx);
          if (drag.dir.includes('s')) nh = Math.round(o.h + dy);
          nw = Math.max(1, Math.min(NG_COLS - o.x, nw));
          nh = Math.max(1, nh);
        }
        setTiles(prev => prev.map(t => t.id === drag.id ? { ...t, x: nx, w: nw, h: nh } : t));
      }
    };
    const up = () => {
      if (drag.kind === 'palette') {
        if (hoverGrid) {
          const def = NEWS_TYPES[drag.type as NewsTileType];
          const newTile = newsClamp({
            id: newsUid(), type: drag.type, x: hoverGrid.x, y: hoverGrid.y,
            w: drag.w, h: drag.h, content: def.content,
          });
          setTiles(prev => newsResolveOverlaps([...prev, newTile], newTile.id));
        }
      } else if (drag.kind === 'move') {
        if (hoverGrid) {
          const tile = tiles.find(t => t.id === drag.id);
          if (tile) {
            setTiles(prev => newsResolveOverlaps(
              prev.map(tt => tt.id === drag.id
                ? newsClamp({ ...tt, x: hoverGrid.x, y: hoverGrid.y })
                : tt),
              drag.id,
            ));
          }
        }
      } else if (drag.kind === 'resize') {
        setTiles(prev => newsResolveOverlaps(prev, drag.id));
      }
      setDrag(null); setHoverGrid(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, hoverGrid, tiles, metrics]);

  // Exit edit on click outside the editing tile
  useEffect(() => {
    if (!editingId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-tile="${editingId}"]`)) setEditingId(null);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [editingId]);

  // Keyboard: delete selected, escape clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingId) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        setTiles(prev => prev.filter(t => t.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === 'Escape') { setSelectedId(null); setEditingId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, editingId]);

  const updateTileContent = (id: string, content: string) => {
    if (editorLang === 'ca') {
      setTiles(prev => prev.map(t => t.id === id ? { ...t, content } : t));
    } else {
      setTiles(prev => prev.map(t => t.id === id ? { ...t, translations: { ...t.translations, [editorLang]: content } } : t));
    }
  };
  const deleteTile = (id: string) => {
    setTiles(prev => prev.filter(t => t.id !== id));
    setSelectedId(null);
  };
  const requestImageUpload = (id: string) => {
    pendingImageId.current = id;
    fileInputRef.current?.click();
  };
  const handleImageFile = async (file: File) => {
    const id = pendingImageId.current;
    pendingImageId.current = null;
    if (!id || !file) return;
    try {
      const full = await apiUploadImage(file);
      const m = full.match(/(\/uploads\/[^?#]+)/);
      const url = m ? m[1] : full;
      setTiles(prev => prev.map(t => t.id === id ? { ...t, url } : t));
    } catch (e: any) {
      setError(e.message ?? 'Error pujant imatge');
    }
  };
  const requestVideoUpload = (id: string) => {
    pendingVideoId.current = id;
    videoInputRef.current?.click();
  };
  const handleVideoFile = async (file: File) => {
    const id = pendingVideoId.current;
    pendingVideoId.current = null;
    if (!id || !file) return;
    try {
      const { url } = await apiUploadMedia(file);
      const m = url.match(/(\/uploads\/[^?#]+)/);
      const rel = m ? m[1] : url;
      setTiles(prev => prev.map(t => t.id === id ? { ...t, url: rel } : t));
    } catch (e: any) {
      setError(e.message ?? 'Error pujant vídeo');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("El títol és obligatori"); return; }
    setSaving(true); setError('');
    try {
      let imageUrl = coverImage;
      if (coverFile) {
        const full = await apiUploadImage(coverFile);
        const m = full.match(/(\/uploads\/[^?#]+)/);
        imageUrl = m ? m[1] : full;
      }
      const fields = {
        category, title: title.trim(), summary: summary.trim(),
        content: JSON.stringify(tiles),
        date,
        image: imageUrl, featured: featured ? 1 : 0, active: articleActive ? 1 : 0,
        translations,
      };
      if (articleId !== null) {
        await apiUpdateNews(articleId, fields);
      } else {
        const created = await apiCreateNews(fields);
        setArticleId(created.id);
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('article', String(created.id));
          window.history.replaceState(null, '', u.toString());
        } catch {}
      }
      setCoverFile(null);
      setCoverImage(imageUrl);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
    } catch (e: any) {
      setError(e.message ?? 'Error guardant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: NT.bg, color: NT.mute,
        display: 'grid', placeItems: 'center', fontFamily: NT.uiFont, fontSize: 13,
      }}>Carregant article…</div>
    );
  }

  const totalH = minRows * metrics.rh + (minRows - 1) * NG_GAP;
  const gridLines = !preview;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: NT.bg, color: NT.ink,
      fontFamily: NT.uiFont, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Saved toast */}
      {savedToast && (
        <div style={{
          position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, padding: '8px 14px', borderRadius: 999,
          background: '#3a7448', color: '#fff', fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}>✓ Article guardat</div>
      )}

      {/* Hidden file inputs for image + video tile upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.currentTarget.value = ''; }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); e.currentTarget.value = ''; }}
      />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: NT.panel, borderBottom: `1px solid ${NT.soft}`, flexShrink: 0,
      }}>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent', border: `1px solid ${NT.soft}`,
            color: NT.ink, padding: '6px 10px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >← Tancar</button>
        <div style={{
          width: 24, height: 24, borderRadius: 4, background: NT.ink,
          display: 'grid', placeItems: 'center', color: NT.bg,
          fontFamily: NT.headlineFont, fontWeight: 700, fontSize: 14,
        }}>T</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontSize: 10, color: NT.mute, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Portal · Notícia extensa
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Títol de l'article…"
              style={{
                fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 14,
                color: NT.ink, lineHeight: 1.2, background: 'transparent',
                border: 'none', outline: 'none', padding: 0, minWidth: 200, maxWidth: 360,
              }}
            />
            {editorLang !== 'ca' && (
              <span style={{
                fontSize: 9, fontFamily: NT.uiFont, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: NT.accentInk,
                background: NT.accent, padding: '2px 6px', borderRadius: 3, flexShrink: 0,
              }}>{editorLang}</span>
            )}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {error && (
          <span style={{
            fontFamily: NT.uiFont, fontSize: 11, color: NT.accent,
            background: 'rgba(191,33,30,0.08)', padding: '4px 10px', borderRadius: 999,
            border: `1px solid ${NT.accent}33`,
          }}>{error}</span>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Language switcher */}
          <div style={{ display: 'flex', border: `1px solid ${NT.soft}`, borderRadius: NT.radius, overflow: 'hidden' }}>
            {(['ca','es','en'] as const).map((lang, i) => {
              const isActive = editorLang === lang;
              const isTranslation = lang !== 'ca';
              return (
                <button key={lang} onClick={() => setEditorLang(lang)} style={{
                  background: isActive ? (isTranslation ? NT.accent : NT.ink) : 'transparent',
                  color: isActive ? (isTranslation ? '#fff' : NT.bg) : NT.mute,
                  border: 'none',
                  borderRight: i < 2 ? `1px solid ${NT.soft}` : 'none',
                  padding: '6px 10px',
                  fontFamily: NT.uiFont, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                  transition: 'background 0.15s, color 0.15s',
                }}>{lang}</button>
              );
            })}
          </div>
          <button onClick={() => setPreview(p => !p)} style={{
            background: 'transparent', border: `1px solid ${NT.soft}`,
            color: NT.ink, padding: '6px 12px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>{preview ? '◐ Edició' : '◑ Vista prèvia'}</button>
          <button onClick={() => setShowSettings(true)} style={{
            background: 'transparent', border: `1px solid ${NT.soft}`,
            color: NT.ink, padding: '6px 12px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>⚙ Configuració</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{
            background: NT.accent, color: NT.accentInk, border: 0,
            padding: '6px 14px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
            cursor: (saving || !title.trim()) ? 'not-allowed' : 'pointer',
            opacity: (saving || !title.trim()) ? 0.5 : 1,
          }}>{saving ? 'Guardant…' : (articleId !== null ? 'Guardar' : 'Publicar')}</button>
        </div>
      </div>

      {/* Body: sidebar palette + canvas */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {!preview && <NewsPalette onPointerDownItem={startPaletteDrag} />}

        <div
          onClick={() => { setSelectedId(null); setEditingId(null); }}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 32, position: 'relative' }}
        >
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            background: NT.surface, borderRadius: NT.radius,
            border: preview ? 'none' : `1px solid ${NT.soft}`,
            padding: preview ? 'clamp(20px, 4vw, 64px)' : 20,
            boxShadow: preview ? 'none' : '0 1px 0 rgba(0,0,0,0.02)',
            position: 'relative',
          }}>
            <div
              ref={canvasRef}
              style={{
                position: 'relative',
                width: '100%', height: totalH, minHeight: 600,
                backgroundImage: gridLines ? `
                  linear-gradient(to right, ${NT.grid} 1px, transparent 1px),
                  linear-gradient(to bottom, ${NT.grid} 1px, transparent 1px)
                ` : 'none',
                backgroundSize: gridLines ? `${metrics.cw + NG_GAP}px 100%, 100% ${metrics.rh + NG_GAP}px` : 'auto',
              }}
            >
              {/* Drop indicator */}
              {hoverGrid && drag && (drag.kind === 'palette' || drag.kind === 'move') && (
                <div style={{
                  position: 'absolute',
                  ...newsTileBox(hoverGrid, metrics.cw, metrics.rh),
                  background: 'rgba(191,33,30,0.14)',
                  border: `1.5px dashed ${NT.accent}`,
                  borderRadius: NT.tileRadius,
                  pointerEvents: 'none',
                  transition: 'left .08s, top .08s, width .08s, height .08s',
                }} />
              )}

              {/* Tiles */}
              {tiles.map(tt => {
                const isDragged = drag?.kind === 'move' && drag.id === tt.id;
                const isResizing = drag?.kind === 'resize' && drag.id === tt.id;
                const renderTile = projectedTiles?.find(p => p.id === tt.id) ?? tt;
                return (
                <div key={tt.id} style={{
                  position: 'absolute',
                  ...newsTileBox(isDragged || isResizing ? tt : renderTile, metrics.cw, metrics.rh),
                  opacity: isDragged && hoverGrid ? 0.35 : 1,
                  transition: (isDragged || isResizing) ? 'none' : 'left .18s cubic-bezier(0.4,0,0.2,1), top .18s cubic-bezier(0.4,0,0.2,1), width .18s cubic-bezier(0.4,0,0.2,1), height .18s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <NewsTileEl
                    tile={tt}
                    selected={!preview && selectedId === tt.id}
                    editing={preview ? null : editingId}
                    activeLang={editorLang}
                    gridLines={gridLines}
                    onSelect={preview ? () => {} : setSelectedId}
                    onEdit={preview ? () => {} : setEditingId}
                    onStopEdit={preview ? () => {} : () => setEditingId(null)}
                    onChange={updateTileContent}
                    onDelete={deleteTile}
                    onPointerDown={preview ? () => {} : startTileDrag}
                    onResizePointerDown={startResize}
                    onRequestImage={requestImageUpload}
                    onRequestVideo={requestVideoUpload}
                  />
                </div>
              );
              })}

              {/* Empty state */}
              {tiles.length === 0 && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{ textAlign: 'center', color: NT.mute }}>
                    <div style={{
                      fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight,
                      fontSize: 28, color: NT.ink, marginBottom: 6,
                    }}>Comença la teva història</div>
                    <div style={{ fontFamily: NT.uiFont, fontSize: 13 }}>
                      Arrossega qualsevol bloc del panell esquerre cap a aquesta pàgina.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          {!preview && (
            <div style={{
              position: 'sticky', bottom: 0,
              display: 'flex', gap: 16, alignItems: 'center',
              padding: '8px 14px', maxWidth: 1200, margin: '16px auto 0',
              background: NT.panel, border: `1px solid ${NT.soft}`,
              borderRadius: NT.radius,
              fontFamily: NT.uiFont, fontSize: 11, color: NT.mute,
            }}>
              <span><b style={{ color: NT.ink }}>{tiles.length}</b> blocs</span>
              <span style={{ width: 1, height: 12, background: NT.soft }} />
              <span>{minRows} files × 12 cols</span>
              <span style={{ width: 1, height: 12, background: NT.soft }} />
              <span style={{ color: NT.ink }}>⌫ esborrar · Esc desseleccionar</span>
              <span style={{ flex: 1 }} />
              <span>{articleId !== null ? `#${articleId}` : 'Esborrany nou'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating drag ghost */}
      {drag?.kind === 'palette' && (
        <div style={{
          position: 'fixed', left: drag.x, top: drag.y,
          transform: 'translate(-50%, -50%)',
          padding: '8px 14px', background: NT.accent, color: NT.accentInk,
          borderRadius: 999, fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          pointerEvents: 'none', zIndex: 1000,
        }}>{NEWS_TYPES[drag.type as NewsTileType].label} · {drag.w}×{drag.h}</div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(4px)',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560,
              background: NT.surface, borderRadius: 8,
              border: `1px solid ${NT.soft}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              padding: 24, fontFamily: NT.uiFont, color: NT.ink,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: NT.mute, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Article</div>
                <div style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 22 }}>Configuració</div>
              </div>
              <button onClick={() => setShowSettings(false)} style={{
                background: 'transparent', border: 'none', color: NT.mute,
                fontSize: 18, cursor: 'pointer', padding: 4,
              }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{
                  width: '100%', padding: '8px 10px', fontFamily: NT.uiFont, fontSize: 13,
                  background: NT.surface, color: NT.ink,
                  border: `1px solid ${NT.soft}`, borderRadius: NT.radius, outline: 'none',
                }}>
                  {NEWS_CATS_FULL.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Data</label>
                <DatePicker value={date} onChange={setDate} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Resum</label>
                <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2}
                  placeholder="Resum breu (1-2 frases)" style={{
                    width: '100%', padding: '8px 10px', fontFamily: NT.bodyFont, fontSize: 13, lineHeight: 1.4,
                    background: NT.surface, color: NT.ink,
                    border: `1px solid ${NT.soft}`, borderRadius: NT.radius, outline: 'none', resize: 'vertical',
                  }} />
              </div>
              {/* Translations */}
              {(['es', 'en'] as const).map(lang => (
                <div key={lang} style={{ gridColumn: '1 / -1', borderTop: `1px solid ${NT.soft}`, paddingTop: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{
                      fontSize: 9, fontFamily: NT.uiFont, fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: '#fff',
                      background: NT.accent, padding: '2px 7px', borderRadius: 3,
                    }}>{lang}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: NT.mute, fontFamily: NT.uiFont }}>
                      {lang === 'es' ? 'Castellà' : 'Anglès'}
                      <span style={{ color: NT.mute, opacity: 0.5, marginLeft: 6, fontSize: 10 }}>— buit = usa CA</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Títol</label>
                      <input
                        value={translations[lang]?.title ?? ''}
                        onChange={e => setTranslations(t => ({ ...t, [lang]: { ...t[lang], title: e.target.value } }))}
                        placeholder={`Títol en ${lang === 'es' ? 'castellà' : 'anglès'} (deixa buit = usa el CA)`}
                        style={{ width: '100%', padding: '8px 10px', fontFamily: NT.uiFont, fontSize: 13, background: NT.surface, color: NT.ink, border: `1px solid ${NT.soft}`, borderRadius: NT.radius, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Resum</label>
                      <textarea
                        value={translations[lang]?.summary ?? ''}
                        onChange={e => setTranslations(t => ({ ...t, [lang]: { ...t[lang], summary: e.target.value } }))}
                        placeholder={`Resum en ${lang === 'es' ? 'castellà' : 'anglès'} (deixa buit = usa el CA)`}
                        rows={2}
                        style={{ width: '100%', padding: '8px 10px', fontFamily: NT.bodyFont, fontSize: 13, lineHeight: 1.4, background: NT.surface, color: NT.ink, border: `1px solid ${NT.soft}`, borderRadius: NT.radius, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => setArticleActive(v => !v)} style={{
                  position: 'relative', width: 40, height: 22, borderRadius: 999, border: 'none',
                  background: articleActive ? '#22c55e' : NT.soft, cursor: 'pointer', padding: 0, transition: 'background .15s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: articleActive ? 20 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)', transition: 'left .15s',
                  }} />
                </button>
                <span style={{ fontSize: 13 }}>Notícia activa (visible a la pàgina de notícies)</span>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => setFeatured(v => !v)} style={{
                  position: 'relative', width: 40, height: 22, borderRadius: 999, border: 'none',
                  background: featured ? NT.accent : NT.soft, cursor: 'pointer', padding: 0, transition: 'background .15s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: featured ? 20 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)', transition: 'left .15s',
                  }} />
                </button>
                <span style={{ fontSize: 13 }}>Notícia destacada (apareix al carrusel de portada)</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Imatge de portada</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(coverFile || coverImage) && (
                    <img
                      src={coverFile ? URL.createObjectURL(coverFile) : resolveImg(coverImage)}
                      alt=""
                      style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: NT.radius, border: `1px solid ${NT.soft}` }}
                    />
                  )}
                  <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
                    style={{ fontSize: 12, fontFamily: NT.uiFont, color: NT.mute }} />
                  {coverImage && !coverFile && (
                    <button type="button" onClick={() => setCoverImage('')} style={{
                      background: 'transparent', border: 'none', color: NT.accent,
                      fontSize: 12, cursor: 'pointer',
                    }}>Treure</button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setShowSettings(false)} style={{
                background: NT.accent, color: NT.accentInk, border: 0,
                padding: '8px 16px', borderRadius: NT.radius,
                fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Fet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CourseTileCanvas ──────────────────────────────────────────────────────────

function CourseTileCanvas({
  tiles,
  onTilesChange,
  editable,
  activeLang = 'ca',
}: {
  tiles: NewsTile[];
  onTilesChange: (tiles: NewsTile[]) => void;
  editable: boolean;
  activeLang?: 'ca' | 'es' | 'en';
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<any>(null);
  const [hoverGrid, setHoverGrid] = useState<{x:number;y:number;w:number;h:number} | null>(null);
  const [metrics, setMetrics] = useState({ cw: 80, rh: NG_ROW_H });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pendingImageId = useRef<string | null>(null);
  const pendingVideoId = useRef<string | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = canvasRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const cw = (w - NG_GAP * (NG_COLS - 1)) / NG_COLS;
      setMetrics({ cw, rh: NG_ROW_H });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const minRows = useMemo(
    () => Math.max(10, ...tiles.map(t => t.y + t.h + 2)),
    [tiles],
  );

  const projectedTiles = useMemo<NewsTile[] | null>(() => {
    if (!drag) return null;
    if (drag.kind === 'move' && hoverGrid) {
      const moved = tiles.map(tt => tt.id === drag.id
        ? newsClamp({ ...tt, x: hoverGrid.x, y: hoverGrid.y })
        : tt);
      return newsResolveOverlaps(moved, drag.id);
    }
    if (drag.kind === 'resize') return newsResolveOverlaps(tiles, drag.id);
    return null;
  }, [drag, hoverGrid, tiles]);

  const startPaletteDrag = useCallback((e: React.PointerEvent, type: NewsTileType) => {
    e.preventDefault();
    const def = NEWS_TYPES[type];
    setDrag({ kind: 'palette', type, w: def.w, h: def.h, x: e.clientX, y: e.clientY });
  }, []);

  const startTileDrag = useCallback((e: React.PointerEvent, tile: NewsTile) => {
    if (editingId === tile.id) return;
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrag({
      kind: 'move', id: tile.id,
      offX: e.clientX - r.left, offY: e.clientY - r.top,
      x: e.clientX, y: e.clientY, w: tile.w, h: tile.h,
    });
    setSelectedId(tile.id);
  }, [editingId]);

  const startResize = useCallback((e: React.PointerEvent, tile: NewsTile, dir: 'se'|'sw'|'e'|'s') => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({
      kind: 'resize', id: tile.id, dir,
      x: e.clientX, y: e.clientY,
      origin: { x: tile.x, y: tile.y, w: tile.w, h: tile.h },
    });
    setSelectedId(tile.id);
  }, []);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const c = canvasRef.current;
      if (drag.kind === 'palette') {
        setDrag((d: any) => ({ ...d, x: e.clientX, y: e.clientY }));
        if (!c) return;
        const r = c.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          const localX = e.clientX - r.left - (drag.w * metrics.cw) / 2;
          const localY = e.clientY - r.top;
          const gx = Math.round(localX / (metrics.cw + NG_GAP));
          const gy = Math.round(localY / (metrics.rh + NG_GAP));
          setHoverGrid({ x: Math.max(0, Math.min(NG_COLS - drag.w, gx)), y: Math.max(0, gy), w: drag.w, h: drag.h });
        } else setHoverGrid(null);
      } else if (drag.kind === 'move') {
        if (!c) return;
        const r = c.getBoundingClientRect();
        const localX = e.clientX - r.left - drag.offX;
        const localY = e.clientY - r.top - drag.offY;
        const gx = Math.round(localX / (metrics.cw + NG_GAP));
        const gy = Math.round(localY / (metrics.rh + NG_GAP));
        const tile = tiles.find(t => t.id === drag.id);
        if (!tile) return;
        const nx = Math.max(0, Math.min(NG_COLS - tile.w, gx));
        const ny = Math.max(0, gy);
        setHoverGrid({ x: nx, y: ny, w: tile.w, h: tile.h });
      } else if (drag.kind === 'resize') {
        const dx = (e.clientX - drag.x) / (metrics.cw + NG_GAP);
        const dy = (e.clientY - drag.y) / (metrics.rh + NG_GAP);
        const o = drag.origin;
        let nx = o.x, nw = o.w, nh = o.h;
        if (drag.dir === 'sw') {
          nx = Math.max(0, Math.min(o.x + o.w - 1, Math.round(o.x + dx)));
          nw = Math.max(1, o.x + o.w - nx);
          nh = Math.max(1, Math.round(o.h + dy));
        } else {
          if (drag.dir.includes('e')) nw = Math.round(o.w + dx);
          if (drag.dir.includes('s')) nh = Math.round(o.h + dy);
          nw = Math.max(1, Math.min(NG_COLS - o.x, nw));
          nh = Math.max(1, nh);
        }
        onTilesChange(tiles.map(t => t.id === drag.id ? { ...t, x: nx, w: nw, h: nh } : t));
      }
    };
    const up = () => {
      if (drag.kind === 'palette') {
        if (hoverGrid) {
          const def = NEWS_TYPES[drag.type as NewsTileType];
          const newTile = newsClamp({
            id: newsUid(), type: drag.type, x: hoverGrid.x, y: hoverGrid.y,
            w: drag.w, h: drag.h, content: def.content,
          });
          onTilesChange(newsResolveOverlaps([...tiles, newTile], newTile.id));
        }
      } else if (drag.kind === 'move') {
        if (hoverGrid) {
          const tile = tiles.find(t => t.id === drag.id);
          if (tile) {
            onTilesChange(newsResolveOverlaps(
              tiles.map(tt => tt.id === drag.id
                ? newsClamp({ ...tt, x: hoverGrid.x, y: hoverGrid.y })
                : tt),
              drag.id,
            ));
          }
        }
      } else if (drag.kind === 'resize') {
        onTilesChange(newsResolveOverlaps(tiles, drag.id));
      }
      setDrag(null); setHoverGrid(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, hoverGrid, tiles, metrics, onTilesChange]);

  useEffect(() => {
    if (!editingId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-tile="${editingId}"]`)) setEditingId(null);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [editingId]);

  useEffect(() => {
    if (!editable) return;
    const onKey = (e: KeyboardEvent) => {
      if (editingId) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        onTilesChange(tiles.filter(t => t.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === 'Escape') { setSelectedId(null); setEditingId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, editingId, editable, tiles, onTilesChange]);

  const updateTileContent = (id: string, content: string) => {
    onTilesChange(tiles.map(t => t.id === id ? { ...t, content } : t));
  };
  const deleteTile = (id: string) => {
    onTilesChange(tiles.filter(t => t.id !== id));
    setSelectedId(null);
  };
  const requestImageUpload = (id: string) => {
    pendingImageId.current = id;
    fileInputRef.current?.click();
  };
  const handleImageFile = async (file: File) => {
    const id = pendingImageId.current;
    pendingImageId.current = null;
    if (!id || !file) return;
    try {
      const full = await apiUploadImage(file);
      const m = full.match(/(\/uploads\/[^?#]+)/);
      const url = m ? m[1] : full;
      onTilesChange(tiles.map(t => t.id === id ? { ...t, url } : t));
    } catch { /* silently ignore */ }
  };
  const requestVideoUpload = (id: string) => {
    pendingVideoId.current = id;
    videoInputRef.current?.click();
  };
  const handleVideoFile = async (file: File) => {
    const id = pendingVideoId.current;
    pendingVideoId.current = null;
    if (!id || !file) return;
    try {
      const { url } = await apiUploadMedia(file);
      const m = url.match(/(\/uploads\/[^?#]+)/);
      const rel = m ? m[1] : url;
      onTilesChange(tiles.map(t => t.id === id ? { ...t, url: rel } : t));
    } catch { /* silently ignore */ }
  };

  const totalH = minRows * metrics.rh + (minRows - 1) * NG_GAP;
  const gridLines = editable;

  const canvas = (
    <div
      onClick={() => { if (editable) { setSelectedId(null); setEditingId(null); } }}
      style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: editable ? 16 : 0, position: 'relative' }}
    >
      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.currentTarget.value = ''; }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); e.currentTarget.value = ''; }}
          />
        </>
      )}
      <div
        ref={canvasRef}
        style={{
          position: 'relative',
          width: '100%', height: totalH, minHeight: 160,
          backgroundImage: gridLines ? `
            linear-gradient(to right, ${NT.grid} 1px, transparent 1px),
            linear-gradient(to bottom, ${NT.grid} 1px, transparent 1px)
          ` : 'none',
          backgroundSize: gridLines ? `${metrics.cw + NG_GAP}px 100%, 100% ${metrics.rh + NG_GAP}px` : 'auto',
        }}
      >
        {editable && hoverGrid && drag && (drag.kind === 'palette' || drag.kind === 'move') && (
          <div style={{
            position: 'absolute',
            ...newsTileBox(hoverGrid, metrics.cw, metrics.rh),
            background: 'rgba(191,33,30,0.14)',
            border: `1.5px dashed ${NT.accent}`,
            borderRadius: NT.tileRadius,
            pointerEvents: 'none',
            transition: 'left .08s, top .08s, width .08s, height .08s',
          }} />
        )}
        {tiles.map(tt => {
          const isDragged = drag?.kind === 'move' && drag.id === tt.id;
          const isResizing = drag?.kind === 'resize' && drag.id === tt.id;
          const renderTile = projectedTiles?.find(p => p.id === tt.id) ?? tt;
          return (
            <div key={tt.id} style={{
              position: 'absolute',
              ...newsTileBox(isDragged || isResizing ? tt : renderTile, metrics.cw, metrics.rh),
              opacity: isDragged && hoverGrid ? 0.35 : 1,
              transition: (isDragged || isResizing) ? 'none' : 'left .18s cubic-bezier(0.4,0,0.2,1), top .18s cubic-bezier(0.4,0,0.2,1), width .18s cubic-bezier(0.4,0,0.2,1), height .18s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <NewsTileEl
                tile={tt}
                selected={editable ? selectedId === tt.id : false}
                editing={editable ? editingId : null}
                activeLang={activeLang}
                gridLines={gridLines}
                onSelect={editable ? setSelectedId : () => {}}
                onEdit={editable ? setEditingId : () => {}}
                onStopEdit={editable ? () => setEditingId(null) : () => {}}
                onChange={updateTileContent}
                onDelete={deleteTile}
                onPointerDown={editable ? startTileDrag : () => {}}
                onResizePointerDown={startResize}
                onRequestImage={requestImageUpload}
                onRequestVideo={requestVideoUpload}
              />
            </div>
          );
        })}
        {tiles.length === 0 && editable && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', color: NT.mute, fontFamily: NT.uiFont, fontSize: 12 }}>
              Arrossega blocs del panell cap aquí
            </div>
          </div>
        )}
      </div>
      {editable && drag?.kind === 'palette' && (
        <div style={{
          position: 'fixed', left: drag.x, top: drag.y,
          transform: 'translate(-50%, -50%)',
          padding: '8px 14px', background: NT.accent, color: NT.accentInk,
          borderRadius: 999, fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          pointerEvents: 'none', zIndex: 10000,
        }}>{NEWS_TYPES[drag.type as NewsTileType].label} · {drag.w}×{drag.h}</div>
      )}
    </div>
  );

  if (!editable) return canvas;

  return (
    <div style={{ display: 'flex', minHeight: 0, flex: 1 }}>
      <NewsPalette onPointerDownItem={startPaletteDrag} />
      {canvas}
    </div>
  );
}

// ── Course editor page — route: /?course=ID ──────────────────────────────────
function CourseEditorPage({ courseId, kind = 'external' }: { courseId: number; kind?: 'external' | 'quiz' }) {
  useEffect(() => {
    try {
      const have = localStorage.getItem('tavil_token') || sessionStorage.getItem('tavil_token');
      if (!have && window.opener) {
        const op = window.opener as Window | null;
        const tok = op?.localStorage?.getItem('tavil_token') ?? op?.sessionStorage?.getItem('tavil_token') ?? null;
        if (tok) sessionStorage.setItem('tavil_token', tok);
      }
    } catch { /* cross-origin */ }
    document.title = 'Editor formació · TAVIL';
  }, []);

  const [courseRaw, setCourseRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preview, setPreview] = useState(false);

  // Course metadata (settings modal)
  const [title, setTitle] = useState('Esborrany sense títol');
  const [summary, setSummary] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // Composer state
  const [tiles, setTiles] = useState<NewsTile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<any>(null);
  const [hoverGrid, setHoverGrid] = useState<{x:number;y:number;w:number;h:number} | null>(null);
  const [metrics, setMetrics] = useState({ cw: 80, rh: NG_ROW_H });

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageId = useRef<string | null>(null);
  const pendingVideoId = useRef<string | null>(null);

  // Load course
  useEffect(() => {
    const tok = localStorage.getItem('tavil_token') || sessionStorage.getItem('tavil_token') || '';
    const url = kind === 'quiz'
      ? `${API_BASE}/quizzes/${courseId}`
      : `${API_BASE}/courses/${courseId}`;
    fetch(url, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json())
      .then(c => {
        if (!c || c.error) { setError('No s\'ha pogut carregar la formació.'); return; }
        setCourseRaw(c);
        setTitle(c.title || 'Esborrany sense títol');
        setSummary(c.description || '');
        setCoverUrl(c.image || '');
        document.title = `${c.title} · Editor · TAVIL`;
        const raw = kind === 'quiz' ? (c.page_content || '') : (c.content || '');
        const trimmed = (raw || '').trim();
        if (!trimmed) { setTiles([]); return; }
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length && parsed[0] && typeof parsed[0].x === 'number' && typeof parsed[0].type === 'string') {
            setTiles(parsed.map((t: any) => newsClamp({ ...t, id: t.id || newsUid() })));
            return;
          }
        } catch { /* not tile JSON — fall through */ }
        setTiles([{ id: newsUid(), type: 'paragraph', x: 0, y: 0, w: 12, h: 4, content: trimmed.replace(/<[^>]+>/g, '') }]);
      })
      .catch(e => setError(e.message ?? 'Error carregant formació'))
      .finally(() => setLoading(false));
  }, [courseId, kind]);

  // Recompute cell width on resize
  useLayoutEffect(() => {
    const measure = () => {
      const el = canvasRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const cw = (w - NG_GAP * (NG_COLS - 1)) / NG_COLS;
      setMetrics({ cw, rh: NG_ROW_H });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const minRows = useMemo(
    () => Math.max(20, ...tiles.map(t => t.y + t.h + 4)),
    [tiles],
  );

  // Live projected positions while dragging/resizing
  const projectedTiles = useMemo<NewsTile[] | null>(() => {
    if (!drag) return null;
    if (drag.kind === 'move' && hoverGrid) {
      const moved = tiles.map(tt => tt.id === drag.id
        ? newsClamp({ ...tt, x: hoverGrid.x, y: hoverGrid.y })
        : tt);
      return newsResolveOverlaps(moved, drag.id);
    }
    if (drag.kind === 'resize') {
      return newsResolveOverlaps(tiles, drag.id);
    }
    return null;
  }, [drag, hoverGrid, tiles]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const startPaletteDrag = useCallback((e: React.PointerEvent, type: NewsTileType) => {
    e.preventDefault();
    const def = NEWS_TYPES[type];
    setDrag({ kind: 'palette', type, w: def.w, h: def.h, x: e.clientX, y: e.clientY });
  }, []);

  const startTileDrag = useCallback((e: React.PointerEvent, tile: NewsTile) => {
    if (editingId === tile.id) return;
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrag({
      kind: 'move', id: tile.id,
      offX: e.clientX - r.left, offY: e.clientY - r.top,
      x: e.clientX, y: e.clientY, w: tile.w, h: tile.h,
    });
    setSelectedId(tile.id);
  }, [editingId]);

  const startResize = useCallback((e: React.PointerEvent, tile: NewsTile, dir: 'se'|'sw'|'e'|'s') => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({
      kind: 'resize', id: tile.id, dir,
      x: e.clientX, y: e.clientY,
      origin: { x: tile.x, y: tile.y, w: tile.w, h: tile.h },
    });
    setSelectedId(tile.id);
  }, []);

  // ── Pointer move/up while drag is active ──────────────────────────────────
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const c = canvasRef.current;
      if (drag.kind === 'palette') {
        setDrag((d: any) => ({ ...d, x: e.clientX, y: e.clientY }));
        if (!c) return;
        const r = c.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          const localX = e.clientX - r.left - (drag.w * metrics.cw) / 2;
          const localY = e.clientY - r.top;
          const gx = Math.round(localX / (metrics.cw + NG_GAP));
          const gy = Math.round(localY / (metrics.rh + NG_GAP));
          setHoverGrid({ x: Math.max(0, Math.min(NG_COLS - drag.w, gx)), y: Math.max(0, gy), w: drag.w, h: drag.h });
        } else setHoverGrid(null);
      } else if (drag.kind === 'move') {
        if (!c) return;
        const r = c.getBoundingClientRect();
        const localX = e.clientX - r.left - drag.offX;
        const localY = e.clientY - r.top - drag.offY;
        const gx = Math.round(localX / (metrics.cw + NG_GAP));
        const gy = Math.round(localY / (metrics.rh + NG_GAP));
        const tile = tiles.find(t => t.id === drag.id);
        if (!tile) return;
        const nx = Math.max(0, Math.min(NG_COLS - tile.w, gx));
        const ny = Math.max(0, gy);
        setHoverGrid({ x: nx, y: ny, w: tile.w, h: tile.h });
      } else if (drag.kind === 'resize') {
        const dx = (e.clientX - drag.x) / (metrics.cw + NG_GAP);
        const dy = (e.clientY - drag.y) / (metrics.rh + NG_GAP);
        const o = drag.origin;
        let nx = o.x, nw = o.w, nh = o.h;
        if (drag.dir === 'sw') {
          nx = Math.max(0, Math.min(o.x + o.w - 1, Math.round(o.x + dx)));
          nw = Math.max(1, o.x + o.w - nx);
          nh = Math.max(1, Math.round(o.h + dy));
        } else {
          if (drag.dir.includes('e')) nw = Math.round(o.w + dx);
          if (drag.dir.includes('s')) nh = Math.round(o.h + dy);
          nw = Math.max(1, Math.min(NG_COLS - o.x, nw));
          nh = Math.max(1, nh);
        }
        setTiles(prev => prev.map(t => t.id === drag.id ? { ...t, x: nx, w: nw, h: nh } : t));
      }
    };
    const up = () => {
      if (drag.kind === 'palette') {
        if (hoverGrid) {
          const def = NEWS_TYPES[drag.type as NewsTileType];
          const newTile = newsClamp({
            id: newsUid(), type: drag.type, x: hoverGrid.x, y: hoverGrid.y,
            w: drag.w, h: drag.h, content: def.content,
          });
          setTiles(prev => newsResolveOverlaps([...prev, newTile], newTile.id));
        }
      } else if (drag.kind === 'move') {
        if (hoverGrid) {
          const tile = tiles.find(t => t.id === drag.id);
          if (tile) {
            setTiles(prev => newsResolveOverlaps(
              prev.map(tt => tt.id === drag.id
                ? newsClamp({ ...tt, x: hoverGrid.x, y: hoverGrid.y })
                : tt),
              drag.id,
            ));
          }
        }
      } else if (drag.kind === 'resize') {
        setTiles(prev => newsResolveOverlaps(prev, drag.id));
      }
      setDrag(null); setHoverGrid(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, hoverGrid, tiles, metrics]);

  // Exit edit on click outside the editing tile
  useEffect(() => {
    if (!editingId) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-tile="${editingId}"]`)) setEditingId(null);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [editingId]);

  // Keyboard: delete selected, escape clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingId) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        setTiles(prev => prev.filter(t => t.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === 'Escape') { setSelectedId(null); setEditingId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, editingId]);

  const updateTileContent = (id: string, content: string) => {
    setTiles(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };
  const deleteTile = (id: string) => {
    setTiles(prev => prev.filter(t => t.id !== id));
    setSelectedId(null);
  };
  const requestImageUpload = (id: string) => {
    pendingImageId.current = id;
    fileInputRef.current?.click();
  };
  const handleImageFile = async (file: File) => {
    const id = pendingImageId.current;
    pendingImageId.current = null;
    if (!id || !file) return;
    try {
      const full = await apiUploadImage(file);
      const m = full.match(/(\/uploads\/[^?#]+)/);
      const url = m ? m[1] : full;
      setTiles(prev => prev.map(t => t.id === id ? { ...t, url } : t));
    } catch (e: any) {
      setError(e.message ?? 'Error pujant imatge');
    }
  };
  const requestVideoUpload = (id: string) => {
    pendingVideoId.current = id;
    videoInputRef.current?.click();
  };
  const handleVideoFile = async (file: File) => {
    const id = pendingVideoId.current;
    pendingVideoId.current = null;
    if (!id || !file) return;
    try {
      const { url } = await apiUploadMedia(file);
      const m = url.match(/(\/uploads\/[^?#]+)/);
      const rel = m ? m[1] : url;
      setTiles(prev => prev.map(t => t.id === id ? { ...t, url: rel } : t));
    } catch (e: any) {
      setError(e.message ?? 'Error pujant vídeo');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('El títol és obligatori'); return; }
    setSaving(true); setError('');
    try {
      const tok = localStorage.getItem('tavil_token') || sessionStorage.getItem('tavil_token') || '';
      const url = kind === 'quiz'
        ? `${API_BASE}/quizzes/${courseId}`
        : `${API_BASE}/courses/${courseId}`;
      const body = kind === 'quiz'
        ? { ...courseRaw, title: title.trim(), description: summary.trim(), page_content: JSON.stringify(tiles), image: coverUrl }
        : { ...courseRaw, title: title.trim(), description: summary.trim(), content: JSON.stringify(tiles), image: coverUrl };
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify(body),
      });
      setCourseRaw((prev: any) => ({ ...prev, title: title.trim(), description: summary.trim(), image: coverUrl }));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
    } catch (e: any) {
      setError(e.message ?? 'Error guardant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: NT.bg, color: NT.mute,
        display: 'grid', placeItems: 'center', fontFamily: NT.uiFont, fontSize: 13,
      }}>Carregant formació…</div>
    );
  }

  const totalH = minRows * metrics.rh + (minRows - 1) * NG_GAP;
  const gridLines = !preview;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: NT.bg, color: NT.ink,
      fontFamily: NT.uiFont, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Saved toast */}
      {savedToast && (
        <div style={{
          position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, padding: '8px 14px', borderRadius: 999,
          background: '#3a7448', color: '#fff', fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}>✓ Formació desada</div>
      )}

      {/* Hidden file inputs for image + video tile upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.currentTarget.value = ''; }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); e.currentTarget.value = ''; }}
      />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: NT.panel, borderBottom: `1px solid ${NT.soft}`, flexShrink: 0,
      }}>
        <button
          onClick={() => window.close()}
          style={{
            background: 'transparent', border: `1px solid ${NT.soft}`,
            color: NT.ink, padding: '6px 10px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >← Tancar</button>
        <div style={{
          width: 24, height: 24, borderRadius: 4, background: NT.ink,
          display: 'grid', placeItems: 'center', color: NT.bg,
          fontFamily: NT.headlineFont, fontWeight: 700, fontSize: 14,
        }}>T</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontSize: 10, color: NT.mute, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Portal · Formació
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Títol de la formació…"
            style={{
              fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 14,
              color: NT.ink, lineHeight: 1.2, background: 'transparent',
              border: 'none', outline: 'none', padding: 0, minWidth: 200, maxWidth: 360,
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        {error && (
          <span style={{
            fontFamily: NT.uiFont, fontSize: 11, color: NT.accent,
            background: 'rgba(191,33,30,0.08)', padding: '4px 10px', borderRadius: 999,
            border: `1px solid ${NT.accent}33`,
          }}>{error}</span>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setPreview(p => !p)} style={{
            background: 'transparent', border: `1px solid ${NT.soft}`,
            color: NT.ink, padding: '6px 12px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>{preview ? '◐ Edició' : '◑ Vista prèvia'}</button>
          <button onClick={() => setShowSettings(true)} style={{
            background: 'transparent', border: `1px solid ${NT.soft}`,
            color: NT.ink, padding: '6px 12px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>⚙ Configuració</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{
            background: NT.accent, color: NT.accentInk, border: 0,
            padding: '6px 14px', borderRadius: NT.radius,
            fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
            cursor: (saving || !title.trim()) ? 'not-allowed' : 'pointer',
            opacity: (saving || !title.trim()) ? 0.5 : 1,
          }}>{saving ? 'Guardant…' : 'Guardar'}</button>
        </div>
      </div>

      {/* Body: sidebar palette + canvas */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {!preview && <NewsPalette onPointerDownItem={startPaletteDrag} />}

        <div
          onClick={() => { setSelectedId(null); setEditingId(null); }}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 32, position: 'relative' }}
        >
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            background: NT.surface, borderRadius: NT.radius,
            border: preview ? 'none' : `1px solid ${NT.soft}`,
            padding: preview ? 'clamp(20px, 4vw, 64px)' : 20,
            boxShadow: preview ? 'none' : '0 1px 0 rgba(0,0,0,0.02)',
            position: 'relative',
          }}>
            <div
              ref={canvasRef}
              style={{
                position: 'relative',
                width: '100%', height: totalH, minHeight: 600,
                backgroundImage: gridLines ? `
                  linear-gradient(to right, ${NT.grid} 1px, transparent 1px),
                  linear-gradient(to bottom, ${NT.grid} 1px, transparent 1px)
                ` : 'none',
                backgroundSize: gridLines ? `${metrics.cw + NG_GAP}px 100%, 100% ${metrics.rh + NG_GAP}px` : 'auto',
              }}
            >
              {/* Drop indicator */}
              {hoverGrid && drag && (drag.kind === 'palette' || drag.kind === 'move') && (
                <div style={{
                  position: 'absolute',
                  ...newsTileBox(hoverGrid, metrics.cw, metrics.rh),
                  background: 'rgba(191,33,30,0.14)',
                  border: `1.5px dashed ${NT.accent}`,
                  borderRadius: NT.tileRadius,
                  pointerEvents: 'none',
                  transition: 'left .08s, top .08s, width .08s, height .08s',
                }} />
              )}

              {/* Tiles */}
              {tiles.map(tt => {
                const isDragged = drag?.kind === 'move' && drag.id === tt.id;
                const isResizing = drag?.kind === 'resize' && drag.id === tt.id;
                const renderTile = projectedTiles?.find(p => p.id === tt.id) ?? tt;
                return (
                <div key={tt.id} style={{
                  position: 'absolute',
                  ...newsTileBox(isDragged || isResizing ? tt : renderTile, metrics.cw, metrics.rh),
                  opacity: isDragged && hoverGrid ? 0.35 : 1,
                  transition: (isDragged || isResizing) ? 'none' : 'left .18s cubic-bezier(0.4,0,0.2,1), top .18s cubic-bezier(0.4,0,0.2,1), width .18s cubic-bezier(0.4,0,0.2,1), height .18s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <NewsTileEl
                    tile={tt}
                    selected={!preview && selectedId === tt.id}
                    editing={preview ? null : editingId}
                    activeLang="ca"
                    gridLines={gridLines}
                    onSelect={preview ? () => {} : setSelectedId}
                    onEdit={preview ? () => {} : setEditingId}
                    onStopEdit={preview ? () => {} : () => setEditingId(null)}
                    onChange={updateTileContent}
                    onDelete={deleteTile}
                    onPointerDown={preview ? () => {} : startTileDrag}
                    onResizePointerDown={startResize}
                    onRequestImage={requestImageUpload}
                    onRequestVideo={requestVideoUpload}
                  />
                </div>
              );
              })}

              {/* Empty state */}
              {tiles.length === 0 && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{ textAlign: 'center', color: NT.mute }}>
                    <div style={{
                      fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight,
                      fontSize: 28, color: NT.ink, marginBottom: 6,
                    }}>Contingut buit</div>
                    <div style={{ fontFamily: NT.uiFont, fontSize: 13 }}>
                      Arrossega qualsevol bloc del panell esquerre cap a aquesta pàgina.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          {!preview && (
            <div style={{
              position: 'sticky', bottom: 0,
              display: 'flex', gap: 16, alignItems: 'center',
              padding: '8px 14px', maxWidth: 1200, margin: '16px auto 0',
              background: NT.panel, border: `1px solid ${NT.soft}`,
              borderRadius: NT.radius,
              fontFamily: NT.uiFont, fontSize: 11, color: NT.mute,
            }}>
              <span><b style={{ color: NT.ink }}>{tiles.length}</b> blocs</span>
              <span style={{ width: 1, height: 12, background: NT.soft }} />
              <span>{minRows} files × 12 cols</span>
              <span style={{ width: 1, height: 12, background: NT.soft }} />
              <span style={{ color: NT.ink }}>⌫ esborrar · Esc desseleccionar</span>
              <span style={{ flex: 1 }} />
              <span>#{courseId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating drag ghost */}
      {drag?.kind === 'palette' && (
        <div style={{
          position: 'fixed', left: drag.x, top: drag.y,
          transform: 'translate(-50%, -50%)',
          padding: '8px 14px', background: NT.accent, color: NT.accentInk,
          borderRadius: 999, fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          pointerEvents: 'none', zIndex: 1000,
        }}>{NEWS_TYPES[drag.type as NewsTileType].label} · {drag.w}×{drag.h}</div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(4px)',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: NT.surface, borderRadius: 8,
              border: `1px solid ${NT.soft}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              padding: 24, fontFamily: NT.uiFont, color: NT.ink,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: NT.mute, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Formació</div>
                <div style={{ fontFamily: NT.headlineFont, fontWeight: NT.headlineWeight, fontSize: 22 }}>Configuració</div>
              </div>
              <button onClick={() => setShowSettings(false)} style={{
                background: 'transparent', border: 'none', color: NT.mute,
                fontSize: 18, cursor: 'pointer', padding: 4,
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Títol</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Títol de la formació"
                  style={{
                    width: '100%', padding: '8px 10px', fontFamily: NT.uiFont, fontSize: 13,
                    background: NT.surface, color: NT.ink,
                    border: `1px solid ${NT.soft}`, borderRadius: NT.radius, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: NT.mute, marginBottom: 4 }}>Descripció</label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={3}
                  placeholder="Descripció breu de la formació"
                  style={{
                    width: '100%', padding: '8px 10px', fontFamily: NT.bodyFont, fontSize: 13, lineHeight: 1.4,
                    background: NT.surface, color: NT.ink,
                    border: `1px solid ${NT.soft}`, borderRadius: NT.radius, outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setShowSettings(false)} style={{
                background: NT.accent, color: NT.accentInk, border: 0,
                padding: '8px 16px', borderRadius: NT.radius,
                fontFamily: NT.uiFont, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Fet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  // Standalone quiz player route: /?quiz=ID opens full-screen presentation player.
  const quizRouteId = useMemo(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('quiz');
      const n = v ? parseInt(v, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch { return null; }
  }, []);
  // Quiz editor route: /?edit=ID (existing) or /?edit=new
  const editRoute = useMemo<{ id: number | null } | null>(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('edit');
      if (v === null) return null;
      if (v === 'new') return { id: null };
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? { id: n } : null;
    } catch { return null; }
  }, []);
  // News article editor route: /?article=ID or /?article=new
  const articleRoute = useMemo<{ id: number | null } | null>(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('article');
      if (v === null) return null;
      if (v === 'new') return { id: null };
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? { id: n } : null;
    } catch { return null; }
  }, []);
  // Course detail/editor page: /?course=ID (external) or /?course=q-ID (quiz)
  const courseRoute = useMemo<{ id: number; kind: 'external' | 'quiz' } | null>(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('course');
      if (v === null) return null;
      if (v.startsWith('q-')) {
        const n = parseInt(v.slice(2), 10);
        return Number.isFinite(n) && n > 0 ? { id: n, kind: 'quiz' } : null;
      }
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? { id: n, kind: 'external' } : null;
    } catch { return null; }
  }, []);

  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('tavil_dark') === 'true';
    if (saved) document.documentElement.classList.add('dark');
    return saved;
  });
  const toggleTheme = () => {
    const apply = () => setIsDarkMode(v => !v);
    // Use View Transitions API for smooth crossfade (Chrome/Edge); fallback to instant flip
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonating, setImpersonating] = useState<{ name: string } | null>(null);
  const SIDEBAR_SECTIONS = useSidebarSections(currentUser?.role, currentUser?.roles);
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify-email' | 'otp' | 'forgot'>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  const [activeTab, setActiveTabState] = useState(() => sessionStorage.getItem('tavil_active_tab') ?? 'Inici');
  const [notifSubTab, setNotifSubTab] = useState<string | null>(null);
  const [adminIntent, setAdminIntent] = useState<'new' | null>(null);
  const setActiveTab = (tab: string, intent?: 'new') => {
    // Clear sub-tab memory so returning to any section starts at its default.
    // F5 (page reload) doesn't call this, so F5-restore still works.
    ['activitats','campus','veu','solicituds','perfil','backoffice'].forEach(k =>
      sessionStorage.removeItem(`tavil_subtab_${k}`)
    );
    sessionStorage.setItem('tavil_active_tab', tab);
    setActiveTabState(tab);
    setAdminIntent(intent ?? null);
  };
  const consumeAdminIntent = () => setAdminIntent(null);

  // Page transition — push style: both old and new pages rendered during the
  // transition window, old slides out while new slides in. Direction derived
  // from sidebar order (forward = further down the list / right on mobile).
  const isMobilePage = useIsMobile();
  const tabOrder = useMemo(
    () => SIDEBAR_SECTIONS.flatMap(s => s.items.map(i => i.id)),
    [SIDEBAR_SECTIONS],
  );
  const [exitingTab, setExitingTab] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'fwd' | 'back'>('fwd');
  const [exitIsMobile, setExitIsMobile] = useState(isMobilePage);
  const [hasNavigated, setHasNavigated] = useState(false);
  const prevTabRef = useRef(activeTab);         // previous tab (for direction logic)
  const goBackRef = useRef(activeTab);          // where goBack() should navigate to
  const bubbleOriginYRef = useRef<number>(240); // viewport Y of last-clicked sidebar nav item center
  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    setHasNavigated(true);
    const prev = tabOrder.indexOf(prevTabRef.current);
    const cur = tabOrder.indexOf(activeTab);
    const dir = prev !== -1 && cur !== -1 && cur < prev ? 'back' : 'fwd';
    setExitingTab(prevTabRef.current);
    setExitDirection(dir);
    if (activeTab === 'Perfil') setExitDirection('back');
    if (prevTabRef.current === 'Perfil' && activeTab === 'Més') setExitDirection('fwd');
    // Sub-tabs opened from Més behave like a drill-down submenu:
    // Més → sub-tab = slide from right (fwd); sub-tab → Més = slide from left (back)
    const MES_SUBTABS = new Set(['Activitats', 'Espai', 'Campus', 'Solicituds']);
    if (prevTabRef.current === 'Més' && MES_SUBTABS.has(activeTab)) setExitDirection('fwd');
    if (activeTab === 'Més' && MES_SUBTABS.has(prevTabRef.current)) setExitDirection('back');
    setExitIsMobile(isMobilePage);
    // Clear open-article state when leaving Notícies (don't restore on return).
    if (prevTabRef.current === 'Notícies' && activeTab !== 'Notícies') {
      try {
        window.sessionStorage.removeItem('tavil_selected_news_id');
        window.sessionStorage.removeItem('tavil_news_origin');
      } catch {}
    }
    goBackRef.current = prevTabRef.current; // save before overwriting
    prevTabRef.current = activeTab;
    // Always reset scroll to top when switching tabs (subtle animation).
    scrollPageToTop();
    const duration = isMobilePage ? 220 : 200;
    const timer = setTimeout(() => setExitingTab(null), duration);
    return () => clearTimeout(timer);
  }, [activeTab, isMobilePage, tabOrder]);

  const goBack = () => setActiveTab(goBackRef.current);

  const enterClass = (isMobilePage && !hasNavigated)
    ? ''
    : isMobilePage
      ? (exitDirection === 'fwd' ? 'anim-page-enter-h-fwd' : 'anim-page-enter-h-back')
      : 'anim-page-enter-desk';
  const exitClass = exitIsMobile
    ? (exitDirection === 'fwd' ? 'anim-page-exit-h-fwd' : 'anim-page-exit-h-back')
    : 'anim-page-exit-desk';
  const [agendaInitDate, setAgendaInitDate] = useState<{ day: number; month: number; year: number } | null>(null);
  const navigateToDate = (day: number, month: number, year: number) => {
    setAgendaInitDate({ day, month, year });
    setActiveTab('Agenda');
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState<{ news: NewsArticle[], activities: Activity[], events: AgendaEvent[], employees: Employee[] } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [demoRole, setDemoRole] = useState('Treballador/a');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerSticky, setHeaderSticky] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [preventionPending, setPreventionPending] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileNotifsOpen, setMobileNotifsOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  useEffect(() => { registerGlobalNavSetter(setNavHidden); return () => { registerGlobalNavSetter(null); }; }, []);

  // Glass + anchor header on scroll. Inici threshold 240px (past hero). Others 30px.
  // On tab change: reset to false + scroll to top so short pages don't inherit anchored state.
  useEffect(() => {
    setHeaderSticky(false);
    window.scrollTo(0, 0);
    const threshold = activeTab === 'Inici' ? 240 : 30;
    let last = false;
    const onScroll = () => {
      const next = window.scrollY > threshold;
      if (next !== last) { last = next; setHeaderSticky(next); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const userInitials = currentUser?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? 'CH';
  const userAvatar = currentUser?.avatar_url ?? null;

  const refreshNotifications = () => {
    apiGetNotifications().then(setNotifications).catch(() => {});
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setDemoRole(user.role);
    setIsLoggedIn(true);
    apiGetNotifications().then(setNotifications).catch(() => {});
    prefetchTabData(true);
    if (user.must_change_password) setShowChangePassword(true);
    if (user.requires_prl) {
      apiPreventionStatus().then(s => setPreventionPending(s.pending)).catch(() => {});
    }
  };

  const handleAuthResult = (data: AuthOut) => {
    if (data.status === 'pending_verification') {
      setPendingEmail(data.email!);
      setAuthView('verify-email');
    } else if (data.status === 'pending_otp') {
      setPendingEmail(data.email!);
      setAuthView('otp');
    } else {
      setToken(data.access_token!, data.remember ?? true);
      handleLogin(data.user!);
    }
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('tavil_active_tab');
    localStorage.removeItem('tavil_token_original');
    setCurrentUser(null);
    setImpersonating(null);
    setIsLoggedIn(false);
    setAuthView('login');
    setIsProfileMenuOpen(false);
    setActiveTabState('Inici');
    setNotifications([]);
    resetTabPrefetch();
  };

  const handleImpersonate = async (userId: number, userName: string) => {
    const orig = localStorage.getItem('tavil_token') ?? sessionStorage.getItem('tavil_token');
    if (orig) localStorage.setItem('tavil_token_original', orig);
    try {
      const data = await apiImpersonate(userId);
      setToken(data.access_token, true);
      setCurrentUser(data.user);
      setImpersonating({ name: userName });
      setImpersonatingMode(true);
      resetTabPrefetch();
      setActiveTab('Inici');
      if (data.user.requires_prl) {
        apiPreventionStatus().then(s => setPreventionPending(s.pending)).catch(() => {});
      } else {
        setPreventionPending([]);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStopImpersonate = () => {
    const orig = localStorage.getItem('tavil_token_original');
    if (orig) {
      setToken(orig, true);
      localStorage.removeItem('tavil_token_original');
    }
    setImpersonating(null);
    setImpersonatingMode(false);
    setPreventionPending([]);
    resetTabPrefetch();
    apiGetMe().then(u => { setCurrentUser(u); }).catch(() => handleLogout());
  };

  useEffect(() => {
    initGraph().catch(() => {}); // process MSAL redirect if returning from MS login
    registerUnauthorizedHandler(handleLogout);
    registerMustChangePasswordHandler(() => setShowChangePassword(true));

    if (getToken()) {
      apiGetMe()
        .then(user => {
          setCurrentUser(user);
          setDemoRole(user.role);
          setIsLoggedIn(true);
          apiGetNotifications().then(setNotifications).catch(() => {});
          prefetchTabData(true);
          if (user.must_change_password) setShowChangePassword(true);
          if (user.requires_prl) {
            apiPreventionStatus().then(s => setPreventionPending(s.pending)).catch(() => {});
          }
        })
        .catch(() => clearToken());
    }
  }, []);

  // Dev-only: notify code-nav server (scripts/code-nav.js) of tab changes
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    fetch('http://127.0.0.1:9999', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tab: activeTab }),
    }).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tavil_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tavil_dark', 'false');
    }
  }, [isDarkMode]);

  // Expose sidebar width to fixed/anchored elements (e.g. Campus mandatory bar)
  // via the `body.sidebar-collapsed` class consumed by the --shell-left CSS var.
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsProfileMenuOpen(false);
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setSearchQuery(''); }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const loadSearchData = async () => {
    if (searchData) return;
    try {
      const [news, activities, events, employees] = await Promise.all([
        apiGetNews(), apiGetActivities(), apiGetAgendaEvents(), apiGetEmployees(),
      ]);
      setSearchData({ news, activities, events, employees });
    } catch {}
  };

  const searchResults = (() => {
    if (!searchQuery.trim() || !searchData) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; sub: string; tab: string; badge: string }[] = [];
    searchData.news.filter(n => n.title.toLowerCase().includes(q) || n.category.toLowerCase().includes(q))
      .slice(0, 3).forEach(n => results.push({ label: n.title, sub: n.category, tab: 'Notícies', badge: 'Notícia' }));
    searchData.activities.filter(a => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
      .slice(0, 3).forEach(a => results.push({ label: a.title, sub: a.category, tab: 'Activitats', badge: 'Activitat' }));
    searchData.events.filter(e => e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
      .slice(0, 2).forEach(e => results.push({ label: e.title, sub: e.type, tab: 'Agenda', badge: 'Agenda' }));
    searchData.employees.filter(e => e.name.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q))
      .slice(0, 3).forEach(e => results.push({ label: e.name, sub: e.dept, tab: 'Directori', badge: 'Directori' }));
    return results.slice(0, 8);
  })();

  const renderContentFor = (tab: string) => {
    const hasUnread = notifications.some(n => !n.read);
    const openDrawer = () => setIsDrawerOpen(true);
    const openNotifs = () => setMobileNotifsOpen(true);
    switch (tab) {
      case 'Inici': return <InicialTab onNavigate={setActiveTab} onNavigateToDate={navigateToDate} onOpenDrawer={openDrawer} hasUnread={hasUnread} onOpenNotifs={openNotifs} currentUser={currentUser} />;
      case 'Notícies': return <NoticiesTab currentUser={currentUser} onOpenDrawer={openDrawer} onNavigate={setActiveTab} />;
      case 'Activitats': return <ActivitatsTab currentUser={currentUser} onBack={goBack} />;
      case 'Agenda': return <AgendaTab currentUser={currentUser} initDate={agendaInitDate} onInitDateConsumed={() => setAgendaInitDate(null)} onOpenDrawer={openDrawer} onNavigate={setActiveTab} />;
      case 'Directori': return <DirectoriTab onOpenDrawer={openDrawer} />;
      case 'Espai': return <EspaiCorporatiuTab onBack={goBack} />;
      case 'Campus': return <CampusTavilTab onBack={goBack} currentUser={currentUser} pageActive={activeTab === 'Campus'} />;
      case 'Veu': return <VeuEmpleatTab currentUser={currentUser} initialSubTab={notifSubTab} onSubTabConsumed={() => setNotifSubTab(null)} onBack={goBack} />;
      case 'Solicituds': return <SolicitudsTab currentUser={currentUser} onNotifChange={refreshNotifications} initialSubTab={notifSubTab} onSubTabConsumed={() => setNotifSubTab(null)} onBack={goBack} />;
      case 'Perfil': return <PerfilTab currentUser={currentUser} onUserUpdate={u => { setCurrentUser(u); }} onNavigate={setActiveTab} isDarkMode={isDarkMode} toggleDarkMode={toggleTheme} onLogout={handleLogout} />;
      case 'Empresa': return <EmpresaLandingTab onNavigate={setActiveTab} />;
      case 'Més': return <MesTab onNavigate={setActiveTab} currentUser={currentUser} isDarkMode={isDarkMode} toggleDarkMode={toggleTheme} onLogout={handleLogout} />;
      case 'Backoffice':        return <BackofficeTab currentUser={currentUser} onImpersonate={handleImpersonate} />;
      case 'admin-dashboard':   return <AdminBackoffice view="dashboard"  currentUser={currentUser} onNavigate={setActiveTab} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'admin-users':       return <AdminBackoffice view="users"      currentUser={currentUser} onNavigate={setActiveTab} onImpersonate={handleImpersonate} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'admin-news':        return <AdminBackoffice view="news"       currentUser={currentUser} onNavigate={setActiveTab} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'admin-activities':  return <AdminBackoffice view="activities" currentUser={currentUser} onNavigate={setActiveTab} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'admin-campus':      return <AdminBackoffice view="campus"     currentUser={currentUser} onNavigate={setActiveTab} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'admin-agenda':      return <AdminBackoffice view="agenda"     currentUser={currentUser} onNavigate={setActiveTab} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'admin-avisos':      return <AdminBackoffice view="avisos"     currentUser={currentUser} onNavigate={setActiveTab} intent={adminIntent} onConsumeIntent={consumeAdminIntent} />;
      case 'Notificacions': return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-display text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{t('notifications.title')}</h2>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.read) && (
                  <button onClick={() => apiMarkAllNotifsRead().then(refreshNotifications).catch(() => {})} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--tavil-border)] text-[var(--tavil-text)] hover:bg-[var(--tavil-bgAlt)]">{t('notifications.markAllRead')}</button>
                )}
                <button onClick={() => apiClearAllNotifications().then(refreshNotifications).catch(() => {})} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--tavil-border)] text-[var(--tavil-muted)] hover:text-red-600 hover:border-red-300 inline-flex items-center gap-1.5"><Trash2 size={12} /> {t('notifications.deleteAll')}</button>
              </div>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-sm text-gray-400">{t('notifications.empty')}</div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 divide-y divide-gray-50 dark:divide-zinc-800">
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) apiMarkNotifRead(n.id).then(refreshNotifications).catch(() => {});
                    if (n.tab) {
                      const [mainTab, sub] = n.tab.split('/');
                      setNotifSubTab(sub ?? null);
                      setActiveTab(mainTab);
                    }
                  }}
                  className={cn("flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors anim-item", !n.read && "bg-red-50/40 dark:bg-red-950/10")}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", !n.read ? "bg-red-100 dark:bg-red-950/30" : "bg-gray-100 dark:bg-zinc-800")}>
                    <FileText size={15} className={!n.read ? "text-red-600" : "text-gray-400"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", !n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-zinc-400")}>{n.title}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{n.body}</p>
                    <p className="text-[11px] text-gray-400 mt-2">{timeAgo(n.created_at, t)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-2"></span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };
  const TabSkeleton = ({ tab }: { tab: string }) => {
    switch (tab) {
      case 'Agenda':    return <SkeletonAgenda />;
      case 'Directori': return <SkeletonDirectori />;
      case 'Campus':    return <SkeletonCampus />;
      case 'Notícies':  return <SkeletonNoticies />;
      case 'Activitats': return <SkeletonActivitats />;
      default:          return <SkeletonInici />;
    }
  };

  const renderPageLayout = (tab: string) => {
    const isInici = tab === 'Inici';
    // These tabs render their own mobile header (hamburger/back + kicker + title)
    const selfHandledMobile = new Set(['Inici', 'Notícies', 'Agenda', 'Directori', 'Activitats', 'Veu', 'Solicituds', 'Campus', 'Espai', 'Perfil']);
    const section = SIDEBAR_SECTIONS.flatMap(s => s.items).find(i => i.id === tab)
      ?? (tab === 'Empresa' ? { id: 'Empresa', label: 'Empresa', icon: Building2 } : undefined);

    const mobileKickers: Record<string, string> = {
      'Perfil': 'Perfil',
      'Campus': 'Formació',
      'Espai': 'Empresa',
      'Empresa': 'Empresa',
      'Més': 'Navegació',
    };

    return (
      <div className={isInici ? 'w-full' : 'w-full md:p-4 lg:p-8 md:max-w-7xl md:mx-auto'}>

        {/* ── Mobile top bar spacer — only for tabs that don't render their own header ── */}
        {!selfHandledMobile.has(tab) && (
          <div className="md:hidden" style={{ background: 'var(--tavil-bg)', height: 82 }} />
        )}

        {/* ── Mobile page title (kicker + Instrument Serif h1) — non-self-handled only ── */}
        {!isInici && !selfHandledMobile.has(tab) && (
          <div
            className={`md:hidden px-5 pb-3.5 ${tab === 'Més' ? 'pt-0' : 'pt-3'} ${tab === 'Perfil' ? 'text-center' : ''}`}
            style={{ background: 'var(--tavil-bg)', position: 'relative' }}
          >
            {tab === 'Perfil' && (
              <button
                onClick={goBack}
                style={{
                  position: 'absolute', left: 20, top: 12,
                  width: 40, height: 40, borderRadius: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                  color: 'var(--tavil-text)', cursor: 'pointer',
                }}
              >
                <ChevronLeft size={22} />
              </button>
            )}
            {mobileKickers[tab] && tab !== 'Perfil' && (
              <div className="mobile-kicker">{mobileKickers[tab]}</div>
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: tab === 'Més' ? 36 : 32, fontWeight: 400, lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--tavil-text)',
              margin: 0,
            }}>
              {tab === 'Perfil' ? 'Perfil' : (section?.label ?? tab)}
            </h1>
          </div>
        )}

        {/* ── Desktop breadcrumb + title — hidden on mobile + admin (admin has own AdminHeader) ── */}
        {!isInici && !tab.startsWith('admin-') && (
          <div className="hidden md:block mb-6 p-3 md:p-0 stagger-1">
            <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--tavil-faint)' }}>
              <button onClick={() => setActiveTab('Inici')} className="flex items-center gap-1 transition-colors hover:text-[var(--tavil-accent)]">
                <Home size={11} /> {t('breadcrumb.home')}
              </button>
              <ChevronRight size={11} />
              <span style={{ color: 'var(--tavil-text)' }}>{section?.label}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 600, lineHeight: 1, letterSpacing: '0em', color: 'var(--tavil-text)', margin: 0 }}>
              {tab === 'Perfil' ? (currentUser?.name ?? section?.label) : section?.label}
            </h1>
          </div>
        )}

        {/* ── Tab content ── */}
        <div
          className={cn(!isInici ? 'md:mt-0 px-3 md:px-0 pb-24 md:pb-0' : '', !isInici ? 'stagger-2' : '')}
          style={!isInici ? { background: 'var(--tavil-bg)' } : undefined}
        >
          <Suspense fallback={<TabSkeleton tab={tab} />}>
            {renderContentFor(tab)}
          </Suspense>
        </div>
      </div>
    );
  };

  // Standalone quiz player route — bypass login flow. Token is inherited from
  // opener tab (sessionStorage isn't shared between tabs, so we copy it once).
  if (quizRouteId !== null) {
    return <QuizPlayerPage quizId={quizRouteId} />;
  }
  // Standalone quiz editor route — same token-inherit trick.
  if (editRoute !== null) {
    return <QuizEditorPage initialQuizId={editRoute.id} />;
  }
  // Standalone news article editor route.
  if (articleRoute !== null) {
    return <NewsEditorPage initialId={articleRoute.id} />;
  }
  // Course editor page — only for admin/formacions with explicit cedit=1 flag.
  const _courseEditorRoles = new Set([currentUser?.role ?? '', ...(currentUser?.roles ?? [])]);
  const _canEditCourse = _courseEditorRoles.has('Administrador') || _courseEditorRoles.has('Administrador/a') || _courseEditorRoles.has('Formacions') || _courseEditorRoles.has('Recursos humans');
  if (courseRoute !== null && new URLSearchParams(window.location.search).get('cedit') === '1' && _canEditCourse) {
    return <CourseEditorPage courseId={courseRoute.id} kind={courseRoute.kind} />;
  }

  if (!isLoggedIn) {
    if (isMobilePage) {
      if (authView === 'login') return <LoginScreen onLoginResult={handleAuthResult} onForgot={() => setAuthView('forgot')} isDarkMode={isDarkMode} />;
      if (authView === 'verify-email') return <VerifyScreen email={pendingEmail} onBack={() => setAuthView('login')} onVerified={handleAuthResult} isDarkMode={isDarkMode} />;
      if (authView === 'forgot') return <ForgotScreen onBack={() => setAuthView('login')} isDarkMode={isDarkMode} />;
    }
    if (authView === 'login') return <Suspense fallback={null}><LoginPage onLoginResult={handleAuthResult} isDarkMode={isDarkMode} toggleDarkMode={toggleTheme} /></Suspense>;
    if (authView === 'verify-email') return <Suspense fallback={null}><VerifyEmailPage email={pendingEmail} onBack={() => setAuthView('login')} onVerified={handleAuthResult} isDarkMode={isDarkMode} toggleDarkMode={toggleTheme} /></Suspense>;
    return <Suspense fallback={null}><OTPPage email={pendingEmail} onBack={() => setAuthView('login')} onVerified={handleAuthResult} isDarkMode={isDarkMode} toggleDarkMode={toggleTheme} /></Suspense>;
  }

  return (
    <ToastProvider>
    <div className={cn("flex min-h-screen bg-[var(--tavil-bg)] font-sans text-gray-900 dark:text-zinc-100 transition-colors duration-300", isDarkMode && "dark")}>
      {/* Impersonate banner */}
      {impersonating && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
          <span>Impersonant: {impersonating.name}</span>
          <button onClick={handleStopImpersonate} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, color: '#fff', padding: '2px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Tornar</button>
        </div>
      )}
      {/* Sidebar */}
      <aside className={cn("bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-zinc-800 flex flex-col fixed inset-y-0 z-30 transition-all duration-300 hidden md:flex", sidebarCollapsed ? "md:w-16" : "md:w-60")}>
        <div className={cn("p-5 pb-4", sidebarCollapsed && "px-2")}>
          <div className={cn("mb-7 cursor-pointer", sidebarCollapsed && "flex justify-center")} onClick={() => setActiveTab('Inici')}>
            <div style={{ position: 'relative', height: 28, width: sidebarCollapsed ? 28 : 120 }}>
              {/* Full wordmark — light */}
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`}
                alt="TAVIL"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 28, objectFit: 'contain', objectPosition: 'left center', opacity: !sidebarCollapsed && !isDarkMode ? 1 : 0, transition: 'opacity 200ms cubic-bezier(.23,1,.32,1)', pointerEvents: 'none' }}
              />
              {/* Full wordmark — dark */}
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoDark.png`}
                alt=""
                aria-hidden="true"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 28, objectFit: 'contain', objectPosition: 'left center', opacity: !sidebarCollapsed && isDarkMode ? 1 : 0, transition: 'opacity 200ms cubic-bezier(.23,1,.32,1)', pointerEvents: 'none' }}
              />
              {/* Collapsed icon */}
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoCollapsed.png`}
                alt=""
                aria-hidden="true"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 28, objectFit: 'contain', objectPosition: 'left center', opacity: sidebarCollapsed ? 1 : 0, transition: 'opacity 200ms cubic-bezier(.23,1,.32,1)', pointerEvents: 'none' }}
              />
            </div>
          </div>
          {SIDEBAR_SECTIONS.map((section) => (
            <SidebarSection key={section.title} title={section.title} collapsed={sidebarCollapsed} isAdmin={(section as any).isAdmin}>
              {section.items.map((item) => (
                <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activeTab === item.id} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); bubbleOriginYRef.current = r.top + r.height / 2; setActiveTab(item.id); }} collapsed={sidebarCollapsed} />
              ))}
            </SidebarSection>
          ))}
        </div>

        <div className="mt-auto border-t border-gray-100 dark:border-zinc-800">
          <div className={cn("flex items-center p-4 gap-3", sidebarCollapsed && "justify-center p-3")}>
            {userAvatar
              ? <img src={resolveImg(userAvatar)} alt="" loading="lazy" className="w-8 h-8 rounded-full flex-shrink-0" style={userAvatar?.startsWith('/assets/') ? { objectFit: 'contain', padding: '4px', background: '#fff' } : { objectFit: 'cover' }} />
              : <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userInitials}</div>}
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser?.name ?? 'Usuari'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{currentUser?.dept ?? 'General'}</p>
                </div>
                <button onClick={handleLogout} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-400">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
      {/* Main */}
      <main className={cn("flex-1 min-w-0 min-h-screen transition-all duration-300 ml-0 pb-16 md:pb-0 relative", sidebarCollapsed ? "md:ml-16" : "md:ml-60")} style={impersonating ? { paddingTop: 37 } : undefined}>
        {/* Header:
            · Inici:  absolute transparent → fixed dark-glass (slide-in) at 240px scroll
            · Altres: absolute solid     → fixed dark-glass (slide-in) at  30px scroll
            Both use same fixed+glass pattern when anchored. */}
        <header
          className={cn(
            "h-14 md:h-16 hidden md:flex items-center justify-between px-3 md:px-4 lg:px-8 z-20 border-b",
            activeTab === 'Inici'
              ? headerSticky
                ? "fixed top-0 right-0 header-glass header-anchored"
                : "absolute top-0 left-0 right-0 header-glass"
              : headerSticky
                ? "fixed top-0 right-0 header-glass-dark header-anchored"
                : "absolute top-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-zinc-800"
          )}
          style={headerSticky ? { left: sidebarCollapsed ? 64 : 240 } : undefined}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:inline-flex p-1.5 hover:bg-gray-100/20 dark:hover:bg-zinc-800/30 rounded-lg transition-colors hg-text text-gray-500 dark:text-zinc-400"
              title={sidebarCollapsed ? t('common.expandMenu') : t('common.collapseMenu')}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="hidden md:inline hg-text text-gray-300 dark:text-zinc-600">|</span>
            <span className="text-[11px] md:text-xs font-semibold hg-text text-gray-500 dark:text-zinc-400 uppercase tracking-widest">{t('common.portalIntern')}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 hg-text text-gray-400" size={15} />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setSearchOpen(true); }}
                onFocus={() => { loadSearchData(); if (searchQuery) setSearchOpen(true); }}
                placeholder={t('common.search')}
                className="hg-search bg-gray-100 dark:bg-zinc-800 rounded-lg py-2 pl-9 pr-14 text-sm w-56 outline-none dark:text-white"
              />
              {searchOpen && searchQuery && (
                <div className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden anim-slide-down origin-top">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-gray-400 text-center">{t('common.noResults', { query: searchQuery })}</p>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => { setActiveTab(r.tab); setSearchOpen(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{r.label}</p>
                            <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex-shrink-0">{r.badge}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileMenuOpen(false); if (!isNotifOpen) refreshNotifications(); }}
                className="relative p-2 hover:bg-gray-100/20 dark:hover:bg-zinc-800/30 rounded-lg hg-text text-gray-500 transition-colors"
              >
                <Bell size={18} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white dark:ring-zinc-900 anim-pulse-soft"></span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 anim-slide-down origin-top-right">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('notifications.title')}</h3>
                      {notifications.some(n => !n.read) && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => apiClearAllNotifications().then(refreshNotifications).catch(() => {})}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                        title={t('notifications.deleteAll')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center">{t('notifications.empty')}</p>
                    ) : notifications.map((n, i) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) {
                            apiMarkNotifRead(n.id).then(refreshNotifications).catch(() => {});
                          }
                          if (n.tab) {
                            const [mainTab, sub] = n.tab.split('/');
                            setNotifSubTab(sub ?? null);
                            setActiveTab(mainTab);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={cn("flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors anim-item", !n.read && "bg-red-50/40 dark:bg-red-950/10")}
                        style={{ '--i': i } as React.CSSProperties}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", !n.read ? "bg-red-100 dark:bg-red-950/30" : "bg-gray-100 dark:bg-zinc-800")}>
                          <FileText size={14} className={!n.read ? "text-red-600" : "text-gray-400"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-semibold", !n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-zinc-400")}>{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at, t)}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-2"></span>}
                      </div>
                    ))}
                  </div>
                  {notifications.some(n => !n.read) && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
                      <button
                        onClick={() => apiMarkAllNotifsRead().then(refreshNotifications).catch(() => {})}
                        className="text-red-600 text-xs font-medium hover:underline w-full text-center"
                      >
                        {t('notifications.markAllRead')}
                      </button>
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={() => { setActiveTab('Notificacions'); setIsNotifOpen(false); }}
                      className="text-[var(--tavil-text)] text-xs font-semibold hover:underline w-full text-center"
                    >
                      Veure totes
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  const langs = ['ca', 'es', 'en'];
                  const next = langs[(langs.indexOf(i18n.language) + 1) % langs.length];
                  i18n.changeLanguage(next);
                  localStorage.setItem('tavil_lang', next);
                }}
                className="p-2 hover:bg-gray-100/20 dark:hover:bg-zinc-800/30 rounded-lg hg-text text-gray-500 dark:text-zinc-400 transition-colors flex items-center gap-1"
                title={t('common.language')}
              >
                <Globe size={18} />
                <span className="hg-text text-[10px] font-bold uppercase">{i18n.language}</span>
              </button>
            </div>

            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100/20 dark:hover:bg-zinc-800/30 rounded-lg hg-text text-gray-500 dark:text-zinc-400 transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100/20 dark:hover:bg-zinc-800/30 rounded-lg transition-colors"
              >
                {userAvatar
                  ? <img src={resolveImg(userAvatar)} alt="" loading="lazy" className="w-7 h-7 rounded-full" style={userAvatar?.startsWith('/assets/') ? { objectFit: 'contain', padding: '3px', background: '#fff' } : { objectFit: 'cover' }} />
                  : <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">{userInitials}</div>}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold hg-text text-gray-900 dark:text-white leading-none">{currentUser?.name ?? 'Usuari'}</p>
                  <p className="text-[10px] hg-text text-gray-400 mt-0.5">{demoRole}</p>
                </div>
                <ChevronLeft size={14} className="hg-text text-gray-400 rotate-[-90deg] hidden lg:block" />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 p-3 z-50 anim-slide-down origin-top-right">
                  <div className="px-3 py-2 border-b border-gray-50 dark:border-zinc-800 mb-2">
                    <p className="text-sm font-bold dark:text-white">{currentUser?.name ?? 'Usuari'}</p>
                    <p className="text-[10px] text-gray-400">{currentUser?.email ?? ''}</p>
                    <p className="text-[10px] text-gray-400">{currentUser?.dept ?? 'General'} · {demoRole}</p>
                  </div>
                  <button onClick={() => { setActiveTab('Perfil'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <UserCircle size={14} /> {t('profile.myProfile')}
                  </button>
                  {!!currentUser?.is_demo_admin && (
                  <div className="border-t border-gray-100 dark:border-zinc-800 mt-2 pt-2">
                    <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t('profile.demoRole')}</p>
                    {['Treballador/a', 'Cap de departament', 'Administrador', 'Formacions', 'Comunicacions', 'SolicitudsDissabtes', 'SolicitudsVacances'].map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          setDemoRole(role);
                          if (currentUser) {
                            const updated = { ...currentUser, role, roles: [] };
                            setCurrentUser(updated);
                            apiUpdateMyRole(role).then(u => setCurrentUser({ ...u, roles: [] })).catch(console.error);
                          }
                        }}
                        className={cn(
                          "w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                          demoRole === role
                            ? "bg-red-50 dark:bg-red-950/20 text-red-600 font-medium"
                            : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  )}
                  <div className="border-t border-gray-100 dark:border-zinc-800 mt-2 pt-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                      <LogOut size={14} /> {t('auth.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Spacer: compensates absolute header height on non-Inici pages so content starts below header.
            Inici needs no spacer — hero image fills from top behind transparent header. */}
        {activeTab !== 'Inici' && <div className="h-14 md:h-16 hidden md:block shrink-0" />}

        {/* Content — mobile: swipeable Instagram-style strip; desktop: vertical push transition */}
        {isMobilePage ? (
          <MobileSwipeStack
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={['Inici', 'Notícies', 'Agenda', 'Directori', 'Més']}
            renderPageLayout={renderPageLayout}
            enterClass={enterClass}
            exitingTab={exitingTab}
            exitClass={exitClass}
          />
        ) : (
          <div className="page-stack w-full">
            {exitingTab && exitingTab !== activeTab && exitingTab !== 'Inici' && (
              <div key={`exit-${exitingTab}`} className={cn("page-viewport page-exiting w-full", exitClass)}>
                {renderPageLayout(exitingTab)}
              </div>
            )}
            <div
              key={`enter-${activeTab}`}
              className={cn("page-viewport page-entering w-full", enterClass)}
            >
              {renderPageLayout(activeTab)}
            </div>
          </div>
        )}
      </main>

      {showChangePassword && (
        <Suspense fallback={null}><ChangePasswordModal onDone={() => window.location.reload()} forced /></Suspense>
      )}
      {!showChangePassword && (() => {
        const infPending = preventionPending.includes('inf');
        const epiKey = preventionPending.find(k => k.startsWith('epi_'));
        if (!infPending && !epiKey) return null;
        const docKey = infPending
          ? ((() => { try { return localStorage.getItem('tavil_lang') === 'en' ? 'inf_en' : 'inf_ca'; } catch { return 'inf_ca'; } })())
          : epiKey!;
        return (
          <Suspense fallback={null}>
            <PreventionOnboarding
              documentKey={docKey as any}
              userName={currentUser?.name ?? ''}
              userDept={currentUser?.dept ?? ''}
              onDone={() => window.location.reload()}
            />
          </Suspense>
        );
      })()}
      <MobileDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(tab) => { setActiveTab(tab); setIsDrawerOpen(false); }}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        activeTab={activeTab}
      />
      {isMobilePage && mobileNotifsOpen && (
        <MobileNotificationsOverlay
          notifications={notifications}
          onClose={() => setMobileNotifsOpen(false)}
          onMarkRead={(id) => apiMarkNotifRead(id).then(() => apiGetNotifications().then(setNotifications)).catch(() => {})}
          onMarkAllRead={() => apiMarkAllNotifsRead().then(() => apiGetNotifications().then(setNotifications)).catch(() => {})}
          isDarkMode={isDarkMode}
        />
      )}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} onOpenDrawer={() => setIsDrawerOpen(true)} isDarkMode={isDarkMode} hidden={navHidden || mobileNotifsOpen || isDrawerOpen} />
    </div>
    </ToastProvider>
  );
}

export default App;
