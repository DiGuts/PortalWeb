<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();

if (method() === 'GET') {
    $rows = $db->query('SELECT * FROM enquestes ORDER BY created_at DESC')->fetchAll();
    foreach ($rows as &$row) {
        $st = $db->prepare('SELECT id FROM enquesta_responses WHERE enquesta_id = ? AND user_email = ?');
        $st->execute([$row['id'], $me['email']]);
        $row['user_completed'] = (bool)$st->fetch();
    }
    json_out($rows);
}

err('Method not allowed', 405);
