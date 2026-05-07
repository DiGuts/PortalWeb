// TAVIL — Conveni 2026 rules. Single source of truth for vacation / hour policy.
// Source: PETICIONS/GestióVacances2026CAT.VD.pdf + CalendariLaboral2026.VD.pdf

export type IsoDate = string; // YYYY-MM-DD

// ── Festius 2026 (Catalunya) ────────────────────────────────────────────────
export const HOLIDAYS_2026: ReadonlySet<IsoDate> = new Set([
  '2026-01-01', // Any Nou
  '2026-01-06', // Reis
  '2026-04-03', // Divendres Sant
  '2026-04-06', // Dilluns de Pasqua
  '2026-05-01', // Festa del treball
  '2026-06-24', // Sant Joan
  '2026-08-15', // L'Assumpció (dissabte)
  '2026-09-11', // Diada de Catalunya
  '2026-10-12', // Festa Nacional d'Espanya
  '2026-11-01', // Tots Sants (diumenge)
  '2026-12-06', // Constitució (diumenge)
  '2026-12-08', // Puríssima
  '2026-12-25', // Nadal
  '2026-12-26', // Sant Esteve (dissabte)
]);

// ── Períodes 2026 ────────────────────────────────────────────────────────────
export interface Period {
  idx: 1 | 2 | 3 | 4;
  label: string;
  // Date ranges where vacation *may* fall (inclusive). Some periods have gaps — see ranges[].
  ranges: Array<{ from: IsoDate; to: IsoDate }>;
  minDays?: number;
  maxDays?: number;
  request: { from: IsoDate; to: IsoDate };     // window when employee may submit
  confirm: { from: IsoDate; to: IsoDate };     // window when RRHH confirms
}

export const PERIODS_2026: readonly Period[] = [
  {
    idx: 1, label: 'Període 1',
    ranges: [{ from: '2026-02-01', to: '2026-05-31' }],
    minDays: 8,
    request: { from: '2026-01-07', to: '2026-01-30' },
    confirm: { from: '2026-02-13', to: '2026-02-27' },
  },
  {
    idx: 2, label: 'Període 2',
    ranges: [{ from: '2026-06-01', to: '2026-09-10' }],
    maxDays: 15,
    request: { from: '2026-05-04', to: '2026-05-18' },
    confirm: { from: '2026-05-25', to: '2026-06-05' },
  },
  {
    idx: 3, label: 'Període 3',
    ranges: [{ from: '2026-09-14', to: '2026-11-30' }],
    minDays: 5,
    request: { from: '2026-09-01', to: '2026-09-10' },
    confirm: { from: '2026-09-21', to: '2026-10-05' },
  },
  {
    idx: 4, label: 'Període 4 (Nadal)',
    ranges: [
      { from: '2026-12-07', to: '2026-12-07' },   // opt: dilluns 7 Des
      { from: '2026-12-21', to: '2026-12-31' },   // setmana Nadal + Cap d'any
    ],
    maxDays: 5,
    request: { from: '2026-11-02', to: '2026-11-13' },
    confirm: { from: '2026-11-23', to: '2026-12-04' },
  },
];

// Vacances 2026 can be consumed up to this date inclusive.
export const VAC_YEAR_DEADLINE: IsoDate = '2027-01-31';

// January 2026 — bridge month for leftover 2025 vacation days.
export const JAN_2026_BRIDGE = { from: '2026-01-01', to: '2026-01-31' } as const;

// Nadal setmanes completes — to claim Nadal period, must match one of these sets.
export const NADAL_FULL_WEEKS_2026: ReadonlyArray<readonly IsoDate[]> = [
  // setmana Nadal (21–24 Des, laboral — 25 festiu, 26 dissabte)
  ['2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24'],
  // setmana Cap d'any (28–31 Des, laboral)
  ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31'],
];

// Annual quota (dies laborals).
export const ANNUAL_QUOTA_DAYS = 33;

// Max consecutive laboral days in a single block.
export const MAX_CONSECUTIVE_LABORAL = 15;

// Max standalone Mon/Fri in a streak.
export const MAX_SOLO_FRIDAY_MONDAY = 2;

// ── Intensius ────────────────────────────────────────────────────────────────
export const INTENSIUS_2026 = {
  // Divendres intensius automàtics en aquest rang.
  summerFridays: { from: '2026-06-26', to: '2026-09-04' },
  // Dies concrets (independents del rang).
  fixed: new Set<IsoDate>([
    '2026-04-02', // dijous Sant
    '2026-06-23', // vigília Sant Joan
    '2026-12-18', // dinar departament
    '2026-12-24',
    '2026-12-31',
    '2027-01-05',
  ]),
  // Sol·licitud fora de dates preestablertes: antelació mínima a RRHH.
  minAdvanceDaysOutOfRange: 7,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const toDate = (iso: IsoDate): Date => {
  // Ensure the date is reasonably valid before trying to create a Date object
  // Standard HTML5 date inputs are YYYY-MM-DD.
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date(NaN); // Invalid Date
  }
  return new Date(iso + 'T00:00:00');
};

const toIso = (d: Date): IsoDate => {
  if (isNaN(d.getTime())) return 'invalid-date';
  // Use local components — toISOString() is UTC and rotates back a day in TZs east of UTC,
  // which made addDays return the same date and broke laboralDaysBetween (capped by safety=1000).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const addDays = (iso: IsoDate, n: number): IsoDate => {
  const d = toDate(iso); d.setDate(d.getDate() + n); return toIso(d);
};
const dayOfWeek = (iso: IsoDate): number => toDate(iso).getDay(); // 0=Sun..6=Sat

export const isWeekend = (iso: IsoDate): boolean => {
  if (iso === 'invalid-date') return false;
  const d = dayOfWeek(iso); return d === 0 || d === 6;
};
export const isHoliday = (iso: IsoDate): boolean => iso !== 'invalid-date' && HOLIDAYS_2026.has(iso);
export const isLaboral = (iso: IsoDate): boolean => iso !== 'invalid-date' && !isWeekend(iso) && !isHoliday(iso);

// Expand inclusive date range into ISO strings.
export const expandRange = (from: IsoDate, to: IsoDate): IsoDate[] => {
  if (from === 'invalid-date' || to === 'invalid-date') return [];
  const out: IsoDate[] = [];
  let cur = from;
  let safety = 0;
  while (cur <= to && safety < 1000) { 
    out.push(cur); 
    cur = addDays(cur, 1); 
    if (cur === 'invalid-date') break;
    safety++;
  }
  return out;
};

// Count laboral days in inclusive [from, to] range.
export const laboralDaysBetween = (from: IsoDate, to: IsoDate): number =>
  expandRange(from, to).filter(isLaboral).length;

// Which período does a date fall into, if any.
export const findPeriod = (iso: IsoDate): Period | null => {
  if (iso === 'invalid-date') return null;
  for (const p of PERIODS_2026) {
    for (const r of p.ranges) {
      if (iso >= r.from && iso <= r.to) return p;
    }
  }
  return null;
};

// Check whether `today` is inside the request window for a given período.
export const isRequestWindowOpen = (p: Period, today: IsoDate): boolean =>
  today >= p.request.from && today <= p.request.to;

// ── Validator ────────────────────────────────────────────────────────────────
export interface ExistingVacation {
  start_date: IsoDate;
  end_date: IsoDate;
  status: string; // 'Pendent' | 'Aprovada' | 'Denegada'
}

export interface ValidationReport {
  errors: string[];      // must block submission
  warnings: string[];    // show, but allow
  laboralDays: number;
  period: Period | null;
  annualUsedIfApproved: number;
}

export function validateVacanca(
  start: IsoDate,
  end: IsoDate,
  existing: ExistingVacation[] = [],
  today: IsoDate = toIso(new Date()),
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic sanity
  if (!start || !end) {
    errors.push('Data d\'inici i de fi són obligatòries.');
    return { errors, warnings, laboralDays: 0, period: null, annualUsedIfApproved: 0 };
  }
  if (end < start) {
    errors.push('La data de fi ha de ser posterior o igual a la d\'inici.');
    return { errors, warnings, laboralDays: 0, period: null, annualUsedIfApproved: 0 };
  }
  if (end > VAC_YEAR_DEADLINE) {
    errors.push(`Les vacances del 2026 s'han de gaudir com a molt tard el ${VAC_YEAR_DEADLINE}.`);
  }

  const days = expandRange(start, end);
  const laboral = days.filter(isLaboral);
  const laboralCount = laboral.length;

  if (laboralCount === 0) {
    errors.push('El període sol·licitat no conté cap dia laboral.');
  }

  // Identify período — range must fit inside a single período's declared ranges,
  // OR fall fully in the January 2026 bridge (days pendents 2025).
  const inJanBridge = start >= JAN_2026_BRIDGE.from && end <= JAN_2026_BRIDGE.to;
  const periodOfStart = findPeriod(start);
  const periodOfEnd = findPeriod(end);

  if (!inJanBridge) {
    // Every laboral day must fall in *some* período. Days between períodes are "blancs".
    const whiteLaboral = laboral.filter(d => findPeriod(d) === null);
    if (whiteLaboral.length > 0) {
      errors.push(
        `Hi ha ${whiteLaboral.length} dia${whiteLaboral.length > 1 ? 's' : ''} laborals fora de qualsevol període autoritzat (blancs al calendari): no es poden agafar com a vacances.`
      );
    }
    if (periodOfStart && periodOfEnd && periodOfStart.idx !== periodOfEnd.idx) {
      errors.push('La sol·licitud ha d\'estar continguda dins d\'un sol període.');
    }
  }

  const period = inJanBridge ? null : periodOfStart;

  // Request window enforcement per período.
  if (period && !isRequestWindowOpen(period, today)) {
    warnings.push(
      `Avís: avui (${today}) queda fora de la finestra de sol·licitud del ${period.label} (${period.request.from} → ${period.request.to}). Pot ser rebutjada per RRHH.`
    );
  }

  // Min/max per període (laboral days of this request only).
  if (period?.minDays && laboralCount < period.minDays) {
    errors.push(`${period.label}: mínim ${period.minDays} dies laborals (has sol·licitat ${laboralCount}).`);
  }
  if (period?.maxDays && laboralCount > period.maxDays) {
    errors.push(`${period.label}: màxim ${period.maxDays} dies laborals (has sol·licitat ${laboralCount}).`);
  }

  // Max 15 consecutive laboral days in a single block (weekends don't break the count).
  if (laboralCount > MAX_CONSECUTIVE_LABORAL) {
    errors.push(`No es poden agafar més de ${MAX_CONSECUTIVE_LABORAL} dies laborals seguits (3 setmanes).`);
  }

  // P4 Nadal — setmanes completes (4 laboral days).
  if (period?.idx === 4) {
    const isDec7 = start === '2026-12-07' && end === '2026-12-07';
    const nadalDays = laboral.filter(d => d >= '2026-12-21' && d <= '2026-12-31');
    if (!isDec7 && nadalDays.length > 0) {
      const matchesFullWeek = NADAL_FULL_WEEKS_2026.some(w =>
        w.every(d => laboral.includes(d)) && laboral.every(d => w.includes(d) || d === '2026-12-07')
      );
      if (!matchesFullWeek) {
        errors.push(
          'Període 4 (Nadal): has de triar una setmana completa — setmana de Nadal (21–24 Des) o setmana de Cap d\'any (28–31 Des).'
        );
      }
    }
  }

  // Rule: ≥2 dies laborals o setmana completa (si dins una setmana agafes ≥ 4 d'una setmana laboral
  // però no tota, sobra 1 treballat).
  const laboralPerWeek = new Map<string, { vac: IsoDate[]; work: IsoDate[] }>();
  for (const d of expandRange(start, end)) {
    if (!isLaboral(d)) continue;
    const mondayIso = mondayOfWeek(d);
    const key = mondayIso;
    if (!laboralPerWeek.has(key)) laboralPerWeek.set(key, { vac: [], work: [] });
    laboralPerWeek.get(key)!.vac.push(d);
  }
  // Fill in the laboral days of the week, compare.
  laboralPerWeek.forEach((entry, mon) => {
    const weekLaboral = expandRange(mon, addDays(mon, 6)).filter(isLaboral);
    const nonVacLaboral = weekLaboral.length - entry.vac.length;
    if (entry.vac.length >= 1 && nonVacLaboral === 1) {
      errors.push(
        `Setmana del ${mon}: agafes ${entry.vac.length} dies laborals i en treballes només 1. Has de fer la setmana completa de vacances o treballar almenys 2 dies.`
      );
    }
  });

  // No més de 2 divendres/dilluns solts seguits de vacances. Inspect whole request + recent approved.
  const soloStreak = countConsecutiveSoloFriMon([
    ...existing.filter(v => v.status !== 'Denegada').map(v => ({ from: v.start_date, to: v.end_date })),
    { from: start, to: end },
  ]);
  if (soloStreak > MAX_SOLO_FRIDAY_MONDAY) {
    errors.push(`No es poden agafar més de ${MAX_SOLO_FRIDAY_MONDAY} divendres/dilluns solts seguits (portaries ${soloStreak}).`);
  }

  // Annual quota (all non-denied vacations).
  const previouslyUsed = existing
    .filter(v => v.status !== 'Denegada')
    .reduce((acc, v) => acc + laboralDaysBetween(v.start_date, v.end_date), 0);
  const annualUsedIfApproved = previouslyUsed + laboralCount;
  if (annualUsedIfApproved > ANNUAL_QUOTA_DAYS) {
    errors.push(
      `Superes la quota anual de ${ANNUAL_QUOTA_DAYS} dies (portaries ${annualUsedIfApproved}).`
    );
  } else if (annualUsedIfApproved > ANNUAL_QUOTA_DAYS - 2) {
    warnings.push(`T'estàs acostant a la quota anual: ${annualUsedIfApproved} / ${ANNUAL_QUOTA_DAYS} dies.`);
  }

  return { errors, warnings, laboralDays: laboralCount, period, annualUsedIfApproved };
}

function mondayOfWeek(iso: IsoDate): IsoDate {
  const d = toDate(iso);
  const diff = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - diff);
  return toIso(d);
}

// Count max consecutive "solo Mon or Fri only" vacation occurrences across weeks.
function countConsecutiveSoloFriMon(blocks: Array<{ from: IsoDate; to: IsoDate }>): number {
  // Extract weeks where the *only* laboral vac day is a Fri or Mon.
  const weekMap = new Map<IsoDate, Set<number>>(); // mondayIso -> set of weekday numbers (1=Mon,5=Fri)
  for (const b of blocks) {
    for (const d of expandRange(b.from, b.to)) {
      if (!isLaboral(d)) continue;
      const mon = mondayOfWeek(d);
      if (!weekMap.has(mon)) weekMap.set(mon, new Set());
      weekMap.get(mon)!.add(dayOfWeek(d));
    }
  }
  const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a < b ? -1 : 1);
  let streak = 0, best = 0;
  let prevMon: IsoDate | null = null;
  for (const [mon, days] of weeks) {
    const isSoloFriMon = days.size === 1 && (days.has(1) || days.has(5));
    const adjacent = prevMon !== null && addDays(prevMon, 7) === mon;
    if (isSoloFriMon && adjacent) streak += 1;
    else if (isSoloFriMon) streak = 1;
    else streak = 0;
    best = Math.max(best, streak);
    prevMon = mon;
  }
  return best;
}
