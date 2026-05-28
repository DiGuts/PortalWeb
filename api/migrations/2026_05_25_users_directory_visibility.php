<?php
// Migration: add visible_in_directory flag to users.
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS visible_in_directory TINYINT(1) NOT NULL DEFAULT 1",
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
