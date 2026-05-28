<?php
// Routes: /api/employees
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

if ($method !== 'GET') respond(['detail' => 'Not found'], 404);

auth_user();
$db = get_db();

$sql = 'SELECT e.*, u.avatar_url
        FROM employees e
        LEFT JOIN users u ON u.email = e.email
        WHERE (u.visible_in_directory IS NULL OR u.visible_in_directory = 1)';
if (isset($_GET['dept']) && $_GET['dept'] !== '') {
    $stmt = $db->prepare($sql . ' AND e.dept=? ORDER BY e.name');
    $stmt->execute([$_GET['dept']]);
} else {
    $stmt = $db->query($sql . ' ORDER BY e.name');
}
$rows = $stmt->fetchAll();
foreach ($rows as &$r) $r['id'] = (int)$r['id'];
respond($rows);
