import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import {
  Home, Newspaper, Activity as ActivityIcon, Calendar, Users, Building2,
  GraduationCap, MessageSquare, UserCircle, Search, Bell,
  Moon, ChevronLeft, ChevronRight, Mail, Database, FolderOpen,
  AlertTriangle, ArrowRight, Sun, MapPin, Clock, Phone, FileText,
  BookOpen, Shield, ThumbsUp, ThumbsDown, Send, ExternalLink, CreditCard,
  TrendingUp, CheckCircle, Star, LogOut, LayoutGrid, List,
  Heart, Gift, Globe, Download, Video, Award, Settings, Eye, EyeOff, Lock, Pencil, Trash2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  User, TokenOut,
  apiLogin, apiRegister, apiGetMe, apiUpdateMe, apiUpdateMyRole,
  setToken, clearToken, getToken, registerUnauthorizedHandler,
  apiGetSuggestions, apiCreateSuggestion, apiVoteSuggestion, apiUpdateSuggestionStatus, apiAddSuggestionResponse, Suggestion,
  apiGetIncidencies, apiCreateIncidencia, apiUpdateIncidenciaStatus, Incidencia,
  apiGetEnquestes, apiRespondreEnquesta, Enquesta,
  apiGetSolicituds, apiCreateSolicitud, apiUpdateSolicitud, Solicitud,
  Notice, apiGetNotices,
  NewsArticle, apiGetNews, apiCreateNews, apiUpdateNews, apiDeleteNews,
  Activity, apiGetActivities, apiCreateActivity, apiUpdateActivity, apiDeleteActivity,
  AgendaEvent, apiGetAgendaEvents, apiCreateAgendaEvent, apiUpdateAgendaEvent, apiDeleteAgendaEvent,
  apiUploadImage, API_BASE,
  Employee, apiGetEmployees,
  Course, apiGetCourses,
  Notification, apiGetNotifications, apiMarkNotifRead, apiMarkAllNotifsRead, apiClearAllNotifications,
  apiCompleteOnboarding,
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

// ── Sidebar ──────────────────────────────────────────────────────────────────

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: {
  icon: any; label: string; active?: boolean; onClick?: () => void; collapsed?: boolean;
}) => (
  <div
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={cn(
      "flex items-center gap-3 rounded-lg cursor-pointer transition-colors group relative",
      collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5",
      active
        ? "text-red-600 bg-red-50 dark:bg-red-950/20"
        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200"
    )}
  >
    {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-600 rounded-r-full" />}
    {active && collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-600 rounded-r-full" />}
    <Icon size={18} className={cn(active ? "text-red-600" : "text-gray-400 group-hover:text-gray-500")} />
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
    className={cn(
      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
      active
        ? "bg-red-600 text-white border-red-600"
        : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
    )}
  >
    {label}
  </button>
);

const UnderlineTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
      active
        ? "border-red-600 text-red-600"
        : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
    )}
  >
    {label}
  </button>
);

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
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    apiGetNotices().then(setNotices).catch(console.error);
    apiGetNews().then(setNews).catch(console.error);
    apiGetActivities(0).then(setActivities).catch(console.error);
    apiGetAgendaEvents().then(setAgendaEvents).catch(console.error);
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
    <div className="animate-in fade-in duration-300">
      {/* Hero banner — edge-to-edge full viewport width, TAVIL building photo */}
      <div
        className="relative overflow-hidden mb-6 h-72 -mt-8 shadow-sm bg-gray-200 dark:bg-zinc-800"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        <img
          src={`${process.env.PUBLIC_URL}/tavil-header.jpg`}
          alt="TAVIL Headquarters"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: '70% 60%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="relative h-full flex flex-col justify-end px-10 pb-8 max-w-7xl mx-auto">
          <h1 className="text-white text-4xl font-black tracking-tight drop-shadow-lg">TAVIL Hub</h1>
          <p className="text-white/90 text-base mt-1 drop-shadow">Portal intern dels treballadors</p>
        </div>
      </div>

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
              <button className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 hover:underline">
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
              <div
                onClick={() => onNavigate?.('Notícies')}
                className="relative rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-red-200 dark:hover:border-red-900/40 transition-colors group"
              >
                {featured.image ? (
                  <img src={featured.image.startsWith('http') ? featured.image : `${API_BASE}${featured.image}`} alt="" className="w-full h-56 object-cover" />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-950/30 dark:to-red-950/10 flex items-center justify-center">
                    <Newspaper size={48} className="text-red-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", NEWS_CAT_COLORS[featured.category] ?? "bg-gray-100 text-gray-600")}>{featured.category}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/90 text-amber-900 uppercase flex items-center gap-0.5"><Star size={9} /> Destacada</span>
                  </div>
                  <h4 className="text-white text-lg font-bold leading-tight drop-shadow line-clamp-2">{featured.title}</h4>
                  {featured.summary && <p className="text-white/85 text-xs mt-1 line-clamp-2 drop-shadow">{featured.summary}</p>}
                  <p className="text-white/70 text-[10px] mt-2">{featured.date}</p>
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
                    {item.image ? (
                      <img src={item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`} alt="" className="w-full h-28 object-cover" />
                    ) : (
                      <div className={cn("w-full h-28 flex items-center justify-center", item.kind === 'news' ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20")}>
                        {item.kind === 'news'
                          ? <Newspaper size={28} className="text-red-400" />
                          : <ActivityIcon size={28} className="text-green-500" />
                        }
                      </div>
                    )}
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
                { icon: Mail, title: "Correu corporatiu", color: "text-blue-600" },
                { icon: Database, title: "ERP — SAP / Gestió", color: "text-green-600" },
                { icon: FolderOpen, title: "Gestor documental", color: "text-amber-600" },
                { icon: GraduationCap, title: "Campus TAVIL", color: "text-violet-600", tab: "Campus" },
                { icon: AlertTriangle, title: "Comunicar incidència", color: "text-orange-600", tab: "Veu" },
                { icon: Users, title: "Directori", color: "text-red-600", tab: "Directori" },
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
    </div>
  );
}

// ── Notícies Tab ──────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-100 dark:border-zinc-800">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('confirm.deleteTitle')}</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">{t('confirm.cancel')}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">{t('confirm.delete')}</button>
        </div>
      </div>
    </div>
  );
}

function NewsEditForm({ neCategory, setNeCategory, neTitle, setNeTitle, neSummary, setNeSummary,
  neAuthor, setNeAuthor, neDate, setNeDate, neImage, neImageFile, setNeImageFile,
  neFeatured, setNeFeatured, neSaving, onSave, onCancel }: any) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
      <select value={neCategory} onChange={(e: any) => setNeCategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
        {['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'].map((c: string) => <option key={c}>{c}</option>)}
      </select>
      <input type="text" value={neTitle} onChange={(e: any) => setNeTitle(e.target.value)} placeholder="Títol *" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
      <textarea value={neSummary} onChange={(e: any) => setNeSummary(e.target.value)} placeholder="Resum" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white resize-none" />
      <input type="text" value={neAuthor} onChange={(e: any) => setNeAuthor(e.target.value)} placeholder="Autor" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
      <input type="text" value={neDate} onChange={(e: any) => setNeDate(e.target.value)} placeholder="Data" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
      <div className="col-span-2">
        {neImage && !neImageFile && <img src={neImage} alt="" className="h-12 rounded mb-1 object-cover" />}
        <input type="file" accept="image/*" onChange={(e: any) => setNeImageFile(e.target.files?.[0] ?? null)} className="w-full text-xs text-gray-600 dark:text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-red-50 file:text-red-700" />
        {neImageFile && <p className="text-[10px] text-gray-400 mt-0.5">{neImageFile.name}</p>}
      </div>
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

function NoticiesTab({ currentUser }: { currentUser: User | null }) {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activeFilter, setActiveFilter] = useState('Totes');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const isAdmin = currentUser?.role === 'Administrador/a';

  // Create news form state
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [nCategory, setNCategory] = useState('Comunicats interns');
  const [nTitle, setNTitle] = useState('');
  const [nSummary, setNSummary] = useState('');
  const [nContent, setNContent] = useState('');
  const [nAuthor, setNAuthor] = useState('');
  const [nDate, setNDate] = useState('');
  const [nImageFile, setNImageFile] = useState<File | null>(null);
  const [nFeatured, setNFeatured] = useState(false);
  const [nSaving, setNSaving] = useState(false);

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
      let imageUrl = '';
      if (nImageFile) imageUrl = await apiUploadImage(nImageFile);
      await apiCreateNews({ category: nCategory, title: nTitle.trim(), summary: nSummary.trim(),
        content: nContent.trim(), author: nAuthor.trim(), date: nDate.trim(),
        image: imageUrl, featured: nFeatured ? 1 : 0 });
      setNews(await apiGetNews());
      setShowNewsForm(false);
      setNTitle(''); setNSummary(''); setNContent(''); setNAuthor(''); setNDate(''); setNImageFile(null); setNFeatured(false);
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

  useEffect(() => {
    apiGetNews().then(setNews).catch(console.error);
  }, []);

  const filtered = activeFilter === 'Totes' ? news : news.filter(n => n.category === activeFilter);
  const featuredList = filtered.filter(n => n.featured === 1);
  const featuredItems = featuredList.length > 0 ? featuredList : filtered.slice(0, 1);
  const featured = featuredItems[featuredIndex % Math.max(featuredItems.length, 1)] ?? null;
  const grid = filtered.filter(n => !featuredItems.includes(n));

  if (selectedNews) {
    return (
      <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
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
            {selectedNews.content && <div className="text-gray-700 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedNews.content}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('news.subtitle')}</p>
        {isAdmin && <button onClick={() => setShowNewsForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">{t('news.newArticle')}</button>}
      </div>
      {isAdmin && showNewsForm && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 mb-6 grid grid-cols-2 gap-3">
          <select value={nCategory} onChange={e => setNCategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
            {['Comunicats interns','Notícies corporatives','Recursos humans','Esdeveniments','Innovació','Seguretat'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="text" value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="Títol *" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <textarea value={nSummary} onChange={e => setNSummary(e.target.value)} placeholder="Resum" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white resize-none" />
          <input type="text" value={nAuthor} onChange={e => setNAuthor(e.target.value)} placeholder="Autor" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <input type="text" value={nDate} onChange={e => setNDate(e.target.value)} placeholder="Data (ex: 1 abril 2026)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <div className="col-span-2">
            <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Imatge</label>
            <input type="file" accept="image/*" onChange={e => setNImageFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
            {nImageFile && <p className="text-[10px] text-gray-400 mt-1">{nImageFile.name}</p>}
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
      )}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder={t('news.searchPlaceholder')} className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Totes', 'Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat'].map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>

      {featured && (
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row mb-8 min-h-[360px]">
          <div
            className="md:w-1/2 h-56 md:h-auto overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer"
            onClick={() => setSelectedNews(featured)}
          >
            <img src={featured.image || '/assets/images/img_4.png'} alt="Featured" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-4">{featured.category}</span>
            <h2
              className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight cursor-pointer hover:text-red-600 transition-colors"
              onClick={() => setSelectedNews(featured)}
            >{featured.title}</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">{featured.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><UserCircle size={14} /><span>{featured.author}</span></div>
                <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{featured.date}</span></div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => newsEditId === featured.id ? setNewsEditId(null) : openNewsEdit(featured)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteNews(featured.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            {isAdmin && newsEditId === featured.id && <NewsEditForm {...{neCategory,setNeCategory,neTitle,setNeTitle,neSummary,setNeSummary,neAuthor,setNeAuthor,neDate,setNeDate,neImage,neImageFile,setNeImageFile,neFeatured,setNeFeatured,neSaving,onSave:handleSaveNewsEdit,onCancel:()=>setNewsEditId(null)}} />}
            {/* Carousel controls */}
            {featuredItems.length > 1 && (
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => setFeaturedIndex(i => (i - 1 + featuredItems.length) % featuredItems.length)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 transition-colors"
                  title={t('home.featuredPrev')}
                ><ChevronLeft size={16} /></button>
                <div className="flex gap-1.5">
                  {featuredItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFeaturedIndex(i)}
                      className={cn("rounded-full transition-all", i === featuredIndex % featuredItems.length ? "w-5 h-2 bg-red-600" : "w-2 h-2 bg-gray-300 dark:bg-zinc-600 hover:bg-red-400")}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setFeaturedIndex(i => (i + 1) % featuredItems.length)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-500 hover:text-red-600 transition-colors"
                  title={t('home.featuredNext')}
                ><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {grid.map((item, i) => (
          <div key={i} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-zinc-800 cursor-pointer" onClick={() => setSelectedNews(item)}>
              <img src={item.image || '/assets/images/img_7.png'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">{item.category}</p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer" onClick={() => setSelectedNews(item)}>{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">{item.summary}</p>
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
              {isAdmin && newsEditId === item.id && <NewsEditForm {...{neCategory,setNeCategory,neTitle,setNeTitle,neSummary,setNeSummary,neAuthor,setNeAuthor,neDate,setNeDate,neImage,neImageFile,setNeImageFile,neFeatured,setNeFeatured,neSaving,onSave:handleSaveNewsEdit,onCancel:()=>setNewsEditId(null)}} />}
            </div>
          </div>
        ))}
      </div>
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}

// ── Activitats Tab ────────────────────────────────────────────────────────────

function ActivitatsTab({ currentUser }: { currentUser: User | null }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('Properes');
  const [activeFilter, setActiveFilter] = useState('Totes');
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

  useEffect(() => {
    apiGetActivities().then(setActivities).catch(console.error);
  }, []);

  const upcoming = activities.filter(a => a.past === 0);
  const past = activities.filter(a => a.past === 1);
  const source = activeTab === 'Properes' ? upcoming : past;
  const filtered = activeFilter === 'Totes' ? source : source.filter(a => a.category === activeFilter);
  const isProperes = activeTab === 'Properes';

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">Esdeveniments socials, esportius i culturals per als treballadors de TAVIL</p>
        {isAdmin && <button onClick={() => setShowActForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">+ Nova activitat</button>}
      </div>
      {isAdmin && showActForm && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 mb-6 grid grid-cols-2 gap-3">
          <input type="text" value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <select value={aCategory} onChange={e => setACategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
            {['Esport','Cultura','Social','RSC','Benestar'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="text" value={aDate} onChange={e => setADate(e.target.value)} placeholder="Data" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <input type="text" value={aTime} onChange={e => setATime(e.target.value)} placeholder="Hora (ex: 10:00)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <input type="text" value={aLocation} onChange={e => setALocation(e.target.value)} placeholder="Lloc" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <textarea value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="Descripció" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white resize-none" />
          <input type="number" value={aCapacity} onChange={e => setACapacity(e.target.value)} placeholder="Aforament (0 = il·limitat)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <div className="flex justify-end gap-2 items-center">
            <button onClick={() => setShowActForm(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel·lar</button>
            <button onClick={handleCreateActivity} disabled={!aTitle.trim() || aSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">{aSaving ? 'Desant...' : 'Crear activitat'}</button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-5">
        {[`Properes (${upcoming.length})`, `Passades (${past.length})`].map(tab => {
          const key = tab.split(' ')[0];
          return <UnderlineTab key={tab} label={tab} active={activeTab === key} onClick={() => { setActiveTab(key); setActiveFilter('Totes'); }} />;
        })}
      </div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Cercar activitats..." className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white w-56" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Totes', 'Esport', 'Cultura', 'Social', 'RSC', 'Benestar'].map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((act, i) => {
          const available = act.capacity > 0 ? act.capacity - act.enrolled : 0;
          return (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow">
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
              <button className="text-red-600 text-sm font-medium flex items-center gap-1 hover:underline mt-4">
                Veure detalls i inscriure's <ArrowRight size={14} />
              </button>
            )}
            {isAdmin && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button onClick={() => actEditId === act.id ? setActEditId(null) : openActEdit(act)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"><Pencil size={12} /> Editar</button>
                <button onClick={() => handleDeleteActivity(act.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"><Trash2 size={12} /> Eliminar</button>
              </div>
            )}
            {isAdmin && actEditId === act.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                <input type="text" value={aeTitle} onChange={e => setAeTitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                <select value={aeCategory} onChange={e => setAeCategory(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
                  {['Esport','Cultura','Social','RSC','Benestar'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={aeCapacity} onChange={e => setAeCapacity(e.target.value)} placeholder="Aforament" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                <input type="text" value={aeDate} onChange={e => setAeDate(e.target.value)} placeholder="Data" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                <input type="text" value={aeTime} onChange={e => setAeTime(e.target.value)} placeholder="Hora" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                <input type="text" value={aeLocation} onChange={e => setAeLocation(e.target.value)} placeholder="Lloc" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                <textarea value={aeDesc} onChange={e => setAeDesc(e.target.value)} placeholder="Descripció" rows={2} className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white resize-none" />
                <div className="col-span-2 flex justify-end gap-2">
                  <button onClick={() => setActEditId(null)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">Cancel·lar</button>
                  <button onClick={handleSaveActEdit} disabled={!aeTitle.trim() || aeSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{aeSaving ? 'Desant...' : 'Desar'}</button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
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
  const [eDay, setEDay] = useState('');
  const [eMonth, setEMonth] = useState('4');
  const [eTime, setETime] = useState('');
  const [eLocation, setELocation] = useState('');
  const [eType, setEType] = useState('Sessió interna');
  const [eSaving, setESaving] = useState(false);

  const handleCreateEvent = async () => {
    if (!eTitle.trim() || !eDay) return;
    setESaving(true);
    try {
      await apiCreateAgendaEvent({ title: eTitle.trim(), day: parseInt(eDay), month: parseInt(eMonth),
        time: eTime.trim(), location: eLocation.trim(), type: eType });
      setAgendaEvents(await apiGetAgendaEvents());
      setShowEventForm(false);
      setETitle(''); setEDay(''); setETime(''); setELocation('');
    } catch (e) { console.error(e); }
    finally { setESaving(false); }
  };

  // Edit event state
  const [evEditId, setEvEditId] = useState<number | null>(null);
  const [eeTitle, setEeTitle] = useState('');
  const [eeDay, setEeDay] = useState('');
  const [eeMonth, setEeMonth] = useState('1');
  const [eeTime, setEeTime] = useState('');
  const [eeLocation, setEeLocation] = useState('');
  const [eeType, setEeType] = useState('Sessió interna');
  const [eeSaving, setEeSaving] = useState(false);

  const openEvEdit = (ev: AgendaEvent) => {
    setEvEditId(ev.id); setEeTitle(ev.title); setEeDay(String(ev.day));
    setEeMonth(String(ev.month)); setEeTime(ev.time || '');
    setEeLocation(ev.location || ''); setEeType(ev.type);
  };

  const handleSaveEvEdit = async () => {
    if (!evEditId || !eeTitle.trim() || !eeDay) return;
    setEeSaving(true);
    try {
      await apiUpdateAgendaEvent(evEditId, { title: eeTitle.trim(), day: parseInt(eeDay),
        month: parseInt(eeMonth), time: eeTime.trim(), location: eeLocation.trim(), type: eeType });
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
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">Calendari d'esdeveniments i dates importants</p>
        {isAdmin && <button onClick={() => setShowEventForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">+ Nou event</button>}
      </div>
      {isAdmin && showEventForm && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 mb-6 grid grid-cols-2 gap-3">
          <input type="text" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <input type="number" value={eDay} onChange={e => setEDay(e.target.value)} placeholder="Dia (1-31)" min={1} max={31} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <select value={eMonth} onChange={e => setEMonth(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
            {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <input type="text" value={eTime} onChange={e => setETime(e.target.value)} placeholder="Hora (ex: 10:00)" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <input type="text" value={eLocation} onChange={e => setELocation(e.target.value)} placeholder="Lloc" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white" />
          <select value={eType} onChange={e => setEType(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-zinc-800 dark:text-white">
            {Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}
          </select>
          <div className="flex justify-end gap-2 items-center">
            <button onClick={() => setShowEventForm(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel·lar</button>
            <button onClick={handleCreateEvent} disabled={!eTitle.trim() || !eDay || eSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">{eSaving ? 'Desant...' : 'Crear event'}</button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
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

      {view === 'calendar' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft size={18} className="text-gray-500" /></button>
            <h3 className="font-bold text-gray-900 dark:text-white">{MONTH_NAMES[currentMonth]} {currentYear}</h3>
            <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight size={18} className="text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-7">
            {days.map(d => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800">{d}</div>
            ))}
            {cells.map((day, i) => {
              const isSel = day !== null && selectedDay === day;
              return (
                <div
                  key={i}
                  onClick={() => day !== null && setSelectedDay(day === selectedDay ? null : day)}
                  className={cn(
                    "min-h-[80px] p-1.5 border-b border-r border-gray-50 dark:border-zinc-800/50 transition-colors",
                    day !== null && "cursor-pointer hover:bg-red-50/60 dark:hover:bg-red-950/20",
                    day !== null && isToday(day) && "bg-red-50/50 dark:bg-red-950/10",
                    isSel && "ring-2 ring-inset ring-red-500 bg-red-50 dark:bg-red-950/30"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday(day) ? "bg-red-600 text-white" : isSel ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold" : "text-gray-700 dark:text-zinc-300")}>{day}</span>
                      {(calendarEvents[day] || []).map((ev, j) => (
                        <div key={j} className={cn("text-[10px] px-1.5 py-0.5 rounded truncate mb-0.5 font-medium", EVENT_COLORS[ev.type])}>{ev.title}</div>
                      ))}
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
              {isAdmin && evEditId === ev.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                  <input type="text" value={eeTitle} onChange={e => setEeTitle(e.target.value)} placeholder="Títol *" className="col-span-2 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                  <input type="number" value={eeDay} onChange={e => setEeDay(e.target.value)} placeholder="Dia" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                  <select value={eeMonth} onChange={e => setEeMonth(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
                    {MONTH_NAMES.slice(1).map((m, idx) => <option key={idx+1} value={idx+1}>{m}</option>)}
                  </select>
                  <input type="text" value={eeTime} onChange={e => setEeTime(e.target.value)} placeholder="Hora" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                  <input type="text" value={eeLocation} onChange={e => setEeLocation(e.target.value)} placeholder="Lloc" className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white" />
                  <select value={eeType} onChange={e => setEeType(e.target.value)} className="border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none dark:bg-zinc-800 dark:text-white">
                    {Object.keys(EVENT_COLORS).map(t => <option key={t}>{t}</option>)}
                  </select>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => setEvEditId(null)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">Cancel·lar</button>
                    <button onClick={handleSaveEvEdit} disabled={!eeTitle.trim() || !eeDay || eeSaving} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{eeSaving ? 'Desant...' : 'Desar'}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
  const [view, setView] = useState<'graella' | 'departaments'>('graella');

  useEffect(() => {
    apiGetEmployees().then(setEmployees).catch(console.error);
  }, []);

  const filtered = activeFilter === 'Tots' ? employees : employees.filter(e => e.dept === activeFilter);

  const grouped = DEPT_ORDER.reduce((acc, dept) => {
    const members = filtered.filter(e => e.dept === dept);
    if (members.length > 0) acc[dept] = members;
    return acc;
  }, {} as Record<string, Employee[]>);

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('directory.subtitle')}</p>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Cercar..." className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white w-40" />
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

      {view === 'graella' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((emp, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow">
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
                  <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
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

  const handleSelectCat = (i: number) => {
    if (selectedCat === i) { setSelectedCat(null); setCatFilter('Tots'); }
    else { setSelectedCat(i); setCatFilter('Tots'); }
  };

  const cat = selectedCat !== null ? ESPAI_CATS[selectedCat] : null;
  const visibleDocs = cat
    ? (catFilter === 'Tots' ? cat.documents : cat.documents.filter(d => d.tag === catFilter))
    : [];

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">Base de coneixement intern, documentació i recursos corporatius</p>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" placeholder="Cercar documents, polítiques, plantilles..." className="w-full max-w-lg bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm outline-none dark:text-white" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {ESPAI_CATS.map((c, i) => (
          <div
            key={i}
            onClick={() => handleSelectCat(i)}
            className={cn(
              "bg-white dark:bg-zinc-900 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md group",
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

  useEffect(() => {
    apiGetCourses().then(setCourses).catch(console.error);
  }, []);

  const completed = courses.filter(c => c.user_status === 'Completat');
  const inProgress = courses.filter(c => c.user_status === 'En curs');
  const pending = courses.filter(c => c.user_status === 'Pendent');
  const completedHours = completed.reduce((s, c) => s + (parseInt(c.hours) || 0), 0);
  const mandatoryPending = courses.find(c => !!c.mandatory && c.user_status === 'Pendent');

  const topics = ['Tots els temes', 'Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Acollida', 'Producció', 'Habilitats', 'Idiomes'];
  const statuses = ['Tots els estats', 'Pendent', 'Completat'];

  const filteredCourses = courses.filter(c => {
    const matchTopic = topicFilter === 'Tots els temes' || c.category === topicFilter;
    const matchStatus = statusFilter === 'Tots els estats' || c.user_status === statusFilter;
    return matchTopic && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Plataforma de formació interna i desenvolupament professional</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Resum', 'Catàleg', 'El meu progrés', 'Recursos'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {activeTab === 'Resum' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Cursos completats", value: String(completed.length), icon: CheckCircle, color: "text-green-500" },
              { label: "En curs", value: String(inProgress.length), icon: TrendingUp, color: "text-blue-500" },
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
                <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">Fer curs</button>
              </div>
            </div>
          )}
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-blue-500" /> Cursos en curs</h3>
          <div className="grid grid-cols-2 gap-4">
            {inProgress.map((course, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{course.category}</span>
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", STATUS_COLORS[course.user_status])}>{course.user_status}</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{course.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 leading-relaxed">{course.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={12} /><span>{course.hours}</span>{!!course.mandatory && <span className="text-[10px] bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold">Obligatòria</span>}</div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5"><span>Progrés</span><span className="font-medium">{course.user_progress}%</span></div>
                <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${course.user_progress}%` }} /></div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'Catàleg' && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Cercar cursos..." className="w-full max-w-md bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {topics.map(t => <FilterChip key={t} label={t} active={topicFilter === t} onClick={() => setTopicFilter(t)} />)}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {statuses.map(s => <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {filteredCourses.map((course, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow">
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
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'El meu progrés' && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Resum del meu progrés</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[{ label: "Completats", value: String(completed.length), icon: CheckCircle, color: "text-green-500" }, { label: "En curs", value: String(inProgress.length), icon: TrendingUp, color: "text-blue-500" }, { label: "Hores formació", value: `${completedHours}h`, icon: Clock, color: "text-purple-500" }].map((s, i) => (
                <div key={i}><p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></div>
              ))}
            </div>
          </div>
          {['En curs', 'Pendents', 'Completats'].map(group => {
            const items = courses.filter(c => {
              if (group === 'Pendents') return c.user_status === 'Pendent';
              if (group === 'Completats') return c.user_status === 'Completat';
              return c.user_status === 'En curs';
            });
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">{group}</h3>
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
              </div>
            );
          })}
        </>
      )}

      {activeTab === 'Recursos' && (
        <>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Biblioteca de recursos complementaris per a l'aprenentatge.</p>
          <div className="grid grid-cols-3 gap-4">
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
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow cursor-pointer group">
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

function VeuEmpleatTab({ currentUser }: { currentUser: User | null }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Suggeriments');

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
    <div className="animate-in fade-in duration-300">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('veu.subtitle')}</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {[
          { key: 'Suggeriments', label: t('veu.suggestions') },
          { key: 'Incidències', label: t('veu.incidents') },
        ].map(tab => (
          <UnderlineTab key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
        ))}
      </div>

      {/* ── Suggeriments ── */}
      {activeTab === 'Suggeriments' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
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
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
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
    <div className="space-y-5 animate-in fade-in duration-300">
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


function SolicitudsTab({ currentUser, onNotifChange }: { currentUser: User | null; onNotifChange?: () => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Dies no ordinaris');
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
  const isHead = currentUser?.role === 'Responsable de departament';

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
    <div className="animate-in fade-in duration-300">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('solicituds.subtitle')}</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Dies no ordinaris', 'Vacances'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {activeTab === 'Dies no ordinaris' && (
        <div className="grid grid-cols-3 gap-6">
          <div className={isRRHH ? 'col-span-3' : 'col-span-2'}>
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

          {!isRRHH && <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
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
        const handleVacSubmit = async () => {
          if (!vacStartDate || !vacEndDate) return;
          setVacSubmitting(true);
          try {
            await apiCreateVacanca(vacStartDate, vacEndDate, vacComments.trim());
            fetchVacances(); onNotifChange?.();
            setVacStartDate(''); setVacEndDate(''); setVacComments('');
            setVacSuccess(true); setTimeout(() => setVacSuccess(false), 3000);
          } catch {} finally { setVacSubmitting(false); }
        };

        return (
          <div className={`grid gap-6 ${showForm ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <div className={showForm ? 'col-span-2' : 'col-span-1'}>
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

            {showForm && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 h-fit">
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
                  <p className="text-[11px] text-red-600">Requereix aprovació del cap i de RRHH</p>
                  <button onClick={handleVacSubmit} disabled={!vacStartDate || !vacEndDate || vacSubmitting}
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
  );
}

// ── Perfil Tab ────────────────────────────────────────────────────────────────

function PerfilTab({ currentUser, onUserUpdate }: { currentUser: User | null; onUserUpdate: (u: User) => void }) {
  const [activeTab, setActiveTab] = useState('Informació');
  const [notifCorreu, setNotifCorreu] = useState(currentUser?.email_notifs !== 0);
  const [notifPortal, setNotifPortal] = useState(true);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name ?? '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone ?? '');
  const [extInput, setExtInput] = useState(currentUser?.ext ?? '');
  const [locationInput, setLocationInput] = useState(currentUser?.location ?? '');
  const [saved, setSaved] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiGetCourses().then(setCourses).catch(console.error);
  }, []);

  const profileCourses = courses.filter(c => c.user_status !== 'Pendent');
  const completedCount = courses.filter(c => c.user_status === 'Completat').length;
  const inProgressCount = courses.filter(c => c.user_status === 'En curs').length;
  const totalHoursStr = `${profileCourses.reduce((s, c) => s + (parseInt(c.hours) || 0), 0)}h`;

  const initials = (currentUser?.name ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !currentUser) return;
    try {
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
    } catch {}
  };

  const handleCancel = () => {
    setEditing(false);
    setNameInput(currentUser?.name ?? '');
    setPhoneInput(currentUser?.phone ?? '');
    setExtInput(currentUser?.ext ?? '');
    setLocationInput(currentUser?.location ?? '');
  };

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Informació personal, formació, beneficis i configuració</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Informació', 'Formació', 'Beneficis socials', 'Configuració'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {activeTab === 'Informació' && (
        <div className="grid grid-cols-3 gap-5">
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
              <div className="grid grid-cols-3 gap-3">
                {[{ icon: Mail, label: "Correu corporatiu" }, { icon: ExternalLink, label: "Portal de nòmines" }, { icon: Calendar, label: "Sol·licitud de vacances" }, { icon: Database, label: "ERP (SAP)" }, { icon: Users, label: "Directori intern" }, { icon: GraduationCap, label: "Campus TAVIL" }].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 border border-gray-100 dark:border-zinc-800 rounded-xl hover:border-red-200 dark:hover:border-red-900 cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors group">
                    <item.icon size={14} className="text-red-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-zinc-300 group-hover:text-red-600 transition-colors">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Formació' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Completats", value: String(completedCount), icon: Award, color: "text-green-500" }, { label: "En curs", value: String(inProgressCount), icon: Clock, color: "text-blue-500" }, { label: "Hores totals", value: totalHoursStr, icon: GraduationCap, color: "text-purple-500" }].map((s, i) => (
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
        <div className="grid grid-cols-3 gap-4">
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
  );
}

// ── Onboarding Modal ─────────────────────────────────────────────────────────

function OnboardingModal({ onComplete }: { onComplete: (dept: string, isHead: boolean) => Promise<void> }) {
  const [dept, setDept] = useState(DEPT_ORDER[0]);
  const [isHead, setIsHead] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onComplete(dept, isHead);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 w-full max-w-sm shadow-xl">
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
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <input
              type="checkbox"
              checked={isHead}
              onChange={e => setIsHead(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Sóc el/la responsable d'aquest departament</p>
              <p className="text-xs text-gray-400">Se t'assignarà el rol de Responsable de departament</p>
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors mt-2"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Auth pages ────────────────────────────────────────────────────────────────

function TavilLogo() {
  return (
    <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" className="h-12 mb-2" />
  );
}

function LoginPage({ onLogin, onRegister, isDarkMode, toggleDarkMode }: {
  onLogin: (user: User) => void;
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
      const data: TokenOut = await apiLogin(email.trim().toLowerCase(), password);
      setToken(data.access_token);
      onLogin(data.user);
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
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2">
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

function RegisterPage({ onBack, onRegistered, isDarkMode, toggleDarkMode }: {
  onBack: () => void;
  onRegistered: () => void;
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
      const data: TokenOut = await apiRegister(name.trim(), email.trim().toLowerCase(), password);
      setToken(data.access_token);
      onRegistered();
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
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm">
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2">
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

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const { t } = useTranslation();
  const SIDEBAR_SECTIONS = useSidebarSections();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const [activeTab, setActiveTabState] = useState(() => localStorage.getItem('tavil_active_tab') ?? 'Inici');
  const setActiveTab = (tab: string) => { localStorage.setItem('tavil_active_tab', tab); setActiveTabState(tab); };
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

  const currentSection = SIDEBAR_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'Inici': return <InicialTab onNavigate={setActiveTab} onNavigateToDate={navigateToDate} />;
      case 'Notícies': return <NoticiesTab currentUser={currentUser} />;
      case 'Activitats': return <ActivitatsTab currentUser={currentUser} />;
      case 'Agenda': return <AgendaTab currentUser={currentUser} initDate={agendaInitDate} onInitDateConsumed={() => setAgendaInitDate(null)} />;
      case 'Directori': return <DirectoriTab />;
      case 'Espai': return <EspaiCorporatiuTab />;
      case 'Campus': return <CampusTavilTab />;
      case 'Veu': return <VeuEmpleatTab currentUser={currentUser} />;
      case 'Solicituds': return <SolicitudsTab currentUser={currentUser} onNotifChange={refreshNotifications} />;
      case 'Perfil': return <PerfilTab currentUser={currentUser} onUserUpdate={u => { setCurrentUser(u); }} />;
      default: return null;
    }
  };

  if (!isLoggedIn) {
    return authView === 'login'
      ? <LoginPage onLogin={handleLogin} onRegister={() => setAuthView('register')} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      : <RegisterPage onBack={() => setAuthView('login')} onRegistered={() => { setAuthView('login'); }} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
  }

  return (
    <div className={cn("flex min-h-screen bg-gray-50 dark:bg-[#121212] font-sans text-gray-900 dark:text-zinc-100 transition-colors duration-300", isDarkMode && "dark")}>
      {/* Sidebar */}
      <aside className={cn("bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-zinc-800 flex flex-col fixed inset-y-0 z-30 transition-all duration-300", sidebarCollapsed ? "w-16" : "w-60")}>
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
      <main className={cn("flex-1 min-h-screen transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-60")}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400"
              title={sidebarCollapsed ? t('common.expandMenu') : t('common.collapseMenu')}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="text-gray-300 dark:text-zinc-600">|</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">{t('common.portalIntern')}</span>
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
                <div className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden">
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
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white dark:ring-zinc-900"></span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50">
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
                          if (n.tab) { setActiveTab(n.tab); setIsNotifOpen(false); }
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
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 p-3 z-50">
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

        {/* Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Breadcrumb + Title — hidden on Inici (hero banner acts as title) */}
          {activeTab !== 'Inici' && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <button onClick={() => setActiveTab('Inici')} className="hover:text-red-600 flex items-center gap-1 transition-colors">
                  <Home size={11} /> {t('breadcrumb.home')}
                </button>
                <ChevronRight size={11} />
                <span className="text-gray-700 dark:text-zinc-300">{currentSection?.label}</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{currentSection?.label}</h1>
            </div>
          )}

          {renderContent()}
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
    </div>
  );
}

export default App;
