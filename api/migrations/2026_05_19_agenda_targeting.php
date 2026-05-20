<?php
// Migration: add target_departments + target_users to agenda_events; add target_users to courses
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS target_departments TEXT NULL DEFAULT NULL",
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS target_users TEXT NULL DEFAULT NULL",
    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_users TEXT NULL DEFAULT NULL",
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
