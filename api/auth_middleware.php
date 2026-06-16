<?php
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/db.php';

// ── USER_FIELDS returned in every user response ───────────────────────────────
const USER_FIELDS = 'id, name, email, role, roles, dept, phone, ext, location, avatar_url, visible_in_directory, onboarded, email_notifs, is_head, must_change_password, active, requires_prl, epi_grup';

// Decode users.roles JSON column into array, mutating the user row in-place.
// Safe no-op if column missing or invalid.
function decode_user_roles(array &$user): void {
    if (!array_key_exists('roles', $user)) return;
    $raw = $user['roles'];
    if (is_array($raw)) return;
    if ($raw === null || $raw === '') { $user['roles'] = []; return; }
    $decoded = json_decode($raw, true);
    $user['roles'] = is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [];
}

function user_has_any_role(array $user, array $needed): bool {
    if (in_array($user['role'] ?? '', $needed, true)) return true;
    $roles = $user['roles'] ?? [];
    if (is_string($roles)) {
        $decoded = json_decode($roles, true);
        $roles = is_array($decoded) ? $decoded : [];
    }
    foreach ($needed as $n) if (in_array($n, $roles, true)) return true;
    return false;
}

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
        respond(['detail' => api_msg('unauthorized')], 401);
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
    if (isset($user['active']) && (int)$user['active'] === 0) {
        respond(['detail' => 'El teu compte ha sigut desactivat'], 401);
    }
    decode_user_roles($user);
    // Block all requests (except change-password) if password change is required.
    if ((int)($user['must_change_password'] ?? 0) === 1) {
        $uri    = $_SERVER['REQUEST_URI'] ?? '';
        $method = $_SERVER['REQUEST_METHOD'] ?? '';
        $is_change_pw = $method === 'PATCH' && strpos($uri, 'change-password') !== false;
        if (!$is_change_pw) {
            respond(['detail' => 'must_change_password'], 403);
        }
    }
    return $user;
}

function require_admin(): array {
    $u = auth_user();
    if (!user_has_any_role($u, ['Administrador', 'Administrador/a'])) {
        respond(['detail' => api_msg('forbidden')], 403);
    }
    return $u;
}

function require_rrhh_or_admin(): array {
    $u = auth_user();
    if (!user_has_any_role($u, ['Administrador', 'Administrador/a', 'SolicitudsVacances', 'SolicitudsDissabtes', 'Sol·licituds', 'Recursos humans'])) {
        respond(['detail' => api_msg('forbidden')], 403);
    }
    return $u;
}

function require_formacions_or_admin(): array {
    $u = auth_user();
    if (!user_has_any_role($u, ['Administrador', 'Administrador/a', 'Formacions', 'Recursos humans'])) {
        respond(['detail' => api_msg('forbidden')], 403);
    }
    return $u;
}

function require_comunicacions_or_admin(): array {
    $u = auth_user();
    if (!user_has_any_role($u, ['Administrador', 'Administrador/a', 'Comunicacions', 'Comunicació', 'Recursos humans'])) {
        respond(['detail' => api_msg('forbidden')], 403);
    }
    return $u;
}

function require_content_editor(): array {
    $u = auth_user();
    if (!user_has_any_role($u, ['Administrador', 'Administrador/a', 'Comunicacions', 'Comunicació', 'Formacions', 'Recursos humans'])) {
        respond(['detail' => api_msg('forbidden')], 403);
    }
    return $u;
}
