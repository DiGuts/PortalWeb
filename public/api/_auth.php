<?php
// Returns current user array, or sends 401 and exits.
require_once __DIR__ . '/_config.php';

function require_auth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        err('No autoritzat', 401);
    }
    $token = $m[1];
    $db = db();
    $st = $db->prepare(
        'SELECT u.id, u.name, u.email, u.role, u.dept, u.phone, u.ext, u.location
           FROM tokens t JOIN users u ON u.id = t.user_id
          WHERE t.token = ?'
    );
    $st->execute([$token]);
    $user = $st->fetch();
    if (!$user) err('No autoritzat', 401);
    return $user;
}
