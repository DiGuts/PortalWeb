<?php
require_once __DIR__ . '/../_auth.php';
require_auth();

if (method() !== 'PATCH') err('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) err('ID requerit');

$b = body();
db()->prepare('UPDATE suggestions SET status = ? WHERE id = ?')->execute([$b['status'] ?? '', $id]);
json_out(['ok' => true]);
