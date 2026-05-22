<?php
// Migration: add start_at / end_at to courses; add course_id to agenda_events
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_at DATE NULL DEFAULT NULL",
    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_at   DATE NULL DEFAULT NULL",
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS course_id INT NULL DEFAULT NULL",
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
