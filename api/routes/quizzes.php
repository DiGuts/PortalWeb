<?php
// Routes: /api/quizzes/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

function _get_full_quiz(PDO $db, int $quiz_id, bool $include_correct): array {
    $stmt = $db->prepare('SELECT * FROM quizzes WHERE id=?');
    $stmt->execute([$quiz_id]);
    $quiz = $stmt->fetch();
    if (!$quiz) respond(['detail' => 'Quiz no trobat'], 404);

    $qs = $db->prepare('SELECT * FROM quiz_questions WHERE quiz_id=? ORDER BY position, id');
    $qs->execute([$quiz_id]);
    $questions = $qs->fetchAll();

    $result_questions = [];
    foreach ($questions as $q) {
        $os = $db->prepare('SELECT * FROM quiz_options WHERE question_id=? ORDER BY position, id');
        $os->execute([$q['id']]);
        $opts = $os->fetchAll();

        $q['id']        = (int)$q['id'];
        $q['quiz_id']   = (int)$q['quiz_id'];
        $q['points']    = (int)$q['points'];
        $q['position']  = (int)$q['position'];
        $q['media_url'] = $q['media_url'] ?? '';

        $clean_opts = [];
        foreach ($opts as $o) {
            $o['id']          = (int)$o['id'];
            $o['question_id'] = (int)$o['question_id'];
            $o['position']    = (int)$o['position'];
            $o['is_correct']  = (int)$o['is_correct'];
            if (!$include_correct) unset($o['is_correct']);
            $clean_opts[] = $o;
        }
        $q['options'] = $clean_opts;
        $result_questions[] = $q;
    }

    $quiz['id']             = (int)$quiz['id'];
    $quiz['time_limit']     = (int)$quiz['time_limit'];
    $quiz['passing_score']  = (int)$quiz['passing_score'];
    $quiz['active']         = (int)$quiz['active'];
    $quiz['is_presential']  = (int)($quiz['is_presential'] ?? 0);
    $quiz['image']          = $quiz['image'] ?? '';
    $quiz['location']       = $quiz['location'] ?? '';
    $quiz['start_at']       = $quiz['start_at'] ?? null;
    $quiz['end_at']         = $quiz['end_at'] ?? null;
    $quiz['target_departments'] = _decode_target_depts($quiz['target_departments'] ?? null);
    $quiz['target_users']       = _decode_target_users($quiz['target_users'] ?? null);
    $quiz['questions']      = $result_questions;
    return $quiz;
}

function _decode_target_depts($raw): array {
    if ($raw === null || $raw === '') return [];
    $decoded = json_decode((string)$raw, true);
    return is_array($decoded) ? array_values(array_filter(array_map('strval', $decoded))) : [];
}

function _encode_target_depts(array $body): ?string {
    if (!array_key_exists('target_departments', $body)) return null;
    $v = $body['target_departments'];
    if (!is_array($v)) return null;
    $clean = array_values(array_filter(array_map(fn($x) => is_string($x) ? trim($x) : '', $v), fn($x) => $x !== ''));
    return $clean ? json_encode($clean, JSON_UNESCAPED_UNICODE) : null;
}

function _decode_target_users($raw): array {
    if ($raw === null || $raw === '') return [];
    $decoded = json_decode((string)$raw, true);
    return is_array($decoded) ? array_values(array_filter(array_map('intval', $decoded))) : [];
}

function _encode_target_users(array $body): ?string {
    if (!array_key_exists('target_users', $body)) return null;
    $v = $body['target_users'];
    if (!is_array($v)) return null;
    $clean = array_values(array_filter(array_map('intval', $v)));
    return $clean ? json_encode($clean) : null;
}

function _upsert_agenda_event(PDO $db, int $quiz_id, array $body): void {
    $start = _quiz_str($body, 'start_at');
    if (!$start) return;
    $dt = date_create($start);
    if (!$dt) return;
    $day   = (int)date_format($dt, 'j');
    $month = (int)date_format($dt, 'n');
    $year  = (int)date_format($dt, 'Y');
    $end   = _quiz_str($body, 'end_at');
    $end_day = $end ? (int)date_format(date_create($end), 'j') : null;
    $title    = str_val($body, 'title') ?: '';
    $location = str_val($body, 'location') ?: '';
    $desc     = str_val($body, 'description') ?: '';
    $target_depts = _encode_target_depts($body);
    $target_users = _encode_target_users($body);
    $db->prepare(
        'INSERT INTO agenda_events (title, day, month, year, end_day, location, description, type, quiz_id, target_departments, target_users)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE year=VALUES(year), end_day=VALUES(end_day), location=VALUES(location), description=VALUES(description), quiz_id=VALUES(quiz_id), target_departments=VALUES(target_departments), target_users=VALUES(target_users)'
    )->execute([$title, $day, $month, $year, $end_day, $location, $desc, 'Formació presencial', $quiz_id, $target_depts, $target_users]);
}

function _quiz_str(array $body, string $key): ?string {
    if (!array_key_exists($key, $body)) return null;
    $v = $body[$key];
    if ($v === null || $v === '') return null;
    return (string)$v;
}

function _insert_questions(PDO $db, int $quiz_id, array $questions): void {
    foreach ($questions as $q) {
        $stmt = $db->prepare('INSERT INTO quiz_questions (quiz_id, type, question, explanation, points, position, media_url) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([
            $quiz_id,
            $q['type'] ?? 'multiple_choice',
            $q['question'] ?? '',
            $q['explanation'] ?? '',
            (int)($q['points'] ?? 1),
            (int)($q['position'] ?? 0),
            isset($q['media_url']) && $q['media_url'] !== '' ? (string)$q['media_url'] : null,
        ]);
        $qid = (int)$db->lastInsertId();
        foreach (($q['options'] ?? []) as $opt) {
            $os = $db->prepare('INSERT INTO quiz_options (question_id, text, is_correct, match_pair, position) VALUES (?,?,?,?,?)');
            $os->execute([
                $qid,
                $opt['text'] ?? '',
                !empty($opt['is_correct']) ? 1 : 0,
                $opt['match_pair'] ?? '',
                (int)($opt['position'] ?? 0),
            ]);
        }
    }
}

// GET /api/quizzes
if ($method === 'GET' && $id === null) {
    $u = auth_user();
    $is_admin = in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Formacions'], true);
    if ($is_admin) {
        $rows = $db->query('SELECT * FROM quizzes ORDER BY created_at DESC')->fetchAll();
    } else {
        $rows = $db->query('SELECT * FROM quizzes WHERE active=1 ORDER BY created_at DESC')->fetchAll();
    }
    $user_dept = (string)($u['dept'] ?? '');
    $user_id   = (int)$u['id'];
    $result = [];
    foreach ($rows as $row) {
        $target_depts = _decode_target_depts($row['target_departments'] ?? null);
        $target_users = _decode_target_users($row['target_users'] ?? null);
        // Visibility: empty both = all. Non-empty = user must match either list.
        if (!$is_admin && (!empty($target_depts) || !empty($target_users))) {
            $dept_ok = !empty($target_depts) && in_array($user_dept, $target_depts, true);
            $user_ok = !empty($target_users) && in_array($user_id, $target_users, true);
            if (!$dept_ok && !$user_ok) continue;
        }
        $a = $db->prepare('SELECT score, max_score, passed, completed_at FROM quiz_attempts WHERE quiz_id=? AND user_id=?');
        $a->execute([(int)$row['id'], (int)$u['id']]);
        $attempt = $a->fetch();
        $c = $db->prepare('SELECT COUNT(*) AS cnt FROM quiz_questions WHERE quiz_id=?');
        $c->execute([(int)$row['id']]);
        $cnt = (int)$c->fetch()['cnt'];
        try {
            $p = $db->prepare('SELECT current_question_idx FROM quiz_progress WHERE quiz_id=? AND user_id=?');
            $p->execute([(int)$row['id'], (int)$u['id']]);
            $progRow = $p->fetch();
            $in_progress = $progRow && (int)$progRow['current_question_idx'] > 0;
        } catch (\Throwable $e) {
            $in_progress = false;
        }

        $row['id']             = (int)$row['id'];
        $row['time_limit']     = (int)$row['time_limit'];
        $row['passing_score']  = (int)$row['passing_score'];
        $row['active']         = (int)$row['active'];
        $row['is_presential']  = (int)($row['is_presential'] ?? 0);
        $row['image']          = $row['image'] ?? '';
        $row['location']       = $row['location'] ?? '';
        $row['start_at']       = $row['start_at'] ?? null;
        $row['end_at']         = $row['end_at'] ?? null;
        $row['target_departments'] = $target_depts;
        $row['target_users']       = $target_users;
        if ($attempt) {
            $attempt['score']     = (int)$attempt['score'];
            $attempt['max_score'] = (int)$attempt['max_score'];
            $attempt['passed']    = (int)$attempt['passed'];
        }
        $row['user_attempt']   = $attempt ?: null;
        $row['question_count'] = $cnt;
        $row['in_progress']    = $in_progress;
        $result[] = $row;
    }
    respond($result);
}

// GET /api/quizzes/{id}
elseif ($method === 'GET' && $id !== null && $sub === '') {
    $u = auth_user();
    $is_admin = in_array($u['role'], ['Administrador/a', 'Recursos humans'], true);
    respond(_get_full_quiz($db, $id, $is_admin));
}

// POST /api/quizzes
elseif ($method === 'POST' && $id === null) {
    require_formacions_or_admin();
    $is_presential = bool_val($body, 'is_presential') ? 1 : 0;
    $db->prepare('INSERT INTO quizzes (title, description, image, category, time_limit, passing_score, active, start_at, end_at, target_departments, target_users, is_presential, location) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
       ->execute([
           str_val($body,'title'), str_val($body,'description'),
           str_val($body,'image'), str_val($body,'category'),
           int_val($body,'time_limit'), int_val($body,'passing_score', 70),
           bool_val($body,'active', true) ? 1 : 0,
           _quiz_str($body, 'start_at'), _quiz_str($body, 'end_at'),
           _encode_target_depts($body), _encode_target_users($body),
           $is_presential, str_val($body, 'location'),
       ]);
    $quiz_id = (int)$db->lastInsertId();
    _insert_questions($db, $quiz_id, $body['questions'] ?? []);
    // Auto-create agenda event for presential trainings
    if ($is_presential && _quiz_str($body, 'start_at')) {
        _upsert_agenda_event($db, $quiz_id, $body);
    }
    respond(_get_full_quiz($db, $quiz_id, true), 201);
}

// PUT /api/quizzes/{id}
elseif ($method === 'PUT' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $stmt = $db->prepare('SELECT id FROM quizzes WHERE id=?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) respond(['detail' => 'Quiz no trobat'], 404);

    $is_presential = bool_val($body, 'is_presential') ? 1 : 0;
    $db->prepare('UPDATE quizzes SET title=?, description=?, image=?, category=?, time_limit=?, passing_score=?, active=?, start_at=?, end_at=?, target_departments=?, target_users=?, is_presential=?, location=? WHERE id=?')
       ->execute([
           str_val($body,'title'), str_val($body,'description'),
           str_val($body,'image'), str_val($body,'category'),
           int_val($body,'time_limit'), int_val($body,'passing_score', 70),
           bool_val($body,'active', true) ? 1 : 0,
           _quiz_str($body, 'start_at'), _quiz_str($body, 'end_at'),
           _encode_target_depts($body), _encode_target_users($body),
           $is_presential, str_val($body, 'location'),
           $id,
       ]);
    $db->prepare('DELETE FROM quiz_questions WHERE quiz_id=?')->execute([$id]);
    _insert_questions($db, $id, $body['questions'] ?? []);
    // Sync agenda event for presential trainings
    if ($is_presential) {
        $db->prepare('DELETE FROM agenda_events WHERE quiz_id=?')->execute([$id]);
        if (_quiz_str($body, 'start_at')) _upsert_agenda_event($db, $id, $body);
    }
    respond(_get_full_quiz($db, $id, true));
}

// DELETE /api/quizzes/{id}
elseif ($method === 'DELETE' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $db->prepare('DELETE FROM quiz_questions WHERE quiz_id=?')->execute([$id]);
    $db->prepare('DELETE FROM quiz_attempts WHERE quiz_id=?')->execute([$id]);
    $db->prepare('DELETE FROM quizzes WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

// POST /api/quizzes/{id}/attempt
elseif ($method === 'POST' && $id !== null && $sub === 'attempt') {
    $u = auth_user();
    $stmt = $db->prepare('SELECT * FROM quizzes WHERE id=?');
    $stmt->execute([$id]);
    $quiz = $stmt->fetch();
    if (!$quiz) respond(['detail' => 'Quiz no trobat'], 404);

    $qs = $db->prepare('SELECT * FROM quiz_questions WHERE quiz_id=? ORDER BY position');
    $qs->execute([$id]);
    $questions = $qs->fetchAll();

    $answers = $body['answers'] ?? [];
    $score = 0;
    $max_score = 0;
    $results = [];

    foreach ($questions as $q) {
        $q_id_str = (string)$q['id'];
        $points = (int)$q['points'];
        $user_answer = $answers[$q_id_str] ?? null;

        // Info slides don't count toward score.
        if ($q['type'] === 'slide') {
            $results[$q_id_str] = [ 'correct' => null, 'points' => 0 ];
            continue;
        }
        // Open-text answers require admin review; excluded from auto max_score.
        if ($q['type'] === 'open_text') {
            $results[$q_id_str] = [
                'correct'        => null,
                'points'         => 0,
                'pending_review' => true,
                'answer'         => (string)($user_answer ?? ''),
            ];
            continue;
        }
        $max_score += $points;

        if ($q['type'] === 'multiple_choice' || $q['type'] === 'true_false') {
            $os = $db->prepare('SELECT id FROM quiz_options WHERE question_id=? AND is_correct=1');
            $os->execute([$q['id']]);
            $correct = $os->fetch();
            $is_correct = $correct && (string)$correct['id'] === (string)$user_answer;
            if ($is_correct) $score += $points;
            $results[$q_id_str] = [
                'correct'    => (bool)$is_correct,
                'points'     => $is_correct ? $points : 0,
                'correct_id' => $correct ? (int)$correct['id'] : null,
            ];
        } elseif ($q['type'] === 'multiple_select') {
            // user_answer expected as array of option-id strings.
            // Partial credit: ratio = max(0, (correct_picked - wrong_picked) / total_correct).
            $os = $db->prepare('SELECT id, is_correct FROM quiz_options WHERE question_id=?');
            $os->execute([$q['id']]);
            $opts = $os->fetchAll();
            $correct_ids = [];
            foreach ($opts as $o) if ((int)$o['is_correct'] === 1) $correct_ids[] = (string)$o['id'];
            $sel = is_array($user_answer) ? array_map('strval', $user_answer) : [];
            $total_correct  = count($correct_ids);
            $picked_correct = count(array_intersect($sel, $correct_ids));
            $picked_wrong   = count(array_diff($sel, $correct_ids));
            $ratio = $total_correct > 0
                ? max(0.0, ($picked_correct - $picked_wrong) / $total_correct)
                : 0.0;
            $ratio = min(1.0, $ratio);
            $earned       = (int)round($points * $ratio);
            $is_correct   = $ratio >= 0.999 && !empty($correct_ids);
            $is_partial   = $ratio > 0.0 && $ratio < 0.999;
            $score += $earned;
            sort($correct_ids);
            $results[$q_id_str] = [
                'correct'     => $is_partial ? null : (bool)$is_correct,
                'partial'     => $is_partial,
                'ratio'       => round($ratio, 3),
                'points'      => $earned,
                'max_points'  => $points,
                'correct_ids' => array_map('intval', $correct_ids),
            ];
        } elseif ($q['type'] === 'matching') {
            $os = $db->prepare('SELECT * FROM quiz_options WHERE question_id=?');
            $os->execute([$q['id']]);
            $opts = $os->fetchAll();
            $all_correct = false;
            if (is_array($user_answer) && !empty($opts)) {
                $all_correct = true;
                foreach ($opts as $o) {
                    if ((string)($user_answer[(string)$o['id']] ?? '') !== (string)$o['match_pair']) {
                        $all_correct = false; break;
                    }
                }
            }
            if ($all_correct) $score += $points;
            $correct_map = [];
            foreach ($opts as $o) $correct_map[(string)$o['id']] = $o['match_pair'];
            $results[$q_id_str] = [
                'correct'     => (bool)$all_correct,
                'points'      => $all_correct ? $points : 0,
                'correct_map' => $correct_map,
            ];
        }
    }

    $passed = $max_score > 0 && ($score / $max_score * 100) >= (int)$quiz['passing_score'];

    $db->prepare(
        'INSERT INTO quiz_attempts (quiz_id, user_id, score, max_score, passed, answers_json) VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE score=VALUES(score), max_score=VALUES(max_score), passed=VALUES(passed), answers_json=VALUES(answers_json), completed_at=NOW()'
    )->execute([$id, (int)$u['id'], $score, $max_score, $passed ? 1 : 0, json_encode($results)]);

    // Clear in-progress save once attempt is recorded
    $db->prepare('DELETE FROM quiz_progress WHERE user_id=? AND quiz_id=?')->execute([(int)$u['id'], $id]);

    respond([
        'score'      => $score,
        'max_score'  => $max_score,
        'passed'     => (bool)$passed,
        'percentage' => $max_score > 0 ? (int)round($score / $max_score * 100) : 0,
        'results'    => $results,
    ]);
}

// GET /api/quizzes/{id}/results  (admin/rrhh)
elseif ($method === 'GET' && $id !== null && $sub === 'results') {
    require_formacions_or_admin();
    $stmt = $db->prepare(
        'SELECT a.id, a.user_id, a.score, a.max_score, a.passed, a.completed_at,
                u.name AS user_name, u.email AS user_email, u.dept AS user_dept
         FROM quiz_attempts a
         JOIN users u ON u.id = a.user_id
         WHERE a.quiz_id = ?
         ORDER BY a.completed_at DESC'
    );
    $stmt->execute([$id]);
    $rows = $stmt->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $score = (int)$r['score'];
        $max   = (int)$r['max_score'];
        $out[] = [
            'id'           => (int)$r['id'],
            'user_id'      => (int)$r['user_id'],
            'user_name'    => $r['user_name'],
            'user_email'   => $r['user_email'],
            'user_dept'    => $r['user_dept'],
            'score'        => $score,
            'max_score'    => $max,
            'percentage'   => $max > 0 ? (int)round($score / $max * 100) : 0,
            'passed'       => (int)$r['passed'],
            'completed_at' => $r['completed_at'],
        ];
    }
    respond($out);
}

// GET /api/quizzes/in-progress-count  (admin/rrhh)
elseif ($method === 'GET' && ($segments[1] ?? '') === 'in-progress-count') {
    require_formacions_or_admin();
    $cnt = (int)$db->query('SELECT COUNT(*) AS c FROM quiz_progress')->fetch()['c'];
    respond(['count' => $cnt]);
}

// GET /api/quizzes/{id}/progress  (current user's saved progress)
elseif ($method === 'GET' && $id !== null && $sub === 'progress') {
    $u = auth_user();
    $stmt = $db->prepare('SELECT current_question_idx, answers_json, updated_at FROM quiz_progress WHERE user_id=? AND quiz_id=?');
    $stmt->execute([(int)$u['id'], $id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'No progress'], 404);
    $answers = json_decode((string)$row['answers_json'], true);
    respond([
        'quiz_id'              => $id,
        'current_question_idx' => (int)$row['current_question_idx'],
        'answers'              => is_array($answers) ? $answers : [],
        'updated_at'           => $row['updated_at'],
    ]);
}

// PUT /api/quizzes/{id}/progress  (upsert)
elseif ($method === 'PUT' && $id !== null && $sub === 'progress') {
    $u = auth_user();
    $idx     = (int)($body['current_question_idx'] ?? 0);
    $answers = $body['answers'] ?? [];
    if (!is_array($answers)) $answers = [];
    $stmt = $db->prepare(
        'INSERT INTO quiz_progress (user_id, quiz_id, current_question_idx, answers_json) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE current_question_idx=VALUES(current_question_idx), answers_json=VALUES(answers_json), updated_at=NOW()'
    );
    $stmt->execute([(int)$u['id'], $id, $idx, json_encode($answers, JSON_UNESCAPED_UNICODE)]);
    respond(['ok' => true]);
}

// DELETE /api/quizzes/{id}/progress  (clear on submit / restart)
elseif ($method === 'DELETE' && $id !== null && $sub === 'progress') {
    $u = auth_user();
    $stmt = $db->prepare('DELETE FROM quiz_progress WHERE user_id=? AND quiz_id=?');
    $stmt->execute([(int)$u['id'], $id]);
    respond(['ok' => true]);
}

// GET /api/quizzes/{id}/non-completers  (admin/rrhh/formacions)
elseif ($method === 'GET' && $id !== null && $sub === 'non-completers') {
    require_formacions_or_admin();
    $row = $db->prepare('SELECT target_departments, target_users FROM quizzes WHERE id=?');
    $row->execute([$id]);
    $quiz = $row->fetch();
    if (!$quiz) respond(['detail' => 'Quiz no trobat'], 404);

    $target_depts = _decode_target_depts($quiz['target_departments'] ?? null);
    $target_users = _decode_target_users($quiz['target_users'] ?? null);

    if (empty($target_depts) && empty($target_users)) {
        $audience = $db->query('SELECT id, name, email, dept FROM users ORDER BY name')->fetchAll();
    } elseif (!empty($target_users) && !empty($target_depts)) {
        $pu = implode(',', array_fill(0, count($target_users), '?'));
        $pd = implode(',', array_fill(0, count($target_depts), '?'));
        $stmt = $db->prepare("SELECT id, name, email, dept FROM users WHERE id IN ($pu) OR dept IN ($pd) ORDER BY name");
        $stmt->execute(array_merge($target_users, $target_depts));
        $audience = $stmt->fetchAll();
    } elseif (!empty($target_users)) {
        $pu = implode(',', array_fill(0, count($target_users), '?'));
        $stmt = $db->prepare("SELECT id, name, email, dept FROM users WHERE id IN ($pu) ORDER BY name");
        $stmt->execute($target_users);
        $audience = $stmt->fetchAll();
    } else {
        $pd = implode(',', array_fill(0, count($target_depts), '?'));
        $stmt = $db->prepare("SELECT id, name, email, dept FROM users WHERE dept IN ($pd) ORDER BY name");
        $stmt->execute($target_depts);
        $audience = $stmt->fetchAll();
    }

    $comp = $db->prepare('SELECT DISTINCT user_id FROM quiz_attempts WHERE quiz_id=?');
    $comp->execute([$id]);
    $completer_ids = array_map('intval', array_column($comp->fetchAll(), 'user_id'));

    $non_completers = array_values(array_filter($audience, fn($u) => !in_array((int)$u['id'], $completer_ids, true)));
    foreach ($non_completers as &$u) $u['id'] = (int)$u['id'];

    respond(['non_completers' => $non_completers, 'total_audience' => count($audience), 'completed' => count($completer_ids)]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
