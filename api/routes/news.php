<?php
// Routes: /api/news/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

// POST /api/news
if ($method === 'POST' && $id === null) {
    require_comunicacions_or_admin();
    $db->prepare('INSERT INTO news (category,title,summary,content,author,date,image,featured) VALUES (?,?,?,?,?,?,?,?)')
       ->execute([str_val($body,'category'), str_val($body,'title'), str_val($body,'summary'), str_val($body,'content'), str_val($body,'author'), str_val($body,'date'), str_val($body,'image'), bool_val($body,'featured') ? 1 : 0]);
    $row = $db->query('SELECT * FROM news WHERE id=' . $db->lastInsertId())->fetch();
    $row['id'] = (int)$row['id'];
    $row['featured'] = (int)$row['featured'];
    respond($row, 201);
}

// GET /api/news
elseif ($method === 'GET' && $id === null) {
    auth_user();
    if (isset($_GET['featured'])) {
        $stmt = $db->prepare('SELECT * FROM news WHERE featured=? ORDER BY created_at DESC');
        $stmt->execute([(int)$_GET['featured']]);
    } else {
        $stmt = $db->query('SELECT * FROM news ORDER BY created_at DESC');
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['featured'] = (int)$r['featured']; }
    respond($rows);
}

// GET /api/news/{id}
elseif ($method === 'GET' && $id !== null) {
    auth_user();
    $stmt = $db->prepare('SELECT * FROM news WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'Notícia no trobada'], 404);
    $row['id'] = (int)$row['id'];
    $row['featured'] = (int)$row['featured'];
    respond($row);
}

// PUT /api/news/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('UPDATE news SET category=?,title=?,summary=?,content=?,author=?,date=?,image=?,featured=? WHERE id=?')
       ->execute([str_val($body,'category'), str_val($body,'title'), str_val($body,'summary'), str_val($body,'content'), str_val($body,'author'), str_val($body,'date'), str_val($body,'image'), bool_val($body,'featured') ? 1 : 0, $id]);
    respond(['ok' => true]);
}

// DELETE /api/news/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('DELETE FROM news WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

else {
    respond(['detail' => 'Not found'], 404);
}
