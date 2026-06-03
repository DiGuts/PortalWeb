<?php
// Routes: /api/employees — sourced from users table
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

if ($method !== 'GET') respond(['detail' => 'Not found'], 404);

auth_user();
$db = get_db();

function emp_initials(string $name): string {
    $parts = preg_split('/\s+/', trim($name));
    $a = isset($parts[0]) ? strtoupper(substr($parts[0], 0, 1)) : '';
    $b = isset($parts[1]) ? strtoupper(substr($parts[1], 0, 1)) : '';
    return $b !== '' ? $a . $b : strtoupper(substr($name, 0, 2));
}

function emp_color(string $name): string {
    $palette = [
        'oklch(0.40 0.14 22)',  'oklch(0.40 0.13 55)',  'oklch(0.40 0.12 118)', 'oklch(0.40 0.12 158)',
        'oklch(0.40 0.13 198)', 'oklch(0.40 0.15 238)', 'oklch(0.40 0.15 265)', 'oklch(0.40 0.14 295)',
        'oklch(0.40 0.12 325)', 'oklch(0.40 0.13 345)', 'oklch(0.40 0.11 140)', 'oklch(0.40 0.13 215)',
    ];
    return $palette[abs(crc32($name)) % count($palette)];
}

$excluded = ['crmit@tavil.net', 'root@tavil.net', 'root'];
$placeholders = implode(',', array_fill(0, count($excluded), '?'));

$sql = "SELECT id, name, dept AS role, dept, email, phone, ext, avatar_url, is_head
        FROM users
        WHERE active = 1
          AND (visible_in_directory IS NULL OR visible_in_directory = 1)
          AND email NOT IN ($placeholders)";

$params = $excluded;

if (isset($_GET['dept']) && $_GET['dept'] !== '') {
    $sql .= ' AND dept = ?';
    $params[] = $_GET['dept'];
}

$sql .= ' ORDER BY name';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

foreach ($rows as &$r) {
    $r['id']       = (int)$r['id'];
    $r['is_head']  = (int)($r['is_head'] ?? 0);
    $r['initials'] = emp_initials($r['name']);
    $r['color']    = emp_color($r['name']);
}
unset($r);

respond($rows);
