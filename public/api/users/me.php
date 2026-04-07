<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();

if (method() === 'GET') {
    json_out($me);
}

if (method() === 'PATCH') {
    $b      = body();
    $fields = [];
    $params = [];
    foreach (['name', 'phone', 'ext', 'location'] as $f) {
        if (isset($b[$f])) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    }
    if ($fields) {
        $params[] = $me['id'];
        $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    $st = $db->prepare('SELECT id, name, email, role, dept, phone, ext, location FROM users WHERE id = ?');
    $st->execute([$me['id']]);
    json_out($st->fetch());
}

err('Method not allowed', 405);
