<?php
// Migration: add `roles` JSON column to users. Multi-role support.
// Keeps existing single `role` column as the primary role for back-compat.
// `roles` is the source of truth for permission checks going forward.
// Initial state: roles = '[]' for everyone — admin must re-assign explicitly.
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT NOT NULL DEFAULT '[]'",
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
