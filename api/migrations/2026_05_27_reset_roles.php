<?php
// Migration: reset all roles to [] and clear legacy role field.
// unaiclapers@tavil.net gets Administrador.
require_once __DIR__ . '/../db.php';
$db = get_db();

// 1. Clear everyone
$db->exec("UPDATE users SET roles = '[]', role = ''");

// 2. Give Administrador to unaiclapers
$db->prepare("UPDATE users SET roles = '[\"Administrador\"]', role = 'Administrador' WHERE email = 'unaiclapers@tavil.net'")
   ->execute();

$total  = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
$admins = $db->query("SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(roles, '\"Administrador\"')")->fetchColumn();

echo json_encode(['ok' => true, 'total_users' => (int)$total, 'admins' => (int)$admins]);
