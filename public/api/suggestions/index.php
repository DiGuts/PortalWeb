<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();

if (method() === 'GET') {
    json_out($db->query('SELECT * FROM suggestions ORDER BY created_at DESC')->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $author = ($b['anonymous'] ?? false) ? 'Anònim' : $me['name'];
    $db->prepare('INSERT INTO suggestions (title, description, category, anonymous, author) VALUES (?, ?, ?, ?, ?)')
       ->execute([$b['title'] ?? '', $b['description'] ?? '', $b['category'] ?? 'General', $b['anonymous'] ? 1 : 0, $author]);
    $st = $db->prepare('SELECT * FROM suggestions WHERE id = ?');
    $st->execute([$db->lastInsertId()]);
    json_out($st->fetch(), 201);
}

err('Method not allowed', 405);
