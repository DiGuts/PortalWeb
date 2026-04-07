<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (method() === 'GET') {
    if (isset($_GET['past'])) {
        $st = $db->prepare('SELECT * FROM activities WHERE past = ? ORDER BY date');
        $st->execute([(int)$_GET['past']]);
    } else {
        $st = $db->query('SELECT * FROM activities ORDER BY past ASC, date ASC');
    }
    json_out($st->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $db->prepare('INSERT INTO activities (title, category, description, date, time, location, capacity) VALUES (?,?,?,?,?,?,?)')
       ->execute([$b['title'] ?? '', $b['category'] ?? '', $b['description'] ?? '', $b['date'] ?? '', $b['time'] ?? '', $b['location'] ?? '', (int)($b['capacity'] ?? 0)]);
    $st = $db->prepare('SELECT * FROM activities WHERE id = ?');
    $st->execute([$db->lastInsertId()]);
    json_out($st->fetch(), 201);
}

if (method() === 'PUT' && $id) {
    $b = body();
    $db->prepare('UPDATE activities SET title=?, category=?, description=?, date=?, time=?, location=?, capacity=? WHERE id=?')
       ->execute([$b['title'] ?? '', $b['category'] ?? '', $b['description'] ?? '', $b['date'] ?? '', $b['time'] ?? '', $b['location'] ?? '', (int)($b['capacity'] ?? 0), $id]);
    json_out(['ok' => true]);
}

if (method() === 'DELETE' && $id) {
    db()->prepare('DELETE FROM activities WHERE id = ?')->execute([$id]);
    http_response_code(204);
    exit;
}

err('Method not allowed', 405);
