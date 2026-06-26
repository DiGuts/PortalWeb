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

// GET /api/courses/{id}
if ($method === 'GET' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $stmt = $db->prepare('SELECT * FROM courses WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'Curs no trobat'], 404);
    $row['id']          = (int)$row['id'];
    $row['mandatory']   = (int)$row['mandatory'];
    $row['cert']        = (int)($row['cert'] ?? 0);
    $row['is_external'] = (int)($row['is_external'] ?? 0);
    $row['active']      = (int)($row['active'] ?? 1);
    $row['departments'] = $row['departments'] ?: '[]';
    $row['target_users'] = json_decode($row['target_users'] ?? '[]', true) ?: [];
    respond($row);
}

// GET /api/courses
elseif ($method === 'GET' && $id === null) {
    $u    = auth_user();
    $uid  = (int)$u['id'];
    $rows = $db->query('SELECT * FROM courses ORDER BY mandatory DESC, title')->fetchAll();

    // Non-manager users only see external courses targeted at their dept/user (or no restriction)
    $isManager = user_has_any_role($u, ['Administrador', 'Administrador/a', 'Recursos humans', 'Formacions']);
    if (!$isManager) {
        $userDept = (string)($u['dept'] ?? '');
        $userId   = (int)$u['id'];
        $rows = array_values(array_filter($rows, function ($r) use ($userDept, $userId) {
            if (!(int)$r['is_external']) return true;
            // Hide inactive external courses from regular users
            if (isset($r['active']) && !(int)$r['active']) return false;
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

    // Certificate status for this user
    $cert_stmt = $db->prepare(
        'SELECT course_id, id AS certificate_id, status AS certificate_status
         FROM course_certificates WHERE user_id=? AND is_active=1'
    );
    $cert_stmt->execute([$uid]);
    $cert_map = [];
    foreach ($cert_stmt->fetchAll() as $c) {
        $cert_map[(int)$c['course_id']] = $c;
    }

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
        $cert = $cert_map[$r['id']] ?? null;
        $r['certificate_status'] = $cert ? $cert['certificate_status'] : null;
        $r['certificate_id']     = $cert ? (int)$cert['certificate_id'] : null;
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
    $image     = str_val($body, 'image');
    $content   = array_key_exists('content', $body) ? (string)($body['content'] ?? '') : '';

    $active = array_key_exists('active', $body) ? (int)(bool)$body['active'] : 1;
    $db->prepare('INSERT INTO courses (title, description, url, category, hours, mandatory, is_external, departments, target_users, start_at, end_at, active, image, content) VALUES (?,?,?,?,?,?,1,?,?,?,?,?,?,?)')
       ->execute([$title, $desc, $url, $cat, $hours, $mand, $depts, $tgt_users, $start_at, $end_at, $active, $image, $content]);
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
    $image     = array_key_exists('image', $body) ? (string)($body['image'] ?? '') : null;

    $active = array_key_exists('active', $body) ? (int)(bool)$body['active'] : 1;

    // Base update — always applied
    $sql    = 'UPDATE courses SET title=?, description=?, url=?, category=?, hours=?, mandatory=?, departments=?, target_users=?, start_at=?, end_at=?, active=?';
    $params = [$title, $desc, $url, $cat, $hours, $mand, $depts, $tgt_users, $start_at, $end_at, $active];

    // image — update only when the key is present in the payload
    if ($image !== null) { $sql .= ', image=?'; $params[] = $image; }

    // content — update only when the key is present (extended editor); small editor omits it → preserved
    if (array_key_exists('content', $body)) { $sql .= ', content=?'; $params[] = (string)($body['content'] ?? ''); }

    $sql .= ' WHERE id=? AND is_external=1';
    $params[] = $id;
    $db->prepare($sql)->execute($params);
    _sync_course_agenda($db, $id, $title, $start_at, $end_at, $depts_arr, $tgt_users);
    respond(['status' => 'ok']);
}

// DELETE /api/courses/{id} — delete external course (admin/formacions only)
elseif ($method === 'DELETE' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $db->prepare('DELETE FROM agenda_events WHERE course_id=?')->execute([$id]);
    $db->prepare('DELETE FROM user_course_progress WHERE course_id=?')->execute([$id]);
    $db->prepare('DELETE FROM course_certificates WHERE course_id=?')->execute([$id]);
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

// GET /api/courses/{id}/users — user progress breakdown for a formation (admin)
elseif ($method === 'GET' && $id !== null && $sub === 'users') {
    require_formacions_or_admin();

    $cq = $db->prepare('SELECT departments, target_users FROM courses WHERE id=? AND is_external=1');
    $cq->execute([$id]);
    $course = $cq->fetch();
    if (!$course) respond(['detail' => 'Curs no trobat'], 404);

    $depts    = json_decode($course['departments'] ?: '[]', true) ?: [];
    $tgt_uids = json_decode($course['target_users'] ?? '[]', true) ?: [];

    $sql    = 'SELECT u.id, u.name, u.dept,
                      COALESCE(p.status, "Pendent") AS status,
                      COALESCE(p.progress, 0) AS progress
               FROM users u
               LEFT JOIN user_course_progress p ON p.user_id=u.id AND p.course_id=?
               WHERE u.active=1';
    $params = [$id];

    if (!empty($depts) || !empty($tgt_uids)) {
        $conds = [];
        if (!empty($depts)) {
            $ph      = implode(',', array_fill(0, count($depts), '?'));
            $conds[] = "u.dept IN ($ph)";
            $params  = array_merge($params, $depts);
        }
        if (!empty($tgt_uids)) {
            $ph      = implode(',', array_fill(0, count($tgt_uids), '?'));
            $conds[] = "u.id IN ($ph)";
            $params  = array_merge($params, $tgt_uids);
        }
        $sql .= ' AND (' . implode(' OR ', $conds) . ')';
    }

    $sql .= ' ORDER BY CASE COALESCE(p.status,"Pendent")
                           WHEN "Completat" THEN 1
                           WHEN "En curs"   THEN 2
                           ELSE 3
                       END, u.name';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id']       = (int)$r['id'];
        $r['progress'] = (int)$r['progress'];
    }
    unset($r);
    respond($rows);
}

else {
    respond(['detail' => 'Not found'], 404);
}
