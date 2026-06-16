<?php
// Routes: /api/enquestes/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

// GET /api/enquestes
if ($method === 'GET' && $id === null) {
    $u    = auth_user();
    $rows = $db->query('SELECT * FROM enquestes ORDER BY created_at DESC')->fetchAll();

    $done_stmt = $db->prepare('SELECT enquesta_id FROM enquesta_responses WHERE user_email=?');
    $done_stmt->execute([$u['email']]);
    $done = array_column($done_stmt->fetchAll(), 'enquesta_id');

    foreach ($rows as &$r) {
        $r['id']             = (int)$r['id'];
        $r['user_completed'] = in_array((int)$r['id'], $done, true);
    }
    respond($rows);
}

// POST /api/enquestes/{id}/respond
elseif ($method === 'POST' && $id !== null && $sub === 'respond') {
    $u = auth_user();
    try {
        $db->prepare('INSERT INTO enquesta_responses (enquesta_id, user_email) VALUES (?,?)')->execute([$id, $u['email']]);
        $db->prepare('UPDATE enquestes SET responses=responses+1 WHERE id=?')->execute([$id]);
    } catch (PDOException $e) {
        // UNIQUE constraint violation
        respond(['detail' => 'Ja has respost aquesta enquesta'], 409);
    }
    respond(['ok' => true], 201);
}

else {
    respond(['detail' => 'Not found'], 404);
}
