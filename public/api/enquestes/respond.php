<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'POST') err('Method not allowed', 405);
$id = (int)($_GET['id'] ?? 0);
if (!$id) err('ID requerit');

$db = db();
try {
    $db->prepare('INSERT INTO enquesta_responses (enquesta_id, user_email) VALUES (?, ?)')->execute([$id, $me['email']]);
    $db->prepare('UPDATE enquestes SET responses = responses + 1 WHERE id = ?')->execute([$id]);
} catch (\PDOException $e) {
    // Duplicate — already responded, ignore
}
json_out(['ok' => true]);
