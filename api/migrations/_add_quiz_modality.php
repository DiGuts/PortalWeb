<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
$db = get_db();

// 1. Add modality column (idempotent)
$cols = $db->query('SHOW COLUMNS FROM quizzes')->fetchAll(PDO::FETCH_ASSOC);
if (!in_array('modality', array_column($cols, 'Field'))) {
    $db->exec("ALTER TABLE quizzes ADD COLUMN modality VARCHAR(20) NOT NULL DEFAULT '' AFTER is_presential");
    echo "✓ Added modality column to quizzes\n";
} else {
    echo "modality already exists — skipping ALTER\n";
}

// 2. Backfill: rows that were presencial before the new field
$affected = $db->exec("UPDATE quizzes SET modality='presencial' WHERE is_presential=1 AND (modality IS NULL OR modality='')");
echo "✓ Backfilled $affected row(s) to modality='presencial'\n";

echo "\nDone.\n";
