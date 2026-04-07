<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'PATCH') err('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) err('ID requerit');

$b = body();
$db = db();
$db->prepare('INSERT INTO user_course_progress (user_id, course_id, status, progress) VALUES (?,?,?,?)
              ON DUPLICATE KEY UPDATE status = VALUES(status), progress = VALUES(progress)')
   ->execute([$me['id'], $id, $b['status'] ?? 'Pendent', (int)($b['progress'] ?? 0)]);
json_out(['ok' => true]);
