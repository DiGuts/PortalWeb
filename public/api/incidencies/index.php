<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();

if (method() === 'GET') {
    $isRrhh = in_array($me['role'], ['Administrador/a', 'Recursos humans']);
    if ($isRrhh) {
        $st = $db->query('SELECT * FROM incidencies ORDER BY created_at DESC');
    } else {
        $st = $db->prepare('SELECT * FROM incidencies WHERE author = ? ORDER BY created_at DESC');
        $st->execute([$me['name']]);
    }
    json_out($st->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $db->prepare('INSERT INTO incidencies (title, description, area, priority, author) VALUES (?, ?, ?, ?, ?)')
       ->execute([$b['title'] ?? '', $b['description'] ?? '', $b['area'] ?? 'General', $b['priority'] ?? 'Baixa', $me['name']]);
    $st = $db->prepare('SELECT * FROM incidencies WHERE id = ?');
    $st->execute([$db->lastInsertId()]);
    json_out($st->fetch(), 201);
}

err('Method not allowed', 405);
