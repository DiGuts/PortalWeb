<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (method() === 'GET') {
    $isRrhh = in_array($me['role'], ['Administrador/a', 'Recursos humans']);
    if ($isRrhh) {
        $st = $db->query('SELECT * FROM solicituds ORDER BY created_at DESC');
    } else {
        $st = $db->prepare('SELECT * FROM solicituds WHERE author = ? ORDER BY created_at DESC');
        $st->execute([$me['name']]);
    }
    json_out($st->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $db->prepare('INSERT INTO solicituds (date, comments, motive, author) VALUES (?, ?, ?, ?)')
       ->execute([$b['date'] ?? '', $b['comments'] ?? '', $b['motive'] ?? '', $me['name']]);
    $st = $db->prepare('SELECT * FROM solicituds WHERE id = ?');
    $st->execute([$db->lastInsertId()]);
    json_out($st->fetch(), 201);
}

if (method() === 'PATCH' && $id) {
    $b = body();
    $db->prepare('UPDATE solicituds SET status = ?, motive = ? WHERE id = ?')
       ->execute([$b['status'] ?? 'Pendent', $b['motive'] ?? '', $id]);
    json_out(['ok' => true]);
}

err('Method not allowed', 405);
