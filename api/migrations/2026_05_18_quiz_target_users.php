<?php
// Migration: add target_users column to quizzes table
require_once __DIR__ . '/../db.php';
$db = get_db();
try {
    $db->exec("ALTER TABLE quizzes ADD COLUMN target_users TEXT NULL DEFAULT NULL");
    echo "OK: target_users column added\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Already exists: target_users column\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
