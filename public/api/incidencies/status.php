<?php
require_once __DIR__ . '/../_auth.php';
require_auth();

if (method() !== 'PATCH') err('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) err('ID requerit');

$b = body();
db()->prepare('UPDATE incidencies SET status = ?, assigned_to = ?, resolution = ? WHERE id = ?')
   ->execute([$b['status'] ?? '', $b['assigned_to'] ?? '', $b['resolution'] ?? '', $id]);
json_out(['ok' => true]);
