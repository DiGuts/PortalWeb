<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'PATCH') err('Method not allowed', 405);

$b    = body();
$role = $b['role'] ?? '';
if (!$role) err('Falta el camp role');

$db = db();
$db->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $me['id']]);

$st = $db->prepare('SELECT id, name, email, role, dept, phone, ext, location FROM users WHERE id = ?');
$st->execute([$me['id']]);
json_out($st->fetch());
