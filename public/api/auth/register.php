<?php
require_once __DIR__ . '/../_config.php';

if (method() !== 'POST') err('Method not allowed', 405);

$b    = body();
$name = trim($b['name'] ?? '');
$email= trim(strtolower($b['email'] ?? ''));
$pass = $b['password'] ?? '';
if (!$name || !$email || !$pass) err('Falten camps obligatoris');

$db = db();
$exists = $db->prepare('SELECT id FROM users WHERE email = ?');
$exists->execute([$email]);
if ($exists->fetch()) err('Ja existeix un compte amb aquest correu', 409);

$hash = password_hash($pass, PASSWORD_BCRYPT);
$st   = $db->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
$st->execute([$name, $email, $hash]);
$id = (int)$db->lastInsertId();

$user = $db->prepare('SELECT id, name, email, role, dept, phone, ext, location FROM users WHERE id = ?');
$user->execute([$id]);
$user = $user->fetch();

$token = bin2hex(random_bytes(32));
$db->prepare('INSERT INTO tokens (token, user_id) VALUES (?, ?)')->execute([$token, $id]);

json_out(['access_token' => $token, 'token_type' => 'bearer', 'user' => $user], 201);
