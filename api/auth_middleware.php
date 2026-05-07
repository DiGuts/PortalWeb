<?php
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/db.php';

// ── USER_FIELDS returned in every user response ───────────────────────────────
const USER_FIELDS = 'id, name, email, role, dept, phone, ext, location, onboarded, email_notifs, is_head, must_change_password';

function get_bearer_token(): ?string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    // Normalise header names to lowercase
    $auth = '';
    foreach ($headers as $k => $v) {
        if (strtolower($k) === 'authorization') { $auth = $v; break; }
    }
    // Fallback: some server configs pass it via $_SERVER
    if (!$auth) $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) return $m[1];
    return null;
}

function auth_user(): array {
    $token = get_bearer_token();
    if (!$token) {
        respond(['detail' => 'Not authenticated'], 401);
    }
    $payload = jwt_decode($token);
    if (!$payload) {
        respond(['detail' => 'Token invàlid o caducat'], 401);
    }
    $email = $payload['sub'] ?? null;
    if (!$email) {
        respond(['detail' => 'Token sense subjecte'], 401);
    }
    $db   = get_db();
    $stmt = $db->prepare('SELECT ' . USER_FIELDS . ' FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        respond(['detail' => 'Usuari no trobat'], 401);
    }
    return $user;
}

function require_admin(): array {
    $u = auth_user();
    if ($u['role'] !== 'Administrador/a') {
        respond(['detail' => 'Acció reservada a administradors'], 403);
    }
    return $u;
}

function require_rrhh_or_admin(): array {
    $u = auth_user();
    if (!in_array($u['role'], ['Administrador/a', 'Recursos humans'], true)) {
        respond(['detail' => 'Acció reservada a RRHH o administradors'], 403);
    }
    return $u;
}

function require_formacions_or_admin(): array {
    $u = auth_user();
    if (!in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Formacions'], true)) {
        respond(['detail' => 'Acció reservada al gestor de formacions'], 403);
    }
    return $u;
}

function require_comunicacions_or_admin(): array {
    $u = auth_user();
    if (!in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Comunicacions'], true)) {
        respond(['detail' => 'Acció reservada al gestor de comunicacions'], 403);
    }
    return $u;
}

function require_content_editor(): array {
    $u = auth_user();
    if (!in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Comunicacions', 'Formacions'], true)) {
        respond(['detail' => 'Acció reservada a editors de contingut'], 403);
    }
    return $u;
}
