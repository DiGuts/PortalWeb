<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
if (method() !== 'GET') err('Method not allowed', 405);

$db  = db();
$rows = $db->query('SELECT * FROM courses ORDER BY id')->fetchAll();

foreach ($rows as &$row) {
    $st = $db->prepare('SELECT status, progress FROM user_course_progress WHERE user_id = ? AND course_id = ?');
    $st->execute([$me['id'], $row['id']]);
    $prog = $st->fetch();
    $row['user_status']   = $prog ? $prog['status']   : 'Pendent';
    $row['user_progress'] = $prog ? (int)$prog['progress'] : 0;
}

json_out($rows);
