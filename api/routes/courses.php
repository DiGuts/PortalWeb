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

    $prog_stmt = $db->prepare('SELECT course_id, status, progress FROM user_course_progress WHERE user_id=?');
    $prog_stmt->execute([$uid]);
    $prog_map = [];
    foreach ($prog_stmt->fetchAll() as $p) $prog_map[$p['course_id']] = $p;

    foreach ($rows as &$r) {
        $r['id']        = (int)$r['id'];
        $r['mandatory'] = (int)$r['mandatory'];
        $r['cert']      = (int)$r['cert'];
        $p = $prog_map[$r['id']] ?? null;
        $r['user_status']   = $p ? $p['status']   : 'Pendent';
        $r['user_progress'] = $p ? (int)$p['progress'] : 0;
    }
    respond($rows);
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
