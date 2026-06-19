import { tabPrefetch, tabPrefetchAt, isTabCacheFresh } from '../../lib/tabPrefetch';
import { resolveImg } from '../../lib/resolveImg';
import { scrollPageToTop } from '../../lib/scroll';
import { cn } from '../../lib/cn';
import { useIsMobile } from '../../lib/useIsMobile';
import { usePersistedSubTab } from '../../lib/usePersistedSubTab';
import { ChevronLeft, ChevronDown, ChevronUp, Clock, ExternalLink, Search, PlayCircle, GraduationCap, UploadCloud, CalendarDays } from 'lucide-react';
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Course, Quiz, apiGetCourses, apiGetQuizzes, apiUpdateCourseProgress, apiUploadCertificate, openCertificateFile, User } from '../../api';
import { FilterChip } from '../shared/FilterChip';
import { UnderlineTab } from '../shared/UnderlineTab';
import { DEPT_ORDER, deptLabel } from '../../lib/depts';
import { DropdownMultiselect } from '../shared/DropdownMultiselect';


// ── Certificate uploader: paste (Ctrl+V) · drag-drop · file picker ──────────
function CertUploader({ onUpload, reupload = false }: { onUpload: (f: File) => void; reupload?: boolean }) {
  const { t } = useTranslation();
  const [clip, setClip] = useState<{ file: File; preview: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.preview); }, [clip]);

  const acceptFile = (file: File) => {
    if (clip) URL.revokeObjectURL(clip.preview);
    if (file.type.startsWith('image/')) {
      setClip({ file, preview: URL.createObjectURL(file) });
    } else {
      onUpload(file); // PDF → upload immediately, no preview needed
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const imgItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (!imgItem) return;
    const file = imgItem.getAsFile();
    if (file) { e.preventDefault(); acceptFile(file); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  if (clip) {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg border border-[#e3e2db] dark:border-zinc-700 p-2">
        <img src={clip.preview} alt="" loading="lazy" className="w-full h-20 object-cover rounded" />
        <div className="flex gap-1.5">
          <button
            onClick={() => { onUpload(clip.file); setClip(null); }}
            className="flex-1 text-xs font-semibold py-1.5 rounded-md bg-[#222725] text-white hover:bg-[#2e3530] dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white transition-colors"
          >
            {t('campus.uploadThisCert')}
          </button>
          <button
            onClick={() => { URL.revokeObjectURL(clip.preview); setClip(null); }}
            className="text-xs px-2.5 py-1.5 rounded-md border border-[#e3e2db] dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      tabIndex={0}
      className={cn(
        "w-full flex flex-col items-center justify-center gap-0.5 text-xs text-gray-500 dark:text-zinc-400",
        "border border-dashed rounded-lg py-2.5 px-3 transition-colors cursor-pointer outline-none",
        "focus:border-[#222725] dark:focus:border-zinc-400",
        dragOver
          ? "border-[#222725] bg-gray-50 dark:border-zinc-400 dark:bg-zinc-800"
          : "border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-500"
      )}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />
      <span className="flex items-center gap-1.5 font-medium">
        <UploadCloud size={13} />
        {reupload ? t('campus.reuploadCertificate') : t('campus.uploadCertificate')}
      </span>
      <span className="text-[10px] opacity-50">{t('campus.uploadHint')}</span>
    </label>
  );
}

interface Props {
  currentUser: User | null;
  onBack?: () => void;
  pageActive?: boolean;   // true only when Campus is the active page (not exiting)
}

// ── CatalogItem type (shared by CatalogCard + CampusTavilTab) ────────────────
type CatalogItem = {
  id: string;
  type: 'Externes' | 'Internes';
  title: string;
  description: string;
  category?: string;
  hours?: string;
  mandatory?: boolean;
  status: 'Pendent' | 'En curs' | 'Completat' | 'No aprovat';
  progress?: number;
  url?: string;
  courseId?: number;
  quizId?: number;
  quizInProgress?: boolean;
  quizAttempted?: boolean;
  quizQuestions?: number;
  isPresential?: boolean;
  modality?: string;
  certificateStatus?: 'pending' | 'approved' | 'rejected' | null;
  certificateId?: number | null;
  requiresCert?: boolean;
  departments?: string[];
  startAt?: string | null;
  endAt?: string | null;
  body_html?: string | null;
  page_content?: string | null;
  image?: string;
};

const STATUS_COLORS: Record<string, string> = {
  "En curs":   "bg-[#fde68a] text-[#854d0e] dark:bg-[#5c4313] dark:text-[#fcd34d]",
  "Pendent":   "bg-[#e2e8f0] text-[#475569] dark:bg-[#334155] dark:text-[#cbd5e1]",
  "Completat": "bg-[#bbf7d0] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]",
  "No aprovat":"bg-[#fecaca] text-[#991b1b] dark:bg-[#5a1414] dark:text-[#fca5a5]",
};

// ── CatalogCard ───────────────────────────────────────────────────────────────
function CatalogCard({ item, i, onSelect, onOpenExternal, onCertUpload }: {
  item: CatalogItem;
  i: number;
  onSelect: (item: CatalogItem) => void;
  onOpenExternal: (item: CatalogItem) => void;
  onCertUpload: (item: CatalogItem, f: File) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  // Detect clamping after first paint (while line-clamp-2 is active)
  useLayoutEffect(() => {
    const el = descRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [item.description]);

  return (
    <div
      className="hover-lift rounded-xl p-5 anim-item flex flex-col"
      onClick={() => onSelect(item)}
      style={{ '--i': i, cursor: 'pointer', background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)' } as React.CSSProperties}
    >
      {/* Category + status */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.modality === 'online' && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
              {t('campus.online')}
            </span>
          )}
          {item.modality === 'presencial' && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#d1fae5] text-[#065f46] dark:bg-[#14532d] dark:text-[#86efac]">
              {t('campus.presential')}
            </span>
          )}
          {item.modality === 'hibrida' && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#ede9fe] text-[#5b21b6] dark:bg-[#2e1065] dark:text-[#c4b5fd]">
              {t('campus.hibrida')}
            </span>
          )}
        </div>
        <span className={cn('text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded flex-shrink-0', STATUS_COLORS[item.status])}>
          {item.status}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-[15px] leading-snug">
        {item.title}
      </h4>

      {/* Description — always reserves 2 lines of height */}
      <p
        ref={descRef}
        className={cn(
          'text-xs text-gray-500 dark:text-zinc-400 leading-relaxed min-h-[2.4375rem]',
          !expanded && 'line-clamp-2',
        )}
      >
        {item.description}
      </p>

      {/* Expand/collapse row — fixed height keeps footer always aligned */}
      <div className="h-[1.375rem] mt-1 mb-3 flex items-center">
        {isClamped && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {expanded ? <><ChevronUp size={10} />Plegar</> : '···'}
          </button>
        )}
      </div>

      {/* Footer — mt-auto pins everything to the bottom of the card */}
      <div className="mt-auto flex flex-col gap-2">
        {/* Hours + mandatory — always occupies a fixed row even if empty */}
        <div className="flex items-center gap-2 text-xs text-gray-500 min-h-[1.125rem]">
          {item.hours && <><Clock size={12} /><span>{item.hours}</span></>}
          {!!item.mandatory && (
            <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-1.5 py-0.5 rounded font-semibold">
              {t('campus.mandatory')}
            </span>
          )}
        </div>
        {/* Date — always occupies a fixed row even if empty */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500 min-h-[1.125rem]">
          {(item.startAt || item.endAt) && (
            <>
              <CalendarDays size={11} />
              <span>
                {item.startAt ? item.startAt.slice(0, 10).split('-').reverse().join('/') : ''}
                {item.startAt && item.endAt ? ' – ' : ''}
                {item.endAt ? item.endAt.slice(0, 10).split('-').reverse().join('/') : ''}
              </span>
            </>
          )}
        </div>
        {item.type === 'Internes' && item.quizInProgress && (
          <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
            <div className="h-1 rounded-full bg-amber-500 animate-pulse" style={{ width: '55%' }} />
          </div>
        )}
        {item.type === 'Externes' && item.url && (
          <button
            onClick={e => { e.stopPropagation(); onOpenExternal(item); }}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={12} /> {t('campus.openCourse')}
          </button>
        )}
        {item.type === 'Externes' && item.requiresCert && item.certificateStatus === null && (
          <div onClick={e => e.stopPropagation()}>
            <CertUploader onUpload={f => onCertUpload(item, f)} />
          </div>
        )}
        {item.type === 'Externes' && item.requiresCert && item.certificateStatus === 'pending' && (
          <div className="w-full flex items-center justify-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Clock size={11} /> {t('campus.certPendingValidation')}
          </div>
        )}
        {item.type === 'Externes' && item.requiresCert && item.certificateStatus === 'rejected' && (
          <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
            <div className="text-[11px] text-red-500 dark:text-red-400 text-center">{t('campus.certRejected')}</div>
            <CertUploader onUpload={f => onCertUpload(item, f)} reupload />
          </div>
        )}
        {item.type === 'Internes' && item.quizId && !item.isPresential && item.status !== 'Completat' && (
          <button
            onClick={e => {
              e.stopPropagation();
              window.open(`${window.location.pathname}?quiz=${item.quizId}${item.quizInProgress ? '&resume=1' : ''}`, '_blank');
            }}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white py-1.5 rounded-lg transition-colors ${
              item.quizInProgress ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#8b8c89] hover:bg-[#222725]'
            }`}
          >
            <PlayCircle size={12} /> {item.quizInProgress ? t('campus.continue') : t('campus.start')}
          </button>
        )}
        {item.type === 'Internes' && item.isPresential && item.status !== 'Completat' && (
          <p className="text-[11px] text-[var(--tavil-muted)] text-center py-1">{t('campus.attendanceByAdmin')}</p>
        )}
      </div>
    </div>
  );
}

export function CampusTavilTab({ currentUser, onBack, pageActive = true }: Props) {
  const { t, i18n } = useTranslation();
  const [courses, setCourses] = useState<Course[]>(() => tabPrefetch.courses ?? []);
  const [activeTab, setActiveTab] = usePersistedSubTab<string>('campus', 'Catàleg', ['Catàleg', 'El meu progrés', 'Proves', ] as const);
  const [campusDeptFilter, setCampusDeptFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('Tots els estats');
  const [campusSearch, setCampusSearch] = useState('');
  const isMobileCampus = useIsMobile();
  const [mobileCat, setMobileCat] = useState('Tot');
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CatalogItem | null>(null);
  const canManageFormacions = useMemo(() => {
    const allRoles = new Set([currentUser?.role ?? '', ...(currentUser?.roles ?? [])]);
    const isAdmin = allRoles.has('Administrador') || allRoles.has('Administrador/a');
    return isAdmin || allRoles.has('Formacions') || allRoles.has('Recursos humans');
  }, [currentUser]);

  useEffect(() => {
    if (isTabCacheFresh('courses')) return;
    apiGetCourses().then(d => { setCourses(d); tabPrefetch.courses = d; tabPrefetchAt.courses = Date.now(); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'Proves' || activeTab === 'Catàleg') {
      apiGetQuizzes().then(setQuizList).catch(console.error);
    }
  }, [activeTab]);

  const openExternalCourse = (item: CatalogItem) => {
    if (!item.url) return;
    window.open(item.url, '_blank', 'noopener,noreferrer');
    if (item.courseId && item.status === 'Pendent') {
      apiUpdateCourseProgress(item.courseId, 'En curs', 1)
        .then(() => apiGetCourses())
        .then(d => { setCourses(d); tabPrefetch.courses = d; tabPrefetchAt.courses = Date.now(); })
        .catch(console.error);
    }
  };

  const handleCertUpload = async (item: { courseId?: number; title: string }, file?: File) => {
    if (!file || !item.courseId) return;
    try {
      await apiUploadCertificate(item.courseId, file);
      setCourses(prev => prev.map(c =>
        c.id === item.courseId ? { ...c, certificate_status: 'pending' } : c
      ));
      apiGetCourses().then(d => {
        setCourses(d);
        tabPrefetch.courses = d;
        tabPrefetchAt.courses = Date.now();
      }).catch(console.error);
    } catch (e: any) {
      alert(e?.message ?? 'Error pujant el certificat');
    }
  };

  const completed = courses.filter(c => c.user_status === 'Completat');
  const completedHours = completed.reduce((s, c) => s + (parseInt(c.hours) || 0), 0);

  const statuses = ['Tots els estats', 'Pendent', 'En curs'];
  const statusLabel = (s: string): string => {
    const map: Record<string, string> = {
      'Tots els estats': 'campus.statuses.all',
      'Pendent': 'campus.statuses.pending',
      'En curs': 'campus.inProgress',
    };
    return map[s] ? t(map[s]) : s;
  };

  const externes: CatalogItem[] = courses
    .filter(c => c.is_external === 1)
    .map(c => ({
      id: `course-${c.id}`,
      type: 'Externes',
      title: c.title,
      description: c.description ?? '',
      category: c.category,
      hours: c.hours,
      mandatory: Number(c.mandatory) === 1,
      status: c.user_status === 'Completat' ? 'Completat' : (c.user_progress > 0 ? 'En curs' : 'Pendent'),
      progress: c.user_progress,
      url: c.url,
      courseId: c.id,
      certificateStatus: c.certificate_status ?? null,
      certificateId: c.certificate_id ?? null,
      requiresCert: c.cert === 1,
      departments: (() => { try { return JSON.parse(c.departments || '[]'); } catch { return []; } })(),
      startAt: c.start_at ?? null,
      endAt: c.end_at ?? null,
      image: c.image || undefined,
    }));

  const internes: CatalogItem[] = quizList
    .map(q => ({
      id: `quiz-${q.id}`,
      type: 'Internes',
      title: q.title,
      description: q.description ?? '',
      category: q.category,
      mandatory: Number(q.mandatory) === 1,
      status: q.user_attempt?.passed ? 'Completat' : (q.in_progress ? 'En curs' : (q.user_attempt ? 'No aprovat' : 'Pendent')),
      quizId: q.id,
      quizInProgress: !!q.in_progress,
      quizAttempted: !!q.user_attempt,
      quizQuestions: q.question_count ?? 0,
      isPresential: q.is_presential === 1,
      modality: q.modality ?? '',
      departments: q.target_departments ?? [],
      startAt: q.start_at ?? null,
      endAt: q.end_at ?? null,
      body_html: q.body_html ?? null,
      page_content: q.page_content ?? null,
      image: q.image || undefined,
    })) as CatalogItem[];

  const catalog: CatalogItem[] = [...externes, ...internes].filter(
    item => item.status !== 'Completat' && item.status !== 'No aprovat'
  );
  const filteredCatalog = catalog.filter(item => {
    const matchDept = campusDeptFilter.length === 0 || (item.departments ?? []).some(d => campusDeptFilter.includes(d));
    const matchStatus = statusFilter === 'Tots els estats' || item.status === statusFilter;
    const q = campusSearch.trim().toLowerCase();
    const matchSearch = !q || [item.title, item.description, item.category ?? '', item.type].some(f => f.toLowerCase().includes(q));
    return matchDept && matchStatus && matchSearch;
  });

  // Sticky bar rotates only through catalog items already shown with the mandatory
  // badge — sourced from catalog (is_external=1 + non-presential quizzes) so it
  // never shows legacy internal courses that aren't in the catalog view.
  const mandatoryItems: { title: string; subtitle: string; action: (() => void) | null }[] = catalog
    .filter(item => item.mandatory && (
      item.type === 'Externes' ? item.status === 'Pendent' : item.status !== 'Completat'
    ))
    .map(item => ({
      title: item.title,
      subtitle: item.type === 'Externes'
        ? `${item.hours || ''}${item.hours && item.category ? ' · ' : ''}${item.category || ''}`
        : `${item.category || ''}`,
      action: item.type === 'Externes'
        ? (item.url ? () => window.open(item.url!, '_blank', 'noopener,noreferrer') : null)
        : (item.quizId ? () => window.open(`${window.location.pathname}?quiz=${item.quizId}${item.quizInProgress ? '&resume=1' : ''}`, '_blank') : null),
    }));
  const [mandIdx, setMandIdx] = useState(0);
  useEffect(() => {
    if (!pageActive || mandatoryItems.length <= 1) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setMandIdx(i => (i + 1) % mandatoryItems.length), 4500);
    return () => window.clearInterval(id);
  }, [pageActive, mandatoryItems.length]);
  const mandSafeIdx = mandatoryItems.length ? mandIdx % mandatoryItems.length : 0;
  const mandatoryPending = mandatoryItems[mandSafeIdx] ?? null;

  const nowMs = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const deadlineItems = [...externes, ...internes].filter(item => {
    if (!item.endAt || item.status === 'Completat') return false;
    const endMs = new Date(item.endAt).getTime();
    return endMs > nowMs && endMs <= nowMs + twoDaysMs;
  });

  const mandBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mandatoryPending || !pageActive) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let last = window.scrollY;
    let settle: number | undefined;
    const onScroll = () => {
      const el = mandBarRef.current;
      if (!el) return;
      const y = window.scrollY;
      const nudge = Math.max(-7, Math.min(7, (y - last) * 0.6));
      last = y;
      el.style.transform = `translateY(${nudge}px)`;
      if (settle) window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        if (mandBarRef.current) mandBarRef.current.style.transform = 'translateY(0)';
      }, 130);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (settle) window.clearTimeout(settle); };
  }, [mandatoryPending, pageActive]);


  if (selectedCourse) {
    return (
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mb-6"
        >
          <ChevronLeft size={16} /> {t('campus.backToCampus')}
        </button>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          {selectedCourse.image && (
            <img
              src={resolveImg(selectedCourse.image)}
              alt={selectedCourse.title}
              loading="lazy"
              className="w-full object-cover"
              style={{ height: 288 }}
            />
          )}
          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {selectedCourse.modality === 'online' && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
                  {t('campus.online')}
                </span>
              )}
              {selectedCourse.modality === 'presencial' && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#d1fae5] text-[#065f46] dark:bg-[#14532d] dark:text-[#86efac]">
                  {t('campus.presential')}
                </span>
              )}
              {selectedCourse.modality === 'hibrida' && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#ede9fe] text-[#5b21b6] dark:bg-[#2e1065] dark:text-[#c4b5fd]">
                  {t('campus.hibrida')}
                </span>
              )}
              {!!selectedCourse.mandatory && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                  {t('campus.mandatory')}
                </span>
              )}
              <span className={cn("text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded ml-auto flex-shrink-0", STATUS_COLORS[selectedCourse.status])}>
                {selectedCourse.status}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
              {selectedCourse.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800 flex-wrap">
              {selectedCourse.hours && (
                <span className="flex items-center gap-1.5"><Clock size={13} />{selectedCourse.hours}</span>
              )}
              {(selectedCourse.startAt || selectedCourse.endAt) && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {selectedCourse.startAt ? selectedCourse.startAt.slice(0,10).split('-').reverse().join('/') : ''}
                  {selectedCourse.startAt && selectedCourse.endAt ? ' – ' : ''}
                  {selectedCourse.endAt ? selectedCourse.endAt.slice(0,10).split('-').reverse().join('/') : ''}
                </span>
              )}
            </div>
            {selectedCourse.description && !selectedCourse.body_html && !selectedCourse.page_content && (
              <p className="text-gray-600 dark:text-zinc-300 text-base leading-relaxed mb-6">
                {selectedCourse.description}
              </p>
            )}
            {selectedCourse.page_content && (() => {
              try {
                const blocks = JSON.parse(selectedCourse.page_content!);
                if (!Array.isArray(blocks) || !blocks.length) return null;
                const sorted = [...blocks].sort((a, b) => a.y - b.y || a.x - b.x);
                return (
                  <div className="formation-body mb-6 space-y-3">
                    {sorted.map((block: any) => {
                      const c = block.content || '';
                      switch (block.type) {
                        case 'headline': return <h2 key={block.id} className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{c}</h2>;
                        case 'subhead': return <h3 key={block.id} className="text-lg font-semibold">{c}</h3>;
                        case 'byline': return <p key={block.id} className="text-sm text-[var(--tavil-faint)]">{c}</p>;
                        case 'paragraph': return <p key={block.id} className="text-base leading-relaxed text-[var(--tavil-text)]" dangerouslySetInnerHTML={{ __html: c }} />;
                        case 'image': return block.url ? <img key={block.id} src={resolveImg(block.url)} alt={c} className="w-full rounded-xl object-cover max-h-72" /> : null;
                        case 'list': return (
                          <ul key={block.id} className="list-disc list-inside space-y-1 text-base text-[var(--tavil-text)]">
                            {c.split('\n').filter(Boolean).map((li: string, i: number) => <li key={i}>{li}</li>)}
                          </ul>
                        );
                        case 'pullquote': return <blockquote key={block.id} className="border-l-4 border-[var(--tavil-accent)] pl-4 italic text-[var(--tavil-muted)]">{c}</blockquote>;
                        case 'divider': return <hr key={block.id} className="border-[var(--tavil-border)]" />;
                        case 'link': return block.url ? <a key={block.id} href={block.url} target="_blank" rel="noopener noreferrer" className="text-[var(--tavil-accent)] underline text-sm">{c || block.url}</a> : null;
                        default: return c ? <p key={block.id} className="text-base leading-relaxed">{c}</p> : null;
                      }
                    })}
                  </div>
                );
              } catch { return null; }
            })()}
            {selectedCourse.body_html && !selectedCourse.page_content && (
              <div
                className="formation-body mb-6"
                dangerouslySetInnerHTML={{ __html: selectedCourse.body_html }}
              />
            )}
            <div className="flex flex-col gap-3">
              {selectedCourse.type === 'Externes' && selectedCourse.url && (
                <button
                  onClick={() => openExternalCourse(selectedCourse)}
                  className="flex items-center justify-center gap-2 text-sm font-semibold py-3 px-6 rounded-xl bg-[#222725] text-white hover:bg-[#2e3530] dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white transition-colors"
                >
                  <ExternalLink size={15} /> {t('campus.openCourse')}
                </button>
              )}
              {selectedCourse.type === 'Internes' && selectedCourse.quizId && !selectedCourse.isPresential && selectedCourse.status !== 'Completat' && (
                <button
                  onClick={() => window.open(`${window.location.pathname}?quiz=${selectedCourse.quizId}${selectedCourse.quizInProgress ? '&resume=1' : ''}`, '_blank')}
                  className={`flex items-center justify-center gap-2 text-sm font-semibold py-3 px-6 rounded-xl text-white transition-colors ${selectedCourse.quizInProgress ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#222725] hover:bg-[#2e3530]'}`}
                >
                  <PlayCircle size={15} /> {selectedCourse.quizInProgress ? t('campus.continue') : t('campus.start')}
                </button>
              )}
              {selectedCourse.type === 'Internes' && selectedCourse.isPresential && (
                <p className="text-sm text-center text-gray-400 dark:text-zinc-500">{t('campus.attendanceByAdmin')}</p>
              )}
              {selectedCourse.type === 'Externes' && selectedCourse.requiresCert && selectedCourse.certificateStatus === null && (
                <div onClick={e => e.stopPropagation()}>
                  <CertUploader onUpload={f => handleCertUpload(selectedCourse, f)} />
                </div>
              )}
              {selectedCourse.type === 'Externes' && selectedCourse.requiresCert && selectedCourse.certificateStatus === 'pending' && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <Clock size={11} /> {t('campus.certPendingValidation')}
                </div>
              )}
              {selectedCourse.type === 'Externes' && selectedCourse.requiresCert && selectedCourse.certificateStatus === 'rejected' && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] text-red-500 dark:text-red-400 text-center">{t('campus.certRejected')}</div>
                  <CertUploader onUpload={f => handleCertUpload(selectedCourse, f)} reupload />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobileCampus) {
    const inProgress = courses.filter(c => c.user_progress > 0 && c.user_progress < 100);
    const allMobileItems = [...externes, ...internes];
    const mobileCats = ['Tot', ...Array.from(new Set(allMobileItems.map(i => i.category).filter((c): c is string => !!c)))];
    const mobileFiltered = allMobileItems.filter(item =>
      item.status !== 'Completat' &&
      item.status !== 'No aprovat' &&
      (mobileCat === 'Tot' || item.category === mobileCat)
    );
    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} aria-label={t('common.back') || 'Enrere'} style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', pointerEvents: 'none' }}>Campus TAVIL</span>
        </div>
        {/* Kicker + title */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{t('campus.kicker')}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>Campus TAVIL</h1>
          <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('campus.mobileSubtitle')}</p>
        </div>
        {/* 3-stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 16px 20px' }}>
          {[
            { value: String(inProgress.length), label: t('campus.inProgress'), color: 'var(--tavil-text)' },
            { value: String(completed.length), label: t('campus.completedCount'), color: '#7a8a6b' },
            { value: `${completedHours}h`, label: t('campus.thisYear'), color: 'var(--tavil-text)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: s.color, letterSpacing: '0em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--tavil-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Continue card — first in-progress */}
        {inProgress[0] && (
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{t('campus.continueWhere')}</div>
            <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tavil-muted)', background: 'var(--tavil-bg)', border: '1px solid var(--tavil-border)', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{inProgress[0].category}</span>
              </div>
              <div style={{ padding: '12px 16px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 10, lineHeight: 1.2 }}>{inProgress[0].title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8 }}>
                  <span>{inProgress[0].hours}</span><span>{inProgress[0].user_progress}{t('campus.completedPct')}</span>
                </div>
                <div style={{ height: 5, background: 'var(--tavil-border)', borderRadius: 3 }}>
                  <div style={{ height: 5, width: '100%', background: 'var(--tavil-text)', borderRadius: 3, transform: `scaleX(${inProgress[0].user_progress / 100})`, transformOrigin: 'left', transition: 'transform 400ms var(--ease-out-quint)' }} />
                </div>
                {inProgress[0].url && (
                  <button onClick={() => window.open(inProgress[0].url, '_blank', 'noopener,noreferrer')} style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, border: 'none', background: 'var(--tavil-text)', color: 'var(--tavil-bg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('campus.continue')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div data-no-swipe style={{ padding: '0 16px 14px', overflowX: 'auto', display: 'flex', gap: 8 }} className="hide-sb">
          {mobileCats.map(c => (
            <button key={c} onClick={() => setMobileCat(c)} style={{
              flexShrink: 0, height: 32, padding: '0 14px', borderRadius: 999,
              background: mobileCat === c ? 'var(--tavil-text)' : 'var(--tavil-card)',
              color: mobileCat === c ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${mobileCat === c ? 'var(--tavil-text)' : 'var(--tavil-border)'}`,
            } as React.CSSProperties}>{c}</button>
          ))}
        </div>

        {/* Course list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mobileFiltered.map((item, i) => (
            <div key={item.id} className="anim-item" onClick={() => setSelectedCourse(item)} style={{ '--i': i, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' } as React.CSSProperties}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                {item.modality === 'online' && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: 6, padding: '2px 8px' }}>{t('campus.online')}</span>}
                {item.modality === 'presencial' && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#065f46', background: '#d1fae5', borderRadius: 6, padding: '2px 8px' }}>{t('campus.presential')}</span>}
                {item.modality === 'hibrida' && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5b21b6', background: '#ede9fe', borderRadius: 6, padding: '2px 8px' }}>{t('campus.hibrida')}</span>}
                <span style={{ fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: '2px 8px', marginLeft: 'auto', background: item.status === 'Completat' ? '#d1fae5' : item.status === 'En curs' ? '#fef3c7' : 'var(--tavil-bg)', color: item.status === 'Completat' ? '#065f46' : item.status === 'En curs' ? '#92400e' : 'var(--tavil-muted)' }}>{item.status}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 6, lineHeight: 1.3 }}>{item.title}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--tavil-muted)', alignItems: 'center' }}>
                {item.hours && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{item.hours}</span>}
                {(item.startAt || item.endAt) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={11} />
                    {item.startAt ? item.startAt.slice(0, 10).split('-').reverse().join('/') : ''}
                    {item.startAt && item.endAt ? ' – ' : ''}
                    {item.endAt ? item.endAt.slice(0, 10).split('-').reverse().join('/') : ''}
                  </span>
                )}
                {item.mandatory && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '1px 7px' }}>{t('campus.mandatory')}</span>}
              </div>
              {item.status === 'En curs' && typeof item.progress === 'number' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tavil-muted)', marginBottom: 5 }}><span>{t('campus.progress')}</span><span>{item.progress}%</span></div>
                  <div style={{ height: 4, background: 'var(--tavil-border)', borderRadius: 2 }}>
                    <div style={{ height: 4, width: '100%', background: 'var(--tavil-text)', borderRadius: 2, transform: `scaleX(${(item.progress ?? 0) / 100})`, transformOrigin: 'left', transition: 'transform 400ms var(--ease-out-quint)' }} />
                  </div>
                </div>
              )}
              {item.type === 'Externes' && item.url && (
                <button onClick={(e) => { e.stopPropagation(); openExternalCourse(item); }} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 44, borderRadius: 10, border: '1px solid var(--tavil-border)', background: 'transparent', color: 'var(--tavil-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <ExternalLink size={13} /> {t('campus.openCourse')}
                </button>
              )}
              {item.type === 'Internes' && item.quizId && !item.isPresential && item.status !== 'Completat' && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`${window.location.pathname}?quiz=${item.quizId}${item.quizInProgress ? '&resume=1' : ''}`, '_blank'); }}
                  style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 44, borderRadius: 10, border: 'none', background: item.quizInProgress ? '#d97706' : 'var(--tavil-text)', color: 'var(--tavil-bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <PlayCircle size={13} /> {item.quizInProgress ? t('campus.continue') : t('campus.start')}
                </button>
              )}
            </div>
          ))}
          {mobileFiltered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tavil-faint)', fontSize: 13 }}>{t('campus.noCoursesInCat')}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('campus.platformSubtitle')}</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {([{ key: 'Catàleg', label: t('campus.tabCatalog') }, { key: 'El meu progrés', label: t('campus.tabMyProgress') }].map(({ key, label }) =>
          <UnderlineTab key={key} label={label} active={activeTab === key} onClick={() => setActiveTab(key)} />
        ))}
      </div>

      <div key={activeTab} className="anim-tab">
      {activeTab === 'Catàleg' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={campusSearch} onChange={e => setCampusSearch(e.target.value)} placeholder={t('campus.searchCourses')} aria-label={t('campus.searchCourses')} className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
            </div>
            <DropdownMultiselect
              options={DEPT_ORDER}
              value={campusDeptFilter}
              onChange={setCampusDeptFilter}
              getLabel={(d) => deptLabel(d, i18n.language)}
              placeholder={t('campus.allDepartments')}
            />
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => <FilterChip key={s} label={statusLabel(s)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />)}
            </div>
          </div>
          {deadlineItems.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3.5 flex items-start gap-2.5">
              <span className="text-amber-600 dark:text-amber-400 text-sm font-bold flex-shrink-0 mt-0.5">⚑</span>
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">{t('campus.deadlineWarning')}</p>
                <ul className="space-y-0.5">
                  {deadlineItems.map(item => (
                    <li key={item.id} className="text-xs text-amber-600 dark:text-amber-400">
                      {item.title} — {new Date(item.endAt!).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : i18n.language === 'es' ? 'es-ES' : 'ca-ES', { day: 'numeric', month: 'long' })}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", mandatoryPending && "pb-28")}>
            {filteredCatalog.map((item, i) => (
              <CatalogCard
                key={item.id}
                item={item}
                i={i}
                onSelect={setSelectedCourse}
                onOpenExternal={openExternalCourse}
                onCertUpload={handleCertUpload}
              />
            ))}
          </div>
          {mandatoryPending && pageActive && createPortal(
            <div
              className="fixed bottom-6 right-0 z-40 flex justify-center px-4 pointer-events-none anim-slide-up"
              style={{ left: 'var(--shell-left, 0px)' }}
            >
              <div
                ref={mandBarRef}
                className="pointer-events-auto w-full max-w-[520px] flex items-center gap-3 rounded-xl border border-[var(--tavil-border)] bg-[var(--tavil-card)] px-4 py-3 shadow-[0_8px_32px_rgba(34,39,37,0.14)]"
                style={{ transition: 'transform 420ms cubic-bezier(0.22,1,0.36,1)', willChange: 'transform' }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded flex-shrink-0">{t('campus.mandatory')}</span>
                <div className="flex-1 min-w-0">
                  {/* keyed → fades on each carousel rotation */}
                  <div key={mandSafeIdx} className="anim-fade-in min-w-0">
                    <p className="text-sm font-semibold text-[var(--tavil-text)] truncate">{mandatoryPending.title}</p>
                    <p className="text-xs text-[var(--tavil-muted)] truncate">{mandatoryPending.subtitle}</p>
                  </div>
                  {mandatoryItems.length > 1 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {mandatoryItems.map((_, di) => (
                        <button
                          key={di}
                          onClick={() => setMandIdx(di)}
                          aria-label={`Anar a obligatòria ${di + 1}`}
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: di === mandSafeIdx ? 14 : 6,
                            background: di === mandSafeIdx ? 'var(--tavil-accent)' : 'var(--tavil-border)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => mandatoryPending.action?.()}
                  disabled={!mandatoryPending.action}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--tavil-accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0 flex items-center gap-1.5"
                >
                  <PlayCircle size={13} /> {t('campus.doTraining')}
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {activeTab === 'El meu progrés' && (() => {
        const allCompleted = catalog.filter(item => item.status === 'Completat');
        const allInProgress = catalog.filter(item => item.status === 'En curs');
        const allPending = catalog.filter(item => item.status === 'Pendent');
        const allFailed = catalog.filter(item => item.status === 'No aprovat');
        const totalHours = allCompleted.filter(item => item.hours).reduce((s, item) => s + (parseInt(item.hours ?? '0') || 0), 0);

        const groups: { label: string; items: typeof catalog; emptyText: string }[] = [
          { label: t('campus.inProgress'), items: allInProgress, emptyText: t('campus.noProgressGroup') },
          { label: t('campus.completedStat') + 's', items: allCompleted, emptyText: t('campus.noCompletedGroup') },
          { label: t('campus.statuses.notApproved'), items: allFailed, emptyText: '' },
          { label: t('campus.pendingGroup'), items: allPending, emptyText: t('campus.noPendingGroup') },
        ].filter(g => g.items.length > 0 || g.label === t('campus.pendingGroup'));

        return (
          <>
            {/* Summary */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 mb-6">
              <h3 className="font-semibold text-[var(--tavil-text)] text-sm mb-4">{t('campus.progressSummary')}</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: t('campus.completedStat'), value: String(allCompleted.length) },
                  { label: t('campus.inProgress'), value: String(allInProgress.length) },
                  { label: t('campus.hours'), value: totalHours > 0 ? `${totalHours}h` : '—' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-3xl font-bold text-[var(--tavil-text)]">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Groups */}
            {groups.map(group => (
              <div key={group.label} className="mb-6">
                <h3 className="font-semibold text-[var(--tavil-text)] text-sm mb-3 flex items-center gap-2">
                  {group.label}
                  <span className="text-[11px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">{group.items.length}</span>
                </h3>
                {group.items.length > 0 ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 divide-y divide-gray-50 dark:divide-zinc-800">
                    {group.items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4">
                        <GraduationCap size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--tavil-text)] text-sm truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.type === 'Externes' ? (item.hours ? `${item.hours}` : '') : ''}
                            {item.category ? ` · ${item.category}` : ''}
                            {item.mandatory ? <span className="text-red-600 dark:text-red-400 font-medium"> · {t('campus.mandatory')}</span> : null}
                          </p>
                          {typeof item.progress === 'number' && item.progress > 0 && item.progress < 100 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-[var(--tavil-text)]" style={{ width: `${item.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-500">{item.progress}%</span>
                            </div>
                          )}
                        </div>
                        <span className={cn("text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded flex-shrink-0", STATUS_COLORS[item.status])}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  group.emptyText ? <p className="text-xs text-gray-400 dark:text-zinc-500">{group.emptyText}</p> : null
                )}
              </div>
            ))}
          </>
        );
      })()}


      
      </div>
    </div>
  );
}