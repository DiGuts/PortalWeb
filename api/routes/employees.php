<?php
// Routes: /api/employees
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

if ($method !== 'GET') respond(['detail' => 'Not found'], 404);

auth_user();
$db = get_db();

if (isset($_GET['dept']) && $_GET['dept'] !== '') {
    $stmt = $db->prepare('SELECT * FROM employees WHERE dept=? ORDER BY name');
    $stmt->execute([$_GET['dept']]);
} else {
    $stmt = $db->query('SELECT * FROM employees ORDER BY name');
}
$rows = $stmt->fetchAll();
foreach ($rows as &$r) $r['id'] = (int)$r['id'];
respond($rows);
