<?php
// Migration: add presential training support to quizzes + agenda_events
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    "ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_presential TINYINT NOT NULL DEFAULT 0",
    "ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT ''",
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS year INT NULL DEFAULT NULL",
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS description TEXT NULL DEFAULT NULL",
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS end_day INT NULL DEFAULT NULL",
    "ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS quiz_id INT NULL DEFAULT NULL",
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
