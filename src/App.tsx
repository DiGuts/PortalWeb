import React, { useState, useEffect } from 'react';
import {
  Home, Newspaper, Activity as ActivityIcon, Calendar, Users, Building2,
  GraduationCap, MessageSquare, UserCircle, Search, Bell,
  Moon, ChevronLeft, ChevronRight, Mail, Database, FolderOpen,
  AlertTriangle, ArrowRight, Sun, MapPin, Clock, Phone, FileText,
  BookOpen, Shield, ThumbsUp, Send, ExternalLink, CreditCard,
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
  Notification, apiGetNotifications, apiMarkNotifRead, apiMarkAllNotifsRead,
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
const NEWS_CAT_SHORT: Record<string, string> = {
  "Notícies corporatives": "Corporatives",
  "Recursos humans":       "RRHH",
  "Seguretat":             "Seguretat",
  "Comunicats interns":    "Interns",
  "Esdeveniments":         "Esdeveniments",
  "Innovació":             "Innovació",
};

function InicialTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [noticeIndex, setNoticeIndex] = useState(0);

  useEffect(() => {
    apiGetNotices().then(setNotices).catch(console.error);
    apiGetNews().then(setNews).catch(console.error);
  }, []);

  const notice = notices[noticeIndex];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Compact urgent notice */}
      {notice && (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AVÍS URGENT</span>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{notice.title}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{notice.content}</p>
          <button className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1 hover:underline">
            {notice.link} <ArrowRight size={11} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-xs text-gray-400">{noticeIndex + 1}/{notices.length}</span>
          <button onClick={() => setNoticeIndex((noticeIndex - 1 + notices.length) % notices.length)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
            <ChevronLeft size={14} className="text-gray-500" />
          </button>
          <button onClick={() => setNoticeIndex((noticeIndex + 1) % notices.length)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>
      </div>
      )}

      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Agenda */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Pròxims a l'agenda</h3>
            <button className="text-red-600 text-xs font-medium flex items-center gap-1 hover:underline">Veure <ArrowRight size={11} /></button>
          </div>
          <div className="space-y-3">
            {[
              { date: "25", day: "DT", title: "Reunió general trimestral", time: "10:00 – 12:00" },
              { date: "27", day: "DJ", title: "Taller de seguretat laboral", time: "09:00 – 13:00" },
              { date: "01", day: "DT", title: "Presentació nous productes Q2", time: "11:30 – 13:00" },
              { date: "03", day: "DJ", title: "Formació Excel avançat", time: "10:00 – 12:00" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 flex-shrink-0">
                  <span className="text-red-600 font-bold text-sm leading-none">{item.date}</span>
                  <span className="text-gray-400 text-[9px] font-medium uppercase">{item.day}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-tight">{item.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Accés ràpid</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Mail, title: "Correu corporatiu", desc: "Outlook Web", color: "bg-blue-50 dark:bg-blue-950/20" },
              { icon: Database, title: "ERP", desc: "SAP / Gestió", color: "bg-green-50 dark:bg-green-950/20" },
              { icon: FolderOpen, title: "Gestor documental", desc: "Normatives i ISO", color: "bg-amber-50 dark:bg-amber-950/20" },
              { icon: GraduationCap, title: "Campus TAVIL", desc: "Formació interna", color: "bg-violet-50 dark:bg-violet-950/20" },
              { icon: AlertTriangle, title: "Comunicar incidència", desc: "Manteniment / IT", color: "bg-orange-50 dark:bg-orange-950/20" },
              { icon: Users, title: "Directori", desc: "Persones / contactes", color: "bg-red-50 dark:bg-red-950/20" },
            ].map((item, i) => (
              <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity", item.color)}>
                <item.icon size={18} className="text-gray-600 dark:text-zinc-300 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 leading-tight">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest News */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Últimes notícies</h3>
          <button className="text-red-600 text-xs font-medium flex items-center gap-1 hover:underline">Totes les notícies <ArrowRight size={11} /></button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
          {news.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 group cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0", NEWS_CAT_COLORS[item.category] ?? "bg-gray-100 text-gray-600")}>{NEWS_CAT_SHORT[item.category] ?? item.category}</span>
                <p className="text-sm text-gray-800 dark:text-zinc-200 group-hover:text-red-600 transition-colors truncate">{item.title}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-4">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notícies Tab ──────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-100 dark:border-zinc-800">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Confirmar eliminació</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel·lar</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">Eliminar</button>
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
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activeFilter, setActiveFilter] = useState('Totes');
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
  const featured = filtered.find(n => n.featured === 1) ?? filtered[0];
  const grid = filtered.filter(n => n !== featured).slice(0, 3);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 dark:text-zinc-400 text-sm">Informació, comunicats i novetats de l'empresa</p>
        {isAdmin && <button onClick={() => setShowNewsForm(v => !v)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">+ Nova notícia</button>}
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
          <input type="text" placeholder="Cercar notícies..." className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Totes', 'Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat'].map(f => (
            <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
      </div>

      {featured && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row mb-8 min-h-[360px]">
          <div className="md:w-1/2 h-56 md:h-auto overflow-hidden bg-gray-100 dark:bg-zinc-800">
            <img src={featured.image || '/assets/images/img_4.png'} alt="Featured" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-4">{featured.category}</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{featured.title}</h2>
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
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {grid.map((item, i) => (
          <div key={i} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-zinc-800">
              <img src={item.image || '/assets/images/img_7.png'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">{item.category}</p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">{item.title}</h3>
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

function AgendaTab({ currentUser }: { currentUser: User | null }) {
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [activeFilter, setActiveFilter] = useState('Tots');
  const [currentMonth, setCurrentMonth] = useState(3);
  const [currentYear, setCurrentYear] = useState(2026);
  const isAdmin = currentUser?.role === 'Administrador/a';

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
            {cells.map((day, i) => (
              <div key={i} className={cn("min-h-[80px] p-1.5 border-b border-r border-gray-50 dark:border-zinc-800/50", day !== null && isToday(day) && "bg-red-50/50 dark:bg-red-950/10")}>
                {day && (
                  <>
                    <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday(day) ? "bg-red-600 text-white" : "text-gray-700 dark:text-zinc-300")}>{day}</span>
                    {(calendarEvents[day] || []).map((ev, j) => (
                      <div key={j} className={cn("text-[10px] px-1.5 py-0.5 rounded truncate mb-0.5 font-medium", EVENT_COLORS[ev.type])}>{ev.title}</div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
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
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Cerca treballadors per nom, departament, càrrec o extensió</p>
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
            <LayoutGrid size={14} /> Graella
          </button>
          <button onClick={() => setView('departaments')} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors", view === 'departaments' ? "bg-red-600 text-white" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
            <Users size={14} /> Departaments
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
  const statuses = ['Tots els estats', 'Pendent', 'En curs', 'Completat'];

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

  const handleVote = async (id: number) => {
    try {
      await apiVoteSuggestion(id);
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
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Suggeriments, incidències i enquestes internes</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Suggeriments', 'Incidències', 'Enquestes'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {/* ── Suggeriments ── */}
      {activeTab === 'Suggeriments' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Suggeriments recents ({suggestions.length})</h3>
            <div className="space-y-3">
              {suggestions.map(sug => (
                <div key={sug.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                      <button onClick={() => handleVote(sug.id)} className="p-1 hover:text-red-600 transition-colors text-gray-400"><ThumbsUp size={14} /></button>
                      <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{sug.votes}</span>
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
                      <span className="text-xs text-gray-400 dark:text-zinc-500 italic">{sug.anonymous ? 'Anònim' : sug.author}</span>
                      {isRrhhOrAdmin && (
                        <button onClick={() => suggAdminOpen === sug.id ? setSuggAdminOpen(null) : openSuggAdmin(sug)} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors">Gestionar</button>
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


function SolicitudsTab({ currentUser, onNotifChange }: { currentUser: User | null; onNotifChange?: () => void }) {
  const [activeTab, setActiveTab] = useState('Dies no ordinaris');
  const [diesNoOrdinaris, setDiesNoOrdinaris] = useState<Solicitud[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [denyingId, setDenyingId] = useState<number | null>(null);
  const [denyMotive, setDenyMotive] = useState('');

  const isRRHH = currentUser?.role === 'Recursos humans';

  const fetchSolicituds = () => {
    apiGetSolicituds().then(setDiesNoOrdinaris).catch(console.error);
  };

  useEffect(() => {
    fetchSolicituds();
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
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Gestió de sol·licituds i peticions personals</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Dies no ordinaris'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      {activeTab === 'Dies no ordinaris' && (
        <div className="grid grid-cols-3 gap-6">
          <div className={isRRHH ? 'col-span-3' : 'col-span-2'}>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Sol·licituds enviades ({diesNoOrdinaris.length})</h3>
            {diesNoOrdinaris.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-8 text-center">
                <Calendar size={32} className="text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">No hi ha sol·licituds encara.</p>
                <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">Fes servir el formulari per enviar la primera.</p>
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
                              <button onClick={() => handleDenyConfirm(d.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Confirmar denegació</button>
                              <button onClick={() => { setDenyingId(null); setDenyMotive(''); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel·lar</button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", statusColor(d.status))}>{d.status}</span>
                        {isRRHH && d.status === 'Pendent' && denyingId !== d.id && (
                          <>
                            <button onClick={() => handleApprove(d.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 transition-colors">Aprovar</button>
                            <button onClick={() => { setDenyingId(d.id); setDenyMotive(''); }} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors">Denegar</button>
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
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Nova sol·licitud</h3>
            </div>
            {success && (
              <div className="mb-3 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-2 text-xs font-medium">
                <CheckCircle size={13} /> Sol·licitud enviada correctament.
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Dia sol·licitat</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1 block">Comentaris</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value.slice(0, 500))}
                  placeholder="Explica el motiu o qualsevol detall rellevant..."
                  rows={5}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white resize-none"
                />
                <p className="text-[10px] text-gray-400 text-right">{comments.length}/500</p>
              </div>
              <p className="text-[11px] text-red-600">L'equip de RRHH revisarà la sol·licitud en un termini de 48 hores.</p>
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || submitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={14} /> Enviar sol·licitud
              </button>
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}

// ── Perfil Tab ────────────────────────────────────────────────────────────────

function PerfilTab({ currentUser, onUserUpdate }: { currentUser: User | null; onUserUpdate: (u: User) => void }) {
  const [activeTab, setActiveTab] = useState('Informació');
  const [notifCorreu, setNotifCorreu] = useState(true);
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
              <div className="flex items-center justify-between"><span className="text-sm text-gray-700 dark:text-zinc-300">Notificacions per correu</span><Toggle on={notifCorreu} onToggle={() => setNotifCorreu(!notifCorreu)} /></div>
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
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@tavil.com" required
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
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@tavil.com" required
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

const SIDEBAR_SECTIONS = [
  {
    title: "General",
    items: [
      { id: 'Inici', label: "Inici", icon: Home },
      { id: 'Notícies', label: "Notícies", icon: Newspaper },
      { id: 'Activitats', label: "Activitats", icon: ActivityIcon },
      { id: 'Agenda', label: "Agenda", icon: Calendar },
      { id: 'Directori', label: "Directori", icon: Users },
    ]
  },
  {
    title: "Empresa",
    items: [
      { id: 'Espai', label: "Espai corporatiu", icon: Building2 },
      { id: 'Campus', label: "Campus TAVIL", icon: GraduationCap },
      { id: 'Veu', label: "Veu de l'empleat", icon: MessageSquare },
      { id: 'Solicituds', label: "Solicituds", icon: FileText },
    ]
  },
  {
    title: "Personal",
    items: [
      { id: 'Perfil', label: "El meu perfil", icon: UserCircle },
    ]
  }
];

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const [activeTab, setActiveTabState] = useState(() => localStorage.getItem('tavil_active_tab') ?? 'Inici');
  const setActiveTab = (tab: string) => { localStorage.setItem('tavil_active_tab', tab); setActiveTabState(tab); };
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [demoRole, setDemoRole] = useState('Treballador/a');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userInitials = currentUser?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? 'CH';

  const refreshNotifications = () => {
    apiGetNotifications().then(setNotifications).catch(() => {});
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setDemoRole(user.role);
    setIsLoggedIn(true);
    apiGetNotifications().then(setNotifications).catch(() => {});
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Inici': return <InicialTab />;
      case 'Notícies': return <NoticiesTab currentUser={currentUser} />;
      case 'Activitats': return <ActivitatsTab currentUser={currentUser} />;
      case 'Agenda': return <AgendaTab currentUser={currentUser} />;
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
              title={sidebarCollapsed ? 'Expandir menú' : 'Reduir menú'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="text-gray-300 dark:text-zinc-600">|</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Portal Intern</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cercar..."
                className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2 pl-9 pr-14 text-sm w-56 outline-none dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded font-mono">⌘K</span>
            </div>

            <div className="relative">
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
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notificacions</h3>
                    {notifications.some(n => !n.read) && (
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center">No hi ha notificacions</p>
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
                        Marcar totes com a llegides
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
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
                    <UserCircle size={14} /> El meu perfil
                  </button>
                  <button onClick={() => { setActiveTab('Perfil'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <Settings size={14} /> Configuració
                  </button>
                  <div className="border-t border-gray-100 dark:border-zinc-800 mt-2 pt-2">
                    <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Rol de demostració</p>
                    {['Treballador/a', 'Responsable de departament', 'Recursos humans', 'Administrador/a'].map(role => (
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
                      <LogOut size={14} /> Tancar sessió
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Breadcrumb + Title */}
          <div className="mb-6">
            {activeTab !== 'Inici' && (
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <button onClick={() => setActiveTab('Inici')} className="hover:text-red-600 flex items-center gap-1 transition-colors">
                  <Home size={11} /> Inici
                </button>
                <ChevronRight size={11} />
                <span className="text-gray-700 dark:text-zinc-300">{currentSection?.label}</span>
              </div>
            )}
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{currentSection?.label}</h1>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
