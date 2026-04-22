import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, DragOverlay,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import {
  Home, Newspaper, Activity as ActivityIcon, Calendar, Users, Building2,
  GraduationCap, MessageSquare, UserCircle, Search, Bell,
  Moon, ChevronLeft, ChevronRight, Mail, Database, FolderOpen,
  AlertTriangle, ArrowRight, Sun, MapPin, Clock, Phone, FileText,
  BookOpen, Shield, ThumbsUp, ThumbsDown, Send, ExternalLink, CreditCard,
  CheckCircle, Star, LogOut, LayoutGrid, List,
  Heart, Gift, Globe, Download, Video, Award, Settings, Eye, EyeOff, Lock, Pencil, Trash2,
  Type, AlignLeft, Image as ImageIcon, Minus, Plus, GripVertical, X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { validateVacanca, PERIODS_2026, ANNUAL_QUOTA_DAYS, laboralDaysBetween } from './conveni';
import {
  User, AuthOut,
  apiLogin, apiRegister, apiVerifyEmail, apiVerifyOTP, apiResendVerification,
  apiGetMe, apiUpdateMe, apiUpdateMyRole,
  setToken, clearToken, getToken, registerUnauthorizedHandler,
  apiGetSuggestions, apiCreateSuggestion, apiVoteSuggestion, apiUpdateSuggestionStatus, apiAddSuggestionResponse, Suggestion,
  apiGetIncidencies, apiCreateIncidencia, apiUpdateIncidenciaStatus, Incidencia,
  apiGetEnquestes, apiRespondreEnquesta, Enquesta,
  apiGetSolicituds, apiCreateSolicitud, apiUpdateSolicitud, Solicitud,
  Notice, apiGetNotices,
  NewsArticle, apiGetNews, apiCreateNews, apiUpdateNews, apiDeleteNews,
  Activity, apiGetActivities, apiCreateActivity, apiUpdateActivity, apiDeleteActivity, apiEnrollActivity,
  AgendaEvent, apiGetAgendaEvents, apiCreateAgendaEvent, apiUpdateAgendaEvent, apiDeleteAgendaEvent,
  apiUploadImage, apiGetImages, apiDedupImages, apiDeleteImage, API_BASE,
  Employee, apiGetEmployees,
  Course, apiGetCourses,
  Notification, apiGetNotifications, apiMarkNotifRead, apiMarkAllNotifsRead, apiClearAllNotifications,
  apiCompleteOnboarding, apiGetDeptHead, apiUpdateDept,
  Vacanca, apiGetVacances, apiCreateVacanca, apiUpdateVacancaHead, apiUpdateVacancaRrhh,
} from './api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function timeAgo(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return 'Fa un moment';
  if (diff < 3600) return `Fa ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Fa ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Ahir';
  return `Fa ${Math.floor(diff / 86400)} dies`;
}

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Skeleton primitives ──────────────────────────────────────────────────────
// Shimmer placeholders. Render while data loads for faster perceived speed.

const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={cn("skeleton", className)} style={style} aria-hidden="true" />
);

const SkeletonText = ({ className, width }: { className?: string; width?: string }) => (
  <Skeleton className={cn("skeleton-text", className)} style={{ width: width ?? '100%' }} />
);

const SkeletonCard = ({ className, lines = 2, media = true }: { className?: string; lines?: number; media?: boolean }) => (
  <div className={cn("rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3", className)} role="status" aria-busy="true" aria-label="Carregant">
    {media && <Skeleton className="w-full h-40 rounded-lg" />}
    <Skeleton className="skeleton-title" style={{ width: '70%' }} />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonText key={i} width={i === lines - 1 ? '55%' : '100%'} />
    ))}
  </div>
);

// ── Bottom Nav Bar (mobile) ──────────────────────────────────────────────────

function BottomNavBar({ activeTab, onTabChange, isDarkMode }: { activeTab: string; onTabChange: (id: string) => void; isDarkMode: boolean }) {
  const items = [
    { id: 'Inici', icon: Home, label: 'Inici' },
    { id: 'Notícies', icon: Newspaper, label: 'Notícies' },
    { id: 'Agenda', icon: Calendar, label: 'Agenda' },
    { id: 'Solicituds', icon: FileText, label: 'Solicituds' },
    { id: 'Perfil', icon: UserCircle, label: 'Perfil' },
  ];
  return createPortal(
    <div className={cn("md:hidden", isDarkMode && "dark")}>
      <nav
        aria-label="Navegació principal"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
        className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_-2px_rgba(0,0,0,0.08)]"
      >
        <ul className="flex items-stretch justify-around min-h-[56px] w-full">
          {items.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <li key={id} className="flex-1 min-w-0">
                <button
                  onClick={() => onTabChange(id)}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  className={cn(
                    "press w-full h-full min-h-[56px] flex flex-col items-center justify-center gap-0.5 transition-colors relative focus-ring",
                    active ? "text-red-600" : "text-gray-500 dark:text-zinc-400 active:bg-gray-50 dark:active:bg-zinc-800/60"
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-b-full anim-fade-in"
                    />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                  <span className={cn("text-[11px] font-medium leading-none", active && "font-semibold")}>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>,
    document.body
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: {
  icon: any; label: string; active?: boolean; onClick?: () => void; collapsed?: boolean;
}) => (
  <div
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={cn(
      "flex items-center gap-3 rounded-lg cursor-pointer transition-all duration-200 group relative",
      collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5",
      active
        ? "text-red-600 bg-red-50 dark:bg-red-950/20"
        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200 hover:translate-x-0.5"
    )}
  >
    {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-600 rounded-r-full anim-fade-in" />}
    {active && collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-600 rounded-r-full anim-fade-in" />}
    <Icon size={18} className={cn("transition-colors duration-200", active ? "text-red-600" : "text-gray-400 group-hover:text-gray-500")} />
    {!collapsed && <span className="text-sm font-medium">{label}</span>}
  </div>
);

const SidebarSection = ({ title, children, collapsed = false }: { title: string; children: React.ReactNode; collapsed?: boolean }) => (
  <div className="mb-4">
    {!collapsed && <p className="px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{title}</p>}
    {collapsed && <div className="mx-auto w-4 h-px bg-gray-200 dark:bg-zinc-700 mb-2 mt-1" />}
    <div className="space-y-0.5">{children}</div>
  </div>
);

// ── Shared helpers ────────────────────────────────────────────────────────────

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    style={{ touchAction: 'manipulation' }}
    className={cn(
      "press px-3.5 py-2 md:py-1.5 min-h-[40px] md:min-h-0 rounded-lg text-sm font-medium transition-all duration-200 border flex-shrink-0 whitespace-nowrap focus-ring",
      active
        ? "bg-red-600 text-white border-red-600 shadow-sm"
        : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 active:bg-gray-50 dark:active:bg-zinc-800"
    )}
  >
    {label}
  </button>
);

const UnderlineTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    style={{ touchAction: 'manipulation' }}
    className={cn(
      "relative px-4 md:px-5 py-3 min-h-[44px] text-sm font-medium border-b-2 transition-colors duration-200 -mb-px focus-ring",
      active
        ? "border-red-600 text-red-600"
        : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
    )}
  >
    {label}
  </button>
);

const resolveImg = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads') || path.startsWith('uploads/')) return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  if (path.startsWith('/')) return `${process.env.PUBLIC_URL}${path}`;
  return path;
};

// ── Inici Tab ─────────────────────────────────────────────────────────────────

const NEWS_CAT_COLORS: Record<string, string> = {
  "Notícies corporatives": "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  "Recursos humans":       "bg-pink-100 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400",
  "Seguretat":             "bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
  "Comunicats interns":    "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  "Esdeveniments":         "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  "Innovació":             "bg-violet-100 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
};
function InicialTab({ onNavigate, onNavigateToDate }: { onNavigate?: (tab: string) => void; onNavigateToDate?: (day: number, month: number, year: number) => void }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      apiGetNotices().then(d => !cancelled && setNotices(d)),
      apiGetNews().then(d => !cancelled && setNews(d)),
      apiGetActivities(0).then(d => !cancelled && setActivities(d)),
      apiGetAgendaEvents().then(d => !cancelled && setAgendaEvents(d)),
    ]).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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

  return (
    <div>
      {/* Hero banner — full width of main content area. Shimmer placeholder until image decodes. */}
      <div
        className="relative overflow-hidden mb-4 md:mb-6 h-36 md:h-56 lg:h-72 shadow-sm bg-gray-200 dark:bg-zinc-800"
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
          <h1 className="text-white text-2xl md:text-4xl font-black tracking-tight drop-shadow-lg">TAVIL Hub</h1>
          <p className="text-white/90 text-xs md:text-base mt-1 drop-shadow">Portal intern dels treballadors</p>
        </div>
      </div>

      <div className="p-3 md:p-4 lg:p-8 max-w-7xl mx-auto">

      {/* Loading skeletons — shown until first fetch completes */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 anim-fade-in" role="status" aria-busy="true" aria-label="Carregant inici">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="w-full h-48 md:h-56 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="w-full h-64 rounded-xl" />
            <Skeleton className="w-full h-40 rounded-xl" />
          </div>
        </div>
      )}

      {!loading && (<>
      {/* Urgent notice (optional — only if notices exist) */}
      {notice && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AVÍS URGENT</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{notice.title}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{notice.content}</p>
            {notice.link && (
              <button
                onClick={() => { if (notice.link.startsWith('http')) window.open(notice.link, '_blank', 'noopener,noreferrer'); }}
                className={cn("text-red-600 text-xs font-medium mt-1 flex items-center gap-1 hover:underline", !notice.link.startsWith('http') && "cursor-default")}
              >
                {notice.link} <ArrowRight size={11} />
              </button>
            )}
          </div>
          {notices.length > 1 && (
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className="text-xs text-gray-400">{noticeIndex + 1}/{notices.length}</span>
              <button onClick={() => setNoticeIndex((noticeIndex - 1 + notices.length) % notices.length)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              <button onClick={() => setNoticeIndex((noticeIndex + 1) % notices.length)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comunicats interns — horizontal banner */}
      {comunicats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <FileText size={14} className="text-blue-600" /> Comunicats interns
            </h3>
            <button onClick={() => onNavigate?.('Notícies')} className="text-red-600 text-xs font-medium flex items-center gap-1 hover:underline">
              Veure tots <ArrowRight size={11} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {comunicats.map(c => (
              <div
                key={c.id}
                onClick={() => onNavigate?.('Notícies')}
                className="min-w-[280px] max-w-[320px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 cursor-pointer hover:border-red-200 dark:hover:border-red-900/40 transition-colors flex-shrink-0"
              >
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 uppercase">Comunicat</span>
                <p className="font-semibold text-gray-900 dark:text-white text-sm mt-2 leading-snug line-clamp-2">{c.title}</p>
                {c.summary && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">{c.summary}</p>}
                <p className="text-[10px] text-gray-400 mt-2">{c.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content: Novetats (left, 2 cols) + Right column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Novetats */}
        <div className="lg:col-span-2 space-y-5">
          {/* Featured news carousel */}
          {featured && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <Star size={14} className="text-amber-500" /> Notícies destacades
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
                    transition: 'transform 500ms cubic-bezier(.23, 1, .32, 1)',
                  }}
                >
                  {featuredNews.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onNavigate?.('Notícies')}
                      className="min-w-full relative cursor-pointer"
                    >
                      {item.image ? (
                        <img src={resolveImg(item.image)} alt="" className="w-full h-40 md:h-56 object-cover" />
                      ) : (
                        <div className="w-full h-40 md:h-56 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                          <Newspaper size={48} className="text-red-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", NEWS_CAT_COLORS[item.category] ?? "bg-gray-100 text-gray-600")}>{item.category}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/90 text-amber-900 uppercase flex items-center gap-0.5"><Star size={9} /> Destacada</span>
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
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Novetats</h3>
            </div>
            {novetats.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-8 text-center">
                <Newspaper size={28} className="text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">Encara no hi ha novetats</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {novetats.map(item => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    onClick={() => onNavigate?.(item.kind === 'news' ? 'Notícies' : 'Activitats')}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-red-200 dark:hover:border-red-900/40 transition-colors flex flex-col"
                  >
                    <div className="hidden md:block">
                      {item.image ? (
                        <img src={resolveImg(item.image)} alt="" className="w-full h-28 object-cover" />
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
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                          item.kind === 'news' ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        )}>
                          {item.kind === 'news' ? 'Notícia' : 'Activitat'}
                        </span>
                        {item.category && (
                          <span className="text-[9px] text-gray-400 truncate">{item.category}</span>
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
        <div className="space-y-5">
          {/* Mini calendar */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{MONTH_NAMES[calMonth]} {calYear}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => navigateCalMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"><ChevronLeft size={14} className="text-gray-500" /></button>
                <button onClick={() => navigateCalMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"><ChevronRight size={14} className="text-gray-500" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(d => (
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

          {/* Upcoming this week */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Properes activitats</h3>
              <button onClick={() => onNavigate?.('Agenda')} className="text-red-600 text-xs font-medium flex items-center gap-1 hover:underline">
                Veure <ArrowRight size={11} />
              </button>
            </div>
            {upcomingThisWeek.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 py-2">Cap event aquesta setmana</p>
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
                      <p className="text-[10px] text-gray-400 mt-0.5">{ev.time || '—'}{ev.location ? ` · ${ev.location}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dreceres / Accés directe */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Dreceres</h3>
            <div className="space-y-1.5">
              {[
                { icon: Building2, title: "Empresa", color: "text-indigo-600", tab: "Empresa" },
                { icon: Mail, title: "Correu corporatiu", color: "text-blue-600" },
                { icon: Database, title: "ERP — SAP / Gestió", color: "text-green-600" },
                { icon: FolderOpen, title: "Gestor documental", color: "text-amber-600" },
                { icon: GraduationCap, title: "Campus TAVIL", color: "text-violet-600", tab: "Campus" },
                { icon: AlertTriangle, title: "Comunicar incidència", color: "text-orange-600", tab: "Veu" },
                { icon: Users, title: "Directori", color: "text-red-600", tab: "Directori" },
                { icon: ActivityIcon, title: "Activitats", color: "text-green-600", tab: "Activitats" },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={() => item.tab && onNavigate?.(item.tab)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <item.icon size={15} className={cn("flex-shrink-0", item.color)} />
                  <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 flex-1 truncate">{item.title}</p>
                  <ArrowRight size={11} className="text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>)}
      </div>{/* end padded content */}
    </div>
  );
}

// ── Notícies Tab ──────────────────────────────────────────────────────────────

function EditModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm anim-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-lg md:mx-4 border border-gray-100 dark:border-zinc-800 anim-scale-in overflow-y-auto max-h-[92vh] md:max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 transition-colors">✕</button>
        </div>
        <div className="p-4 md:p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm anim-fade-in" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-100 dark:border-zinc-800 anim-scale-in">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('confirm.deleteTitle')}</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="press px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">{t('confirm.cancel')}</button>
          <button onClick={onConfirm} className="press px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">{t('confirm.delete')}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function NewsEditForm({ neCategory, setNeCategory, neTitle, setNeTitle, neSummary, setNeSummary,
  neAuthor, setNeAuthor, neDate, setNeDate, neImage, setNeImage, neImageFile, setNeImageFile,
  neFeatured, setNeFeatured, neSaving, onSave, onCancel }: any) {
  const [showPicker, setShowPicker] = useState(false);
  const [poolImages, setPoolImages] = useState<{ url: string; name: string }[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [deduping, setDeduping] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ name: string; url: string } | null>(null);

  const openPicker = async () => {
    setShowPicker(true);
    if (poolImages.length === 0) {
      setLoadingPool(true);
      try {
        const imgs = await apiGetImages();
        setPoolImages(imgs);
      } catch { }
      setLoadingPool(false);
    }
  };

  const selectPoolImage = (url: string) => {
    setNeImage(url);
    setNeImageFile(null);
    setShowPicker(false);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <select value={neCategory} onChange={(e: any) => setNeCategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
        {['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'].map((c: string) => <option key={c}>{c}</option>)}
      </select>
      <input type="text" value={neTitle} onChange={(e: any) => setNeTitle(e.target.value)} placeholder="Títol *" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
      <textarea value={neSummary} onChange={(e: any) => setNeSummary(e.target.value)} placeholder="Resum" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white resize-none" />
      <input type="text" value={neAuthor} onChange={(e: any) => setNeAuthor(e.target.value)} placeholder="Autor" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
      <input type="date" value={neDate} onChange={(e: any) => setNeDate(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
      <div className="col-span-2 space-y-1.5">
        {neImage && <img src={resolveImg(neImage)} alt="" className="h-16 rounded object-cover border border-gray-200 dark:border-zinc-700" />}
        <div className="flex gap-2 items-center">
          <input type="file" accept="image/*" onChange={(e: any) => { setNeImageFile(e.target.files?.[0] ?? null); setNeImage(''); }} className="flex-1 text-xs text-gray-600 dark:text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-red-50 file:text-red-700" />
          <button type="button" onClick={openPicker} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
            📁 Galeria
          </button>
        </div>
        {neImageFile && <p className="text-[10px] text-gray-400">{neImageFile.name}</p>}
      </div>

      {showPicker && (
        <div className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 bg-gray-50 dark:bg-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Galeria d'imatges</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={deduping}
                onClick={async () => {
                  setDeduping(true);
                  try {
                    const res = await apiDedupImages();
                    if (res.removed_count > 0) {
                      const imgs = await apiGetImages();
                      setPoolImages(imgs);
                    }
                    alert(`${res.removed_count} duplicats eliminats.`);
                  } catch { alert('Error eliminant duplicats.'); }
                  setDeduping(false);
                }}
                className="text-[10px] px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-600 text-gray-500 dark:text-zinc-400 hover:border-red-300 hover:text-red-600 disabled:opacity-40 transition-colors"
              >
                {deduping ? '...' : '🧹 Netejar duplicats'}
              </button>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
          </div>
          {loadingPool ? (
            <p className="text-xs text-gray-400 text-center py-4">Carregant...</p>
          ) : poolImages.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Cap imatge a la galeria</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {poolImages.map(img => (
                <div key={img.name} className="relative group aspect-square">
                  <button type="button" onClick={() => selectPoolImage(img.url)}
                    className={cn("w-full h-full rounded-lg overflow-hidden border-2 transition-colors",
                      neImage === img.url ? "border-red-500" : "border-transparent hover:border-red-300"
                    )}>
                    <img src={resolveImg(img.url)} alt={img.name} className="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(img); }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Eliminar imatge"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {confirmDelete && (
        <ConfirmModal
          message={`Eliminar la imatge "${confirmDelete.name}"? Aquesta acció no es pot desfer.`}
          onConfirm={async () => { try { await apiDeleteImage(confirmDelete.name); setPoolImages(p => p.filter(i => i.name !== confirmDelete.name)); if (neImage === confirmDelete.url) setNeImage(''); } catch {} setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => setNeFeatured((v: boolean) => !v)} className={cn("relative inline-flex h-4 w-8 items-center rounded-full transition-colors", neFeatured ? "bg-red-600" : "bg-gray-200 dark:bg-zinc-700")}>
          <span className="inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform" style={{ transform: neFeatured ? 'translateX(16px)' : 'translateX(2px)' }} />
        </button>
        <span className="text-xs text-gray-600 dark:text-zinc-400">Destacada</span>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">Cancel·lar</button>
        <button onClick={onSave} disabled={!neTitle.trim() || neSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{neSaving ? 'Desant...' : 'Desar'}</button>
      </div>
    </div>
  );
}

// ── Rich Article ──────────────────────────────────────────────────────────────
type BlockSpan = 1 | 2 | 3;
type BlockType = 'heading' | 'text' | 'image' | 'quote' | 'divider';

interface ArticleBlock {
  id: string;
  type: BlockType;
  span: BlockSpan;
  content?: string;
  level?: 1 | 2 | 3;
  url?: string;
  caption?: string;
  author?: string;
}

function genBlockId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function makeBlock(type: BlockType): ArticleBlock {
  if (type === 'heading') return { id: genBlockId(), type, span: 3, level: 2, content: '' };
  if (type === 'image')   return { id: genBlockId(), type, span: 1, url: '', caption: '' };
  if (type === 'quote')   return { id: genBlockId(), type, span: 2, content: '', author: '' };
  if (type === 'divider') return { id: genBlockId(), type, span: 3 };
  return { id: genBlockId(), type: 'text', span: 2, content: '' };
}

function isRichContent(s: string): boolean {
  return s.trimStart().startsWith('[');
}

function parseBlocks(s: string): ArticleBlock[] {
  try { return JSON.parse(s) as ArticleBlock[]; }
  catch { return []; }
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
              <p className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{block.content}</p>
            )}
            {block.type === 'image' && block.url && (
              <figure>
                <img src={block.url} alt={block.caption ?? ''} className="w-full rounded-xl object-cover" />
                {block.caption && <figcaption className="text-[11px] text-gray-400 mt-2 text-center italic">{block.caption}</figcaption>}
              </figure>
            )}
            {block.type === 'quote' && (
              <blockquote className="border-l-4 border-red-600 pl-5 py-2">
                <p className="text-gray-700 dark:text-zinc-300 text-base italic leading-relaxed">&ldquo;{block.content}&rdquo;</p>
                {block.author && <footer className="text-xs text-gray-400 mt-2">— {block.author}</footer>}
              </blockquote>
            )}
            {block.type === 'divider' && (
              <hr className="border-gray-200 dark:border-zinc-700 my-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

const RICH_BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'heading', label: 'Títol',      icon: Type,           color: 'text-purple-500' },
  { type: 'text',    label: 'Text',       icon: AlignLeft,      color: 'text-blue-500'   },
  { type: 'image',   label: 'Imatge',     icon: ImageIcon,      color: 'text-green-500'  },
  { type: 'quote',   label: 'Cita',       icon: MessageSquare,  color: 'text-orange-500' },
  { type: 'divider', label: 'Separador',  icon: Minus,          color: 'text-gray-400'   },
];

// ── Grid layout (ghost cells) ─────────────────────────────────────────────────
interface GhostCell {
  id: string;
  insertBeforeBlockIdx: number; // index in blocks[]; blocks.length = append
  span: BlockSpan;
}
type GridCell = { kind: 'block'; block: ArticleBlock } | { kind: 'ghost'; ghost: GhostCell };

function buildGridLayout(blocks: ArticleBlock[]): GridCell[][] {
  const rows: GridCell[][] = [];
  let row: GridCell[] = [];
  let colSum = 0;

  const addGhost = (span: BlockSpan, idx: number) =>
    row.push({ kind: 'ghost', ghost: { id: `ghost-r${rows.length}-c${3 - span}`, insertBeforeBlockIdx: idx, span } });

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (colSum + b.span > 3) { addGhost((3 - colSum) as BlockSpan, i); rows.push(row); row = []; colSum = 0; }
    row.push({ kind: 'block', block: b });
    colSum += b.span;
    if (colSum === 3) { rows.push(row); row = []; colSum = 0; }
  }
  if (row.length > 0) { if (colSum < 3) addGhost((3 - colSum) as BlockSpan, blocks.length); rows.push(row); }
  // Always show a trailing empty full-width row as a drop target
  rows.push([{ kind: 'ghost', ghost: { id: 'ghost-append', insertBeforeBlockIdx: blocks.length, span: 3 } }]);
  return rows;
}

// ── Ghost drop cell ───────────────────────────────────────────────────────────
function GhostDropCell({ ghost, isEmpty, activeBlock }: {
  ghost: GhostCell;
  isEmpty?: boolean;
  activeBlock?: ArticleBlock | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: ghost.id });
  const sc = ghost.span === 1 ? 'col-span-1' : ghost.span === 2 ? 'col-span-2' : 'col-span-3';
  const bt = activeBlock ? RICH_BLOCK_TYPES.find(t => t.type === activeBlock.type)! : null;

  return (
    <div
      ref={setNodeRef}
      data-ghost-id={ghost.id}
      className={cn(sc, 'rounded-xl border-2 border-dashed transition-all duration-150 overflow-hidden',
        isEmpty && !isOver ? 'min-h-40 flex flex-col items-center justify-center' : 'min-h-20',
        isOver && activeBlock
          ? 'border-red-400 bg-red-50/40 dark:bg-red-950/15'
          : isOver
            ? 'border-red-400 bg-red-50/70 dark:bg-red-950/20 scale-[1.01] flex items-center justify-center'
            : 'border-gray-200/60 dark:border-zinc-700/40 flex flex-col items-center justify-center'
      )}
    >
      {isOver && activeBlock && bt ? (
        // Preview: ghost silhouette of the dragged block at this slot
        <div className="w-full opacity-60 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/20">
            <bt.icon size={12} className={bt.color} />
            <span className="text-[11px] font-semibold text-red-400">{bt.label}</span>
            <span className="ml-auto text-[10px] font-bold text-red-300">
              {ghost.span === 1 ? '1/3' : ghost.span === 2 ? '2/3' : 'Ple'}
            </span>
          </div>
          <div className="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500 truncate">
            {activeBlock.content ?? activeBlock.url ?? '—'}
          </div>
        </div>
      ) : isOver ? (
        <span className="text-[11px] font-semibold text-red-400">
          {ghost.span === 1 ? '1 columna' : ghost.span === 2 ? '2 columnes' : 'Ample complet'}
        </span>
      ) : isEmpty ? (
        <div className="text-center">
          <LayoutGrid size={32} className="text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-gray-300 dark:text-zinc-600">Afegeix blocs o arrossega aquí</p>
        </div>
      ) : null}
    </div>
  );
}

// ── Palette item (sidebar — pointer-event drag, click-to-add) ─────────────────
function PaletteDragItem({
  bt, onAdd, setDragState, onDrop,
}: {
  bt: typeof RICH_BLOCK_TYPES[0];
  onAdd: () => void;
  setDragState: (s: { type: BlockType; x: number; y: number } | null) => void;
  onDrop: (type: BlockType, x: number, y: number) => void;
}) {
  const isDraggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    if (!isDraggingRef.current && Math.hypot(e.clientX - startRef.current.x, e.clientY - startRef.current.y) > 5) {
      isDraggingRef.current = true;
    }
    if (isDraggingRef.current) setDragState({ type: bt.type, x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) onDrop(bt.type, e.clientX, e.clientY);
    else onAdd();
    isDraggingRef.current = false;
    startRef.current = null;
    setDragState(null);
  };
  const onPointerCancel = () => { isDraggingRef.current = false; startRef.current = null; setDragState(null); };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing touch-none select-none border-gray-100 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors group"
    >
      <bt.icon size={14} className={cn(bt.color, 'flex-shrink-0')} />
      <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 group-hover:text-red-600 transition-colors">{bt.label}</span>
      <GripVertical size={13} className="ml-auto text-gray-300 dark:text-zinc-600 group-hover:text-red-400" />
    </div>
  );
}

// ── Block drag overlay preview ────────────────────────────────────────────────
function BlockDragPreview({ block }: { block: ArticleBlock }) {
  const bt = RICH_BLOCK_TYPES.find(t => t.type === block.type)!;
  return (
    <div className="w-56 bg-white dark:bg-zinc-900 rounded-xl border border-red-300 shadow-2xl overflow-hidden rotate-1 opacity-95 pointer-events-none">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-800">
        <GripVertical size={13} className="text-gray-400" />
        <bt.icon size={12} className={bt.color} />
        <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">{bt.label}</span>
      </div>
      <div className="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500 truncate">
        {block.content ?? block.url ?? '—'}
      </div>
    </div>
  );
}

// ── Active-block ghost slot (keeps ID stable so dnd-kit never loses it) ──────
function GhostForActiveBlock({ block, activeBlock }: { block: ArticleBlock; activeBlock?: ArticleBlock | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: block.id });
  const sc = block.span === 1 ? 'col-span-1' : block.span === 2 ? 'col-span-2' : 'col-span-3';
  const bt = activeBlock ? RICH_BLOCK_TYPES.find(t => t.type === activeBlock.type)! : null;
  return (
    <div
      ref={setNodeRef}
      className={cn(sc, 'rounded-xl border-2 border-dashed min-h-20 flex flex-col items-center justify-center transition-all duration-150 overflow-hidden',
        isOver && activeBlock
          ? 'border-red-400 bg-red-50/40 dark:bg-red-950/15'
          : 'border-gray-200/60 dark:border-zinc-700/40'
      )}
    >
      {isOver && activeBlock && bt && (
        <div className="w-full opacity-60 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/20">
            <bt.icon size={12} className={bt.color} />
            <span className="text-[11px] font-semibold text-red-400">{bt.label}</span>
          </div>
          <div className="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500 truncate">
            {activeBlock.content ?? activeBlock.url ?? '—'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Draggable block card ──────────────────────────────────────────────────────
function DraggableBlockCard({
  block, updateBlock, removeBlock, spanLabel, isBeingDragged,
}: {
  block: ArticleBlock;
  updateBlock: (id: string, patch: Partial<ArticleBlock>) => void;
  removeBlock: (id: string) => void;
  spanLabel: (s: BlockSpan) => string;
  isBeingDragged: boolean;
}) {
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({ id: block.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: block.id });
  const setRef = useCallback((node: HTMLDivElement | null) => { setDragRef(node); setDropRef(node); }, [setDragRef, setDropRef]);
  const sc = block.span === 1 ? 'col-span-1' : block.span === 2 ? 'col-span-2' : 'col-span-3';
  const bt = RICH_BLOCK_TYPES.find(t => t.type === block.type)!;
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ name: string; url: string }[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [confirmDeleteImg, setConfirmDeleteImg] = useState<{ name: string; url: string } | null>(null);

  return (
    <div
      ref={setRef}
      className={cn(sc, 'rounded-xl border overflow-hidden shadow-sm transition-all duration-150',
        isBeingDragged
          ? 'opacity-25 border-dashed border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10'
          : isOver
            ? 'border-red-400 shadow-md bg-white dark:bg-zinc-900'
            : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-red-300 dark:hover:border-red-800'
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes} {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400 touch-none"
            title="Arrossega per moure"
          >
            <GripVertical size={13} />
          </button>
          <bt.icon size={12} className={bt.color} />
          <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">{bt.label}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {block.type !== 'divider' && ([1, 2, 3] as BlockSpan[]).map(s => (
            <button key={s} onClick={() => updateBlock(block.id, { span: s })}
              className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors',
                block.span === s ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300'
              )}>{spanLabel(s)}</button>
          ))}
          <div className="w-px h-3 bg-gray-200 dark:bg-zinc-700 mx-1" />
          <button onClick={() => removeBlock(block.id)}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={11} /></button>
        </div>
      </div>
      <div className="p-3">
        {block.type === 'heading' && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {([1, 2, 3] as const).map(l => (
                <button key={l} onClick={() => updateBlock(block.id, { level: l })}
                  className={cn('text-[10px] font-bold px-2 py-0.5 rounded transition-colors',
                    block.level === l ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300' : 'text-gray-400 hover:text-gray-700')}>H{l}</button>
              ))}
            </div>
            <input value={block.content ?? ''} onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Títol..."
              className={cn('w-full bg-transparent outline-none text-gray-900 dark:text-white font-bold placeholder-gray-300 dark:placeholder-zinc-600',
                block.level === 1 ? 'text-2xl' : block.level === 3 ? 'text-base' : 'text-xl')} />
          </div>
        )}
        {block.type === 'text' && (
          <textarea value={block.content ?? ''} onChange={e => updateBlock(block.id, { content: e.target.value })}
            placeholder="Escriu el text aquí..." rows={5}
            className="w-full bg-transparent outline-none text-sm text-gray-700 dark:text-zinc-300 leading-relaxed resize-none placeholder-gray-300 dark:placeholder-zinc-600" />
        )}
        {block.type === 'image' && (
          <div className="space-y-2">
            {block.url ? (
              <div className="relative">
                <img src={block.url} alt="" className="w-full rounded-lg object-cover max-h-48" />
                <button onClick={() => updateBlock(block.id, { url: '' })}
                  className="absolute top-2 right-2 p-1 bg-white/90 dark:bg-zinc-900/90 rounded-lg text-gray-500 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl py-6 cursor-pointer hover:border-red-300 dark:hover:border-red-800 transition-colors">
                  <ImageIcon size={22} className="text-gray-300 dark:text-zinc-600" />
                  <span className="text-xs text-gray-400">Clica per pujar imatge</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try { updateBlock(block.id, { url: await apiUploadImage(file) }); } catch {}
                  }} />
                </label>
                <button type="button" onClick={async () => {
                  setShowGallery(v => !v);
                  if (galleryImages.length === 0) {
                    setLoadingGallery(true);
                    try { setGalleryImages(await apiGetImages()); } catch {}
                    setLoadingGallery(false);
                  }
                }} className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1">
                  📁 Galeria d'imatges
                </button>
                {showGallery && (
                  <div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-3 bg-gray-50 dark:bg-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Galeria</span>
                      <button onClick={() => setShowGallery(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </div>
                    {loadingGallery ? (
                      <p className="text-xs text-gray-400 text-center py-4">Carregant...</p>
                    ) : galleryImages.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Cap imatge a la galeria</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {galleryImages.map(img => (
                          <div key={img.name} className="relative group aspect-square">
                            <button type="button"
                              onClick={() => { updateBlock(block.id, { url: img.url }); setShowGallery(false); }}
                              className="w-full h-full rounded-lg overflow-hidden border-2 border-transparent hover:border-red-300 transition-colors">
                              <img src={`${API_BASE}${img.url}`} alt={img.name} className="w-full h-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setConfirmDeleteImg(img); }}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              title="Eliminar imatge"
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {confirmDeleteImg && (
                  <ConfirmModal
                    message={`Eliminar la imatge "${confirmDeleteImg.name}"?`}
                    onConfirm={async () => { try { await apiDeleteImage(confirmDeleteImg.name); setGalleryImages(p => p.filter(i => i.name !== confirmDeleteImg.name)); } catch {} setConfirmDeleteImg(null); }}
                    onCancel={() => setConfirmDeleteImg(null)}
                  />
                )}
              </div>
            )}
            <input value={block.caption ?? ''} onChange={e => updateBlock(block.id, { caption: e.target.value })}
              placeholder="Peu de foto (opcional)"
              className="w-full bg-transparent outline-none text-xs text-gray-500 dark:text-zinc-400 placeholder-gray-300 dark:placeholder-zinc-600 border-b border-gray-100 dark:border-zinc-800 pb-1" />
          </div>
        )}
        {block.type === 'quote' && (
          <div className="space-y-2 border-l-4 border-red-300 pl-3">
            <textarea value={block.content ?? ''} onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Text de la cita..." rows={3}
              className="w-full bg-transparent outline-none text-sm italic text-gray-700 dark:text-zinc-300 leading-relaxed resize-none placeholder-gray-300 dark:placeholder-zinc-600" />
            <input value={block.author ?? ''} onChange={e => updateBlock(block.id, { author: e.target.value })}
              placeholder="Autor de la cita"
              className="w-full bg-transparent outline-none text-xs text-gray-400 placeholder-gray-300 dark:placeholder-zinc-600" />
          </div>
        )}
        {block.type === 'divider' && (
          <div className="flex items-center justify-center py-3">
            <hr className="w-full border-gray-200 dark:border-zinc-700" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── RichArticleBuilder ────────────────────────────────────────────────────────
function RichArticleBuilder({
  onSave, onCancel,
}: {
  onSave: (fields: {
    category: string; title: string; summary: string; content: string;
    author: string; date: string; image: string; featured: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [blocks, setBlocks]         = useState<ArticleBlock[]>([]);
  const [title, setTitle]           = useState('');
  const [category, setCategory]     = useState('Comunicats interns');
  const [summary, setSummary]       = useState('');
  const [author, setAuthor]         = useState('');
  const [date, setDate]             = useState('');
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [featured, setFeatured]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [paletteDrag, setPaletteDrag] = useState<{ type: BlockType; x: number; y: number } | null>(null);

  // Track dark mode via MutationObserver so the single canvas background stays correct
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Modifier: center the DragOverlay preview under the cursor (no matter where you grab the block)
  const snapCenterToCursor = useCallback((args: {
    activatorEvent: Event | null;
    activeNodeRect: { left: number; top: number; width: number; height: number } | null;
    draggingNodeRect: { width: number; height: number } | null;
    transform: { x: number; y: number; scaleX: number; scaleY: number };
    [key: string]: unknown;
  }) => {
    const { activatorEvent, activeNodeRect, draggingNodeRect, transform } = args;
    if (activeNodeRect && activatorEvent && 'clientX' in activatorEvent) {
      const ev = activatorEvent as PointerEvent;
      const w = draggingNodeRect?.width ?? activeNodeRect.width;
      const h = draggingNodeRect?.height ?? activeNodeRect.height;
      return {
        ...transform,
        x: transform.x + (ev.clientX - activeNodeRect.left) - w / 2,
        y: transform.y + (ev.clientY - activeNodeRect.top)  - h / 2,
      };
    }
    return transform;
  }, []);
  const layout  = useMemo(() => buildGridLayout(blocks), [blocks]);

  const updateBlock = useCallback((id: string, patch: Partial<ArticleBlock>) =>
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)), []);
  const removeBlock = useCallback((id: string) =>
    setBlocks(bs => bs.filter(b => b.id !== id)), []);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handlePaletteDrop = useCallback((type: BlockType, x: number, y: number) => {
    const els = document.elementsFromPoint(x, y);
    const ghostEl = els.find(el => el instanceof HTMLElement && (el as HTMLElement).dataset.ghostId) as HTMLElement | undefined;
    if (ghostEl?.dataset.ghostId) {
      const ghostId = ghostEl.dataset.ghostId;
      setBlocks(bs => {
        const currentLayout = buildGridLayout(bs);
        let ghost: GhostCell | undefined;
        for (const row of currentLayout) {
          for (const cell of row) {
            if (cell.kind === 'ghost' && cell.ghost.id === ghostId) { ghost = cell.ghost; break; }
          }
          if (ghost) break;
        }
        const newBlock = makeBlock(type);
        if (!ghost) return [...bs, newBlock];
        const insertAt = Math.max(0, Math.min(ghost.insertBeforeBlockIdx, bs.length));
        return [...bs.slice(0, insertAt), { ...newBlock, span: ghost.span }, ...bs.slice(insertAt)];
      });
    } else {
      setBlocks(bs => [...bs, makeBlock(type)]);
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const overId    = String(over.id);
    const activeId_ = String(active.id);

    if (activeId_ === overId) return;

    // ── Block reorder ─────────────────────────────────────────────────────────
    if (overId.startsWith('ghost-')) {
      setBlocks(bs => {
        const currentLayout = buildGridLayout(bs);
        let ghost: GhostCell | undefined;
        for (const row of currentLayout) {
          for (const cell of row) {
            if (cell.kind === 'ghost' && cell.ghost.id === overId) { ghost = cell.ghost; break; }
          }
          if (ghost) break;
        }
        if (!ghost) return bs;
        const dragIdx = bs.findIndex(b => b.id === activeId_);
        if (dragIdx === -1) return bs;
        const dragged = { ...bs[dragIdx], span: ghost.span };
        const rest = bs.filter((_, i) => i !== dragIdx);
        let insertAt = ghost.insertBeforeBlockIdx;
        if (dragIdx < insertAt) insertAt--;
        insertAt = Math.max(0, Math.min(insertAt, rest.length));
        return [...rest.slice(0, insertAt), dragged, ...rest.slice(insertAt)];
      });
    } else {
      setBlocks(bs => {
        const from = bs.findIndex(b => b.id === activeId_);
        const to   = bs.findIndex(b => b.id === overId);
        if (from === -1 || to === -1) return bs;
        return arrayMove(bs, from, to);
      });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let imageUrl = '';
      if (headerFile) imageUrl = await apiUploadImage(headerFile);
      await onSave({
        category, title: title.trim(), summary: summary.trim(),
        content: JSON.stringify(blocks),
        author: author.trim(), date: date.trim(),
        image: imageUrl, featured: featured ? 1 : 0,
      });
    } catch (e) { console.error(e); setSaving(false); }
  };

  const spanLabel = (s: BlockSpan) => s === 1 ? '1/3' : s === 2 ? '2/3' : 'Ple';
  const activeBlock = blocks.find(b => b.id === activeId);

  const canvasBg: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle, ${isDark ? '#3f3f46' : '#cbd5e1'} 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-zinc-950 flex flex-col anim-fade-in overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors press">
          <ChevronLeft size={18} />
        </button>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Títol de l'article *"
          className="flex-1 text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-zinc-600"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel·lar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg transition-colors press"
          >
            {saving ? 'Desant...' : 'Publicar article'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col overflow-y-auto flex-shrink-0" style={{ width: '272px' }}>
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metadades</p>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
              {['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'].map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea value={summary} onChange={e => setSummary(e.target.value)}
              placeholder="Resum breu (targeta de notícia)" rows={3}
              className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white resize-none" />
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Autor"
              className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input value={date} onChange={e => setDate(e.target.value)} placeholder="Data (ex: 17 abril 2026)"
              className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <div>
              <p className="text-[10px] text-gray-400 mb-1">Imatge de capçalera</p>
              <input type="file" accept="image/*" onChange={e => setHeaderFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-600 dark:text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
              {headerFile && <p className="text-[10px] text-gray-400 mt-1 truncate">{headerFile.name}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFeatured(v => !v)}
                className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", featured ? "bg-red-600" : "bg-gray-200 dark:bg-zinc-700")}>
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform" style={{ transform: featured ? 'translateX(18px)' : 'translateX(2px)' }} />
              </button>
              <span className="text-xs text-gray-600 dark:text-zinc-400">Destacada</span>
            </div>
          </div>
          <div className="p-4 flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Afegir bloc</p>
            <div className="space-y-1.5">
              {RICH_BLOCK_TYPES.map(bt => (
                <PaletteDragItem
                  key={bt.type}
                  bt={bt}
                  onAdd={() => setBlocks(bs => [...bs, makeBlock(bt.type)])}
                  setDragState={setPaletteDrag}
                  onDrop={handlePaletteDrop}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Canvas — DndContext scoped here so overlay coords stay correct */}
        <div className="flex-1 overflow-y-auto p-8" style={canvasBg}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
            <div className="space-y-4">
              {layout.map((row, ri) => (
                <div key={ri} className="grid grid-cols-3 gap-4">
                  {row.map(cell =>
                    cell.kind === 'block'
                      ? activeId === cell.block.id
                        ? <GhostForActiveBlock key={cell.block.id} block={cell.block} activeBlock={activeBlock} />
                        : <DraggableBlockCard key={cell.block.id} block={cell.block} updateBlock={updateBlock} removeBlock={removeBlock} spanLabel={spanLabel} isBeingDragged={false} />
                      : <GhostDropCell key={cell.ghost.id} ghost={cell.ghost} isEmpty={blocks.length === 0} activeBlock={activeBlock} />
                  )}
                </div>
              ))}
            </div>
            <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor as never]}>
              {activeBlock ? <BlockDragPreview block={activeBlock} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Palette drag ghost — follows pointer, pointer-events: none */}
      {paletteDrag && createPortal(
        (() => {
          const bt = RICH_BLOCK_TYPES.find(t => t.type === paletteDrag.type)!;
          return (
            <div
              style={{ position: 'fixed', left: paletteDrag.x - 96, top: paletteDrag.y - 20, zIndex: 99999, pointerEvents: 'none' }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-300 bg-white dark:bg-zinc-900 shadow-2xl w-48 rotate-1 opacity-95"
            >
              <bt.icon size={14} className={bt.color} />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{bt.label}</span>
              <Plus size={13} className="ml-auto text-red-400" />
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}

function NoticiesTab({ currentUser }: { currentUser: User | null }) {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activeFilter, setActiveFilter] = useState('Totes');
  const [newsSearch, setNewsSearch] = useState('');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const isAdmin = currentUser?.role === 'Administrador/a';

  // Create news form state
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showRichBuilder, setShowRichBuilder] = useState(false);
  const [nCategory, setNCategory] = useState('Comunicats interns');
  const [nTitle, setNTitle] = useState('');
  const [nSummary, setNSummary] = useState('');
  const [nContent, setNContent] = useState('');
  const [nAuthor, setNAuthor] = useState('');
  const [nDate, setNDate] = useState('');
  const [nImageFile, setNImageFile] = useState<File | null>(null);
  const [nImage, setNImage] = useState('');
  const [nFeatured, setNFeatured] = useState(false);
  const [nSaving, setNSaving] = useState(false);
  const [showNPicker, setShowNPicker] = useState(false);
  const [nPoolImages, setNPoolImages] = useState<{ url: string; name: string }[]>([]);
  const [loadingNPool, setLoadingNPool] = useState(false);

  // Edit news state
  const [newsEditId, setNewsEditId] = useState<number | null>(null);
  const [neCategory, setNeCategory] = useState('');
  const [neTitle, setNeTitle] = useState('');
  const [neSummary, setNeSummary] = useState('');
  const [neContent, setNeContent] = useState('');
  const [neAuthor, setNeAuthor] = useState('');
  const [neDate, setNeDate] = useState('');
  const [neImage, setNeImage] = useState('');
  const [neImageFile, setNeImageFile] = useState<File | null>(null);
  const [neFeatured, setNeFeatured] = useState(false);
  const [neSaving, setNeSaving] = useState(false);

  const openNewsEdit = (item: NewsArticle) => {
    setNewsEditId(item.id);
    setNeCategory(item.category); setNeTitle(item.title); setNeSummary(item.summary);
    setNeContent(item.content); setNeAuthor(item.author); setNeDate(item.date);
    setNeImage(item.image || ''); setNeImageFile(null); setNeFeatured(item.featured === 1);
  };

  const handleCreateNews = async () => {
    if (!nTitle.trim()) return;
    setNSaving(true);
    try {
      let imageUrl = nImage;
      if (nImageFile) imageUrl = await apiUploadImage(nImageFile);
      await apiCreateNews({ category: nCategory, title: nTitle.trim(), summary: nSummary.trim(),
        content: nContent.trim(), author: nAuthor.trim(), date: nDate.trim(),
        image: imageUrl, featured: nFeatured ? 1 : 0 });
      setNews(await apiGetNews());
      setShowNewsForm(false);
      setNTitle(''); setNSummary(''); setNContent(''); setNAuthor(''); setNDate(''); setNImageFile(null); setNImage(''); setNFeatured(false);
    } catch (e) { console.error(e); }
    finally { setNSaving(false); }
  };

  const handleSaveNewsEdit = async () => {
    if (!newsEditId || !neTitle.trim()) return;
    setNeSaving(true);
    try {
      let imageUrl = neImage;
      if (neImageFile) imageUrl = await apiUploadImage(neImageFile);
      await apiUpdateNews(newsEditId, { category: neCategory, title: neTitle.trim(), summary: neSummary.trim(),
        content: neContent.trim(), author: neAuthor.trim(), date: neDate.trim(),
        image: imageUrl, featured: neFeatured ? 1 : 0 });
      setNews(await apiGetNews());
      setNewsEditId(null); setNeImageFile(null);
    } catch (e) { console.error(e); }
    finally { setNeSaving(false); }
  };

  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleDeleteNews = (id: number) => {
    setConfirmModal({
      message: 'Segur que vols eliminar aquesta notícia? Aquesta acció no es pot desfer.',
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteNews(id); setNews(await apiGetNews()); }
        catch (e) { console.error(e); }
      },
    });
  };

  const [newsLoading, setNewsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    apiGetNews()
      .then(d => { if (!cancelled) setNews(d); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setNewsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = (activeFilter === 'Totes' ? news : news.filter(n => n.category === activeFilter))
    .filter(n => !newsSearch || [n.title, n.summary, n.content, n.author].some(f => f.toLowerCase().includes(newsSearch.toLowerCase())));
  const featuredList = filtered.filter(n => n.featured === 1);
  const featuredItems = featuredList.length > 0 ? featuredList : filtered.slice(0, 1);
  const featured = featuredItems[featuredIndex % Math.max(featuredItems.length, 1)] ?? null;
  const grid = filtered.filter(n => !featuredItems.includes(n));

  if (selectedNews) {
    return (
      <div className={cn("mx-auto", isRichContent(selectedNews.content) ? "max-w-5xl" : "max-w-3xl")}>
        <button
          onClick={() => setSelectedNews(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mb-6"
        >
          {t('news.detail.backToNews')}
        </button>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          {selectedNews.image && (
            <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-72 object-cover" />
          )}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider", NEWS_CAT_COLORS[selectedNews.category] ?? "bg-gray-100 text-gray-600")}>{selectedNews.category}</span>
              <span className="text-xs text-gray-400">{selectedNews.date}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">{selectedNews.title}</h1>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5"><UserCircle size={14} /><span>{selectedNews.author}</span></div>
              <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{selectedNews.date}</span></div>
            </div>
            {selectedNews.summary && <p className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed mb-6 font-medium">{selectedNews.summary}</p>}
            {selectedNews.content && (
              isRichContent(selectedNews.content)
                ? <RichBlockViewer blocks={parseBlocks(selectedNews.content)} />
                : <div className="text-gray-700 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedNews.content}</div>
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
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowRichBuilder(true)} className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-semibold px-3 py-2 rounded-lg hover:border-red-400 hover:text-red-600 transition-colors press">
              <LayoutGrid size={14} /> Article extès
            </button>
            <button onClick={() => setShowNewsForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors press">{t('news.newArticle')}</button>
          </div>
        )}
      </div>
      {isAdmin && showNewsForm && (
        <EditModal title="Nova notícia" onClose={() => setShowNewsForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <select value={nCategory} onChange={e => setNCategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
              {['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="text" value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="Títol *" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <textarea value={nSummary} onChange={e => setNSummary(e.target.value)} placeholder="Resum" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white resize-none" />
            <input type="text" value={nAuthor} onChange={e => setNAuthor(e.target.value)} placeholder="Autor" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="date" value={nDate} onChange={e => setNDate(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-gray-500 dark:text-zinc-400 block">Imatge</label>
              {nImage && <img src={resolveImg(nImage)} alt="" className="h-16 rounded object-cover border border-gray-200 dark:border-zinc-700" />}
              <div className="flex gap-2 items-center">
                <input type="file" accept="image/*" onChange={e => { setNImageFile(e.target.files?.[0] ?? null); setNImage(''); }} className="flex-1 text-sm text-gray-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                <button type="button" onClick={async () => {
                  setShowNPicker(v => !v);
                  if (nPoolImages.length === 0) {
                    setLoadingNPool(true);
                    try { setNPoolImages(await apiGetImages()); } catch { }
                    setLoadingNPool(false);
                  }
                }} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                  📁 Galeria
                </button>
              </div>
              {nImageFile && <p className="text-[10px] text-gray-400">{nImageFile.name}</p>}
              {showNPicker && (
                <div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-3 bg-gray-50 dark:bg-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Galeria d'imatges</span>
                    <button onClick={() => setShowNPicker(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>
                  {loadingNPool ? (
                    <p className="text-xs text-gray-400 text-center py-4">Carregant...</p>
                  ) : nPoolImages.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Cap imatge a la galeria</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {nPoolImages.map(img => (
                        <button key={img.name} type="button" onClick={() => { setNImage(img.url); setNImageFile(null); setShowNPicker(false); }}
                          className={cn("rounded-lg overflow-hidden border-2 transition-colors aspect-square",
                            nImage === img.url ? "border-red-500" : "border-transparent hover:border-red-300"
                          )}>
                          <img src={resolveImg(img.url)} alt={img.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setNFeatured(v => !v)} className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", nFeatured ? "bg-red-600" : "bg-gray-200 dark:bg-zinc-700")}>
                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform" style={{ transform: nFeatured ? 'translateX(18px)' : 'translateX(2px)' }} />
              </button>
              <span className="text-xs text-gray-600 dark:text-zinc-400">Destacada</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewsForm(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel·lar</button>
              <button onClick={handleCreateNews} disabled={!nTitle.trim() || nSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">{nSaving ? 'Desant...' : 'Crear notícia'}</button>
            </div>
          </div>
        </EditModal>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={newsSearch} onChange={e => setNewsSearch(e.target.value)} placeholder={t('news.searchPlaceholder')} className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Totes', 'Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat'].map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>

      {featured && (
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden mb-8">
          <div
            className="flex"
            style={{
              transform: `translateX(-${(featuredIndex % featuredItems.length) * 100}%)`,
              transition: 'transform 550ms cubic-bezier(.23, 1, .32, 1)',
            }}
          >
            {featuredItems.map(item => (
              <div key={item.id} className="min-w-full flex flex-col md:flex-row md:min-h-[360px]">
                <div
                  className="w-full md:w-1/2 h-40 md:h-auto overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer"
                  onClick={() => setSelectedNews(item)}
                >
                  {item.image ? (
                    <img src={resolveImg(item.image)} alt="Featured" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full min-h-[160px] md:min-h-[224px] bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                      <Newspaper size={56} className="text-red-300" />
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-4 md:p-8 flex flex-col justify-center">
                  <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-2 md:mb-4">{item.category}</span>
                  <h2
                    className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4 leading-tight cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => setSelectedNews(item)}
                  >{item.title}</h2>
                  <p className="text-gray-500 dark:text-zinc-400 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5"><UserCircle size={14} /><span>{item.author}</span></div>
                      <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{item.date}</span></div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => newsEditId === item.id ? setNewsEditId(null) : openNewsEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteNews(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Carousel controls — outside slide track, absolute positioned */}
          {featuredItems.length > 1 && !newsEditId && (
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

      {newsLoading && news.length === 0 && (
        <>
          <Skeleton className="w-full h-40 md:h-64 rounded-2xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6" role="status" aria-busy="true" aria-label="Carregant notícies">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        {grid.map((item, i) => (
          <div key={i} className="group hover-lift bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="hidden md:block aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer" onClick={() => setSelectedNews(item)}>
              {item.image ? (
                <img src={resolveImg(item.image)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[600ms] ease-out" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                  <Newspaper size={40} className="text-red-300" />
                </div>
              )}
            </div>
            <div className="p-4 md:p-5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">{item.category}</p>
              <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer" onClick={() => setSelectedNews(item)}>{item.title}</h3>
              <p className="text-[13px] md:text-xs text-gray-500 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">{item.summary}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-1"><UserCircle size={12} /><span>{item.author}</span></div>
                <span>{item.date}</span>
              </div>
              {isAdmin && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button onClick={() => newsEditId === item.id ? setNewsEditId(null) : openNewsEdit(item)} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600 transition-colors"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleDeleteNews(item.id)} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600 transition-colors"><Trash2 size={12} /> Eliminar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showRichBuilder && (
        <RichArticleBuilder
          onSave={async fields => {
            await apiCreateNews(fields);
            setNews(await apiGetNews());
            setShowRichBuilder(false);
          }}
          onCancel={() => setShowRichBuilder(false)}
        />
      )}
      {newsEditId !== null && (
        <EditModal title="Editar notícia" onClose={() => { setNewsEditId(null); setNeImageFile(null); }}>
          <NewsEditForm {...{neCategory,setNeCategory,neTitle,setNeTitle,neSummary,setNeSummary,neAuthor,setNeAuthor,neDate,setNeDate,neImage,setNeImage,neImageFile,setNeImageFile,neFeatured,setNeFeatured,neSaving,onSave:handleSaveNewsEdit,onCancel:()=>{setNewsEditId(null);setNeImageFile(null);}}} />
        </EditModal>
      )}
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}

// ── Activitats Tab ────────────────────────────────────────────────────────────

function ActivitatsTab({ currentUser }: { currentUser: User | null }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('Properes');
  const [activeFilter, setActiveFilter] = useState('Totes');
  const [actSearch, setActSearch] = useState('');
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [enrolledId, setEnrolledId] = useState<number | null>(null);
  const [enrollError, setEnrollError] = useState('');
  const isAdmin = currentUser?.role === 'Administrador/a';

  // New activity form state
  const [showActForm, setShowActForm] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aCategory, setACategory] = useState('Esport');
  const [aDesc, setADesc] = useState('');
  const [aDate, setADate] = useState('');
  const [aTime, setATime] = useState('');
  const [aLocation, setALocation] = useState('');
  const [aCapacity, setACapacity] = useState('');
  const [aSaving, setASaving] = useState(false);

  const handleCreateActivity = async () => {
    if (!aTitle.trim()) return;
    setASaving(true);
    try {
      await apiCreateActivity({ title: aTitle.trim(), category: aCategory, description: aDesc.trim(),
        date: aDate.trim(), time: aTime.trim(), location: aLocation.trim(), capacity: parseInt(aCapacity) || 0 });
      setActivities(await apiGetActivities());
      setShowActForm(false);
      setATitle(''); setADesc(''); setADate(''); setATime(''); setALocation(''); setACapacity('');
    } catch (e) { console.error(e); }
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
  const [aeSaving, setAeSaving] = useState(false);

  const openActEdit = (act: Activity) => {
    setActEditId(act.id);
    setAeTitle(act.title); setAeCategory(act.category); setAeDesc(act.description);
    setAeDate(act.date); setAeTime(act.time); setAeLocation(act.location);
    setAeCapacity(String(act.capacity));
  };

  const handleSaveActEdit = async () => {
    if (!actEditId || !aeTitle.trim()) return;
    setAeSaving(true);
    try {
      await apiUpdateActivity(actEditId, { title: aeTitle.trim(), category: aeCategory,
        description: aeDesc.trim(), date: aeDate.trim(), time: aeTime.trim(),
        location: aeLocation.trim(), capacity: parseInt(aeCapacity) || 0 });
      setActivities(await apiGetActivities());
      setActEditId(null);
    } catch (e) { console.error(e); }
    finally { setAeSaving(false); }
  };

  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleDeleteActivity = (id: number) => {
    setConfirmModal({
      message: 'Segur que vols eliminar aquesta activitat? Aquesta acció no es pot desfer.',
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteActivity(id); setActivities(await apiGetActivities()); }
        catch (e) { console.error(e); }
      },
    });
  };

  const [actLoading, setActLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    apiGetActivities()
      .then(d => { if (!cancelled) setActivities(d); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setActLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const upcoming = activities.filter(a => a.past === 0);
  const past = activities.filter(a => a.past === 1);
  const source = activeTab === 'Properes' ? upcoming : past;
  const filtered = (activeFilter === 'Totes' ? source : source.filter(a => a.category === activeFilter))
    .filter(a => !actSearch || [a.title, a.description, a.location].some(f => f.toLowerCase().includes(actSearch.toLowerCase())));
  const isProperes = activeTab === 'Properes';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">Esdeveniments socials, esportius i culturals per als treballadors de TAVIL</p>
        {isAdmin && <button onClick={() => setShowActForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">+ Nova activitat</button>}
      </div>
      {isAdmin && showActForm && (
        <EditModal title="Nova activitat" onClose={() => setShowActForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <select value={aCategory} onChange={e => setACategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
              {['Esport','Cultura','Social','RSC','Benestar'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={aDate} onChange={e => setADate(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={aTime} onChange={e => setATime(e.target.value)} placeholder="Hora (ex: 10:00)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={aLocation} onChange={e => setALocation(e.target.value)} placeholder="Lloc" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <textarea value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="Descripció" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white resize-none" />
            <input type="number" value={aCapacity} onChange={e => setACapacity(e.target.value)} placeholder="Aforament (0 = il·limitat)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <div className="flex justify-end gap-2 items-center">
              <button onClick={() => setShowActForm(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel·lar</button>
              <button onClick={handleCreateActivity} disabled={!aTitle.trim() || aSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">{aSaving ? 'Desant...' : 'Crear activitat'}</button>
            </div>
          </div>
        </EditModal>
      )}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-5">
        {[`Properes (${upcoming.length})`, `Passades (${past.length})`].map(tab => {
          const key = tab.split(' ')[0];
          return <UnderlineTab key={tab} label={tab} active={activeTab === key} onClick={() => { setActiveTab(key); setActiveFilter('Totes'); setActSearch(''); }} />;
        })}
      </div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={actSearch} onChange={e => setActSearch(e.target.value)} placeholder="Cercar activitats..." className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white w-56" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Totes', 'Esport', 'Cultura', 'Social', 'RSC', 'Benestar'].map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>
      {actLoading && activities.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" role="status" aria-busy="true" aria-label="Carregant activitats">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}
      <div key={`${activeTab}-${activeFilter}`} className="grid grid-cols-1 md:grid-cols-2 gap-5 anim-tab">
        {filtered.map((act, i) => {
          const available = act.capacity > 0 ? act.capacity - act.enrolled : 0;
          return (
          <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{act.category}</span>
              {isProperes
                ? <span className="text-[11px] font-bold text-white bg-red-600 px-2.5 py-0.5 rounded">Inscripció oberta</span>
                : <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded">Finalitzada</span>}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{act.title}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed">{act.description}</p>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><Calendar size={13} /><span>{act.date}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><Clock size={13} /><span>{act.time}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><MapPin size={13} /><span>{act.location}</span></div>
            </div>
            <div className={isProperes ? "mb-4" : ""}>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="flex items-center gap-1"><Users size={11} />{act.enrolled} / {act.capacity} places</span>
                {isProperes && act.capacity > 0 && <span className="text-green-600 font-medium">{available} disponibles</span>}
              </div>
              <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div className={cn("h-1.5 rounded-full", isProperes ? "bg-red-500" : "bg-gray-400 dark:bg-zinc-600")} style={{ width: `${act.capacity > 0 ? (act.enrolled / act.capacity) * 100 : 0}%` }} />
              </div>
            </div>
            {isProperes && (
              <button onClick={() => { setSelectedAct(act); setEnrolledId(null); setEnrollError(''); }} className="text-red-600 text-sm font-medium flex items-center gap-1 hover:underline mt-4">
                Veure detalls i inscriure's <ArrowRight size={14} />
              </button>
            )}
            {isAdmin && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button onClick={() => actEditId === act.id ? setActEditId(null) : openActEdit(act)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"><Pencil size={12} /> Editar</button>
                <button onClick={() => handleDeleteActivity(act.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"><Trash2 size={12} /> Eliminar</button>
              </div>
            )}
          </div>
          );
        })}
      </div>
      {selectedAct && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 anim-fade-in" onClick={() => setSelectedAct(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 w-full max-w-md mx-4 shadow-xl anim-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{selectedAct.category}</span>
              <button onClick={() => setSelectedAct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 text-sm px-1">✕</button>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{selectedAct.title}</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed">{selectedAct.description}</p>
            <div className="space-y-2 mb-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><Calendar size={13} /><span>{selectedAct.date}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><Clock size={13} /><span>{selectedAct.time}</span></div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><MapPin size={13} /><span>{selectedAct.location}</span></div>
            </div>
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span className="flex items-center gap-1"><Users size={11} />{selectedAct.enrolled} / {selectedAct.capacity} places</span>
                {selectedAct.capacity > 0 && <span className="text-green-600 font-medium">{Math.max(0, selectedAct.capacity - selectedAct.enrolled)} disponibles</span>}
              </div>
              <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${selectedAct.capacity > 0 ? Math.min((selectedAct.enrolled / selectedAct.capacity) * 100, 100) : 0}%` }} />
              </div>
            </div>
            {enrollError && <p className="text-red-500 text-xs mb-3">{enrollError}</p>}
            <button
              onClick={async () => {
                setEnrollError('');
                try {
                  await apiEnrollActivity(selectedAct.id);
                  setEnrolledId(selectedAct.id);
                  setActivities(await apiGetActivities());
                } catch (e: any) {
                  setEnrollError(e.message ?? 'Error en la inscripció');
                }
              }}
              disabled={enrolledId === selectedAct.id || (selectedAct.capacity > 0 && selectedAct.enrolled >= selectedAct.capacity)}
              className="press w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              {enrolledId === selectedAct.id ? '✓ Inscrit!' : selectedAct.capacity > 0 && selectedAct.enrolled >= selectedAct.capacity ? 'Activitat completa' : "Inscriure's"}
            </button>
          </div>
        </div>,
        document.body
      )}
      {actEditId !== null && (
        <EditModal title="Editar activitat" onClose={() => setActEditId(null)}>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={aeTitle} onChange={e => setAeTitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <select value={aeCategory} onChange={e => setAeCategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
              {['Esport','Cultura','Social','RSC','Benestar'].map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" value={aeCapacity} onChange={e => setAeCapacity(e.target.value)} placeholder="Aforament" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="date" value={aeDate} onChange={e => setAeDate(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={aeTime} onChange={e => setAeTime(e.target.value)} placeholder="Hora" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={aeLocation} onChange={e => setAeLocation(e.target.value)} placeholder="Lloc" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <textarea value={aeDesc} onChange={e => setAeDesc(e.target.value)} placeholder="Descripció" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white resize-none" />
            <div className="col-span-2 flex justify-end gap-2">
              <button onClick={() => setActEditId(null)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">Cancel·lar</button>
              <button onClick={handleSaveActEdit} disabled={!aeTitle.trim() || aeSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{aeSaving ? 'Desant...' : 'Desar'}</button>
            </div>
          </div>
        </EditModal>
      )}
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}

// ── Agenda Tab ────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  "Sessió interna":    "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  "Festiu":            "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  "Activitat empresa": "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  "Visita comercial":  "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "Fira":              "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
};

const MONTH_NAMES = ['', 'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
const MONTH_ABBR: Record<number, string> = { 1: 'GEN', 2: 'FEB', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN', 7: 'JUL', 8: 'AGO', 9: 'SET', 10: 'OCT', 11: 'NOV', 12: 'DES' };

function AgendaTab({ currentUser, initDate, onInitDateConsumed }: { currentUser: User | null; initDate: { day: number; month: number; year: number } | null; onInitDateConsumed: () => void }) {
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [activeFilter, setActiveFilter] = useState('Tots');
  const today0 = new Date();
  const [currentMonth, setCurrentMonth] = useState(today0.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today0.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const isAdmin = currentUser?.role === 'Administrador/a';

  useEffect(() => {
    if (initDate) {
      setCurrentMonth(initDate.month);
      setCurrentYear(initDate.year);
      setSelectedDay(initDate.day);
      setView('calendar');
      onInitDateConsumed();
    }
  }, [initDate, onInitDateConsumed]);

  // New event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eTitle, setETitle] = useState('');
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('');
  const [eLocation, setELocation] = useState('');
  const [eType, setEType] = useState('Sessió interna');
  const [eSaving, setESaving] = useState(false);

  const handleCreateEvent = async () => {
    if (!eTitle.trim() || !eDate) return;
    const [, mStr, dStr] = eDate.split('-');
    const day = parseInt(dStr); const month = parseInt(mStr);
    if (!day || !month) return;
    setESaving(true);
    try {
      await apiCreateAgendaEvent({ title: eTitle.trim(), day, month,
        time: eTime.trim(), location: eLocation.trim(), type: eType });
      setAgendaEvents(await apiGetAgendaEvents());
      setShowEventForm(false);
      setETitle(''); setEDate(''); setETime(''); setELocation('');
    } catch (e) { console.error(e); }
    finally { setESaving(false); }
  };

  // Edit event state
  const [evEditId, setEvEditId] = useState<number | null>(null);
  const [eeTitle, setEeTitle] = useState('');
  const [eeDate, setEeDate] = useState('');
  const [eeTime, setEeTime] = useState('');
  const [eeLocation, setEeLocation] = useState('');
  const [eeType, setEeType] = useState('Sessió interna');
  const [eeSaving, setEeSaving] = useState(false);

  const openEvEdit = (ev: AgendaEvent) => {
    setEvEditId(ev.id); setEeTitle(ev.title);
    const yyyy = String(currentYear);
    const mm = String(ev.month).padStart(2, '0');
    const dd = String(ev.day).padStart(2, '0');
    setEeDate(`${yyyy}-${mm}-${dd}`);
    setEeTime(ev.time || '');
    setEeLocation(ev.location || ''); setEeType(ev.type);
  };

  const handleSaveEvEdit = async () => {
    if (!evEditId || !eeTitle.trim() || !eeDate) return;
    const [, mStr, dStr] = eeDate.split('-');
    const day = parseInt(dStr); const month = parseInt(mStr);
    if (!day || !month) return;
    setEeSaving(true);
    try {
      await apiUpdateAgendaEvent(evEditId, { title: eeTitle.trim(), day,
        month, time: eeTime.trim(), location: eeLocation.trim(), type: eeType });
      setAgendaEvents(await apiGetAgendaEvents());
      setEvEditId(null);
    } catch (e) { console.error(e); }
    finally { setEeSaving(false); }
  };

  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleDeleteEvent = (id: number) => {
    setConfirmModal({
      message: 'Segur que vols eliminar aquest event? Aquesta acció no es pot desfer.',
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteAgendaEvent(id); setAgendaEvents(await apiGetAgendaEvents()); }
        catch (e) { console.error(e); }
      },
    });
  };

  useEffect(() => {
    apiGetAgendaEvents().then(setAgendaEvents).catch(console.error);
  }, []);

  const navigateMonth = (dir: 1 | -1) => {
    setCurrentMonth(m => {
      const nm = m + dir;
      if (nm > 12) { setCurrentYear(y => y + 1); return 1; }
      if (nm < 1) { setCurrentYear(y => y - 1); return 12; }
      return nm;
    });
  };

  const filters = ['Tots', 'Festiu', 'Fira', 'Visita comercial', 'Sessió interna', 'Activitat empresa'];

  const filteredEvents = activeFilter === 'Tots'
    ? agendaEvents
    : agendaEvents.filter(e => e.type === activeFilter);

  // Build calendar cell events map for the current month
  const calendarEvents: Record<number, AgendaEvent[]> = {};
  filteredEvents.filter(e => e.month === currentMonth && e.id !== undefined).forEach(e => {
    if (!calendarEvents[e.day]) calendarEvents[e.day] = [];
    calendarEvents[e.day].push(e);
  });

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const days = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
  const cells: (number | null)[] = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">Calendari d'esdeveniments i dates importants</p>
        {isAdmin && <button onClick={() => setShowEventForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">+ Nou event</button>}
      </div>
      {isAdmin && showEventForm && (
        <EditModal title="Nou event" onClose={() => setShowEventForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="date" value={eDate} onChange={e => setEDate(e.target.value)} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={eTime} onChange={e => setETime(e.target.value)} placeholder="Hora (ex: 10:00)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={eLocation} onChange={e => setELocation(e.target.value)} placeholder="Lloc" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
            <select value={eType} onChange={e => setEType(e.target.value)} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
              {Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}
            </select>
            <div className="col-span-2 flex justify-end gap-2 items-center">
              <button onClick={() => setShowEventForm(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel·lar</button>
              <button onClick={handleCreateEvent} disabled={!eTitle.trim() || !eDate || eSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">{eSaving ? 'Desant...' : 'Crear event'}</button>
            </div>
          </div>
        </EditModal>
      )}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex gap-2 overflow-x-auto flex-nowrap md:flex-wrap scrollbar-hide -mx-1 px-1 flex-1 min-w-0">
          {filters.map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
        <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
          <button onClick={() => setView('calendar')} className={cn("flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors", view === 'calendar' ? "bg-red-600 text-white" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
            <Calendar size={15} /> Calendari
          </button>
          <button onClick={() => setView('list')} className={cn("flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors", view === 'list' ? "bg-red-600 text-white" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
            <List size={15} /> Llista
          </button>
        </div>
      </div>

      <div key={view} className="anim-tab">
      {view === 'calendar' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-3 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft size={18} className="text-gray-500" /></button>
            <h3 className="font-bold text-gray-900 dark:text-white">{MONTH_NAMES[currentMonth]} {currentYear}</h3>
            <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight size={18} className="text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-7">
            {days.map(d => (
              <div key={d} className="px-1 md:px-2 py-2 text-center text-[10px] md:text-xs font-semibold text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800">{d}</div>
            ))}
            {cells.map((day, i) => {
              const isSel = day !== null && selectedDay === day;
              const dayEvents = day !== null ? (calendarEvents[day] || []) : [];
              const maxChipsMobile = 1;
              return (
                <div
                  key={i}
                  onClick={() => day !== null && setSelectedDay(day === selectedDay ? null : day)}
                  className={cn(
                    "min-h-[56px] md:min-h-[80px] p-1 md:p-1.5 border-b border-r border-gray-50 dark:border-zinc-800/50 transition-colors",
                    day !== null && "cursor-pointer hover:bg-red-50/60 dark:hover:bg-red-950/20",
                    day !== null && isToday(day) && "bg-red-50/50 dark:bg-red-950/10",
                    isSel && "ring-2 ring-inset ring-red-500 bg-red-50 dark:bg-red-950/30"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn("text-[11px] md:text-xs font-medium w-5 md:w-6 h-5 md:h-6 flex items-center justify-center rounded-full mb-0.5 md:mb-1", isToday(day) ? "bg-red-600 text-white" : isSel ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold" : "text-gray-700 dark:text-zinc-300")}>{day}</span>
                      <div className="hidden md:block">
                        {dayEvents.map((ev, j) => (
                          <div key={j} className={cn("text-[10px] px-1.5 py-0.5 rounded truncate mb-0.5 font-medium", EVENT_COLORS[ev.type])}>{ev.title}</div>
                        ))}
                      </div>
                      <div className="md:hidden">
                        {dayEvents.slice(0, maxChipsMobile).map((ev, j) => (
                          <div key={j} className={cn("text-[9px] px-1 py-0.5 rounded truncate font-medium", EVENT_COLORS[ev.type])}>{ev.title}</div>
                        ))}
                        {dayEvents.length > maxChipsMobile && (
                          <div className="text-[9px] px-1 text-gray-500 dark:text-zinc-400 font-medium">+{dayEvents.length - maxChipsMobile}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {selectedDay !== null && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                  {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}
                </h4>
                <button onClick={() => setSelectedDay(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">Tancar</button>
              </div>
              {(calendarEvents[selectedDay] || []).length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 italic">No hi ha esdeveniments aquest dia.</p>
              ) : (
                <div className="space-y-2">
                  {(calendarEvents[selectedDay] || []).map((ev, j) => (
                    <div key={j} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800">
                      <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0", EVENT_COLORS[ev.type])}>{ev.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{ev.title}</p>
                        {(ev.time || ev.location) && (
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                            {ev.time && <span className="flex items-center gap-1"><Clock size={11} />{ev.time}</span>}
                            {ev.location && <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>}
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => evEditId === ev.id ? setEvEditId(null) : openEvEdit(ev)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-12">No hi ha esdeveniments per a aquest filtre.</p>
          )}
          {filteredEvents.map((ev, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-red-50 dark:bg-red-950/20 flex-shrink-0">
                  <span className="text-red-600 font-bold text-lg leading-none">{ev.day}</span>
                  <span className="text-red-400 text-[10px] font-bold uppercase">{MONTH_ABBR[ev.month] ?? ev.month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{ev.title}</p>
                  {ev.time && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1"><Clock size={11} />{ev.time}</span>
                      {ev.location && <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>}
                    </div>
                  )}
                </div>
                <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0", EVENT_COLORS[ev.type])}>{ev.type}</span>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => evEditId === ev.id ? setEvEditId(null) : openEvEdit(ev)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      {evEditId !== null && (
        <EditModal title="Editar event" onClose={() => setEvEditId(null)}>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={eeTitle} onChange={e => setEeTitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="date" value={eeDate} onChange={e => setEeDate(e.target.value)} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={eeTime} onChange={e => setEeTime(e.target.value)} placeholder="Hora" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <input type="text" value={eeLocation} onChange={e => setEeLocation(e.target.value)} placeholder="Lloc" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
            <select value={eeType} onChange={e => setEeType(e.target.value)} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
              {Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}
            </select>
            <div className="col-span-2 flex justify-end gap-2">
              <button onClick={() => setEvEditId(null)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">Cancel·lar</button>
              <button onClick={handleSaveEvEdit} disabled={!eeTitle.trim() || !eeDate || eeSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{eeSaving ? 'Desant...' : 'Desar'}</button>
            </div>
          </div>
        </EditModal>
      )}
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}

// ── Directori Tab ─────────────────────────────────────────────────────────────

const DEPT_ORDER = ['Comercial', 'Compres', 'Direcció', 'Enginyeria', 'Màrqueting', 'Operacions', 'Producció', 'Recursos humans', 'Sistemes', 'Qualitat'];

function DirectoriTab() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tots');
  const [dirSearch, setDirSearch] = useState('');
  const [view, setView] = useState<'graella' | 'departaments'>('graella');

  useEffect(() => {
    apiGetEmployees().then(setEmployees).catch(console.error);
  }, []);

  const filtered = (activeFilter === 'Tots' ? employees : employees.filter(e => e.dept === activeFilter))
    .filter(e => !dirSearch || [e.name, e.role, e.email, e.ext].some(f => f.toLowerCase().includes(dirSearch.toLowerCase())));

  const grouped = DEPT_ORDER.reduce((acc, dept) => {
    const members = filtered.filter(e => e.dept === dept);
    if (members.length > 0) acc[dept] = members;
    return acc;
  }, {} as Record<string, Employee[]>);

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('directory.subtitle')}</p>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={dirSearch} onChange={e => setDirSearch(e.target.value)} placeholder="Cercar..." className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white w-40" />
          </div>
          <div className="flex flex-wrap gap-2">
            {['Tots', ...DEPT_ORDER].map(f => (
              <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
            ))}
          </div>
        </div>
        <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
          <button onClick={() => setView('graella')} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors", view === 'graella' ? "bg-red-600 text-white" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
            <LayoutGrid size={14} /> {t('directory.grid')}
          </button>
          <button onClick={() => setView('departaments')} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors", view === 'departaments' ? "bg-red-600 text-white" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
            <Users size={14} /> {t('directory.departments')}
          </button>
        </div>
      </div>

      <div key={view} className="anim-tab">
      {view === 'graella' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((emp, i) => (
            <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0", emp.color)}>{emp.initials}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{emp.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{emp.role}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded">{emp.dept}</span>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-zinc-400"><Mail size={11} className="flex-shrink-0" /><span className="truncate">{emp.email}</span></div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-zinc-400"><Phone size={11} className="flex-shrink-0" /><span>{emp.phone}</span></div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-zinc-400"><span className="font-medium">Ext.</span><span>{emp.ext}</span></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dept, members]) => (
            <div key={dept}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-red-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{dept}</h3>
                <span className="text-xs text-gray-400 font-medium">({members.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {members.map((emp, i) => (
                  <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-3 flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", emp.color)}>{emp.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{emp.role}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 font-medium whitespace-nowrap">Ext. {emp.ext}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

// ── Espai Corporatiu Tab ──────────────────────────────────────────────────────

const ESPAI_CATS = [
  {
    icon: FileText, iconColor: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20",
    title: "Manual del treballador i protocols", desc: "Guies d'acollida, normativa interna i protocols operatius", docs: 4,
    filters: ['Tots', 'Acollida', 'Normativa'],
    documents: [
      { title: "Protocol d'acollida (onboarding)", desc: "Guia completa per als nous treballadors amb tota la informació necessària.", tag: "Acollida", meta: "PDF · 2.4 MB", views: 342 },
      { title: "Reglament de règim intern", desc: "Normativa interna que regula la convivència, els horaris i els permisos.", tag: "Normativa", meta: "PDF · 1.8 MB", views: 518 },
      { title: "Guia de seguretat i prevenció de riscos", desc: "Manual de prevenció de riscos laborals per a les instal·lacions de TAVIL.", tag: "Normativa", meta: "PDF · 3.1 MB", views: 287 },
      { title: "Guia d'ús dels espais comuns", desc: "Normes per a la utilització de les sales de reunions i zones comunes.", tag: "Acollida", meta: "PDF · 0.6 MB", views: 143 },
    ],
  },
  {
    icon: Shield, iconColor: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20",
    title: "Polítiques internes", desc: "Normatives, polítiques de viatge, despeses i compliance", docs: 5,
    filters: ['Tots', 'Viatges', 'Conducta', 'RRHH'],
    documents: [
      { title: "Política de viatges corporatius", desc: "Normes per a la reserva de viatges, allotjaments i dietes.", tag: "Viatges", meta: "PDF · 0.9 MB", views: 195 },
      { title: "Codi de conducta TAVIL", desc: "Valors, comportaments esperats i límits ètics de l'empresa.", tag: "Conducta", meta: "PDF · 1.1 MB", views: 320 },
      { title: "Política de protecció de dades", desc: "Tractament de dades personals d'empleats i clients.", tag: "Conducta", meta: "PDF · 0.7 MB", views: 210 },
      { title: "Pla d'igualtat", desc: "Mesures per garantir la igualtat de tracte i oportunitats.", tag: "RRHH", meta: "PDF · 2.0 MB", views: 178 },
      { title: "Política de despeses", desc: "Procediment per a la justificació de despeses professionals.", tag: "Viatges", meta: "PDF · 0.5 MB", views: 244 },
    ],
  },
  {
    icon: BookOpen, iconColor: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20",
    title: "Manuals tècnics", desc: "Documentació de producte, seguretat i procediments tècnics", docs: 3,
    filters: ['Tots', 'Sistemes', 'Producte'],
    documents: [
      { title: "Manual de connexió a la xarxa interna", desc: "Guia pas a pas per connectar-se a la VPN, el correu corporatiu i les eines internes.", tag: "Sistemes", meta: "PDF · 1.3 MB", views: 467 },
      { title: "Manual d'ús de l'ERP", desc: "Guia d'usuari del sistema ERP per a la gestió de comandes, inventari i facturació.", tag: "Sistemes", meta: "PDF · 4.2 MB", views: 234 },
      { title: "Guia tècnica de producte: ancoratges", desc: "Especificacions tècniques, aplicacions i normativa dels ancoratges TAVIL.", tag: "Producte", meta: "PDF · 5.8 MB", views: 178 },
    ],
  },
  {
    icon: Building2, iconColor: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20",
    title: "Identitat corporativa i plantilles", desc: "Recursos gràfics, plantilles de presentació i dossiers", docs: 5,
    filters: ['Tots', 'Plantilles', 'Marca'],
    documents: [
      { title: "Plantilla de presentació corporativa", desc: "Plantilla PowerPoint amb la identitat visual de TAVIL per a presentacions.", tag: "Plantilles", meta: "PPTX · 3.5 MB", views: 534 },
      { title: "Plantilla de dossier comercial", desc: "Plantilla Word per a la creació de dossiers i propostes comercials.", tag: "Plantilles", meta: "DOCX · 2.1 MB", views: 298 },
      { title: "Manual d'identitat visual", desc: "Guia d'ús del logotip, colors, tipografia i aplicacions de la marca TAVIL.", tag: "Marca", meta: "PDF · 6.2 MB", views: 412 },
      { title: "Pack de recursos gràfics", desc: "Logotips en diversos formats, icones, fotografies corporatives i elements gràfics.", tag: "Marca", meta: "ZIP · 45 MB", views: 189 },
      { title: "Signatura i plantilla de correu", desc: "Signatura oficial electrònica i plantilla per a comunicats interns.", tag: "Plantilles", meta: "HTML · 0.2 MB", views: 378 },
    ],
  },
];

function EspaiCorporatiuTab() {
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState('Tots');
  const [espaiSearch, setEspaiSearch] = useState('');

  const handleSelectCat = (i: number) => {
    if (selectedCat === i) { setSelectedCat(null); setCatFilter('Tots'); }
    else { setSelectedCat(i); setCatFilter('Tots'); }
  };

  const cat = selectedCat !== null ? ESPAI_CATS[selectedCat] : null;
  const visibleDocs = cat
    ? (catFilter === 'Tots' ? cat.documents : cat.documents.filter(d => d.tag === catFilter))
        .filter(d => !espaiSearch || d.title.toLowerCase().includes(espaiSearch.toLowerCase()))
    : [];
  const espaiSearchResults = espaiSearch && !cat
    ? ESPAI_CATS.flatMap(c => c.documents
        .filter(d => d.title.toLowerCase().includes(espaiSearch.toLowerCase()))
        .map(d => ({ ...d, catTitle: c.title })))
    : [];

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">Base de coneixement intern, documentació i recursos corporatius</p>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" value={espaiSearch} onChange={e => setEspaiSearch(e.target.value)} placeholder="Cercar documents, polítiques, plantilles..." className="w-full max-w-lg bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm outline-none dark:text-white" />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {ESPAI_CATS.map((c, i) => (
          <div
            key={i}
            onClick={() => handleSelectCat(i)}
            className={cn(
              "hover-lift bg-white dark:bg-zinc-900 rounded-xl border-2 p-5 cursor-pointer group",
              selectedCat === i ? "border-red-500 shadow-md" : "border-gray-100 dark:border-zinc-800"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", c.bg)}>
              <c.icon size={20} className={c.iconColor} />
            </div>
            <h3 className={cn("font-semibold text-sm mb-2 transition-colors", selectedCat === i ? "text-red-600" : "text-gray-900 dark:text-white group-hover:text-red-600")}>{c.title}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 leading-relaxed">{c.desc}</p>
            <p className="text-[11px] text-gray-400 font-medium">{c.docs} documents</p>
          </div>
        ))}
      </div>

      {cat ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-3 mb-4">
            {cat.filters.map(f => (
              <FilterChip key={f} label={f} active={catFilter === f} onClick={() => setCatFilter(f)} />
            ))}
            <span className="ml-auto text-sm text-gray-500 dark:text-zinc-400">{visibleDocs.length} documents trobats</span>
          </div>
          <div className="space-y-1">
            {visibleDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <FileText size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{doc.title}</p>
                  <p className="text-xs text-gray-400 truncate">{doc.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{doc.meta} · {doc.views} visualitzacions</p>
                </div>
                <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-700 text-gray-500 px-2 py-0.5 rounded">{doc.tag}</span>
                <Download size={14} className="text-gray-300 group-hover:text-red-600 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} className="text-amber-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Documents destacats</h3>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{doc.title}</p>
                  <p className="text-xs text-gray-400 truncate">{doc.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{doc.meta}</p>
                </div>
                <Download size={14} className="text-gray-300 group-hover:text-red-600 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Campus TAVIL Tab ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "En curs":   "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  "Pendent":   "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "Completat": "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
};

function CampusTavilTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState('Resum');
  const [topicFilter, setTopicFilter] = useState('Tots els temes');
  const [statusFilter, setStatusFilter] = useState('Tots els estats');
  const [campusSearch, setCampusSearch] = useState('');

  useEffect(() => {
    apiGetCourses().then(setCourses).catch(console.error);
  }, []);

  const completed = courses.filter(c => c.user_status === 'Completat');
  const pending = courses.filter(c => c.user_status === 'Pendent');
  const completedHours = completed.reduce((s, c) => s + (parseInt(c.hours) || 0), 0);
  const mandatoryPending = courses.find(c => !!c.mandatory && c.user_status === 'Pendent');

  const topics = ['Tots els temes', 'Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Acollida', 'Producció', 'Habilitats', 'Idiomes'];
  const statuses = ['Tots els estats', 'Pendent', 'Completat'];

  const filteredCourses = courses.filter(c => {
    const matchTopic = topicFilter === 'Tots els temes' || c.category === topicFilter;
    const matchStatus = statusFilter === 'Tots els estats' || c.user_status === statusFilter;
    const matchSearch = !campusSearch || [c.title, c.description, c.category].some(f => f.toLowerCase().includes(campusSearch.toLowerCase()));
    return matchTopic && matchStatus && matchSearch;
  });

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Plataforma de formació interna i desenvolupament professional</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Resum', 'Catàleg', 'El meu progrés', 'Recursos'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      <div key={activeTab} className="anim-tab">
      {activeTab === 'Resum' && (
        <>
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
            {[
              { label: "Cursos completats", value: String(completed.length), icon: CheckCircle, color: "text-green-500" },
              { label: "Pendents", value: String(pending.length), icon: Clock, color: "text-orange-500" },
              { label: "Hores completades", value: `${completedHours}h`, icon: ActivityIcon, color: "text-purple-500" },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500 dark:text-zinc-400">{stat.label}</p><stat.icon size={15} className={stat.color} /></div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
          {mandatoryPending && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 mb-5">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle size={15} className="text-orange-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Formació obligatòria pendent</h3></div>
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{mandatoryPending.title}</p>
                  <div className="flex items-center gap-3 mt-1"><span className="text-xs text-gray-500">{mandatoryPending.hours} · {mandatoryPending.category}</span><span className="text-[10px] font-bold bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded">Obligatòria</span></div>
                </div>
                <button onClick={() => { if (mandatoryPending.url) { window.open(mandatoryPending.url, '_blank', 'noopener,noreferrer'); } else { setActiveTab('Catàleg'); setCampusSearch(mandatoryPending.title); } }} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">Fer curs</button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'Catàleg' && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={campusSearch} onChange={e => setCampusSearch(e.target.value)} placeholder="Cercar cursos..." className="w-full max-w-md bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {topics.map(t => <FilterChip key={t} label={t} active={topicFilter === t} onClick={() => setTopicFilter(t)} />)}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {statuses.map(s => <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCourses.map((course, i) => (
              <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{course.category}</span>
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", STATUS_COLORS[course.user_status])}>{course.user_status}</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{course.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 leading-relaxed line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2"><Clock size={12} /><span>{course.hours}</span>{!!course.mandatory && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">Obligatòria</span>}</div>
                {!!course.cert && <div className="flex items-center gap-1 text-[11px] text-green-600"><Award size={12} /><span>Certificat disponible</span></div>}
                {course.user_progress > 0 && course.user_progress < 100 && (
                  <><div className="flex justify-between text-xs text-gray-500 mt-3 mb-1"><span>Progrés</span><span>{course.user_progress}%</span></div><div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${course.user_progress}%` }} /></div></>
                )}
                {course.url && (
                  <button onClick={() => window.open(course.url, '_blank', 'noopener,noreferrer')} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 rounded-lg transition-colors">
                    <ExternalLink size={12} /> Obrir curs
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'El meu progrés' && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Resum del meu progrés</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[{ label: "Completats", value: String(completed.length), icon: CheckCircle, color: "text-green-500" }, { label: "Hores formació", value: `${completedHours}h`, icon: Clock, color: "text-purple-500" }].map((s, i) => (
                <div key={i}><p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></div>
              ))}
            </div>
          </div>
          {['Pendents', 'Completats'].map(group => {
            const items = courses.filter(c => {
              if (group === 'Pendents') return c.user_status === 'Pendent';
              return c.user_status === 'Completat';
            });
            return (
              <div key={group} className="mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  {group}
                  <span className="text-[11px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">{items.length}</span>
                </h3>
                {items.length > 0 ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 divide-y divide-gray-50 dark:divide-zinc-800">
                    {items.map((c, i) => (
                      <div key={i} className="flex items-center gap-4 p-4">
                        <GraduationCap size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.title}</p>
                          <p className="text-xs text-gray-500">{c.hours} · {c.category}{!!c.mandatory ? ' · ' : ''}{!!c.mandatory && <span className="text-orange-500 font-medium">Obligatòria</span>}</p>
                          {c.user_progress > 0 && c.user_progress < 100 && <div className="flex items-center gap-2 mt-1.5"><div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${c.user_progress}%` }} /></div><span className="text-[10px] text-gray-500">{c.user_progress}%</span></div>}
                        </div>
                        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0", STATUS_COLORS[c.user_status])}>{c.user_status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Cap curs en aquest estat.</p>
                )}
              </div>
            );
          })}
        </>
      )}

      {activeTab === 'Recursos' && (
        <>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Biblioteca de recursos complementaris per a l'aprenentatge.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: "pdf", title: "Guia ràpida d'EPI", desc: "Referència visual dels equips de protecció individual.", tags: ["Seguretat", "Infografia"] },
              { type: "video", title: "Vídeo: procediment d'evacuació", desc: "Simulacre d'evacuació de la planta de Mollet enregistrat.", tags: ["Seguretat", "Vídeo"] },
              { type: "pdf", title: "Checklist d'auditoria interna", desc: "Llista de verificació per a auditories internes ISO 9001.", tags: ["Qualitat", "PDF"] },
              { type: "pdf", title: "Guia ràpida SAP: comandes de venda", desc: "Pas a pas per crear una comanda de venda a l'ERP.", tags: ["Sistemes", "PDF"] },
              { type: "pdf", title: "Glossari de termes comercials", desc: "Termes habituals en la relació amb clients i distribuïdors.", tags: ["Comercial", "PDF"] },
              { type: "pdf", title: "Infografia RGPD: drets dels treballadors", desc: "Resum visual dels drets en matèria de protecció de dades.", tags: ["Compliance", "Infografia"] },
              { type: "video", title: "Vídeo: benvinguda a TAVIL", desc: "Vídeo corporatiu de presentació per a noves incorporacions.", tags: ["Acollida", "Vídeo"] },
              { type: "pdf", title: "Metodologia 5S – resum", desc: "Resum dels principis 5S aplicats a la planta de TAVIL.", tags: ["Producció", "PDF"] },
            ].map((r, i) => (
              <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-4">
                  {r.type === 'video' ? <Video size={18} className="text-red-500" /> : <FileText size={18} className="text-red-500" />}
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2 group-hover:text-red-600 transition-colors">{r.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 leading-relaxed">{r.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((t, j) => <span key={j} className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

// ── Veu de l'Empleat Tab ──────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0", on ? "bg-red-600" : "bg-gray-200 dark:bg-zinc-700")}>
      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform" style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  );
}

function VeuEmpleatTab({ currentUser, initialSubTab, onSubTabConsumed }: { currentUser: User | null; initialSubTab?: string | null; onSubTabConsumed?: () => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialSubTab ?? 'Suggeriments');

  useEffect(() => {
    if (initialSubTab) { setActiveTab(initialSubTab); onSubTabConsumed?.(); }
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

  const isRrhhOrAdmin = currentUser?.role === 'Administrador/a' || currentUser?.role === 'Recursos humans';

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

  const handleRespondre = async (id: number) => {
    try {
      await apiRespondreEnquesta(id);
      const updated = await apiGetEnquestes();
      setEnquestes(updated);
    } catch (e) {
      console.error('Error responding enquesta:', e);
      alert(e instanceof Error ? e.message : 'Error en respondre l\'enquesta');
    }
  };

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
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusTagColor(sug.status))}>{sug.status}</span>
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
              <p className="text-[11px] text-red-600">L'equip de persones revisa els suggeriments setmanalment.</p>
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
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", incStatusColor(inc.status))}>{inc.status}</span>
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


function SolicitudsTab({ currentUser, onNotifChange, initialSubTab, onSubTabConsumed }: { currentUser: User | null; onNotifChange?: () => void; initialSubTab?: string | null; onSubTabConsumed?: () => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialSubTab ?? 'Dies no ordinaris');

  useEffect(() => {
    if (initialSubTab) { setActiveTab(initialSubTab); onSubTabConsumed?.(); }
  }, [initialSubTab]);
  const [diesNoOrdinaris, setDiesNoOrdinaris] = useState<Solicitud[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [denyingId, setDenyingId] = useState<number | null>(null);
  const [denyMotive, setDenyMotive] = useState('');

  // Vacances state
  const [vacSubTab, setVacSubTab] = useState<'sol' | 'info'>('sol');
  const [vacances, setVacances] = useState<Vacanca[]>([]);
  const [vacStartDate, setVacStartDate] = useState('');
  const [vacEndDate, setVacEndDate] = useState('');
  const [vacComments, setVacComments] = useState('');
  const [vacSubmitting, setVacSubmitting] = useState(false);
  const [vacSuccess, setVacSuccess] = useState(false);
  const [vacDenyingId, setVacDenyingId] = useState<number | null>(null);
  const [vacDenyStage, setVacDenyStage] = useState<'head' | 'rrhh'>('head');
  const [vacDenyComment, setVacDenyComment] = useState('');

  const isRRHH = currentUser?.role === 'Recursos humans' || currentUser?.role === 'Administrador/a';
  const isHead = !!(currentUser?.is_head);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const fetchSolicituds = () => {
    apiGetSolicituds().then(setDiesNoOrdinaris).catch(console.error);
  };

  const fetchVacances = () => {
    apiGetVacances().then(setVacances).catch(console.error);
  };

  useEffect(() => {
    fetchSolicituds();
    fetchVacances();
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

  const handleApprove = async (id: number) => {
    try {
      await apiUpdateSolicitud(id, 'Aprovada');
      fetchSolicituds();
    } catch (e) {
      console.error('Error approving:', e);
    }
  };

  const handleDenyConfirm = async (id: number) => {
    try {
      await apiUpdateSolicitud(id, 'Denegada', denyMotive.trim());
      fetchSolicituds();
      setDenyingId(null);
      setDenyMotive('');
    } catch (e) {
      console.error('Error denying:', e);
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('solicituds.subtitle')}</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Dies no ordinaris', 'Vacances'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      <div key={activeTab} className="anim-tab">

      {activeTab === 'Dies no ordinaris' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className={isRRHH ? 'md:col-span-3' : 'md:col-span-2'}>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">{t('solicituds.sentRequests', { count: diesNoOrdinaris.length })}</h3>
            {diesNoOrdinaris.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-8 text-center">
                <Calendar size={32} className="text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">{t('solicituds.noRequests')}</p>
                <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">{t('solicituds.noRequestsHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diesNoOrdinaris.map(d => (
                  <div key={d.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{formatDate(d.date)}</p>
                        <p className="text-xs text-gray-400 mb-2">Sol·licitat el {formatDate(d.created_at)} · Per: {d.author}</p>
                        {d.comments && <p className="text-xs text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2 mb-2">{d.comments}</p>}
                        {d.status === 'Denegada' && d.motive && (
                          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2"><span className="font-semibold">Motiu:</span> {d.motive}</p>
                        )}
                        {isRRHH && d.status === 'Pendent' && denyingId === d.id && (
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
                        {isRRHH && d.status === 'Pendent' && denyingId !== d.id && (
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
          </div>

          {!isRRHH && <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
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
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white"
                />
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
          </div>}
        </div>
      )}

      {activeTab === 'Dies no ordinaris' && !isRRHH && createPortal(
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

      {activeTab === 'Dies no ordinaris' && !isRRHH && mobileFormOpen && createPortal(
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
                  <input type="date" value={selectedDate} min={today} onChange={e => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
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
        const showForm = !isRRHH && !isHead;
        const reviewList = isHead ? pendingHead : isRRHH ? pendingRrhh : vacances;
        const showReviewPanel = isHead || isRRHH;

        const handleVacApprove = async (id: number) => {
          try {
            if (isHead) await apiUpdateVacancaHead(id, 'Aprovada');
            else await apiUpdateVacancaRrhh(id, 'Aprovada');
            fetchVacances(); onNotifChange?.();
          } catch {}
        };
        const handleVacDenyConfirm = async (id: number) => {
          try {
            if (vacDenyStage === 'head') await apiUpdateVacancaHead(id, 'Denegada', vacDenyComment.trim());
            else await apiUpdateVacancaRrhh(id, 'Denegada', vacDenyComment.trim());
            fetchVacances(); onNotifChange?.();
            setVacDenyingId(null); setVacDenyComment('');
          } catch {}
        };
        // Live conveni validation for current user's own existing vacances.
        const ownVacances = vacances.filter(v => v.user_id === currentUser?.id);
        const vacReport = (vacStartDate && vacEndDate)
          ? validateVacanca(
              vacStartDate, vacEndDate,
              ownVacances.map(v => ({ start_date: v.start_date, end_date: v.end_date, status: v.status })),
            )
          : null;

        const handleVacSubmit = async () => {
          if (!vacStartDate || !vacEndDate) return;
          const report = validateVacanca(
            vacStartDate, vacEndDate,
            ownVacances.map(v => ({ start_date: v.start_date, end_date: v.end_date, status: v.status })),
          );
          if (report.errors.length > 0) {
            alert('La sol·licitud no compleix el conveni:\n\n' + report.errors.map(e => '• ' + e).join('\n'));
            return;
          }
          setVacSubmitting(true);
          try {
            await apiCreateVacanca(vacStartDate, vacEndDate, vacComments.trim());
            fetchVacances(); onNotifChange?.();
            setVacStartDate(''); setVacEndDate(''); setVacComments('');
            setVacSuccess(true); setTimeout(() => setVacSuccess(false), 3000);
          } catch (e: any) {
            alert('La sol·licitud ha estat rebutjada pel servidor:\n\n' + (e?.message ?? 'Error desconegut'));
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
                      <div key={v.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
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
                                  <button onClick={() => { setVacDenyingId(null); setVacDenyComment(''); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel·lar</button>
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
              ) : (
                <div className="space-y-3">
                  {vacances.map(v => (
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
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Data d'inici</label>
                        <input type="date" value={vacStartDate} min={today} onChange={e => setVacStartDate(e.target.value)}
                          className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Data de fi</label>
                        <input type="date" value={vacEndDate} min={vacStartDate || today} onChange={e => setVacEndDate(e.target.value)}
                          className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
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
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Data d'inici</label>
                    <input type="date" value={vacStartDate} min={today} onChange={e => setVacStartDate(e.target.value)}
                      className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Data de fi</label>
                    <input type="date" value={vacEndDate} min={vacStartDate || today} onChange={e => setVacEndDate(e.target.value)}
                      className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
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
                  <button onClick={handleVacSubmit} disabled={!vacStartDate || !vacEndDate || vacSubmitting || (vacReport?.errors.length ?? 0) > 0}
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
    </div>
  );
}

// ── Perfil Tab ────────────────────────────────────────────────────────────────

function PerfilTab({ currentUser, onUserUpdate, onNavigate }: { currentUser: User | null; onUserUpdate: (u: User) => void; onNavigate?: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useState('Informació');
  const [notifCorreu, setNotifCorreu] = useState(currentUser?.email_notifs !== 0);
  const [notifPortal, setNotifPortal] = useState(true);

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

  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiGetCourses().then(setCourses).catch(console.error);
  }, []);

  const profileCourses = courses.filter(c => c.user_status !== 'Pendent');
  const completedCount = courses.filter(c => c.user_status === 'Completat').length;
  const pendingCount = courses.filter(c => c.user_status === 'Pendent').length;
  const totalHoursStr = `${profileCourses.reduce((s, c) => s + (parseInt(c.hours) || 0), 0)}h`;

  const initials = (currentUser?.name ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !currentUser) return;
    try {
      const deptChanged = deptInput !== currentUser.dept || isHeadInput !== (currentUser.is_head === 1);
      if (deptChanged) {
        await apiUpdateDept(deptInput, isHeadInput);
      }
      const updated = await apiUpdateMe({
        name: trimmed,
        phone: phoneInput.trim(),
        ext: extInput.trim(),
        location: locationInput.trim(),
      });
      onUserUpdate(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message ?? 'Error en desar');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setNameInput(currentUser?.name ?? '');
    setPhoneInput(currentUser?.phone ?? '');
    setExtInput(currentUser?.ext ?? '');
    setLocationInput(currentUser?.location ?? '');
    setDeptInput(currentUser?.dept ?? DEPT_ORDER[0]);
    setIsHeadInput((currentUser?.is_head ?? 0) === 1);
  };

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Informació personal, formació, beneficis i configuració</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Informació', 'Formació', 'Beneficis socials', 'Configuració'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      <div key={activeTab} className="anim-tab">
      {activeTab === 'Informació' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-6 relative">

            {/* Edit / Save button — top right, always visible */}
            {editing ? (
              <div className="absolute top-4 right-4 flex gap-1.5">
                <button onClick={handleSave} disabled={!nameInput.trim()} className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">Desar</button>
                <button onClick={handleCancel} className="text-xs border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel·lar</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditing(true); setNameInput(currentUser?.name ?? ''); }}
                className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-700 px-2.5 py-1.5 rounded-lg transition-colors"
                title="Editar perfil"
              >
                <Settings size={13} /> Editar
              </button>
            )}

            {/* Avatar + name */}
            <div className="flex flex-col items-center mb-6 pt-2">
              <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold mb-4">{initials}</div>

              {editing ? (
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                  className="w-full text-center font-bold text-gray-900 dark:text-white text-base border border-red-400 rounded-lg px-3 py-1.5 outline-none dark:bg-zinc-800 mb-1"
                />
              ) : (
                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">{currentUser?.name ?? '—'}</h3>
              )}

              {saved && <p className="text-[11px] text-green-600 mt-1">Canvis desats.</p>}

              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{currentUser?.dept ?? '—'}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded font-medium">{currentUser?.dept ?? '—'}</span>
                <span className="text-[11px] bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded font-medium">{currentUser?.role ?? '—'}</span>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              {/* Email — read only */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{currentUser?.email ?? '—'}</span>
              </div>

              {/* Phone — editable */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                {editing
                  ? <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                  : <span>{phoneInput}</span>}
              </div>

              {/* Ext — editable */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                {editing
                  ? <input value={extInput} onChange={e => setExtInput(e.target.value)} className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                  : <span>{extInput}</span>}
              </div>

              {/* Location — editable */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                {editing
                  ? <input value={locationInput} onChange={e => setLocationInput(e.target.value)} className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                  : <span>{locationInput}</span>}
              </div>

              {/* Dept — editable */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <FolderOpen size={14} className="text-gray-400 flex-shrink-0" />
                {editing ? (
                  <select value={deptInput} onChange={e => { setDeptInput(e.target.value); setIsHeadInput(false); }} className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white">
                    {DEPT_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : <span>{currentUser?.dept ?? '—'}</span>}
              </div>

              {/* Is head — editable, only show if no other head for selected dept */}
              {editing && (
                <label className={cn("flex items-center gap-2 cursor-pointer text-sm", deptHasHead ? "opacity-40 cursor-not-allowed" : "")}>
                  <input
                    type="checkbox"
                    checked={isHeadInput}
                    disabled={deptHasHead}
                    onChange={e => setIsHeadInput(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-400"
                  />
                  <span className="text-gray-700 dark:text-zinc-300">
                    Sóc el/la responsable d'aquest departament
                    {deptHasHead && <span className="text-xs text-gray-400 ml-1">(ja té responsable)</span>}
                  </span>
                </label>
              )}
              {!editing && (currentUser?.is_head === 1) && (
                <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 font-medium">
                  <Users size={14} className="flex-shrink-0" />
                  <span>Cap de departament</span>
                </div>
              )}

              {/* ID — read only */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
                <span>{`ID: TAV-0${String(currentUser?.id ?? 0).padStart(3, '0')}`}</span>
              </div>

              {/* Start date — read only */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                <span>Des de 15 setembre 2019</span>
              </div>
            </div>
          </div>
          <div className="col-span-2 space-y-5">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Resum de vacances</h3>
              <div className="grid grid-cols-4 gap-3">
                {[{ label: "Total", value: "23", red: false }, { label: "Gaudits", value: "8", red: false }, { label: "Pendents d'aprovar", value: "2", red: false }, { label: "Restants", value: "13", red: true }].map((stat, i) => (
                  <div key={i} className="border border-gray-100 dark:border-zinc-800 rounded-xl p-3 text-center">
                    <p className={cn("text-2xl font-bold", stat.red ? "text-red-600" : "text-gray-900 dark:text-white")}>{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Accessos ràpids</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {([
                  { icon: Building2, label: "Empresa", tab: "Empresa" },
                  { icon: ActivityIcon, label: "Activitats", tab: "Activitats" },
                  { icon: MessageSquare, label: "Veu de l'empleat", tab: "Veu" },
                  { icon: Mail, label: "Correu corporatiu", external: true },
                  { icon: ExternalLink, label: "Portal de nòmines", external: true },
                  { icon: Calendar, label: "Sol·licitud de vacances", tab: "Solicituds" },
                  { icon: Database, label: "ERP (SAP)", external: true },
                  { icon: Users, label: "Directori intern", tab: "Directori" },
                  { icon: GraduationCap, label: "Campus TAVIL", tab: "Campus" },
                ] as { icon: React.ElementType; label: string; external?: boolean; tab?: string }[]).map((item, i) => (
                  item.external ? (
                    <div key={i} title="Properament disponible" className="flex items-center gap-2 p-3 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-not-allowed opacity-50 select-none">
                      <item.icon size={14} className="text-red-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-zinc-400">{item.label}</span>
                    </div>
                  ) : (
                    <div key={i} onClick={() => onNavigate?.(item.tab!)} className="flex items-center gap-2 p-3 border border-gray-100 dark:border-zinc-800 rounded-xl hover:border-red-200 dark:hover:border-red-900 cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors group">
                      <item.icon size={14} className="text-red-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-zinc-300 group-hover:text-red-600 transition-colors">{item.label}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Formació' && (
        <>
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
            {[{ label: "Completats", value: String(completedCount), icon: Award, color: "text-green-500" }, { label: "Pendents", value: String(pendingCount), icon: Clock, color: "text-orange-500" }, { label: "Hores totals", value: totalHoursStr, icon: GraduationCap, color: "text-purple-500" }].map((s, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p><s.icon size={15} className={s.color} /></div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 divide-y divide-gray-50 dark:divide-zinc-800">
            {profileCourses.map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <GraduationCap size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.title}</p>
                  {c.user_progress > 0 && c.user_progress < 100 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 max-w-xs bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${c.user_progress}%` }} /></div>
                      <span className="text-[10px] text-gray-500">{c.user_progress}%</span>
                    </div>
                  )}
                </div>
                <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded flex-shrink-0", STATUS_COLORS[c.user_status])}>{c.user_status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'Beneficis socials' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { icon: Heart, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", title: "Assegurança mèdica", desc: "Cobertura mèdica privada Adeslas per al treballador i familiars directes. Copagament reduït." },
            { icon: ActivityIcon, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", title: "Descompte gimnàs", desc: "30% de descompte a la xarxa de gimnasos DIR amb accés iHimitat." },
            { icon: Gift, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20", title: "Club d'avantatges TAVIL", desc: "Descomptes en comerços locals, tecnologia, viatges i oci a través de la plataforma Cobee." },
            { icon: Shield, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20", title: "Assegurança de vida", desc: "Pòlissa d'assegurança de vida i accidents amb cobertura de 2x el salari anual." },
            { icon: GraduationCap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", title: "Formació subvencionada", desc: "L'empresa subvenciona fins al 100% de la formació relacionada amb el lloc de treball." },
            { icon: Calendar, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20", title: "Dia lliure d'aniversari", desc: "Dia lliure retribuït el dia del teu aniversari o el dia laborable més proper." },
          ].map((b, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", b.bg)}><b.icon size={20} className={b.color} /></div>
                <span className="text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-2 py-0.5 rounded">Actiu</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{b.title}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Configuració' && (
        <div className="max-w-lg space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4"><Bell size={15} className="text-gray-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Notificacions</h3></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-700 dark:text-zinc-300">Notificacions per correu</span><Toggle on={notifCorreu} onToggle={async () => { const newVal = !notifCorreu; setNotifCorreu(newVal); try { const u = await apiUpdateMe({ email_notifs: newVal ? 1 : 0 }); onUserUpdate(u); } catch {} }} /></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-700 dark:text-zinc-300">Notificacions al portal</span><Toggle on={notifPortal} onToggle={() => setNotifPortal(!notifPortal)} /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4"><Settings size={15} className="text-gray-500" /><h3 className="font-bold text-gray-900 dark:text-white text-sm">Preferències</h3></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-2"><Globe size={14} />Idioma</span><span className="text-sm text-gray-500">Català</span></div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ── Onboarding Modal ─────────────────────────────────────────────────────────

function OnboardingModal({ onComplete }: { onComplete: (dept: string, isHead: boolean) => Promise<void> }) {
  const [dept, setDept] = useState(DEPT_ORDER[0]);
  const [isHead, setIsHead] = useState(false);
  const [deptHasHead, setDeptHasHead] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGetDeptHead(dept).then(r => { setDeptHasHead(r.has_head); if (r.has_head) setIsHead(false); }).catch(() => {});
  }, [dept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onComplete(dept, isHead);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 anim-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 w-full max-w-sm shadow-xl anim-scale-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Benvingut/da a TAVIL</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Digues-nos una mica més sobre tu per configurar el teu espai.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Departament</label>
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white"
            >
              {DEPT_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <label className={cn("flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 dark:border-zinc-800 transition-colors", deptHasHead ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-zinc-800")}>
            <input
              type="checkbox"
              checked={isHead}
              disabled={deptHasHead}
              onChange={e => setIsHead(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Sóc el/la responsable d'aquest departament</p>
              <p className="text-xs text-gray-400">{deptHasHead ? 'Aquest departament ja té un responsable assignat' : 'Marca si ets el/la cap de departament'}</p>
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="press w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors mt-2"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Auth pages ────────────────────────────────────────────────────────────────

function VerifyEmailPage({ email, onBack, onVerified, isDarkMode, toggleDarkMode }: {
  email: string;
  onBack: () => void;
  onVerified: (data: AuthOut) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiVerifyEmail(email, code.trim());
      onVerified(data);
    } catch (err: any) {
      setError(err.message ?? 'Codi invàlid o caducat.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await apiResendVerification(email);
      setResent(true);
    } catch {}
  };

  return (
    <div className={cn("min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col transition-colors", isDarkMode && "dark")}>
      <div className="flex justify-end p-4">
        <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <TavilLogo />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">Portal intern del treballador</p>
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm anim-scale-in">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-red-500 hover:underline mb-4">
            <ChevronLeft size={15} /> Tornar
          </button>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 mb-4 mx-auto">
            <Mail size={22} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">Verifica el teu correu</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-1">Hem enviat un codi a</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 text-center mb-6">{email}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Codi de verificació</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="A3F92BDE"
                maxLength={8}
                required
                className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 px-4 text-sm text-center tracking-widest font-mono outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white uppercase"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {resent && <p className="text-green-600 text-sm text-center">Nou codi enviat!</p>}
            <button type="submit" disabled={loading || code.length < 8}
              className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
              Verificar compte
            </button>
          </form>
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mt-4">
            No has rebut el correu?{' '}
            <button onClick={handleResend} className="text-red-500 font-medium hover:underline">Reenviar</button>
          </p>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-800">
        © 2026 TAVIL · Portal intern
      </div>
    </div>
  );
}

function OTPPage({ email, onBack, onVerified, isDarkMode, toggleDarkMode }: {
  email: string;
  onBack: () => void;
  onVerified: (data: AuthOut) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiVerifyOTP(email, code.trim());
      onVerified(data);
    } catch (err: any) {
      setError(err.message ?? 'Codi invàlid o caducat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col transition-colors", isDarkMode && "dark")}>
      <div className="flex justify-end p-4">
        <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <TavilLogo />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">Portal intern del treballador</p>
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm anim-scale-in">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-red-500 hover:underline mb-4">
            <ChevronLeft size={15} /> Tornar
          </button>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 mb-4 mx-auto">
            <Shield size={22} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">Verificació en dos passos</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-1">Hem enviat un codi de 6 dígits a</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 text-center mb-6">{email}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Codi d'accés</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
                className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 px-4 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || code.length < 6}
              className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
              Verificar
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-zinc-500 text-center mt-4">El codi caduca en 10 minuts.</p>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-800">
        © 2026 TAVIL · Portal intern
      </div>
    </div>
  );
}

function TavilLogo() {
  return (
    <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" className="h-12 mb-2" />
  );
}

function LoginPage({ onLoginResult, onRegister, isDarkMode, toggleDarkMode }: {
  onLoginResult: (data: AuthOut) => void;
  onRegister: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) { setError('Format de correu no vàlid.'); return; }
    setLoading(true);
    try {
      const data = await apiLogin(email.trim().toLowerCase(), password);
      onLoginResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Correu o contrasenya incorrectes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col transition-colors", isDarkMode && "dark")}>
      <div className="flex justify-end p-4">
        <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <TavilLogo />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">Portal intern del treballador</p>
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm anim-scale-in">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">Inicia sessió</h1>
          <p className="text-sm text-red-500 text-center mb-6">Introdueix les teves credencials corporatives</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Correu electrònic</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@tavil.net" required
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 pl-9 pr-4 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Contrasenya</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="········" required
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 pl-9 pr-10 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2">
              Accedir
            </button>
          </form>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500 dark:text-zinc-400">Has oblidat la contrasenya?</span>
            <button onClick={onRegister} className="text-red-500 font-medium hover:underline">Crea un compte</button>
          </div>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-800">
        © 2026 TAVIL · Portal intern
      </div>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage({ onBack, onRegisterResult, isDarkMode, toggleDarkMode }: {
  onBack: () => void;
  onRegisterResult: (data: AuthOut) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) { setError('El correu ha de tenir el format nom@domini.ext'); return; }
    if (!email.trim().toLowerCase().endsWith('@tavil.net')) { setError('Només es permeten correus @tavil.net'); return; }
    if (password.length < 6) { setError('La contrasenya ha de tenir mínim 6 caràcters.'); return; }
    if (password !== confirmPassword) { setError('Les contrasenyes no coincideixen.'); return; }
    setLoading(true);
    try {
      const data = await apiRegister(name.trim(), email.trim().toLowerCase(), password);
      onRegisterResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Error desconegut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col transition-colors", isDarkMode && "dark")}>
      <div className="flex justify-end p-4">
        <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        <TavilLogo />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">Portal intern del treballador</p>
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm anim-scale-in">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-red-500 hover:underline mb-4">
            <ChevronLeft size={15} /> Tornar
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Crea un compte</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Registra't amb el teu correu corporatiu</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Nom complet</label>
              <div className="relative">
                <UserCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Marta García" required
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 pl-9 pr-4 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Correu electrònic</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@tavil.net" required
                  className={cn("w-full border rounded-lg py-3 pl-9 pr-4 text-sm outline-none dark:bg-zinc-800 dark:text-white",
                    email && !EMAIL_RE.test(email) ? "border-red-400 focus:border-red-500" : "border-gray-200 dark:border-zinc-700 focus:border-red-400")} />
              </div>
              {email && !EMAIL_RE.test(email) && (
                <p className="text-red-400 text-xs mt-1">Format: nom@domini.ext</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Contrasenya</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínim 6 caràcters" required
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 pl-9 pr-10 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Confirma la contrasenya</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeteix la contrasenya" required
                  className={cn("w-full border rounded-lg py-3 pl-9 pr-10 text-sm outline-none dark:bg-zinc-800 dark:text-white",
                    !passwordsMatch ? "border-red-400 focus:border-red-500" : "border-gray-200 dark:border-zinc-700 focus:border-red-400")} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-red-400 text-xs mt-1">Les contrasenyes no coincideixen.</p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading || !passwordsMatch}
              className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2">
              Registrar-se
            </button>
          </form>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-800">
        © 2026 TAVIL · Portal intern
      </div>
    </div>
  );
}

// ── Sidebar data ──────────────────────────────────────────────────────────────

function useSidebarSections() {
  const { t } = useTranslation();
  return [
    {
      title: t('nav.general'),
      items: [
        { id: 'Inici', label: t('nav.inici'), icon: Home },
        { id: 'Notícies', label: t('nav.noticies'), icon: Newspaper },
        { id: 'Activitats', label: t('nav.activitats'), icon: ActivityIcon },
        { id: 'Agenda', label: t('nav.agenda'), icon: Calendar },
        { id: 'Directori', label: t('nav.directori'), icon: Users },
      ]
    },
    {
      title: t('nav.empresa'),
      items: [
        { id: 'Espai', label: t('nav.espai'), icon: Building2 },
        { id: 'Campus', label: t('nav.campus'), icon: GraduationCap },
        { id: 'Veu', label: t('nav.veu'), icon: MessageSquare },
      ]
    },
    {
      title: t('nav.personal'),
      items: [
        { id: 'Solicituds', label: t('nav.solicituds'), icon: FileText },
        { id: 'Perfil', label: t('nav.perfil'), icon: UserCircle },
      ]
    }
  ];
}

// ── Empresa Landing (mobile-first list of company tabs) ──────────────────────

function EmpresaLandingTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const items: { id: string; label: string; icon: any; desc: string }[] = [
    { id: 'Directori', label: 'Directori', icon: Users, desc: 'Troba companys per departament' },
    { id: 'Espai', label: 'Espai corporatiu', icon: Building2, desc: 'Documents, polítiques, plantilles' },
    { id: 'Campus', label: 'Campus TAVIL', icon: GraduationCap, desc: 'Formació i cursos' },
    { id: 'Veu', label: "Veu de l'empleat", icon: MessageSquare, desc: 'Suggeriments i incidències' },
    { id: 'Activitats', label: 'Activitats', icon: ActivityIcon, desc: "Esdeveniments d'empresa" },
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

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const { t } = useTranslation();
  const SIDEBAR_SECTIONS = useSidebarSections();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify-email' | 'otp'>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  const [activeTab, setActiveTabState] = useState(() => localStorage.getItem('tavil_active_tab') ?? 'Inici');
  const [notifSubTab, setNotifSubTab] = useState<string | null>(null);
  const setActiveTab = (tab: string) => { localStorage.setItem('tavil_active_tab', tab); setActiveTabState(tab); };

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
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    const prev = tabOrder.indexOf(prevTabRef.current);
    const cur = tabOrder.indexOf(activeTab);
    const dir = prev !== -1 && cur !== -1 && cur < prev ? 'back' : 'fwd';
    setExitingTab(prevTabRef.current);
    setExitDirection(dir);
    setExitIsMobile(isMobilePage);
    prevTabRef.current = activeTab;
    const duration = isMobilePage ? 620 : 720;
    const timer = setTimeout(() => setExitingTab(null), duration);
    return () => clearTimeout(timer);
  }, [activeTab, isMobilePage, tabOrder]);

  const enterClass = isMobilePage
    ? (exitDirection === 'fwd' ? 'anim-page-enter-h-fwd' : 'anim-page-enter-h-back')
    : (exitDirection === 'fwd' ? 'anim-page-enter-v-fwd' : 'anim-page-enter-v-back');
  const exitClass = exitIsMobile
    ? (exitDirection === 'fwd' ? 'anim-page-exit-h-fwd' : 'anim-page-exit-h-back')
    : (exitDirection === 'fwd' ? 'anim-page-exit-v-fwd' : 'anim-page-exit-v-back');
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const userInitials = currentUser?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? 'CH';

  const refreshNotifications = () => {
    apiGetNotifications().then(setNotifications).catch(() => {});
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setDemoRole(user.role);
    setIsLoggedIn(true);
    apiGetNotifications().then(setNotifications).catch(() => {});
    if (!user.onboarded) setShowOnboarding(true);
  };

  const handleAuthResult = (data: AuthOut) => {
    if (data.status === 'pending_verification') {
      setPendingEmail(data.email!);
      setAuthView('verify-email');
    } else if (data.status === 'pending_otp') {
      setPendingEmail(data.email!);
      setAuthView('otp');
    } else {
      setToken(data.access_token!);
      handleLogin(data.user!);
    }
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('tavil_active_tab');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setAuthView('login');
    setIsProfileMenuOpen(false);
    setActiveTabState('Inici');
    setNotifications([]);
  };

  const currentSection = SIDEBAR_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)
    ?? (activeTab === 'Empresa' ? { id: 'Empresa', label: 'Empresa', icon: Building2 } : undefined);

  useEffect(() => {
    registerUnauthorizedHandler(handleLogout);

    const savedDark = localStorage.getItem('tavil_dark') === 'true';
    setIsDarkMode(savedDark);
    if (savedDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    if (getToken()) {
      apiGetMe()
        .then(user => {
          setCurrentUser(user);
          setDemoRole(user.role);
          setIsLoggedIn(true);
          apiGetNotifications().then(setNotifications).catch(() => {});
          if (!user.onboarded) setShowOnboarding(true);
        })
        .catch(() => clearToken());
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tavil_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tavil_dark', 'false');
    }
  }, [isDarkMode]);

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
    switch (tab) {
      case 'Inici': return <InicialTab onNavigate={setActiveTab} onNavigateToDate={navigateToDate} />;
      case 'Notícies': return <NoticiesTab currentUser={currentUser} />;
      case 'Activitats': return <ActivitatsTab currentUser={currentUser} />;
      case 'Agenda': return <AgendaTab currentUser={currentUser} initDate={agendaInitDate} onInitDateConsumed={() => setAgendaInitDate(null)} />;
      case 'Directori': return <DirectoriTab />;
      case 'Espai': return <EspaiCorporatiuTab />;
      case 'Campus': return <CampusTavilTab />;
      case 'Veu': return <VeuEmpleatTab currentUser={currentUser} initialSubTab={notifSubTab} onSubTabConsumed={() => setNotifSubTab(null)} />;
      case 'Solicituds': return <SolicitudsTab currentUser={currentUser} onNotifChange={refreshNotifications} initialSubTab={notifSubTab} onSubTabConsumed={() => setNotifSubTab(null)} />;
      case 'Perfil': return <PerfilTab currentUser={currentUser} onUserUpdate={u => { setCurrentUser(u); }} onNavigate={setActiveTab} />;
      case 'Empresa': return <EmpresaLandingTab onNavigate={setActiveTab} />;
      default: return null;
    }
  };
  const renderPageLayout = (tab: string) => {
    const isInici = tab === 'Inici';
    const section = SIDEBAR_SECTIONS.flatMap(s => s.items).find(i => i.id === tab)
      ?? (tab === 'Empresa' ? { id: 'Empresa', label: 'Empresa', icon: Building2 } : undefined);
    return (
      <div className={isInici ? 'w-full' : 'p-3 md:p-4 lg:p-8 max-w-7xl mx-auto w-full'}>
        {!isInici && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <button onClick={() => setActiveTab('Inici')} className="hover:text-red-600 flex items-center gap-1 transition-colors">
                <Home size={11} /> {t('breadcrumb.home')}
              </button>
              <ChevronRight size={11} />
              <span className="text-gray-700 dark:text-zinc-300">{section?.label}</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{section?.label}</h1>
          </div>
        )}
        {renderContentFor(tab)}
      </div>
    );
  };

  if (!isLoggedIn) {
    if (authView === 'login') return <LoginPage onLoginResult={handleAuthResult} onRegister={() => setAuthView('register')} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
    if (authView === 'register') return <RegisterPage onBack={() => setAuthView('login')} onRegisterResult={handleAuthResult} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
    if (authView === 'verify-email') return <VerifyEmailPage email={pendingEmail} onBack={() => setAuthView('login')} onVerified={handleAuthResult} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
    return <OTPPage email={pendingEmail} onBack={() => setAuthView('login')} onVerified={handleAuthResult} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
  }

  return (
    <div className={cn("flex min-h-screen bg-gray-50 dark:bg-[#121212] font-sans text-gray-900 dark:text-zinc-100 transition-colors duration-300", isDarkMode && "dark")}>
      {/* Sidebar */}
      <aside className={cn("bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-zinc-800 flex flex-col fixed inset-y-0 z-30 transition-all duration-300 hidden md:flex", sidebarCollapsed ? "md:w-16" : "md:w-60")}>
        <div className={cn("p-5 pb-4", sidebarCollapsed && "px-2")}>
          <div className={cn("mb-7 cursor-pointer", sidebarCollapsed && "flex justify-center")} onClick={() => setActiveTab('Inici')}>
            {sidebarCollapsed
              ? <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoCollapsed.png`} alt="TAVIL" className="h-7" />
              : isDarkMode
                ? <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoDark.png`} alt="TAVIL" className="h-7" />
                : <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" className="h-7" />
            }
          </div>
          {SIDEBAR_SECTIONS.map((section) => (
            <SidebarSection key={section.title} title={section.title} collapsed={sidebarCollapsed}>
              {section.items.map((item) => (
                <SidebarItem key={item.id} icon={item.icon} label={item.label} active={activeTab === item.id} onClick={() => setActiveTab(item.id)} collapsed={sidebarCollapsed} />
              ))}
            </SidebarSection>
          ))}
        </div>

        <div className="mt-auto border-t border-gray-100 dark:border-zinc-800">
          <div className={cn("flex items-center p-4 gap-3", sidebarCollapsed && "justify-center p-3")}>
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userInitials}</div>
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
      <main className={cn("flex-1 min-w-0 min-h-screen transition-all duration-300 ml-0 pb-16 md:pb-0", sidebarCollapsed ? "md:ml-16" : "md:ml-60")}>
        {/* Header */}
        <header className="h-14 md:h-16 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-3 md:px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:inline-flex p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400"
              title={sidebarCollapsed ? t('common.expandMenu') : t('common.collapseMenu')}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="hidden md:inline text-gray-300 dark:text-zinc-600">|</span>
            <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">{t('common.portalIntern')}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setSearchOpen(true); }}
                onFocus={() => { loadSearchData(); if (searchQuery) setSearchOpen(true); }}
                placeholder={t('common.search')}
                className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2 pl-9 pr-14 text-sm w-56 outline-none dark:text-white"
              />
              {!searchQuery && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded font-mono">⌘K</span>}
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
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 transition-colors"
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
                    ) : notifications.map(n => (
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
                        className={cn("flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors", !n.read && "bg-red-50/40 dark:bg-red-950/10")}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", !n.read ? "bg-red-100 dark:bg-red-950/30" : "bg-gray-100 dark:bg-zinc-800")}>
                          <FileText size={14} className={!n.read ? "text-red-600" : "text-gray-400"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-semibold", !n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-zinc-400")}>{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
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
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors flex items-center gap-1"
                title={t('common.language')}
              >
                <Globe size={18} />
                <span className="text-[10px] font-bold uppercase">{i18n.language}</span>
              </button>
            </div>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">{userInitials}</div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{currentUser?.name ?? 'Usuari'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{demoRole}</p>
                </div>
                <ChevronLeft size={14} className="text-gray-400 rotate-[-90deg] hidden lg:block" />
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
                  <button onClick={() => { setActiveTab('Perfil'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <Settings size={14} /> {t('profile.settings')}
                  </button>
                  <div className="border-t border-gray-100 dark:border-zinc-800 mt-2 pt-2">
                    <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t('profile.demoRole')}</p>
                    {['Treballador/a', 'Responsable de departament', 'Recursos humans', 'Administrador/a', 'Manteniment'].map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          setDemoRole(role);
                          if (currentUser) {
                            const updated = { ...currentUser, role };
                            setCurrentUser(updated);
                            apiUpdateMyRole(role).then(u => setCurrentUser(u)).catch(console.error);
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

        {/* Content — push transition: old slides out, new slides in, stacked in a relative wrapper */}
        <div className="page-stack w-full">
          {exitingTab && exitingTab !== activeTab && (
            <div key={`exit-${exitingTab}`} className={cn("page-viewport page-exiting w-full", exitClass)}>
              {renderPageLayout(exitingTab)}
            </div>
          )}
          <div key={`enter-${activeTab}`} className={cn("page-viewport page-entering w-full", enterClass)}>
            {renderPageLayout(activeTab)}
          </div>
        </div>
      </main>

      {showOnboarding && currentUser && (
        <OnboardingModal
          onComplete={async (dept, isHead) => {
            try {
              const u = await apiCompleteOnboarding(dept, isHead);
              setCurrentUser(u);
              setDemoRole(u.role);
              setShowOnboarding(false);
            } catch {}
          }}
        />
      )}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;
