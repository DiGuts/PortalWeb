<?php
require_once __DIR__ . '/../db.php';
$db = get_db();
$results = [];

// Drop old unique key (ignoring error if already gone)
try {
    $db->exec("ALTER TABLE agenda_events DROP INDEX uq_event");
    $results[] = "OK: dropped old uq_event";
} catch (PDOException $e) {
    $results[] = "Skip drop (not found): " . $e->getMessage();
}

// Add new unique key including year
try {
    $db->exec("ALTER TABLE agenda_events ADD UNIQUE KEY uq_event (title, day, month, year)");
    $results[] = "OK: added uq_event(title,day,month,year)";
} catch (PDOException $e) {
    $msg = $e->getMessage();
    if (strpos($msg, 'Duplicate key') !== false || strpos($msg, 'already exists') !== false) {
        $results[] = "Already exists: uq_event with year";
    } else {
        $results[] = "ERROR: " . $msg;
    }
}

header('Content-Type: text/plain');
echo implode("\n", $results) . "\n";
