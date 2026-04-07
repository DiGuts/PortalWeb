<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'PATCH') err('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) err('ID requerit');

db()->prepare('UPDATE notifications SET `read` = 1 WHERE id = ? AND user_id = ?')->execute([$id, $me['id']]);
json_out(['ok' => true]);
