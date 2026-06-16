<?php
// Routes: /api/agenda/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

// POST /api/agenda
if ($method === 'POST' && $id === null) {
    require_comunicacions_or_admin();
    $db->prepare('INSERT INTO agenda_events (title,day,month,time,location,type) VALUES (?,?,?,?,?,?)')
       ->execute([str_val($body,'title'), int_val($body,'day'), int_val($body,'month'), str_val($body,'time'), str_val($body,'location'), str_val($body,'type','Sessió interna')]);
    $row = $db->query('SELECT * FROM agenda_events WHERE id=' . $db->lastInsertId())->fetch();
    $row['id'] = (int)$row['id'];
    respond($row, 201);
}

// PUT /api/agenda/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('UPDATE agenda_events SET title=?,day=?,month=?,time=?,location=?,type=? WHERE id=?')
       ->execute([str_val($body,'title'), int_val($body,'day'), int_val($body,'month'), str_val($body,'time'), str_val($body,'location'), str_val($body,'type','Sessió interna'), $id]);
    respond(['ok' => true]);
}

// DELETE /api/agenda/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('DELETE FROM agenda_events WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

// GET /api/agenda
elseif ($method === 'GET' && $id === null) {
    auth_user();
    if (isset($_GET['month'])) {
        $stmt = $db->prepare('SELECT * FROM agenda_events WHERE month=? ORDER BY day, time');
        $stmt->execute([(int)$_GET['month']]);
    } else {
        $stmt = $db->query('SELECT * FROM agenda_events ORDER BY month, day, time');
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) $r['id'] = (int)$r['id'];
    respond($rows);
}

else {
    respond(['detail' => 'Not found'], 404);
}
