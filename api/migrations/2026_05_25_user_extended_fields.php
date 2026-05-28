<?php
// Migration: add avatar_url to users (phone/ext/location already present).
// User personal data becomes admin-editable only; avatar must persist server-side.
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL DEFAULT NULL",
];

foreach ($stmts as $sql) {
    try {
        $db->exec($sql);
        echo "OK: $sql\n";
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate column') !== false || strpos($msg, 'already exists') !== false) {
            echo "Already exists: $sql\n";
        } else {
            $errors[] = $msg;
            echo "Error: $msg\n";
        }
    }
}

echo count($errors) === 0 ? "\nAll OK\n" : "\nErrors: " . count($errors) . "\n";
