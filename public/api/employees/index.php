<?php
require_once __DIR__ . '/../_auth.php';
require_auth();

if (method() !== 'GET') err('Method not allowed', 405);

$db   = db();
$dept = $_GET['dept'] ?? '';
if ($dept) {
    $st = $db->prepare('SELECT * FROM employees WHERE dept = ? ORDER BY name');
    $st->execute([$dept]);
} else {
    $st = $db->query('SELECT * FROM employees ORDER BY name');
}
json_out($st->fetchAll());
