<?php
// Routes: /api/courses/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

// GET /api/courses
if ($method === 'GET' && $id === null) {
    $u    = auth_user();
    $uid  = (int)$u['id'];
    $rows = $db->query('SELECT * FROM courses ORDER BY mandatory DESC, title')->fetchAll();

    // Non-manager users only see external courses targeted at their dept (or no dept restriction)
    $isManager = in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Formacions'], true);
    if (!$isManager) {
        $userDept = $u['dept'];
        $rows = array_values(array_filter($rows, function ($r) use ($userDept) {
            if (!(int)$r['is_external']) return true;
            $depts = json_decode($r['departments'] ?: '[]', true);
            return empty($depts) || in_array($userDept, $depts, true);
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
        $p = $prog_map[$r['id']] ?? null;
        $r['user_status']   = $p ? $p['status']   : 'Pendent';
        $r['user_progress'] = $p ? (int)$p['progress'] : 0;
    }
    respond($rows);
}

// POST /api/courses — create external course (admin/formacions only)
elseif ($method === 'POST' && $id === null) {
    require_formacions_or_admin();
    $title = str_val($body, 'title');
    $desc  = str_val($body, 'description');
    $url   = str_val($body, 'url');
    $cat   = str_val($body, 'category');
    $hours = str_val($body, 'hours');
    $mand  = int_val($body, 'mandatory');
    $depts = json_encode($body['departments'] ?? []);

    $db->prepare('INSERT INTO courses (title, description, url, category, hours, mandatory, is_external, departments) VALUES (?,?,?,?,?,?,1,?)')
       ->execute([$title, $desc, $url, $cat, $hours, $mand, $depts]);
    respond(['id' => (int)$db->lastInsertId(), 'status' => 'ok'], 201);
}

// PUT /api/courses/{id} — update external course (admin/formacions only)
elseif ($method === 'PUT' && $id !== null && $sub === '') {
    require_formacions_or_admin();
    $title = str_val($body, 'title');
    $desc  = str_val($body, 'description');
    $url   = str_val($body, 'url');
    $cat   = str_val($body, 'category');
    $hours = str_val($body, 'hours');
    $mand  = int_val($body, 'mandatory');
    $depts = json_encode($body['departments'] ?? []);

    $db->prepare('UPDATE courses SET title=?, description=?, url=?, category=?, hours=?, mandatory=?, departments=? WHERE id=? AND is_external=1')
       ->execute([$title, $desc, $url, $cat, $hours, $mand, $depts, $id]);
    respond(['status' => 'ok']);
}

// DELETE /api/courses/{id} — delete external course (admin/formacions only)
elseif ($method === 'DELETE' && $id !== null && $sub === '') {
    require_formacions_or_admin();
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
