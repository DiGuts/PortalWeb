<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (method() === 'GET') {
    if (isset($_GET['month'])) {
        $st = $db->prepare('SELECT * FROM agenda_events WHERE month = ? ORDER BY day');
        $st->execute([(int)$_GET['month']]);
    } else {
        $st = $db->query('SELECT * FROM agenda_events ORDER BY month, day');
    }
    json_out($st->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $db->prepare('INSERT INTO agenda_events (title, day, month, time, location, type) VALUES (?,?,?,?,?,?)')
       ->execute([$b['title'] ?? '', (int)($b['day'] ?? 0), (int)($b['month'] ?? 0), $b['time'] ?? '', $b['location'] ?? '', $b['type'] ?? 'Sessió interna']);
    $st = $db->prepare('SELECT * FROM agenda_events WHERE id = ?');
    $st->execute([$db->lastInsertId()]);
    json_out($st->fetch(), 201);
}

if (method() === 'PUT' && $id) {
    $b = body();
    $db->prepare('UPDATE agenda_events SET title=?, day=?, month=?, time=?, location=?, type=? WHERE id=?')
       ->execute([$b['title'] ?? '', (int)($b['day'] ?? 0), (int)($b['month'] ?? 0), $b['time'] ?? '', $b['location'] ?? '', $b['type'] ?? '', $id]);
    json_out(['ok' => true]);
}

if (method() === 'DELETE' && $id) {
    db()->prepare('DELETE FROM agenda_events WHERE id = ?')->execute([$id]);
    http_response_code(204);
    exit;
}

err('Method not allowed', 405);
