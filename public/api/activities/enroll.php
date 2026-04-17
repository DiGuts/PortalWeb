<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Ensure table exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS activity_enrollments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        user_id     INT NOT NULL,
        name        VARCHAR(200) NOT NULL,
        comment     TEXT,
        created_at  DATETIME NOT NULL DEFAULT NOW(),
        UNIQUE KEY unique_enrollment (activity_id, user_id)
    )");
} catch (\PDOException $e) {}

// POST — enroll current user
if (method() === 'POST' && $id) {
    $b = body();
    try {
        $db->prepare('INSERT INTO activity_enrollments (activity_id, user_id, name, comment) VALUES (?, ?, ?, ?)')
           ->execute([$id, $me['id'], $b['name'] ?? $me['name'], $b['comment'] ?? '']);
    } catch (\PDOException $e) {
        err('Ja estàs inscrit a aquesta activitat', 409);
    }
    json_out(['ok' => true], 201);
}

// GET — admin sees enrollee list for an activity
if (method() === 'GET' && $id) {
    if ($me['role'] !== 'Administrador/a') err('No autoritzat', 403);
    $st = $db->prepare(
        'SELECT ae.id, ae.name, ae.comment, ae.created_at, u.email
           FROM activity_enrollments ae
           JOIN users u ON u.id = ae.user_id
          WHERE ae.activity_id = ?
          ORDER BY ae.created_at'
    );
    $st->execute([$id]);
    json_out($st->fetchAll());
}

// DELETE — admin cancels an enrollment
if (method() === 'DELETE' && $id) {
    if ($me['role'] !== 'Administrador/a') err('No autoritzat', 403);
    $userId = (int)($_GET['user_id'] ?? 0);
    if ($userId) {
        $db->prepare('DELETE FROM activity_enrollments WHERE activity_id = ? AND user_id = ?')->execute([$id, $userId]);
    } else {
        $db->prepare('DELETE FROM activity_enrollments WHERE id = ?')->execute([$id]);
    }
    http_response_code(204);
    exit;
}

err('Method not allowed', 405);
