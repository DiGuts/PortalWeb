<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'GET') err('Method not allowed', 405);

$st = db()->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC');
$st->execute([$me['id']]);
json_out($st->fetchAll());
