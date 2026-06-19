<?php
// Migration: add image_crop column to activities table
require_once __DIR__ . '/../helpers.php';
$db = get_db();
$db->exec("ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_crop VARCHAR(1000) NULL DEFAULT NULL");
echo "OK: image_crop column added to activities\n";
