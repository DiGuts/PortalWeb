<?php
// Routes: /api/notices/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$seg1 = $segments[1] ?? null;
$id   = is_numeric($seg1) ? (int)$seg1 : null;

function _notice_out(array $r): array {
    return [
        'id'        => (int)$r['id'],
        'title'     => $r['title'],
        'content'   => $r['content'] ?? '',
        'link'      => $r['link'] ?? '',
        'link_text' => $r['link_text'] ?? '',
        'active'    => (int)($r['active'] ?? 0),
        'kind'      => $r['kind'] ?? 'warning',
    ];
}

// GET /api/notices  (active only — public to authed users)
if ($method === 'GET' && $seg1 === null) {
    auth_user();
    $rows = $db->query('SELECT * FROM notices WHERE active=1 ORDER BY id')->fetchAll();
    respond(array_map('_notice_out', $rows));
}

// GET /api/notices/all  (admin: includes inactive)
elseif ($method === 'GET' && $seg1 === 'all') {
    require_comunicacions_or_admin();
    $rows = $db->query('SELECT * FROM notices ORDER BY id')->fetchAll();
    respond(array_map('_notice_out', $rows));
}

// POST /api/notices
elseif ($method === 'POST' && $seg1 === null) {
    require_comunicacions_or_admin();
    $allowed_kinds = ['warning','danger','neutral'];
    $kind = in_array($body['kind'] ?? '', $allowed_kinds) ? $body['kind'] : 'warning';
    $db->prepare('INSERT INTO notices (title,content,link,link_text,active,kind) VALUES (?,?,?,?,?,?)')
       ->execute([
           str_val($body,'title'),
           str_val($body,'content'),
           str_val($body,'link'),
           str_val($body,'link_text'),
           (int)($body['active'] ?? 1),
           $kind,
       ]);
    $row = $db->query('SELECT * FROM notices WHERE id=' . $db->lastInsertId())->fetch();
    respond(_notice_out($row), 201);
}

// PUT /api/notices/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $allowed_kinds = ['warning','danger','neutral'];
    $kind = in_array($body['kind'] ?? '', $allowed_kinds) ? $body['kind'] : 'warning';
    $db->prepare('UPDATE notices SET title=?, content=?, link=?, link_text=?, active=?, kind=? WHERE id=?')
       ->execute([
           str_val($body,'title'),
           str_val($body,'content'),
           str_val($body,'link'),
           str_val($body,'link_text'),
           (int)($body['active'] ?? 1),
           $kind,
           $id,
       ]);
    $row = $db->query('SELECT * FROM notices WHERE id=' . $id)->fetch();
    if (!$row) respond(['detail' => 'Avís no trobat'], 404);
    respond(_notice_out($row));
}

// DELETE /api/notices/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('DELETE FROM notices WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

else {
    respond(['detail' => 'Not found'], 404);
}
