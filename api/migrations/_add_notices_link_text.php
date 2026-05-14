<?php
require_once __DIR__ . '/../db.php';
$db = get_db();
try {
    $db->exec("ALTER TABLE notices ADD COLUMN link_text TEXT NOT NULL DEFAULT ''");
    echo "OK: column link_text added\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "SKIP: column already exists\n";
    } else {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}
