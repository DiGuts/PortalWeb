<?php
require_once __DIR__ . '/../_config.php';

if (method() !== 'POST') err('Method not allowed', 405);

$b = body();
$email    = trim($b['email'] ?? '');
$password = $b['password'] ?? '';
if (!$email || !$password) err('Falten camps obligatoris');

$db = db();
$st = $db->prepare('SELECT id, name, email, password, role, dept, phone, ext, location FROM users WHERE email = ?');
$st->execute([$email]);
$user = $st->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    err('Credencials incorrectes', 401);
}

$token = bin2hex(random_bytes(32));
$db->prepare('INSERT INTO tokens (token, user_id) VALUES (?, ?)')->execute([$token, $user['id']]);

unset($user['password']);
json_out(['access_token' => $token, 'token_type' => 'bearer', 'user' => $user]);
