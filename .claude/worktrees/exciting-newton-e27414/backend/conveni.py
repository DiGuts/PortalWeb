"""TAVIL — Conveni 2026 rules (backend mirror of src/conveni.ts).

Single source of truth for vacation policy enforcement on the server.
Frontend does the same checks for UX but client-side is bypassable,
so these are the authoritative rules.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Iterable

# ── Festius 2026 (Catalunya) ────────────────────────────────────────────────
HOLIDAYS_2026: frozenset[date] = frozenset({
    date(2026, 1, 1),
    date(2026, 1, 6),
    date(2026, 4, 3),
    date(2026, 4, 6),
    date(2026, 5, 1),
    date(2026, 6, 24),
    date(2026, 8, 15),
    date(2026, 9, 11),
    date(2026, 10, 12),
    date(2026, 11, 1),
    date(2026, 12, 6),
    date(2026, 12, 8),
    date(2026, 12, 25),
    date(2026, 12, 26),
})

VAC_YEAR_DEADLINE = date(2027, 1, 31)
ANNUAL_QUOTA_DAYS = 33
MAX_CONSECUTIVE_LABORAL = 15
MAX_SOLO_FRIDAY_MONDAY = 2


@dataclass(frozen=True)
class Period:
    idx: int
    label: str
    ranges: tuple[tuple[date, date], ...]
    request_from: date
    request_to: date
    min_days: int | None = None
    max_days: int | None = None


PERIODS_2026: tuple[Period, ...] = (
    Period(1, "Període 1",
           ((date(2026, 2, 1), date(2026, 5, 31)),),
           date(2026, 1, 7), date(2026, 1, 30), min_days=8),
    Period(2, "Període 2",
           ((date(2026, 6, 1), date(2026, 9, 10)),),
           date(2026, 5, 4), date(2026, 5, 18), max_days=15),
    Period(3, "Període 3",
           ((date(2026, 9, 14), date(2026, 11, 30)),),
           date(2026, 9, 1), date(2026, 9, 10), min_days=5),
    Period(4, "Període 4 (Nadal)",
           ((date(2026, 12, 7), date(2026, 12, 7)),
            (date(2026, 12, 21), date(2026, 12, 31))),
           date(2026, 11, 2), date(2026, 11, 13), max_days=5),
)

JAN_2026_BRIDGE = (date(2026, 1, 1), date(2026, 1, 31))

NADAL_FULL_WEEKS_2026: tuple[frozenset[date], ...] = (
    frozenset({date(2026, 12, 21), date(2026, 12, 22), date(2026, 12, 23), date(2026, 12, 24)}),
    frozenset({date(2026, 12, 28), date(2026, 12, 29), date(2026, 12, 30), date(2026, 12, 31)}),
)


def _parse(iso: str) -> date:
    return datetime.strptime(iso, "%Y-%m-%d").date()


def is_weekend(d: date) -> bool:
    return d.weekday() >= 5


def is_laboral(d: date) -> bool:
    return not is_weekend(d) and d not in HOLIDAYS_2026


def expand_range(a: date, b: date) -> list[date]:
    out: list[date] = []
    cur = a
    while cur <= b:
        out.append(cur)
        cur += timedelta(days=1)
    return out


def laboral_days_between(a: date, b: date) -> int:
    return sum(1 for d in expand_range(a, b) if is_laboral(d))


def find_period(d: date) -> Period | None:
    for p in PERIODS_2026:
        for lo, hi in p.ranges:
            if lo <= d <= hi:
                return p
    return None


def monday_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())


@dataclass
class ExistingVacation:
    start_date: date
    end_date: date
    status: str


def _count_solo_fri_mon_streak(blocks: Iterable[tuple[date, date]]) -> int:
    week_map: dict[date, set[int]] = {}
    for lo, hi in blocks:
        for d in expand_range(lo, hi):
            if not is_laboral(d):
                continue
            mon = monday_of_week(d)
            week_map.setdefault(mon, set()).add(d.weekday())  # 0=Mon..4=Fri
    weeks = sorted(week_map.items())
    streak = best = 0
    prev_mon: date | None = None
    for mon, days in weeks:
        solo = len(days) == 1 and (0 in days or 4 in days)
        adjacent = prev_mon is not None and (mon - prev_mon).days == 7
        if solo and adjacent:
            streak += 1
        elif solo:
            streak = 1
        else:
            streak = 0
        best = max(best, streak)
        prev_mon = mon
    return best


def validate_vacanca(
    start_iso: str,
    end_iso: str,
    existing: list[ExistingVacation] | None = None,
    today: date | None = None,
) -> list[str]:
    """Return list of error messages (empty = valid)."""
    errors: list[str] = []
    existing = existing or []
    today = today or date.today()

    try:
        start = _parse(start_iso)
        end = _parse(end_iso)
    except Exception:
        return ["Dates invàlides."]

    if end < start:
        return ["La data de fi ha de ser posterior o igual a la d'inici."]
    if end > VAC_YEAR_DEADLINE:
        errors.append(f"Les vacances del 2026 s'han de gaudir com a molt tard el {VAC_YEAR_DEADLINE}.")

    laboral = [d for d in expand_range(start, end) if is_laboral(d)]
    laboral_count = len(laboral)
    if laboral_count == 0:
        errors.append("El període sol·licitat no conté cap dia laboral.")

    in_jan_bridge = start >= JAN_2026_BRIDGE[0] and end <= JAN_2026_BRIDGE[1]
    p_start = find_period(start)
    p_end = find_period(end)
    period = None if in_jan_bridge else p_start

    if not in_jan_bridge:
        white = [d for d in laboral if find_period(d) is None]
        if white:
            errors.append(
                f"Hi ha {len(white)} dia(s) laborals fora de qualsevol període autoritzat "
                f"(blancs al calendari): no es poden agafar com a vacances."
            )
        if p_start and p_end and p_start.idx != p_end.idx:
            errors.append("La sol·licitud ha d'estar continguda dins d'un sol període.")

    if period:
        if not (period.request_from <= today <= period.request_to):
            # Soft warn on backend → allow RRHH override by treating as warning, so we
            # keep this as non-blocking: clients may submit early/late but RRHH can see.
            # Not adding as error (matches conveni PDF wording "s'intentarà respectar-les").
            pass
        if period.min_days and laboral_count < period.min_days:
            errors.append(f"{period.label}: mínim {period.min_days} dies laborals "
                          f"(has sol·licitat {laboral_count}).")
        if period.max_days and laboral_count > period.max_days:
            errors.append(f"{period.label}: màxim {period.max_days} dies laborals "
                          f"(has sol·licitat {laboral_count}).")

        # Nadal full-week rule
        if period.idx == 4:
            is_dec7 = start == date(2026, 12, 7) and end == date(2026, 12, 7)
            nadal_days = [d for d in laboral if date(2026, 12, 21) <= d <= date(2026, 12, 31)]
            if not is_dec7 and nadal_days:
                laboral_set = frozenset(laboral) - {date(2026, 12, 7)}
                match = any(laboral_set == w for w in NADAL_FULL_WEEKS_2026)
                if not match:
                    errors.append(
                        "Període 4 (Nadal): has de triar una setmana completa — "
                        "setmana de Nadal (21–24 Des) o setmana de Cap d'any (28–31 Des)."
                    )

    if laboral_count > MAX_CONSECUTIVE_LABORAL:
        errors.append(
            f"No es poden agafar més de {MAX_CONSECUTIVE_LABORAL} dies laborals seguits (3 setmanes)."
        )

    # Week partial rule — 4 vacation + 1 work
    per_week: dict[date, list[date]] = {}
    for d in laboral:
        mon = monday_of_week(d)
        per_week.setdefault(mon, []).append(d)
    for mon, vac_days in per_week.items():
        week_laboral = [d for d in expand_range(mon, mon + timedelta(days=6)) if is_laboral(d)]
        work_count = len(week_laboral) - len(vac_days)
        if len(vac_days) >= 1 and work_count == 1:
            errors.append(
                f"Setmana del {mon}: agafes {len(vac_days)} dies laborals i en treballes només 1. "
                "Has de fer la setmana completa de vacances o treballar almenys 2 dies."
            )

    # Consecutive solo Fri/Mon
    all_blocks = [(v.start_date, v.end_date) for v in existing if v.status != "Denegada"]
    all_blocks.append((start, end))
    streak = _count_solo_fri_mon_streak(all_blocks)
    if streak > MAX_SOLO_FRIDAY_MONDAY:
        errors.append(
            f"No es poden agafar més de {MAX_SOLO_FRIDAY_MONDAY} divendres/dilluns solts "
            f"seguits (portaries {streak})."
        )

    # Annual quota
    used = sum(laboral_days_between(v.start_date, v.end_date)
               for v in existing if v.status != "Denegada")
    if used + laboral_count > ANNUAL_QUOTA_DAYS:
        errors.append(
            f"Superes la quota anual de {ANNUAL_QUOTA_DAYS} dies "
            f"(portaries {used + laboral_count})."
        )

    return errors
