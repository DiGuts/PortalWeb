<?php
// Routes: /api/activities/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

// POST /api/activities
if ($method === 'POST' && $id === null) {
    require_comunicacions_or_admin();
    $db->prepare('INSERT INTO activities (title,category,description,date,time,location,capacity,link,enrolled,past) VALUES (?,?,?,?,?,?,?,?,0,0)')
       ->execute([str_val($body,'title'), str_val($body,'category'), str_val($body,'description'), str_val($body,'date'), str_val($body,'time'), str_val($body,'location'), int_val($body,'capacity'), str_val($body,'link')]);
    $row = $db->query('SELECT * FROM activities WHERE id=' . $db->lastInsertId())->fetch();
    $row['id'] = (int)$row['id'];
    respond($row, 201);
}

// GET /api/activities
elseif ($method === 'GET' && $id === null) {
    auth_user();
    if (isset($_GET['past'])) {
        $stmt = $db->prepare('SELECT * FROM activities WHERE past=? ORDER BY date');
        $stmt->execute([(int)$_GET['past']]);
    } else {
        $stmt = $db->query('SELECT * FROM activities ORDER BY past, date');
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['past'] = (int)$r['past']; }
    respond($rows);
}

// POST /api/activities/{id}/enroll
elseif ($method === 'POST' && $id !== null && $sub === 'enroll') {
    auth_user();
    $stmt = $db->prepare('SELECT capacity, enrolled FROM activities WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'Activitat no trobada'], 404);
    if ($row['capacity'] > 0 && $row['enrolled'] >= $row['capacity']) respond(['detail' => 'Activitat completa'], 409);
    $db->prepare('UPDATE activities SET enrolled=enrolled+1 WHERE id=?')->execute([$id]);
    respond(['ok' => true]);
}

// PUT /api/activities/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('UPDATE activities SET title=?,category=?,description=?,date=?,time=?,location=?,capacity=?,link=? WHERE id=?')
       ->execute([str_val($body,'title'), str_val($body,'category'), str_val($body,'description'), str_val($body,'date'), str_val($body,'time'), str_val($body,'location'), int_val($body,'capacity'), str_val($body,'link'), $id]);
    respond(['ok' => true]);
}

// DELETE /api/activities/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('DELETE FROM activities WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

else {
    respond(['detail' => 'Not found'], 404);
}
