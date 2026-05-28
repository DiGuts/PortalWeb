import { tabPrefetch, tabPrefetchAt, isTabCacheFresh } from '../../lib/tabPrefetch';
import { scrollPageToTop } from '../../lib/scroll';
import { cn } from '../../lib/cn';
import { useIsMobile } from '../../lib/useIsMobile';
import { usePersistedSubTab } from '../../lib/usePersistedSubTab';
import { ChevronLeft, Clock, ExternalLink, Search, PlayCircle, CheckCircle, GraduationCap, X, AlignLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Course, Quiz, QuizAttemptResult, apiGetCourses, apiGetQuizzes, apiGetQuiz, apiSubmitQuizAttempt, User } from '../../api';
import { FilterChip } from '../shared/FilterChip';
import { UnderlineTab } from '../shared/UnderlineTab';


interface Props {
  currentUser: User | null;
  onBack?: () => void;
  // add whatever props the function needs from App
}

const STATUS_COLORS: Record<string, string> = {
  "En curs":   "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  "Pendent":   "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "Completat": "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
};

export function CampusTavilTab({ currentUser, onBack }: Props) {
  type CatalogItem = {
    id: string;
    type: 'Externes' | 'Internes';
    title: string;
    description: string;
    category?: string;
    hours?: string;
    mandatory?: boolean;
    status: 'Pendent' | 'En curs' | 'Completat';
    progress?: number;
    url?: string;
    quizId?: number;
    quizInProgress?: boolean;
    quizAttempted?: boolean;
    quizQuestions?: number;
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
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  useEffect(() => { scrollPageToTop(); }, [activeQuiz]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  useEffect(() => {
    if (isTabCacheFresh('courses')) return;
    apiGetCourses().then(d => { setCourses(d); tabPrefetch.courses = d; tabPrefetchAt.courses = Date.now(); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'Proves' || activeTab === 'Catàleg') {
      apiGetQuizzes().then(setQuizList).catch(console.error);
    }
  }, [activeTab]);

  const startQuiz = async (q: Quiz) => {
    const full = await apiGetQuiz(q.id);
    setActiveQuiz(full);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setQuizSubmitting(true);
    try {
      const result = await apiSubmitQuizAttempt(activeQuiz.id, quizAnswers);
      setQuizResult(result);
      apiGetQuizzes().then(setQuizList).catch(console.error);
    } catch (e) { console.error(e); }
    finally { setQuizSubmitting(false); }
  };

  const completed = courses.filter(c => c.user_status === 'Completat');
  const pending = courses.filter(c => c.user_status === 'Pendent');
  const completedHours = completed.reduce((s, c) => s + (parseInt(c.hours) || 0), 0);
  const mandatoryPending = courses.find(c => !!c.mandatory && c.user_status === 'Pendent');

  const kinds = ['Totes', 'Externes', 'Internes'];
  const statuses = ['Tots els estats', 'Pendent', 'En curs', 'Completat'];

  const externes: CatalogItem[] = courses
    .filter(c => c.is_external === 1)
    .map(c => ({
      id: `course-${c.id}`,
      type: 'Externes',
      title: c.title,
      description: c.description ?? '',
      category: c.category,
      hours: c.hours,
      mandatory: !!c.mandatory,
      status: c.user_status === 'Completat' ? 'Completat' : (c.user_progress > 0 ? 'En curs' : 'Pendent'),
      progress: c.user_progress,
      url: c.url,
    }));

  const internes: CatalogItem[] = quizList
    .filter(q => !q.is_presential)
    .map(q => ({
      id: `quiz-${q.id}`,
      type: 'Internes',
      title: q.title,
      description: q.description ?? '',
      category: q.category,
      status: q.user_attempt?.passed ? 'Completat' : (q.in_progress ? 'En curs' : 'Pendent'),
      quizId: q.id,
      quizInProgress: !!q.in_progress,
      quizAttempted: !!q.user_attempt,
      quizQuestions: q.question_count ?? 0,
    }));

  const catalog: CatalogItem[] = [...externes, ...internes];
  const filteredCatalog = catalog.filter(item => {
    const matchKind = kindFilter === 'Totes' || item.type === kindFilter;
    const matchStatus = statusFilter === 'Tots els estats' || item.status === statusFilter;
    const q = campusSearch.trim().toLowerCase();
    const matchSearch = !q || [item.title, item.description, item.category ?? '', item.type].some(f => f.toLowerCase().includes(q));
    return matchKind && matchStatus && matchSearch;
  });


  if (isMobileCampus) {
    const inProgress = courses.filter(c => c.user_progress > 0 && c.user_progress < 100);
    const MOBILE_CATS = ['Tot', 'Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Producció', 'Habilitats'];
    const mobileFiltered = courses.filter(c => mobileCat === 'Tot' || c.category === mobileCat);
    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
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
            { value: String(inProgress.length), label: t('campus.inProgress'), color: 'var(--tavil-accent)' },
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
              <div style={{ height: 80, background: 'var(--tavil-accent)', display: 'flex', alignItems: 'center', padding: '0 18px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 999 }}>{inProgress[0].category}</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 10 }}>{inProgress[0].title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8 }}>
                  <span>{inProgress[0].hours}</span><span>{inProgress[0].user_progress}{t('campus.completedPct')}</span>
                </div>
                <div style={{ height: 5, background: 'var(--tavil-border)', borderRadius: 3 }}>
                  <div style={{ height: 5, width: '100%', background: 'var(--tavil-accent)', borderRadius: 3, transform: `scaleX(${inProgress[0].user_progress / 100})`, transformOrigin: 'left', transition: 'transform 400ms var(--ease-out-quint)' }} />
                </div>
                {inProgress[0].url && (
                  <button onClick={() => window.open(inProgress[0].url, '_blank', 'noopener,noreferrer')} style={{ marginTop: 14, width: '100%', height: 42, borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                {!!course.mandatory && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '1px 7px' }}>Obligatòria</span>}
              </div>
              {course.user_progress > 0 && course.user_progress < 100 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tavil-muted)', marginBottom: 5 }}><span>Progrés</span><span>{course.user_progress}%</span></div>
                  <div style={{ height: 4, background: 'var(--tavil-border)', borderRadius: 2 }}>
                    <div style={{ height: 4, width: '100%', background: 'var(--tavil-accent)', borderRadius: 2, transform: `scaleX(${course.user_progress / 100})`, transformOrigin: 'left', transition: 'transform 400ms var(--ease-out-quint)' }} />
                  </div>
                </div>
              )}
              {course.url && (
                <button onClick={() => window.open(course.url, '_blank', 'noopener,noreferrer')} style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 38, borderRadius: 10, border: '1px solid #e8d0cf', background: 'transparent', color: 'var(--tavil-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
              <input type="text" value={campusSearch} onChange={e => setCampusSearch(e.target.value)} placeholder="Cercar cursos..." className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white" />
            </div>
            <div className="flex flex-wrap gap-2">
              {kinds.map(k => <FilterChip key={k} label={k} active={kindFilter === k} onClick={() => setKindFilter(k)} />)}
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCatalog.map((item, i) => (
              <div key={item.id} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5 anim-item flex flex-col" style={{ '--i': i } as React.CSSProperties}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{item.type}{item.category ? ` · ${item.category}` : ''}</span>
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", STATUS_COLORS[item.status])}>{item.status}</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed line-clamp-2">{item.description}</p>
                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.hours && <><Clock size={12} /><span>{item.hours}</span></>}
                    {!!item.mandatory && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">Obligatòria</span>}
                    {item.type === 'Internes' && <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-bold">{item.quizQuestions ?? 0} preguntes</span>}
                  </div>
                  {typeof item.progress === 'number' && item.progress > 0 && item.progress < 100 && (
                    <><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progrés</span><span>{item.progress}%</span></div><div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${item.progress}%`, background: 'var(--tavil-accent)' }} /></div></>
                  )}
                  {item.type === 'Externes' && item.url && (
                    <button onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 py-1.5 rounded-lg transition-colors">
                      <ExternalLink size={12} /> Obrir curs
                    </button>
                  )}
                  {item.type === 'Internes' && item.quizId && (
                    <button
                      onClick={() => window.open(`${window.location.pathname}?quiz=${item.quizId}${item.quizInProgress ? '&resume=1' : ''}`, '_blank')}
                      className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white py-1.5 rounded-lg transition-colors ${item.quizInProgress ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#bf211e] hover:bg-[#a21b18]'}`}
                    >
                      <PlayCircle size={12} /> {item.quizInProgress ? 'Continuar' : (item.quizAttempted ? 'Repetir' : 'Comença')}
                    </button>
                  )}
                </div>
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


      
      </div>
    </div>
  );
}