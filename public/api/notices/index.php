<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

$isAdmin = in_array($me['role'], ['Administrador/a']);

// GET — all users see active notices; admins see all
if (method() === 'GET') {
    if ($isAdmin) {
        json_out($db->query('SELECT * FROM notices ORDER BY id DESC')->fetchAll());
    } else {
        json_out($db->query('SELECT * FROM notices WHERE active = 1 ORDER BY id DESC')->fetchAll());
    }
}

// POST — admin only: create notice
if (method() === 'POST') {
    if (!$isAdmin) err('No autoritzat', 403);
    $b = body();
    $db->prepare('INSERT INTO notices (title, content, link, active) VALUES (?, ?, ?, ?)')
       ->execute([
           $b['title']   ?? '',
           $b['content'] ?? '',
           $b['link']    ?? '',
           isset($b['active']) ? (int)(bool)$b['active'] : 1,
       ]);
    $new = $db->prepare('SELECT * FROM notices WHERE id = ?');
    $new->execute([$db->lastInsertId()]);
    json_out($new->fetch(), 201);
}

// PATCH — admin only: update notice
if (method() === 'PATCH' && $id) {
    if (!$isAdmin) err('No autoritzat', 403);
    $b = body();
    $db->prepare('UPDATE notices SET title = ?, content = ?, link = ?, active = ? WHERE id = ?')
       ->execute([
           $b['title']   ?? '',
           $b['content'] ?? '',
           $b['link']    ?? '',
           isset($b['active']) ? (int)(bool)$b['active'] : 1,
           $id,
       ]);
    json_out(['ok' => true]);
}

// DELETE — admin only
if (method() === 'DELETE' && $id) {
    if (!$isAdmin) err('No autoritzat', 403);
    $db->prepare('DELETE FROM notices WHERE id = ?')->execute([$id]);
    http_response_code(204);
    exit;
}

err('Method not allowed', 405);
