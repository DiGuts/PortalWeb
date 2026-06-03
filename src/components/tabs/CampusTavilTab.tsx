import { tabPrefetch, tabPrefetchAt, isTabCacheFresh } from '../../lib/tabPrefetch';
import { scrollPageToTop } from '../../lib/scroll';
import { cn } from '../../lib/cn';
import { useIsMobile } from '../../lib/useIsMobile';
import { usePersistedSubTab } from '../../lib/usePersistedSubTab';
import { ChevronLeft, Clock, ExternalLink, Search, PlayCircle, GraduationCap, UploadCloud } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Course, Quiz, apiGetCourses, apiGetQuizzes, apiUpdateCourseProgress, apiUploadCertificate, openCertificateFile, User } from '../../api';
import { FilterChip } from '../shared/FilterChip';
import { UnderlineTab } from '../shared/UnderlineTab';


// ── Certificate uploader: paste (Ctrl+V) · drag-drop · file picker ──────────
function CertUploader({ onUpload, reupload = false }: { onUpload: (f: File) => void; reupload?: boolean }) {
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
        <img src={clip.preview} alt="" className="w-full h-20 object-cover rounded" />
        <div className="flex gap-1.5">
          <button
            onClick={() => { onUpload(clip.file); setClip(null); }}
            className="flex-1 text-xs font-semibold py-1.5 rounded-md bg-[#222725] text-white hover:bg-[#2e3530] dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white transition-colors"
          >
            Puja aquest certificat
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
        {reupload ? 'Torna a pujar' : 'Puja el certificat'}
      </span>
      <span className="text-[10px] opacity-50">PDF o imatge · arrossega o Ctrl+V</span>
    </label>
  );
}

interface Props {
  currentUser: User | null;
  onBack?: () => void;
  pageActive?: boolean;   // true only when Campus is the active page (not exiting)
  // add whatever props the function needs from App
}

const STATUS_COLORS: Record<string, string> = {
  "En curs":   "bg-[#fde68a] text-[#854d0e] dark:bg-[#5c4313] dark:text-[#fcd34d]",
  "Pendent":   "bg-[#e2e8f0] text-[#475569] dark:bg-[#334155] dark:text-[#cbd5e1]",
  "Completat": "bg-[#bbf7d0] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]",
  "No aprovat":"bg-[#fecaca] text-[#991b1b] dark:bg-[#5a1414] dark:text-[#fca5a5]",
};

export function CampusTavilTab({ currentUser, onBack, pageActive = true }: Props) {
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
    certificateStatus?: 'pending' | 'approved' | 'rejected' | null;
    certificateId?: number | null;
  };
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>(() => tabPrefetch.courses ?? []);
  const [activeTab, setActiveTab] = usePersistedSubTab<string>('campus', 'Catàleg', ['Catàleg', 'El meu progrés', 'Proves', ] as const);
  const [kindFilter, setKindFilter] = useState('Totes');
  const [statusFilter, setStatusFilter] = useState('Tots els estats');
  const [campusSearch, setCampusSearch] = useState('');
  const isMobileCampus = useIsMobile();
  const [mobileCat, setMobileCat] = useState('Tot');
  const [quizList, setQuizList] = useState<Quiz[]>([]);

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

  const kinds = ['Totes', 'Externes', 'Internes'];
  const statuses = ['Tots els estats', 'Pendent', 'En curs'];

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
    })) as CatalogItem[];

  const catalog: CatalogItem[] = [...externes, ...internes].filter(
    item => item.status !== 'Completat' && item.status !== 'No aprovat'
  );
  const filteredCatalog = catalog.filter(item => {
    const matchKind = kindFilter === 'Totes' || item.type === kindFilter;
    const matchStatus = statusFilter === 'Tots els estats' || item.status === statusFilter;
    const q = campusSearch.trim().toLowerCase();
    const matchSearch = !q || [item.title, item.description, item.category ?? '', item.type].some(f => f.toLowerCase().includes(q));
    return matchKind && matchStatus && matchSearch;
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
        : `${item.quizQuestions ?? 0} preguntes${item.category ? ' · ' + item.category : ''}`,
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


  if (isMobileCampus) {
    const inProgress = courses.filter(c => c.user_progress > 0 && c.user_progress < 100);
    const MOBILE_CATS = ['Tot', 'Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Producció', 'Habilitats'];
    const mobileFiltered = courses.filter(c => c.user_status !== 'Completat' && (mobileCat === 'Tot' || c.category === mobileCat));
    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} aria-label={t('common.back') || 'Enrere'} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
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
                  <button onClick={() => window.open(inProgress[0].url, '_blank', 'noopener,noreferrer')} style={{ marginTop: 14, width: '100%', height: 42, borderRadius: 12, border: 'none', background: 'var(--tavil-text)', color: 'var(--tavil-bg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('campus.continue')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div style={{ padding: '0 16px 14px', overflowX: 'auto', display: 'flex', gap: 8 }} className="hide-sb">
          {MOBILE_CATS.map(c => (
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
          {mobileFiltered.map((course, i) => (
            <div key={i} className="anim-item" style={{ '--i': i, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: '14px 16px' } as React.CSSProperties}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tavil-muted)', background: 'var(--tavil-bg)', border: '1px solid var(--tavil-border)', borderRadius: 6, padding: '2px 8px' }}>{course.category}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: '2px 8px', marginLeft: 'auto', background: course.user_status === 'Completat' ? '#d1fae5' : course.user_progress > 0 ? '#fef3c7' : 'var(--tavil-bg)', color: course.user_status === 'Completat' ? '#065f46' : course.user_progress > 0 ? '#92400e' : 'var(--tavil-muted)' }}>{course.user_status}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 6, lineHeight: 1.3 }}>{course.title}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--tavil-muted)', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{course.hours}</span>
                {Number(course.mandatory) === 1 && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '1px 7px' }}>Obligatòria</span>}
              </div>
              {course.user_progress > 0 && course.user_progress < 100 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tavil-muted)', marginBottom: 5 }}><span>Progrés</span><span>{course.user_progress}%</span></div>
                  <div style={{ height: 4, background: 'var(--tavil-border)', borderRadius: 2 }}>
                    <div style={{ height: 4, width: '100%', background: 'var(--tavil-text)', borderRadius: 2, transform: `scaleX(${course.user_progress / 100})`, transformOrigin: 'left', transition: 'transform 400ms var(--ease-out-quint)' }} />
                  </div>
                </div>
              )}
              {course.url && (
                <button onClick={() => window.open(course.url, '_blank', 'noopener,noreferrer')} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 38, borderRadius: 10, border: '1px solid var(--tavil-border)', background: 'transparent', color: 'var(--tavil-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <ExternalLink size={13} /> Obrir curs
                </button>
              )}
            </div>
          ))}
          {mobileFiltered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--tavil-faint)', fontSize: 13 }}>Cap formació disponible en aquesta categoria.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">Plataforma de formació interna i desenvolupament professional</p>
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-6">
        {['Catàleg', 'El meu progrés'].map(tab => (
          <UnderlineTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </div>

      <div key={activeTab} className="anim-tab">
      {activeTab === 'Catàleg' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={campusSearch} onChange={e => setCampusSearch(e.target.value)} placeholder="Cercar cursos..." aria-label="Cercar cursos" className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
            </div>
            <div className="flex flex-wrap gap-2">
              {kinds.map(k => <FilterChip key={k} label={k} active={kindFilter === k} onClick={() => setKindFilter(k)} />)}
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />)}
            </div>
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", mandatoryPending && "pb-28")}>
            {filteredCatalog.map((item, i) => (
              <div key={item.id} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 anim-item flex flex-col" style={{ '--i': i } as React.CSSProperties}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded",
                      item.type === 'Internes'
                        ? "bg-[#fed7aa] text-[#9a3412] dark:bg-[#5a2a0d] dark:text-[#fdba74]"
                        : "bg-[#c7d2fe] text-[#3730a3] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                    )}>{item.type}{item.category ? ` · ${item.category}` : ''}</span>
                    {item.isPresential && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-[#d1fae5] text-[#065f46] dark:bg-[#14532d] dark:text-[#86efac]">Presencial</span>
                    )}
                  </div>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded flex-shrink-0", STATUS_COLORS[item.status])}>{item.status}</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-[15px] leading-snug">{item.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed line-clamp-2 min-h-[2.5rem]">{item.description}</p>
                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.hours && <><Clock size={12} /><span>{item.hours}</span></>}
                    {!!item.mandatory && <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-1.5 py-0.5 rounded font-semibold">Obligatòria</span>}
                    {item.type === 'Internes' && <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-semibold">{item.quizQuestions ?? 0} preguntes</span>}
                  </div>
                  {typeof item.progress === 'number' && item.progress > 0 && item.progress < 100 && (
                    <><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progrés</span><span>{item.progress}%</span></div><div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${item.progress}%`, background: 'var(--tavil-text)' }} /></div></>
                  )}
                  {item.type === 'Externes' && item.url && (
                    <button onClick={() => openExternalCourse(item)} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 py-1.5 rounded-lg transition-colors">
                      <ExternalLink size={12} /> Obrir curs
                    </button>
                  )}
                  {item.type === 'Externes' && item.certificateStatus === null && (
                    <CertUploader onUpload={f => handleCertUpload(item, f)} />
                  )}
                  {item.type === 'Externes' && item.certificateStatus === 'pending' && (
                    <div className="w-full flex items-center justify-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <Clock size={11} /> Certificat pendent de validació
                    </div>
                  )}
                  {item.type === 'Externes' && item.certificateStatus === 'rejected' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[11px] text-red-500 dark:text-red-400 text-center">Certificat rebutjat</div>
                      <CertUploader onUpload={f => handleCertUpload(item, f)} reupload />
                    </div>
                  )}
                  {item.type === 'Internes' && item.quizId && !item.isPresential && item.status !== 'Completat' && (
                    <button
                      onClick={() => window.open(`${window.location.pathname}?quiz=${item.quizId}${item.quizInProgress ? '&resume=1' : ''}`, '_blank')}
                      className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white py-1.5 rounded-lg transition-colors ${item.quizInProgress ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#8b8c89] hover:bg-[#222725]'}`}
                    >
                      <PlayCircle size={12} /> {item.quizInProgress ? 'Continuar' : 'Comença'}
                    </button>
                  )}
                  {item.type === 'Internes' && item.isPresential && item.status !== 'Completat' && (
                    <p className="text-[11px] text-[var(--tavil-muted)] text-center py-1">Assistència validada per l'administrador</p>
                  )}
                </div>
              </div>
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded flex-shrink-0">Obligatòria</span>
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
                  <PlayCircle size={13} /> Fer la formació
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
          { label: 'En curs', items: allInProgress, emptyText: 'Cap formació en curs.' },
          { label: 'Completats', items: allCompleted, emptyText: 'Cap formació completada.' },
          { label: 'No aprovats', items: allFailed, emptyText: '' },
          { label: 'Pendents', items: allPending, emptyText: 'Cap formació per fer.' },
        ].filter(g => g.items.length > 0 || g.label === 'Pendents');

        return (
          <>
            {/* Summary */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 mb-6">
              <h3 className="font-semibold text-[var(--tavil-text)] text-sm mb-4">Resum del meu progrés</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Completades', value: String(allCompleted.length) },
                  { label: 'En curs', value: String(allInProgress.length) },
                  { label: 'Hores', value: totalHours > 0 ? `${totalHours}h` : '—' },
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
                            {item.type === 'Externes' ? (item.hours ? `${item.hours}` : '') : `${item.quizQuestions ?? 0} preguntes`}
                            {item.category ? ` · ${item.category}` : ''}
                            {item.mandatory ? <span className="text-red-600 dark:text-red-400 font-medium"> · Obligatòria</span> : null}
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