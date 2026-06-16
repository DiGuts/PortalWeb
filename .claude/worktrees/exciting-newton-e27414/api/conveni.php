<?php
/**
 * TAVIL — Conveni 2026 vacation rules (PHP port of backend/conveni.py).
 * Returns an array of error strings (empty = valid).
 */

// ── Festius 2026 (Catalunya) ──────────────────────────────────────────────────
const HOLIDAYS_2026 = [
    '2026-01-01', '2026-01-06',
    '2026-04-03', '2026-04-06',
    '2026-05-01', '2026-06-24',
    '2026-08-15', '2026-09-11',
    '2026-10-12', '2026-11-01',
    '2026-12-06', '2026-12-08',
    '2026-12-25', '2026-12-26',
];

const ANNUAL_QUOTA_DAYS       = 33;
const MAX_CONSECUTIVE_LABORAL = 15;
const MAX_SOLO_FRIDAY_MONDAY  = 2;

// Periods: [label, ranges[], request_from, request_to, min_days, max_days]
const PERIODS_2026 = [
    1 => ['label' => 'Període 1',        'ranges' => [['2026-02-01','2026-05-31']], 'req_from' => '2026-01-07', 'req_to' => '2026-01-30', 'min' => 8,    'max' => null],
    2 => ['label' => 'Període 2',        'ranges' => [['2026-06-01','2026-09-10']], 'req_from' => '2026-05-04', 'req_to' => '2026-05-18', 'min' => null, 'max' => 15],
    3 => ['label' => 'Període 3',        'ranges' => [['2026-09-14','2026-11-30']], 'req_from' => '2026-09-01', 'req_to' => '2026-09-10', 'min' => 5,    'max' => null],
    4 => ['label' => 'Període 4 (Nadal)','ranges' => [['2026-12-07','2026-12-07'],['2026-12-21','2026-12-31']], 'req_from' => '2026-11-02', 'req_to' => '2026-11-13', 'min' => null, 'max' => 5],
];

const JAN_2026_BRIDGE = ['2026-01-01', '2026-01-31'];

const NADAL_FULL_WEEKS_2026 = [
    ['2026-12-21','2026-12-22','2026-12-23','2026-12-24'],
    ['2026-12-28','2026-12-29','2026-12-30','2026-12-31'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function _parse_date(string $iso): DateTime {
    $d = DateTime::createFromFormat('Y-m-d', $iso);
    $d->setTime(0, 0, 0);
    return $d;
}

function _is_weekend(DateTime $d): bool {
    return (int)$d->format('N') >= 6;
}

function _is_laboral(DateTime $d): bool {
    if (_is_weekend($d)) return false;
    return !in_array($d->format('Y-m-d'), HOLIDAYS_2026, true);
}

function _expand_range(DateTime $a, DateTime $b): array {
    $out = [];
    $cur = clone $a;
    while ($cur <= $b) {
        $out[] = clone $cur;
        $cur->modify('+1 day');
    }
    return $out;
}

function _laboral_days_between(DateTime $a, DateTime $b): int {
    return count(array_filter(_expand_range($a, $b), '_is_laboral'));
}

function _find_period(DateTime $d): ?int {
    $iso = $d->format('Y-m-d');
    foreach (PERIODS_2026 as $idx => $p) {
        foreach ($p['ranges'] as [$lo, $hi]) {
            if ($iso >= $lo && $iso <= $hi) return $idx;
        }
    }
    return null;
}

function _monday_of_week(DateTime $d): string {
    $day = clone $d;
    $dow = (int)$day->format('N'); // 1=Mon..7=Sun
    $day->modify('-' . ($dow - 1) . ' days');
    return $day->format('Y-m-d');
}

function _count_solo_fri_mon_streak(array $blocks): int {
    // blocks = array of [start_date_str, end_date_str]
    $week_map = []; // monday_str => set of weekday numbers (0=Mon..4=Fri)
    foreach ($blocks as [$lo_str, $hi_str]) {
        $lo = _parse_date($lo_str);
        $hi = _parse_date($hi_str);
        foreach (_expand_range($lo, $hi) as $d) {
            if (!_is_laboral($d)) continue;
            $mon = _monday_of_week($d);
            $dow = (int)$d->format('N') - 1; // 0=Mon..4=Fri
            $week_map[$mon][$dow] = true;
        }
    }
    ksort($week_map);
    $streak = 0; $best = 0;
    $prev_mon = null;
    foreach ($week_map as $mon => $days) {
        $count = count($days);
        $solo  = $count === 1 && (isset($days[0]) || isset($days[4]));
        $adjacent = false;
        if ($prev_mon !== null) {
            $diff = (int)((_parse_date($mon)->getTimestamp() - _parse_date($prev_mon)->getTimestamp()) / 86400);
            $adjacent = $diff === 7;
        }
        if ($solo && $adjacent) {
            $streak++;
        } elseif ($solo) {
            $streak = 1;
        } else {
            $streak = 0;
        }
        $best = max($best, $streak);
        $prev_mon = $mon;
    }
    return $best;
}

// ── Main validator ────────────────────────────────────────────────────────────

/**
 * @param string $start_iso  'YYYY-MM-DD'
 * @param string $end_iso    'YYYY-MM-DD'
 * @param array  $existing   array of ['start_date'=>str,'end_date'=>str,'status'=>str]
 * @param string|null $today_iso override today (for testing)
 * @return string[]  error messages (empty = valid)
 */
function validate_vacanca(string $start_iso, string $end_iso, array $existing = [], ?string $today_iso = null): array {
    $errors = [];
    $today_str = $today_iso ?? date('Y-m-d');

    try {
        $start = _parse_date($start_iso);
        $end   = _parse_date($end_iso);
    } catch (Throwable) {
        return ['Dates invàlides.'];
    }

    if ($end < $start) return ['La data de fi ha de ser posterior o igual a la d\'inici.'];

    $deadline = _parse_date('2027-01-31');
    if ($end > $deadline) {
        $errors[] = 'Les vacances del 2026 s\'han de gaudir com a molt tard el 2027-01-31.';
    }

    $all_days  = _expand_range($start, $end);
    $laboral   = array_values(array_filter($all_days, '_is_laboral'));
    $lab_count = count($laboral);

    if ($lab_count === 0) {
        $errors[] = 'El període sol·licitat no conté cap dia laboral.';
    }

    $in_jan = $start_iso >= JAN_2026_BRIDGE[0] && $end_iso <= JAN_2026_BRIDGE[1];
    $p_idx  = _find_period($start);
    $p_end  = _find_period($end);
    $period = $in_jan ? null : ($p_idx ?? null);

    if (!$in_jan) {
        $white = array_filter($laboral, fn($d) => _find_period($d) === null);
        if (count($white) > 0) {
            $errors[] = sprintf(
                'Hi ha %d dia(s) laborals fora de qualsevol període autoritzat: no es poden agafar com a vacances.',
                count($white)
            );
        }
        if ($p_idx !== null && $p_end !== null && $p_idx !== $p_end) {
            $errors[] = 'La sol·licitud ha d\'estar continguda dins d\'un sol període.';
        }
    }

    if ($period !== null) {
        $p = PERIODS_2026[$period];
        if ($p['min'] && $lab_count < $p['min']) {
            $errors[] = "{$p['label']}: mínim {$p['min']} dies laborals (has sol·licitat $lab_count).";
        }
        if ($p['max'] && $lab_count > $p['max']) {
            $errors[] = "{$p['label']}: màxim {$p['max']} dies laborals (has sol·licitat $lab_count).";
        }

        // Nadal full-week rule
        if ($period === 4) {
            $is_dec7 = $start_iso === '2026-12-07' && $end_iso === '2026-12-07';
            $nadal_days = array_filter($laboral, fn($d) => $d->format('Y-m-d') >= '2026-12-21');
            if (!$is_dec7 && count($nadal_days) > 0) {
                $lab_set = array_map(fn($d) => $d->format('Y-m-d'), $laboral);
                $lab_set = array_filter($lab_set, fn($s) => $s !== '2026-12-07');
                sort($lab_set);
                $match = false;
                foreach (NADAL_FULL_WEEKS_2026 as $week) {
                    $sorted_week = $week;
                    sort($sorted_week);
                    if ($lab_set === $sorted_week) { $match = true; break; }
                }
                if (!$match) {
                    $errors[] = 'Període 4 (Nadal): has de triar una setmana completa — setmana de Nadal (21–24 Des) o setmana de Cap d\'any (28–31 Des).';
                }
            }
        }
    }

    if ($lab_count > MAX_CONSECUTIVE_LABORAL) {
        $errors[] = 'No es poden agafar més de ' . MAX_CONSECUTIVE_LABORAL . ' dies laborals seguits (3 setmanes).';
    }

    // Week partial rule
    $per_week = [];
    foreach ($laboral as $d) {
        $mon = _monday_of_week($d);
        $per_week[$mon][] = $d;
    }
    foreach ($per_week as $mon => $vac_days) {
        $mon_dt      = _parse_date($mon);
        $sun_dt      = clone $mon_dt; $sun_dt->modify('+6 days');
        $week_all    = _expand_range($mon_dt, $sun_dt);
        $week_lab    = array_filter($week_all, '_is_laboral');
        $work_count  = count($week_lab) - count($vac_days);
        if (count($vac_days) >= 1 && $work_count === 1) {
            $errors[] = "Setmana del $mon: agafes " . count($vac_days) . " dies laborals i en treballes només 1. Has de fer la setmana completa de vacances o treballar almenys 2 dies.";
        }
    }

    // Solo Fri/Mon streak
    $all_blocks = [];
    foreach ($existing as $v) {
        if (($v['status'] ?? '') !== 'Denegada') {
            $all_blocks[] = [$v['start_date'], $v['end_date']];
        }
    }
    $all_blocks[] = [$start_iso, $end_iso];
    $streak = _count_solo_fri_mon_streak($all_blocks);
    if ($streak > MAX_SOLO_FRIDAY_MONDAY) {
        $errors[] = 'No es poden agafar més de ' . MAX_SOLO_FRIDAY_MONDAY . " divendres/dilluns solts seguits (portaries $streak).";
    }

    // Annual quota
    $used = 0;
    foreach ($existing as $v) {
        if (($v['status'] ?? '') !== 'Denegada') {
            $used += _laboral_days_between(_parse_date($v['start_date']), _parse_date($v['end_date']));
        }
    }
    if ($used + $lab_count > ANNUAL_QUOTA_DAYS) {
        $errors[] = 'Superes la quota anual de ' . ANNUAL_QUOTA_DAYS . ' dies (portaries ' . ($used + $lab_count) . ').';
    }

    return $errors;
}
