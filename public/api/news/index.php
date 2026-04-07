<?php
require_once __DIR__ . '/../_auth.php';
require_auth();

$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (method() === 'GET') {
    if ($id) {
        $st = $db->prepare('SELECT * FROM news WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) err('No trobat', 404);
        json_out($row);
    }
    json_out($db->query('SELECT * FROM news ORDER BY created_at DESC')->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $db->prepare('INSERT INTO news (category, title, summary, content, author, date, image, featured) VALUES (?,?,?,?,?,?,?,?)')
       ->execute([$b['category'] ?? '', $b['title'] ?? '', $b['summary'] ?? '', $b['content'] ?? '', $b['author'] ?? '', $b['date'] ?? '', $b['image'] ?? '', (int)($b['featured'] ?? 0)]);
    $st = $db->prepare('SELECT * FROM news WHERE id = ?');
    $st->execute([$db->lastInsertId()]);
    json_out($st->fetch(), 201);
}

if (method() === 'PUT' && $id) {
    $b = body();
    $db->prepare('UPDATE news SET category=?, title=?, summary=?, content=?, author=?, date=?, image=?, featured=? WHERE id=?')
       ->execute([$b['category'] ?? '', $b['title'] ?? '', $b['summary'] ?? '', $b['content'] ?? '', $b['author'] ?? '', $b['date'] ?? '', $b['image'] ?? '', (int)($b['featured'] ?? 0), $id]);
    json_out(['ok' => true]);
}

if (method() === 'DELETE' && $id) {
    $db->prepare('DELETE FROM news WHERE id = ?')->execute([$id]);
    http_response_code(204);
    exit;
}

err('Method not allowed', 405);
