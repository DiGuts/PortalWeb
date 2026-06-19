import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu, Plus, MapPin, Pencil, Trash2, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import { CreateAgendaModal, EditAgendaModal } from '../admin/CreateAgendaModal';
import { FilterChip } from '../shared/FilterChip';
import { DropdownMultiselect } from '../shared/DropdownMultiselect';
import { useIsMobile } from '../../lib/useIsMobile';
import { useScrollIntoViewWhen } from '../../lib/scroll';
import { setGlobalNavHidden } from '../../lib/globalNav';
import { tabPrefetch, tabPrefetchAt, isTabCacheFresh } from '../../lib/tabPrefetch';
import { DEPT_ORDER, deptLabel } from '../../lib/depts';
import { DeptSearch } from '../admin/DeptSearch';
import { ConfirmModal as ConfirmModal } from '../ConfirmDialog';
import {
  User, AgendaEvent,
  apiGetAgendaEvents, apiCreateAgendaEvent, apiUpdateAgendaEvent, apiDeleteAgendaEvent,
} from '../../api';
import { DatePicker, TimePicker } from '../shared/AgendaPickers';
import { useToast } from '../shared/Toast';

// ── Agenda Tab ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'];

const EVENT_COLORS: Record<string, string> = {
  "Sessió interna":    "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  "Festiu":            "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  "Activitat empresa": "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  "Visita comercial":  "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  "Fira":              "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
};


// Catalonia public holidays 2026. Virtual events merged into the agenda client-side.
// Negative ids signal "not stored in DB" so admin edit/delete is suppressed.
const FESTIUS_2026: AgendaEvent[] = [
  { id: -10101, title: 'Any Nou',                       day:  1, month:  1, time: '', location: '', type: 'Festiu' },
  { id: -10106, title: 'Reis',                          day:  6, month:  1, time: '', location: '', type: 'Festiu' },
  { id: -10403, title: 'Divendres Sant',                day:  3, month:  4, time: '', location: '', type: 'Festiu' },
  { id: -10406, title: 'Dilluns de Pasqua',             day:  6, month:  4, time: '', location: '', type: 'Festiu' },
  { id: -10501, title: 'Festa del Treball',             day:  1, month:  5, time: '', location: '', type: 'Festiu' },
  { id: -10624, title: 'Sant Joan',                     day: 24, month:  6, time: '', location: '', type: 'Festiu' },
  { id: -10815, title: "L'Assumpció",                   day: 15, month:  8, time: '', location: '', type: 'Festiu' },
  { id: -10911, title: 'Diada de Catalunya',            day: 11, month:  9, time: '', location: '', type: 'Festiu' },
  { id: -11012, title: "Festa Nacional d'Espanya",      day: 12, month: 10, time: '', location: '', type: 'Festiu' },
  { id: -11101, title: 'Tots Sants',                    day:  1, month: 11, time: '', location: '', type: 'Festiu' },
  { id: -11206, title: 'La Constitució',                day:  6, month: 12, time: '', location: '', type: 'Festiu' },
  { id: -11208, title: 'La Puríssima',                  day:  8, month: 12, time: '', location: '', type: 'Festiu' },
  { id: -11225, title: 'Nadal',                         day: 25, month: 12, time: '', location: '', type: 'Festiu' },
  { id: -11226, title: 'Sant Esteve',                   day: 26, month: 12, time: '', location: '', type: 'Festiu' },
];

export function AgendaTab({ currentUser, initDate, onInitDateConsumed, onOpenDrawer, onNavigate }: { currentUser: User | null; initDate: { day: number; month: number; year: number } | null; onInitDateConsumed: () => void; onOpenDrawer?: () => void; onNavigate?: (tab: string, intent?: 'new') => void }) {
  const [apiAgendaEvents, setApiAgendaEvents] = useState<AgendaEvent[]>(() => tabPrefetch.agendaEvents ?? []);
  const [, setView] = useState<'calendar' | 'list'>('calendar');
  const [activeFilter, setActiveFilter] = useState('Tots');
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [typeFilterMulti, setTypeFilterMulti] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<'setmana' | 'mes'>('setmana');
  const today0 = new Date();
  const [currentMonth, setCurrentMonth] = useState(today0.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today0.getFullYear());

  // Merge Catalonia 2026 festius client-side. Real TAVIL events come from API.
  const agendaEvents = useMemo<AgendaEvent[]>(
    () => currentYear === 2026 ? [...apiAgendaEvents, ...FESTIUS_2026] : apiAgendaEvents,
    [apiAgendaEvents, currentYear]
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(today0.getDate());
  useScrollIntoViewWhen<HTMLDivElement>(selectedDay, { threshold: 0.5, block: 'center', delay: 80 });
  const isAdmin = (() => {
    const r = currentUser?.role ?? '';
    const rs = currentUser?.roles ?? [];
    return ['Administrador', 'Administrador/a', 'Recursos humans', 'Comunicacions', 'Comunicació', 'Formacions'].some(x => x === r || rs.includes(x));
  })();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const MONTH_NAMES = t('common.months', { returnObjects: true }) as string[];

  const typeLabel = (type: string): string => {
    const map: Record<string, string> = {
      'Tots': 'agenda.types.all',
      'Festiu': 'agenda.types.festiu',
      'Fira': 'agenda.types.fira',
      'Visita comercial': 'agenda.types.visitaComercial',
      'Sessió interna': 'agenda.types.sessioInterna',
      'Activitat empresa': 'agenda.types.activitatEmpresa',
      'Formació': 'agenda.types.formacio',
    };
    return map[type] ? t(map[type]) : type;
  };

  const eventRailColor = (ev: AgendaEvent): string => {
    switch (ev.type) {
      case 'Festiu':              return '#e05c5c';
      case 'Activitat empresa':   return '#4ead7a';
      case 'Visita comercial':    return '#e8944a';
      case 'Fira':                return '#5b9bd6';
      case 'Sessió interna':      return '#9b7fd4';
      case 'Formació presencial': return '#3dbfbf';
      case 'Formació externa':    return '#6da8e0';
      default:                    return 'var(--tavil-muted)';
    }
  };

  const DAYS = t('common.days', { returnObjects: true }) as string[];
  const MONTHS_GENITIVE = t('common.monthsGenitive', { returnObjects: true }) as string[];

  const monthGenitiu = (m: number): string =>
    MONTHS_GENITIVE[m] ?? '';

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
  const [closingEventForm, setClosingEventForm] = useState(false);
  // Edit event id — declared early so the nav-hide effect can reference it
  const [evEditId, setEvEditId] = useState<number | null>(null);
  const [evEditClosing, setEvEditClosing] = useState(false);
  // Hide bottom nav when any form sheet is open (create or edit)
  useEffect(() => { setGlobalNavHidden(showEventForm || evEditId !== null); }, [showEventForm, evEditId]);
  const [eTitle, setETitle] = useState('');
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('');
  const [eTimeEnd, setETimeEnd] = useState('');
  const [eLocation, setELocation] = useState('');
  const [eType, setEType] = useState('Sessió interna');
  const [eDepts, setEDepts] = useState<string[]>([]);
  const [eSaving, setESaving] = useState(false);

  const closeEventForm = () => {
    setClosingEventForm(true);
    setTimeout(() => { setShowEventForm(false); setClosingEventForm(false); }, 260);
  };

  const handleCreateEvent = async () => {
    if (!eTitle.trim() || !eDate) return;
    const [yStr, mStr, dStr] = eDate.split('-');
    const day = parseInt(dStr); const month = parseInt(mStr); const year = parseInt(yStr);
    if (!day || !month || !year) return;
    setESaving(true);
    try {
      await apiCreateAgendaEvent({ title: eTitle.trim(), day, month, year,
        time: eTime.trim(), time_end: eTimeEnd.trim() || undefined,
        location: eLocation.trim(), type: eType, target_departments: eDepts });
      setApiAgendaEvents(await apiGetAgendaEvents());
      closeEventForm();
      setTimeout(() => { setETitle(''); setEDate(''); setETime(''); setETimeEnd(''); setELocation(''); setEDepts([]); }, 260);
      toast.success('Esdeveniment creat');
    } catch (e: any) { toast.error(e?.message ?? 'Error creant l\'esdeveniment'); }
    finally { setESaving(false); }
  };

  // Edit event state
  const closeEvEdit = () => { setEvEditClosing(true); setTimeout(() => { setEvEditId(null); setEvEditClosing(false); }, 220); };
  const [eeTitle, setEeTitle] = useState('');
  const [eeDate, setEeDate] = useState('');
  const [eeTime, setEeTime] = useState('');
  const [eeTimeEnd, setEeTimeEnd] = useState('');
  const [eeLocation, setEeLocation] = useState('');
  const [eeType, setEeType] = useState('Sessió interna');
  const [eeDepts, setEeDepts] = useState<string[]>([]);
  const [eeSaving, setEeSaving] = useState(false);

  const openEvEdit = (ev: AgendaEvent) => {
    setEvEditId(ev.id); setEeTitle(ev.title);
    const yyyy = String(currentYear);
    const mm = String(ev.month).padStart(2, '0');
    const dd = String(ev.day).padStart(2, '0');
    setEeDate(`${yyyy}-${mm}-${dd}`);
    setEeTime(ev.time || '');
    setEeTimeEnd(ev.time_end || '');
    setEeLocation(ev.location || ''); setEeType(ev.type);
    setEeDepts(ev.target_departments ?? []);
  };

  const handleSaveEvEdit = async () => {
    if (!evEditId || !eeTitle.trim() || !eeDate) return;
    const [yStr, mStr, dStr] = eeDate.split('-');
    const day = parseInt(dStr); const month = parseInt(mStr); const year = parseInt(yStr);
    if (!day || !month || !year) return;
    setEeSaving(true);
    try {
      await apiUpdateAgendaEvent(evEditId, { title: eeTitle.trim(), day,
        month, year, time: eeTime.trim(), time_end: eeTimeEnd.trim() || undefined,
        location: eeLocation.trim(), type: eeType, target_departments: eeDepts });
      setApiAgendaEvents(await apiGetAgendaEvents());
      setEvEditId(null);
      toast.success('Canvis guardats');
    } catch (e: any) { toast.error(e?.message ?? 'Error guardant l\'esdeveniment'); }
    finally { setEeSaving(false); }
  };

  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleDeleteEvent = (id: number) => {
    setConfirmModal({
      message: t('agenda.confirmDelete'),
      onConfirm: async () => {
        setConfirmModal(null);
        try { await apiDeleteAgendaEvent(id); setApiAgendaEvents(await apiGetAgendaEvents()); toast.info('Esdeveniment eliminat'); }
        catch (e: any) { toast.error(e?.message ?? 'Error eliminant l\'esdeveniment'); }
      },
    });
  };

  useEffect(() => {
    if (isTabCacheFresh('agendaEvents')) return;
    apiGetAgendaEvents().then(d => { setApiAgendaEvents(d); tabPrefetch.agendaEvents = d; tabPrefetchAt.agendaEvents = Date.now(); }).catch(console.error);
  }, []);

  const navigateMonth = (dir: 1 | -1) => {
    // Compute purely, then set both states once (no nested setState in an
    // updater — that can fire setCurrentYear twice and skip a year).
    let nm = currentMonth + dir;
    let ny = currentYear;
    if (nm > 12) { nm = 1; ny += 1; }
    else if (nm < 1) { nm = 12; ny -= 1; }
    setCurrentMonth(nm);
    setCurrentYear(ny);
  };

  const filters = ['Tots', 'Festiu', 'Fira', 'Sessió interna', 'Activitat empresa'];

  // Festius always pass (affect everyone). Events with no target_departments are visible to all.
  // Otherwise the selected deptFilter must be in target_departments. 'Tots' = no filtering.
  const passesDept = (e: AgendaEvent): boolean => {
    if (deptFilter.length === 0) return true;
    if (e.type === 'Festiu') return true;
    const td = e.target_departments;
    if (!td || td.length === 0) return true;
    return td.some(d => deptFilter.includes(d));
  };

  const filteredEvents = (activeFilter === 'Tots' ? agendaEvents : agendaEvents.filter(e => e.type === activeFilter))
    .filter(passesDept)
    .filter(e => (e.id ?? 0) < 0 ? true : (!e.year || Number(e.year) === currentYear));

  // Build calendar cell events map for the current month
  const calendarEvents: Record<number, AgendaEvent[]> = {};
  filteredEvents.filter(e => e.month === currentMonth).forEach(e => {
    if (!calendarEvents[e.day]) calendarEvents[e.day] = [];
    calendarEvents[e.day].push(e);
  });

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const isMobileAgenda = useIsMobile();
  const cells: (number | null)[] = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  // ── Scrollable day strip ref (hoisted here so hooks aren't inside a conditional) ──
  const stripRef = useRef<HTMLDivElement>(null);

  // Visible-month label for the week-snap strip (e.g. "JUNY 2026")
  const [stripVisibleMonth, setStripVisibleMonth] = useState<string>('');

  // Helper: get the Monday of the week containing a given date
  const getMondayOf = (d: Date): Date => {
    const dow = d.getDay(); // 0=Sun
    const diff = dow === 0 ? -6 : 1 - dow;
    const m = new Date(d);
    m.setDate(d.getDate() + diff);
    m.setHours(0, 0, 0, 0);
    return m;
  };

  // Week-snap strip: 12 weeks before today's Monday → 52 weeks after (= 64 total weeks)
  const STRIP_WEEKS_BEFORE = 12;
  const STRIP_WEEKS_TOTAL = 64;
  // Base Monday of the strip (computed once; stable reference via useMemo)
  const stripBaseMon = useMemo(() => {
    const mon = getMondayOf(new Date());
    mon.setDate(mon.getDate() - STRIP_WEEKS_BEFORE * 7);
    return mon;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build week blocks: array of 64 weeks, each with 7 day objects
  const stripWeeks = useMemo(() => {
    return Array.from({ length: STRIP_WEEKS_TOTAL }, (_, wi) => {
      return Array.from({ length: 7 }, (_, di) => {
        const d = new Date(stripBaseMon);
        d.setDate(stripBaseMon.getDate() + wi * 7 + di);
        return {
          n: d.getDate(),
          l: ['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'][d.getDay()],
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
        };
      });
    });
  }, [stripBaseMon]);

  // Auto-scroll to today's week on mount and when entering 'setmana' view.
  // Deps: only isMobileAgenda + mobileView — NOT selectedDay/currentMonth/currentYear,
  // otherwise every day-click re-scrolls the strip (the "coses rares" bug).
  useEffect(() => {
    if (!isMobileAgenda || mobileView !== 'setmana') return;
    const container = stripRef.current;
    if (!container) return;
    const weekBlocks = container.querySelectorAll<HTMLDivElement>('[data-week-block]');
    const targetBlock = weekBlocks[STRIP_WEEKS_BEFORE]; // always scroll to today's week
    if (targetBlock) container.scrollLeft = targetBlock.offsetLeft;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileAgenda, mobileView]);

  // Scroll listener: update the month/year kicker label as the user scrolls.
  useEffect(() => {
    if (!isMobileAgenda || mobileView !== 'setmana') return;
    const container = stripRef.current;
    if (!container) return;
    const updateLabel = () => {
      const cx = container.scrollLeft + container.clientWidth / 2;
      const blocks = container.querySelectorAll<HTMLDivElement>('[data-week-block]');
      let best: HTMLDivElement | null = null;
      for (const b of Array.from(blocks)) {
        if (b.offsetLeft <= cx) best = b;
        else break;
      }
      if (best) {
        const m = parseInt(best.dataset.month ?? '1', 10);
        const y = parseInt(best.dataset.year ?? '2026', 10);
        setStripVisibleMonth(`${MONTH_NAMES[m - 1]?.toUpperCase() ?? ''} ${y}`);
      }
    };
    updateLabel();
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { updateLabel(); ticking = false; });
        ticking = true;
      }
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [isMobileAgenda, mobileView, MONTH_NAMES]);

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobileAgenda) {
    const EVENT_BAR_COLORS: Record<string, string> = {
      'Festiu': '#22c55e',
      'Fira': '#f59e0b',
      'Visita comercial': '#3b82f6',
      'Sessió interna': '#8b5cf6',
      'Activitat empresa': 'var(--tavil-accent)',
    };

    // Real today reference (never changes — used for dot indicator + "today" label)
    const todayDate = new Date();
    const todayDay = todayDate.getDate();
    const todayMonth = todayDate.getMonth() + 1;
    const todayYear = todayDate.getFullYear();

    // ── Mobile-local filtered list (uses typeFilterMulti + dept; never touches desktop state) ──
    const mobileFilteredEvents = agendaEvents
      .filter(e => typeFilterMulti.length === 0 || typeFilterMulti.includes(e.type))
      .filter(passesDept);

    const selDay = selectedDay ?? todayDay;
    const selMonth = currentMonth;
    const selEvents = mobileFilteredEvents.filter(e => e.day === selDay && e.month === selMonth);

    // Build mobile calendar events map for Mes grid dots
    const mobileCalendarEvents: Record<number, AgendaEvent[]> = {};
    mobileFilteredEvents.filter(e => e.month === currentMonth).forEach(e => {
      if (!mobileCalendarEvents[e.day]) mobileCalendarEvents[e.day] = [];
      mobileCalendarEvents[e.day].push(e);
    });

    // Month grid helpers for Mes view
    const mesMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
    const mesFirstDow = new Date(currentYear, currentMonth - 1, 1).getDay();
    const mesMondayOffset = mesFirstDow === 0 ? 6 : mesFirstDow - 1;
    const mesCells: (number | null)[] = [
      ...Array(mesMondayOffset).fill(null),
      ...Array.from({ length: mesMonthDaysCount }, (_, i) => i + 1),
    ];
    // Pad to full weeks
    while (mesCells.length % 7 !== 0) mesCells.push(null);

    const isTodayMes = (d: number) =>
      d === todayDay && currentMonth === todayMonth && currentYear === todayYear;

    return (
      <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
        {/* Top bar */}
        <div style={{ height: 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <button onClick={onOpenDrawer} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)' }}>
            <Menu size={18} />
          </button>
          {isAdmin && (
            <button onClick={() => setShowEventForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 10, background: 'var(--tavil-accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={15} /> Nou
            </button>
          )}
        </div>

        {/* Header text */}
        <div style={{ padding: '4px 16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
            {MONTH_NAMES[todayMonth - 1]} {todayYear}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, lineHeight: 1, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>{t('nav.agenda')}</h1>
        </div>

        {/* Toggle + type dropdown on same row */}
        <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Segmented toggle: Setmana | Mes */}
          <div style={{ display: 'flex', background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 12, padding: 3, gap: 2, flexShrink: 0 }}>
            {(['setmana', 'mes'] as const).map(v => (
              <button
                key={v}
                onClick={() => setMobileView(v)}
                style={{
                  padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: 'none',
                  background: mobileView === v ? 'var(--tavil-text)' : 'transparent',
                  color: mobileView === v ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
                  transition: 'background 160ms, color 160ms',
                  minHeight: 38,
                }}
              >
                {v === 'setmana' ? t('common.week') : t('common.month')}
              </button>
            ))}
          </div>
          {/* Type multiselect — fills remaining space */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <DropdownMultiselect
              options={['Festiu', 'Fira', 'Sessió interna', 'Activitat empresa']}
              value={typeFilterMulti}
              onChange={setTypeFilterMulti}
              getLabel={(x) => typeLabel(x)}
              placeholder={t('agenda.allTypes')}
              align="right"
            />
          </div>
        </div>

        {/* ── SETMANA VIEW ── */}
        {mobileView === 'setmana' && (
          <div key="setmana" className="anim-fade-in">
            {/* Visible-month kicker label */}
            {stripVisibleMonth && (
              <div style={{ padding: '0 16px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--tavil-faint)' }}>
                {stripVisibleMonth}
              </div>
            )}

            {/* Week-snap day strip */}
            <div
              ref={stripRef}
              data-no-swipe
              className="hide-sb"
              style={{
                paddingBottom: 20,
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}
            >
              {stripWeeks.map((week, wi) => {
                // Use the Monday of each week to identify the block's month/year
                const repDay = week[0]; // Monday
                return (
                  <div
                    key={wi}
                    data-week-block
                    data-month={repDay.month}
                    data-year={repDay.year}
                    style={{
                      flexShrink: 0,
                      width: '100%',
                      scrollSnapAlign: 'start',
                      display: 'flex',
                      padding: '0 16px',
                      gap: 6,
                      boxSizing: 'border-box',
                    }}
                  >
                    {week.map(d => {
                      const active = d.n === selDay && d.month === selMonth && d.year === currentYear;
                      const isTod = d.n === todayDay && d.month === todayMonth && d.year === todayYear;
                      // 3-state: todayAndSelected | selectedOnly | todayOnly | neither
                      const todayAndSelected = isTod && active;
                      const selectedOnly = active && !isTod;
                      const todayOnly = isTod && !active;
                      return (
                        <button
                          key={d.key}
                          onClick={() => { setSelectedDay(d.n); setCurrentMonth(d.month); setCurrentYear(d.year); }}
                          style={{
                            flex: 1,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px',
                            background: active ? 'var(--tavil-text)' : 'transparent',
                            color: active ? 'var(--tavil-bg)' : todayOnly ? 'var(--tavil-accent)' : 'var(--tavil-text)',
                            border: todayOnly
                              ? '1.5px solid var(--tavil-accent)'
                              : `1px solid ${active ? 'var(--tavil-text)' : 'var(--tavil-border)'}`,
                            borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: todayAndSelected ? '0 0 0 2px var(--tavil-accent)' : 'none',
                            transition: 'background-color 200ms var(--ease-out-cubic), color 200ms var(--ease-out-cubic), border-color 200ms var(--ease-out-cubic), outline-color 200ms var(--ease-out-cubic)',
                            minHeight: 64,
                          }}
                        >
                          {todayOnly
                            ? <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--tavil-accent)', lineHeight: 1 }}>AVUI</span>
                            : <span style={{ fontSize: 10, fontWeight: 500, opacity: active ? 0.7 : 0.6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{d.l}</span>
                          }
                          <span style={{
                            fontSize: 18,
                            fontWeight: todayOnly ? 700 : 600,
                            marginTop: 3,
                            fontFamily: 'var(--font-display)',
                            color: todayOnly ? 'var(--tavil-accent)' : undefined,
                          }}>{d.n}</span>
                          <div style={{ width: 4, height: 4, borderRadius: 2, background: isTod ? 'var(--tavil-accent)' : selectedOnly ? 'rgba(255,255,255,0.35)' : 'transparent', marginTop: 4 }} />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Event count + timeline */}
            <div style={{ padding: '0 16px' }}>
              <div style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginBottom: 16 }}>
                {selEvents.length === 1 ? t('agenda.event', { count: 1 }) : t('agenda.events', { count: selEvents.length })} · {selDay === todayDay && selMonth === todayMonth ? t('agenda.today') : `${selDay} ${MONTH_NAMES[selMonth - 1]}`}
              </div>
              <div key={`${selDay}-${selMonth}-${currentYear}`} className="anim-fade-in">
                {selEvents.length === 0 && (
                  <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: 32, textAlign: 'center', color: 'var(--tavil-faint)', fontSize: 13 }}>
                    {t('agenda.noEvents')}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selEvents.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((ev, j) => {
                    const tStart = (ev.time || '').trim();
                    const tEnd = (ev.time_end || '').trim();
                    return (
                      <div key={j} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                        <div style={{ width: 52, flexShrink: 0, paddingTop: 2 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tavil-text)', fontFeatureSettings: '"tnum"' }}>{tStart || '—'}</div>
                          {tEnd && <div style={{ fontSize: 10.5, color: 'var(--tavil-faint)', marginTop: 1 }}>{tEnd}</div>}
                        </div>
                        <div style={{ width: 3, background: EVENT_BAR_COLORS[ev.type] ?? 'var(--tavil-accent)', borderRadius: 2, flexShrink: 0, alignSelf: 'stretch' }} />
                        <div style={{ flex: 1, minWidth: 0, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, padding: '14px 16px' }}>
                          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25, color: 'var(--tavil-text)', marginBottom: 6 }}>{ev.title}</div>
                          {ev.location && (
                            <div style={{ fontSize: 12, color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                              <MapPin size={12} />{ev.location}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: 'var(--tavil-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 600, background: 'var(--tavil-faint)', borderRadius: 5, padding: '1px 7px' }}>{ev.type}</span>
                          </div>
                          {isAdmin && ev.id >= 0 && (
                            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                              <button onClick={() => openEvEdit(ev)} style={{ background: 'none', border: 'none', color: 'var(--tavil-muted)', cursor: 'pointer', padding: 0 }}><Pencil size={13} /></button>
                              <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: 'var(--tavil-accent)', cursor: 'pointer', padding: 0 }}><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MES VIEW ── */}
        {mobileView === 'mes' && (
          <div key="mes" className="anim-fade-in" style={{ padding: '0 16px' }}>
            {/* Month nav — framed, mirrors desktop style */}
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)', overflow: 'hidden', marginBottom: 20 }}>
              <button
                onClick={() => navigateMonth(-1)}
                style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRight: '1px solid var(--tavil-border)', cursor: 'pointer', color: 'var(--tavil-muted)' }}
                aria-label="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--tavil-text)', letterSpacing: '0.01em' }}>
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderLeft: '1px solid var(--tavil-border)', cursor: 'pointer', color: 'var(--tavil-muted)' }}
                aria-label="Mes següent"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday header row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
              {['Dl','Dt','Dc','Dj','Dv','Ds','Dg'].map(w => (
                <div key={w} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 0' }}>{w}</div>
              ))}
            </div>

            {/* Day cells grid */}
            <div key={`${currentMonth}-${currentYear}`} className="anim-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 24 }}>
              {mesCells.map((d, i) => {
                if (d === null) return <div key={i} style={{ aspectRatio: '1', minHeight: 48 }} />;
                const evs = mobileCalendarEvents[d] ?? [];
                const isActiveDay = d === selDay && currentMonth === selMonth;
                const isTod = isTodayMes(d);
                const dotColors = evs.slice(0, 3).map(ev => eventRailColor(ev));
                // 3-state: todayAndSelected | selectedOnly | todayOnly | neither
                const todayAndSelectedMes = isTod && isActiveDay;
                const selectedOnlyMes = isActiveDay && !isTod;
                const todayOnlyMes = isTod && !isActiveDay;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDay(d);
                      setCurrentMonth(currentMonth);
                      setCurrentYear(currentYear);
                      setMobileView('setmana');
                    }}
                    style={{
                      aspectRatio: '1', minHeight: 48,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      borderRadius: 10,
                      border: todayOnlyMes
                        ? '1.5px solid var(--tavil-accent)'
                        : `1.5px solid ${isActiveDay ? 'var(--tavil-text)' : 'var(--tavil-border)'}`,
                      background: isActiveDay ? 'var(--tavil-text)' : 'var(--tavil-card)',
                      color: isActiveDay ? 'var(--tavil-bg)' : todayOnlyMes ? 'var(--tavil-accent)' : 'var(--tavil-text)',
                      boxShadow: todayAndSelectedMes ? '0 0 0 2px var(--tavil-accent)' : 'none',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background 150ms, border-color 150ms, outline-color 150ms',
                      padding: 0,
                    }}
                    aria-label={`${d} ${MONTH_NAMES[currentMonth - 1]}, ${evs.length} esdeveniments`}
                  >
                    <span style={{ fontSize: 13, fontWeight: isTod || isActiveDay ? 700 : 500, lineHeight: 1, color: todayOnlyMes ? 'var(--tavil-accent)' : undefined }}>{d}</span>
                    {dotColors.length > 0 && (
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {dotColors.map((c, ci) => (
                          <div key={ci} style={{ width: 4, height: 4, borderRadius: 2, background: isActiveDay ? 'rgba(255,255,255,0.7)' : c, flexShrink: 0 }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin: new event bottom sheet */}
        {isAdmin && showEventForm && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${closingEventForm ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeEventForm}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: `20px 20px calc(env(safe-area-inset-bottom, 0px) + 80px)`, width: '100%', maxHeight: 'calc(92dvh - env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }} className={closingEventForm ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 18 }}>Nou event</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Títol *" style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <DatePicker value={eDate} onChange={setEDate} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--tavil-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hora inici</div>
                    <TimePicker value={eTime} onChange={setETime} optional />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--tavil-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Final <span style={{ textTransform: 'none', fontWeight: 400 }}>(opcional)</span></div>
                    <TimePicker value={eTimeEnd} onChange={setETimeEnd} optional />
                  </div>
                </div>
                <input type="text" value={eLocation} onChange={e => setELocation(e.target.value)} placeholder="Lloc" style={{ borderRadius: 10, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none' }} />
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8, fontWeight: 600 }}>Tipus</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.keys(EVENT_COLORS).map(t => (
                      <button key={t} onClick={() => setEType(t)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', background: eType === t ? 'var(--tavil-text)' : 'var(--tavil-bg)', color: eType === t ? 'var(--tavil-bg)' : 'var(--tavil-muted)', border: `1px solid ${eType === t ? 'var(--tavil-text)' : 'var(--tavil-border)'}` }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginBottom: 8, fontWeight: 600 }}>
                    Departaments {eDepts.length === 0 ? '(tots)' : `(${eDepts.length})`}
                  </div>
                  <DeptSearch value={eDepts} onChange={setEDepts} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={closeEventForm} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                  <button onClick={handleCreateEvent} disabled={!eTitle.trim() || !eDate || eSaving} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!eTitle.trim() || !eDate || eSaving) ? 0.5 : 1 }}>{eSaving ? 'Desant...' : 'Crear event'}</button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
        {/* Admin: edit event bottom sheet */}
        {isAdmin && evEditId !== null && createPortal(
          <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm ${evEditClosing ? 'anim-fade-out' : 'anim-fade-in'}`} onClick={closeEvEdit}>
            <div style={{ background: 'var(--tavil-card)', borderRadius: '20px 20px 0 0', padding: `24px 20px calc(env(safe-area-inset-bottom, 0px) + 80px)`, width: '100%', maxHeight: 'calc(92dvh - env(safe-area-inset-bottom, 0px))', overflowY: 'auto' }} className={evEditClosing ? 'anim-sheet-exit' : 'anim-sheet-enter'} onClick={e => e.stopPropagation()}>
              {/* Kicker + live title */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tavil-accent)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 2 }}>Editar esdeveniment</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--tavil-text)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{eeTitle || 'Esdeveniment'}</div>
              </div>
              {(() => {
                const lCls: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--tavil-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 6 };
                const iStyle: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1px solid var(--tavil-border)', padding: '11px 14px', fontSize: 14, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label style={lCls}>Títol <span style={{ color: 'var(--tavil-accent)' }}>*</span></label>
                      <input type="text" value={eeTitle} onChange={e => setEeTitle(e.target.value)} style={iStyle} placeholder="Títol de l'esdeveniment" /></div>
                    <div><label style={lCls}>Data <span style={{ color: 'var(--tavil-accent)' }}>*</span></label>
                      <DatePicker value={eeDate} onChange={setEeDate} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={lCls}>Hora inici</label>
                        <TimePicker value={eeTime} onChange={setEeTime} optional /></div>
                      <div><label style={{ ...lCls }}>Hora final</label>
                        <TimePicker value={eeTimeEnd} onChange={setEeTimeEnd} optional /></div>
                    </div>
                    <div><label style={lCls}>Ubicació</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                        <input type="text" value={eeLocation} onChange={e => setEeLocation(e.target.value)} style={{ ...iStyle, paddingLeft: 34 }} placeholder="Sala, edifici, localitat…" />
                      </div>
                    </div>
                    <div><label style={lCls}>Tipus</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.keys(EVENT_COLORS).map(t => (
                          <button key={t} onClick={() => setEeType(t)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', background: eeType === t ? 'var(--tavil-text)' : 'transparent', color: eeType === t ? 'var(--tavil-bg)' : 'var(--tavil-muted)', border: `1px solid ${eeType === t ? 'var(--tavil-text)' : 'var(--tavil-border)'}` }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div><label style={lCls}>Departaments destinataris</label>
                      <DeptSearch value={eeDepts} onChange={setEeDepts} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      <button onClick={closeEvEdit} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1px solid var(--tavil-border)', background: 'none', color: 'var(--tavil-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
                      <button onClick={handleSaveEvEdit} disabled={!eeTitle.trim() || !eeDate || eeSaving} style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: 'var(--tavil-text)', color: 'var(--tavil-bg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!eeTitle.trim() || !eeDate || eeSaving) ? 0.4 : 1 }}>{eeSaving ? 'Desant…' : '✓ Desa canvis'}</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}
        {confirmModal && createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm anim-fade-in" onClick={() => setConfirmModal(null)}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 w-full max-w-xs mx-4 shadow-xl anim-scale-in" onClick={e => e.stopPropagation()}>
              <p className="text-sm text-gray-700 dark:text-zinc-300 mb-4">{confirmModal.message}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmModal(null)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400">{t('confirm.cancel')}</button>
                <button onClick={confirmModal.onConfirm} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg font-semibold">{t('confirm.delete')}</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  const selDay = selectedDay ?? today.getDate();
  const selEvents = filteredEvents.filter(e => e.day === selDay && e.month === currentMonth);

  return (
    <div>
      {/* Page header */}
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('agenda.subtitle')}</p>

      {/* ── Unified controls bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {/* Type filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {filters.map(f => (
            <FilterChip key={f} label={typeLabel(f)} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </div>
        {/* Dept filter */}
        <DropdownMultiselect
          options={DEPT_ORDER}
          value={deptFilter}
          onChange={setDeptFilter}
          getLabel={(d) => deptLabel(d, i18n.language)}
          placeholder={t('agenda.allDepartments')}
        />
        {/* New event */}
        {isAdmin && (
          <button
            onClick={() => setShowEventForm(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex-shrink-0"
          >
            <Plus size={14} /> {t('agenda.newEvent')}
          </button>
        )}
      </div>

      <CreateAgendaModal
        open={isAdmin && showEventForm}
        onClose={() => setShowEventForm(false)}
        initialDate={selDay && currentYear && currentMonth
          ? `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(selDay).padStart(2,'0')}`
          : undefined}
        onCreated={async () => { setShowEventForm(false); setApiAgendaEvents(await apiGetAgendaEvents()); }}
      />

      {/* ── Two-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: 28, alignItems: 'start' }}>

        {/* ── Left: calendar ── */}
        <div>
          {/* Month nav — framed: [<]  Month Year  [>] */}
          <div className="flex items-center justify-between mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)' }}>
            <button
              onClick={() => navigateMonth(-1)}
              aria-label="Mes anterior"
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center transition-colors"
              style={{ color: 'var(--tavil-muted)', borderRight: '1px solid var(--tavil-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            ><ChevronLeft size={15} /></button>
            <span className="flex-1 text-center font-bold text-lg" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.01em', color: 'var(--tavil-text)' }}>
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              aria-label="Mes següent"
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center transition-colors"
              style={{ color: 'var(--tavil-muted)', borderLeft: '1px solid var(--tavil-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            ><ChevronRight size={15} /></button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {['Dl','Dt','Dc','Dj','Dv','Ds','Dg'].map(w => (
              <div key={w} className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-center py-1">{w}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} style={{ height: 80 }} />;
              const evs = calendarEvents[d] || [];
              const active = d === selDay;
              const todayCell = isToday(d);
              const preview = evs.slice(0, 2);
              const extra = evs.length - 2;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(d === selectedDay ? null : d)}
                  aria-label={`${d} ${MONTH_NAMES[currentMonth-1]}, ${evs.length} esdeveniments`}
                  style={{
                    height: 80, width: '100%', borderRadius: 8, overflow: 'hidden',
                    background: active
                      ? 'var(--tavil-text)'
                      : todayCell
                        ? 'var(--tavil-accent-light)'
                        : 'var(--tavil-card)',
                    color: active ? 'var(--tavil-bg)' : todayCell ? 'var(--tavil-accent)' : 'var(--tavil-text)',
                    border: `1.5px solid ${active ? 'var(--tavil-text)' : todayCell ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                    padding: '6px 5px 5px', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                    textAlign: 'left', transition: 'background 100ms',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = todayCell ? 'oklch(0.94 0.03 22)' : 'var(--tavil-bgAlt)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = todayCell ? 'var(--tavil-accent-light)' : 'var(--tavil-card)'; }}
                >
                  {/* Day number */}
                  <div style={{ fontSize: 13, fontWeight: todayCell || active ? 700 : 500, lineHeight: 1, marginBottom: 4, paddingLeft: 2 }}>{d}</div>
                  {/* Event previews */}
                  {preview.map((ev, ei) => (
                    <div key={ei} style={{
                      fontSize: 9.5, lineHeight: 1.2, fontWeight: 500, marginBottom: 2,
                      padding: '1.5px 4px', borderRadius: 3,
                      background: active ? 'rgba(255,255,255,0.18)' : eventRailColor(ev) + '22',
                      color: active ? 'rgba(255,255,255,0.9)' : eventRailColor(ev),
                      borderLeft: active ? 'none' : `2px solid ${eventRailColor(ev)}`,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ev.time ? ev.time.slice(0,5) + ' ' : ''}{ev.title}
                    </div>
                  ))}
                  {extra > 0 && (
                    <div style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.6)' : 'var(--tavil-faint)', paddingLeft: 2, marginTop: 1 }}>+{extra} més</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 mt-3.5 pt-2.5" style={{ borderTop: '1px solid var(--tavil-border)' }}>
            {Object.entries({
              'Festiu': eventRailColor({ type: 'Festiu' } as AgendaEvent),
              'Fira': eventRailColor({ type: 'Fira' } as AgendaEvent),
              'Visita comercial': eventRailColor({ type: 'Visita comercial' } as AgendaEvent),
              'Sessió interna': eventRailColor({ type: 'Sessió interna' } as AgendaEvent),
              'Activitat empresa': eventRailColor({ type: 'Activitat empresa' } as AgendaEvent),
              'Formació': eventRailColor({ type: 'Formació presencial' } as AgendaEvent),
            }).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0 inline-block" style={{ background: color }} />
                <span className="text-[10.5px] font-medium" style={{ color: 'var(--tavil-muted)' }}>{typeLabel(label)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: day detail ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          {/* Day header */}
          <div className="mb-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--tavil-faint)' }}>
              {isToday(selDay) ? t('agenda.today') : `${DAYS_OF_WEEK[new Date(currentYear, currentMonth - 1, selDay).getDay()]} ${selDay} ${monthGenitiu(currentMonth)}`}
            </div>
            <div className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.01em', lineHeight: 1.1, color: 'var(--tavil-text)' }}>
              {selEvents.length === 0 ? t('agenda.noEventsShort') : (selEvents.length === 1 ? t('agenda.event', { count: selEvents.length }) : t('agenda.events', { count: selEvents.length }))}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--tavil-muted)' }}>
              {selDay} {monthGenitiu(currentMonth)} {currentYear} · Barcelona
            </div>
          </div>

          {selEvents.length === 0 ? (
            <div className="rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center" style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)' }}>
              <Calendar size={26} style={{ color: 'var(--tavil-faint)' }} />
              <span className="text-sm" style={{ color: 'var(--tavil-muted)' }}>{t('agenda.freeDayNote')}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...selEvents].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')).map((ev, idx) => {
                const tStart = (ev.time || '').trim();
                const tEnd = (ev.time_end || '').trim();
                const color = eventRailColor(ev);
                return (
                  <div
                    key={ev.id}
                    className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 anim-item"
                    style={{ borderLeft: `3px solid ${color}`, '--i': idx } as React.CSSProperties}
                  >
                    {/* Time */}
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{tStart || '—'}</span>
                      {tEnd && <span className="text-[11px] text-gray-400 dark:text-zinc-500">fins {tEnd}</span>}
                    </div>
                    {/* Title */}
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-2">{ev.title}</p>
                    {/* Meta */}
                    <div className={`flex flex-wrap gap-1.5 ${ev.location ? 'mb-2' : ''}`}>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: color + '20', color }}>{ev.type}</span>
                      {(ev.target_departments?.length ?? 0) > 0 && ev.target_departments!.slice(0,2).map(d => (
                        <span key={d} className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">{d}</span>
                      ))}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                        <MapPin size={11} className="flex-shrink-0" />{ev.location}
                      </div>
                    )}
                    {isAdmin && ev.id >= 0 && (
                      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                        <button onClick={() => openEvEdit(ev)} className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                          <Pencil size={12} /> {t('common.edit')}
                        </button>
                        <button onClick={() => handleDeleteEvent(ev.id)} className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors">
                          <Trash2 size={12} /> {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EditAgendaModal
        open={evEditId !== null}
        onClose={() => setEvEditId(null)}
        title={eeTitle} setTitle={setEeTitle}
        date={eeDate} setDate={setEeDate}
        time={eeTime} setTime={setEeTime}
        timeEnd={eeTimeEnd} setTimeEnd={setEeTimeEnd}
        location={eeLocation} setLocation={setEeLocation}
        type={eeType} setType={setEeType}
        depts={eeDepts} setDepts={setEeDepts}
        saving={eeSaving}
        onSave={handleSaveEvEdit}
      />
      {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
    </div>
  );
}
