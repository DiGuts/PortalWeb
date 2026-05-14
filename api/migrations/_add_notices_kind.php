<?php
require_once __DIR__ . '/../db.php';
$db = get_db();
try {
    $db->exec("ALTER TABLE notices ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'warning'");
    echo "OK: column kind added\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "SKIP: column already exists\n";
    } else {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}
