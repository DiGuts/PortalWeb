<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'DELETE') err('Method not allowed', 405);

db()->prepare('DELETE FROM notifications WHERE user_id = ?')->execute([$me['id']]);
http_response_code(204);
exit;
