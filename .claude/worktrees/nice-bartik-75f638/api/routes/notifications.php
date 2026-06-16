<?php
// Routes: /api/notifications/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db  = get_db();
$id  = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub = $segments[1] ?? ''; // could be 'read-all' or 'clear-all'

// GET /api/notifications
if ($method === 'GET' && $sub === '') {
    $u    = auth_user();
    $stmt = $db->prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30');
    $stmt->execute([(int)$u['id']]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['read'] = (int)$r['read']; }
    respond($rows);
}

// PATCH /api/notifications/read-all
elseif ($method === 'PATCH' && $sub === 'read-all') {
    $u = auth_user();
    $db->prepare('UPDATE notifications SET `read`=1 WHERE user_id=?')->execute([(int)$u['id']]);
    respond(['ok' => true]);
}

// DELETE /api/notifications/clear-all
elseif ($method === 'DELETE' && $sub === 'clear-all') {
    $u = auth_user();
    $db->prepare('DELETE FROM notifications WHERE user_id=?')->execute([(int)$u['id']]);
    http_response_code(204);
    exit;
}

// PATCH /api/notifications/{id}/read
elseif ($method === 'PATCH' && $id !== null && ($segments[2] ?? '') === 'read') {
    $u = auth_user();
    $db->prepare('UPDATE notifications SET `read`=1 WHERE id=? AND user_id=?')->execute([$id, (int)$u['id']]);
    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
