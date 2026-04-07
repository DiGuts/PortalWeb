<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'PATCH') err('Method not allowed', 405);

db()->prepare('UPDATE notifications SET `read` = 1 WHERE user_id = ?')->execute([$me['id']]);
json_out(['ok' => true]);
