<?php
// Routes: /api/courses/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

function _sync_course_agenda(PDO $db, int $course_id, string $title, ?string $start_at, ?string $end_at, array $depts, ?string $target_users_json): void {
    // Remove old event for this course
    $db->prepare('DELETE FROM agenda_events WHERE course_id=?')->execute([$course_id]);
    if (!$start_at) return;
    $dt = date_create($start_at);
    if (!$dt) return;
    $day   = (int)date_format($dt, 'j');
    $month = (int)date_format($dt, 'n');
    $year  = (int)date_format($dt, 'Y');
    $end_day = null;
    if ($end_at && $end_at !== $start_at) {
        $dt2 = date_create($end_at);
        if ($dt2) $end_day = (int)date_format($dt2, 'j');
    }
    $target_depts_json = !empty($depts) ? json_encode(array_values($depts), JSON_UNESCAPED_UNICODE) : null;
    $db->prepare(
        'INSERT INTO agenda_events (title, day, month, year, end_day, type, course_id, target_departments, target_users)
         VALUES (?,?,?,?,?,?,?,?,?)'
    )->execute([$title, $day, $month, $year, $end_day, 'Formació externa', $course_id, $target_depts_json, $target_users_json]);
}

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

// GET /api/courses
if ($method === 'GET' && $id === null) {
    $u    = auth_user();
    $uid  = (int)$u['id'];
    $rows = $db->query('SELECT * FROM courses ORDER BY mandatory DESC, title')->fetchAll();

    // Non-manager users only see external courses targeted at their dept/user (or no restriction)
    $isManager = in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Formacions'], true);
    if (!$isManager) {
        $userDept = (string)($u['dept'] ?? '');
        $userId   = (int)$u['id'];
        $rows = array_values(array_filter($rows, function ($r) use ($userDept, $userId) {
            if (!(int)$r['is_external']) return true;
            $depts      = json_decode($r['departments'] ?: '[]', true) ?: [];
            $tgt_users  = json_decode($r['target_users'] ?? '[]', true) ?: [];
            // No restriction = visible to all
            if (empty($depts) && empty($tgt_users)) return true;
            $dept_ok = !empty($depts) && in_array($userDept, $depts, true);
            $user_ok = !empty($tgt_users) && in_array($userId, $tgt_users, true);
            return $dept_ok || $user_ok;
        }));
    }

    $prog_stmt = $db->prepare('SELECT course_id, status, progress FROM user_course_progress WHERE user_id=?');
    $prog_stmt->execute([$uid]);
    $prog_map = [];
    foreach ($prog_stmt->fetchAll() as $p) $prog_map[$p['course_id']] = $p;

    foreach ($rows as &$r) {
        $r['id']          = (int)$r['id'];
        $r['mandatory']   = (int)$r['mandatory'];
        $r['cert']        = (int)$r['cert'];
        $r['is_external'] = (int)$r['is_external'];
        $r['departments'] = $r['departments'] ?: '[]';
        $r['target_users'] = json_decode($r['target_users'] ?? '[]', true) ?: [];
        $r['start_at']     = $r['start_at'] ?? null;
        $r['end_at']       = $r['end_at']   ?? null;
        $p = $prog_map[$r['id']] ?? null;
        $r['user_status']   = $p ? $p['status']   : 'Pendent';
        $r['user_progress'] = $p ? (int)$p['progress'] : 0;
    }
    respond($rows);
}

// POST /api/courses — create external course (admin/formacions only)
elseif ($method === 'POST' && $id === null) {
    require_formacions_or_admin();
    $title     = str_val($body, 'title');
    $desc      = str_val($body, 'description');
    $url       = str_val($body, 'url');
    $cat       = str_val($body, 'category');
    $hours     = str_val($body, 'hours');
    $mand      = int_val($body, 'mandatory');
    $depts_arr = is_array($body['departments'] ?? null) ? $body['departments'] : [];
    $depts     = json_encode($depts_arr);
    $tgt_users = !empty($body['target_users']) && is_array($body['target_users'])
        ? json_encode(array_values(array_filter(array_map('intval', $body['target_users']))))
        : null;
    $start_at  = isset($body['start_at']) && $body['start_at'] !== '' ? (string)$body['start_at'] : null;
    $end_at    = isset($body['end_at'])   && $body['end_at']   !== '' ? (string)$body['end_at']   : null;

    $db->prepare('INSERT INTO courses (title, description, url, category, hours, mandatory, is_external, departments, target_users, start_at, end_at) VALUES (?,?,?,?,?,?,1,?,?,?,?)')
       ->execute([$title, $desc, $url, $cat, $hours, $mand, $depts, $tgt_users, $start_at, $end_at]);
    $new_id = (int)$db->lastInsertId();
    _sync_course_agenda($db, $new_id, $title, $start_at, $end_at, $depts_arr, $tgt_users);
    respond(['id' => $new_id, 'status' => 'ok'], 201);
}

// PUT /api/courses/{id} — update external course (admin/formacions only)
elseif ($method === 'PUT' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $title     = str_val($body, 'title');
    $desc      = str_val($body, 'description');
    $url       = str_val($body, 'url');
    $cat       = str_val($body, 'category');
    $hours     = str_val($body, 'hours');
    $mand      = int_val($body, 'mandatory');
    $depts_arr = is_array($body['departments'] ?? null) ? $body['departments'] : [];
    $depts     = json_encode($depts_arr);
    $tgt_users = !empty($body['target_users']) && is_array($body['target_users'])
        ? json_encode(array_values(array_filter(array_map('intval', $body['target_users']))))
        : null;
    $start_at  = isset($body['start_at']) && $body['start_at'] !== '' ? (string)$body['start_at'] : null;
    $end_at    = isset($body['end_at'])   && $body['end_at']   !== '' ? (string)$body['end_at']   : null;

    $db->prepare('UPDATE courses SET title=?, description=?, url=?, category=?, hours=?, mandatory=?, departments=?, target_users=?, start_at=?, end_at=? WHERE id=? AND is_external=1')
       ->execute([$title, $desc, $url, $cat, $hours, $mand, $depts, $tgt_users, $start_at, $end_at, $id]);
    _sync_course_agenda($db, $id, $title, $start_at, $end_at, $depts_arr, $tgt_users);
    respond(['status' => 'ok']);
}

// DELETE /api/courses/{id} — delete external course (admin/formacions only)
elseif ($method === 'DELETE' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $db->prepare('DELETE FROM agenda_events WHERE course_id=?')->execute([$id]);
    $db->prepare('DELETE FROM courses WHERE id=? AND is_external=1')->execute([$id]);
    respond(['status' => 'ok']);
}

// PATCH /api/courses/{id}/progress
elseif ($method === 'PATCH' && $id !== null && $sub === 'progress') {
    $u   = auth_user();
    $uid = (int)$u['id'];
    // MariaDB upsert
    $db->prepare('INSERT INTO user_course_progress (user_id, course_id, status, progress) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), progress=VALUES(progress)')
       ->execute([$uid, $id, str_val($body,'status'), int_val($body,'progress')]);
    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
