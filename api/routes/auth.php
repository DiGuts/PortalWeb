<?php
// Routes: /api/auth/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';
require_once __DIR__ . '/../email.php';
require_once __DIR__ . '/../helpers.php';

const _USER_FIELDS_AUTH = 'id, name, email, role, roles, dept, phone, ext, location, avatar_url, visible_in_directory, onboarded, email_notifs, is_head, must_change_password, active, requires_prl, epi_grup';

function _expires_at(int $minutes = 0, int $hours = 0): string {
    return date('Y-m-d H:i:s', time() + $minutes * 60 + $hours * 3600);
}

function _store_code(PDO $db, string $email, string $code, string $purpose, int $minutes = 0, int $hours = 0): void {
    $db->prepare('DELETE FROM auth_tokens WHERE email=? AND purpose=?')->execute([$email, $purpose]);
    $db->prepare('INSERT INTO auth_tokens (email,code,purpose,expires_at) VALUES (?,?,?,?)')->execute([
        $email, $code, $purpose, _expires_at($minutes, $hours),
    ]);
}

function _consume_code(PDO $db, string $email, string $code, string $purpose): bool {
    $stmt = $db->prepare('SELECT expires_at FROM auth_tokens WHERE email=? AND code=? AND purpose=?');
    $stmt->execute([$email, $code, $purpose]);
    $row = $stmt->fetch();
    if (!$row) return false;
    if (strtotime($row['expires_at']) < time()) return false;
    $db->prepare('DELETE FROM auth_tokens WHERE email=? AND purpose=?')->execute([$email, $purpose]);
    return true;
}

function _build_token_response(PDO $db, string $email): array {
    $stmt = $db->prepare('SELECT ' . _USER_FIELDS_AUTH . ' FROM users WHERE email=?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    $token = jwt_encode([
        'sub'  => $row['email'],
        'id'   => $row['id'],
        'role' => $row['role'],
        'exp'  => time() + JWT_EXPIRY,
    ]);
    return ['status' => 'ok', 'access_token' => $token, 'token_type' => 'bearer', 'user' => _user_out($row)];
}

function _user_out(array $row): array {
    $rolesRaw = $row['roles'] ?? '[]';
    $rolesArr = is_array($rolesRaw) ? $rolesRaw : (json_decode((string)$rolesRaw, true) ?: []);
    return [
        'id'          => (int)$row['id'],
        'name'        => $row['name'],
        'email'       => $row['email'],
        'role'        => $row['role'],
        'roles'       => array_values(array_filter($rolesArr, 'is_string')),
        'dept'        => $row['dept'],
        'phone'       => $row['phone'] ?? '',
        'ext'         => $row['ext']   ?? '',
        'location'    => $row['location'] ?? '',
        'avatar_url'  => $row['avatar_url'] ?? null,
        'visible_in_directory' => (int)($row['visible_in_directory'] ?? 1),
        'onboarded'   => (int)($row['onboarded'] ?? 0),
        'email_notifs'=> (int)($row['email_notifs'] ?? 1),
        'is_head'     => (int)($row['is_head'] ?? 0),
        'must_change_password' => (int)($row['must_change_password'] ?? 0),
        'active'       => (int)($row['active'] ?? 1),
        'is_demo_admin' => ($row['email'] ?? '') === 'unaiclapers@tavil.net' ? 1 : 0,
        'requires_prl' => (int)($row['requires_prl'] ?? 0),
        'epi_grup'     => $row['epi_grup'] ?? null,
    ];
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
$action = $segments[1] ?? '';
$db     = get_db();
$body   = request_body();

if ($method === 'POST' && $action === 'login') {
    $email    = str_val($body, 'email');
    $password = str_val($body, 'password');

    $extra = EMAIL_VERIFY_ENABLED ? ', email_verified' : '';
    $stmt  = $db->prepare('SELECT ' . _USER_FIELDS_AUTH . ", password$extra FROM users WHERE email=?");
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password'])) {
        respond(['detail' => 'Usuari o contrasenya incorrectes'], 401);
    }
    if (isset($row['active']) && (int)$row['active'] === 0) {
        respond(['detail' => 'El teu compte ha sigut desactivat, parla amb RRHH per solucionar-ho'], 403);
    }
    if (EMAIL_VERIFY_ENABLED && empty($row['email_verified'])) {
        respond(['detail' => 'Verifica el teu correu electrònic abans d\'accedir'], 403);
    }

    if (LOGIN_2FA_ENABLED) {
        $otp = (string)random_int(100000, 999999);
        _store_code($db, $email, $otp, 'otp', 10);
        send_email($email, 'Codi d\'accés — TAVIL Portal',
            "<p style='font-family:sans-serif'>El teu codi d'accés és:</p>"
            . "<p style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#dc2626'><strong>$otp</strong></p>"
            . "<p style='font-family:sans-serif;color:#888'>Caduca en 10 minuts.</p>"
        );
        respond(['status' => 'pending_otp', 'email' => $email]);
    }

    respond(_build_token_response($db, $email));
}

elseif ($method === 'POST' && $action === 'register') {
    $email = strtolower(str_val($body, 'email'));
    if (!str_ends_with($email, '@tavil.net')) {
        respond(['detail' => 'Només es permeten correus @tavil.net'], 400);
    }
    $existing = $db->prepare('SELECT id FROM users WHERE email=?');
    $existing->execute([$email]);
    if ($existing->fetch()) {
        respond(['detail' => 'Aquest correu ja està registrat'], 409);
    }

    $hashed = password_hash(str_val($body, 'password'), PASSWORD_BCRYPT);
    $name   = str_val($body, 'name');
    $role   = str_val($body, 'role', 'Treballador/a');
    $dept   = str_val($body, 'dept', 'General');

    if (EMAIL_VERIFY_ENABLED) {
        $db->prepare('INSERT INTO users (name,email,password,role,dept,email_verified) VALUES (?,?,?,?,?,0)')
           ->execute([$name, $email, $hashed, $role, $dept]);
        $code = strtoupper(bin2hex(random_bytes(4)));
        _store_code($db, $email, $code, 'verify', 0, 24);
        send_email($email, 'Confirma el teu correu — TAVIL Portal',
            "<p style='font-family:sans-serif'>Benvingut/da al Portal TAVIL!</p>"
            . "<p style='font-family:sans-serif'>Introdueix aquest codi per verificar el teu compte:</p>"
            . "<p style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#dc2626'><strong>$code</strong></p>"
            . "<p style='font-family:sans-serif;color:#888'>Caduca en 24 hores.</p>"
        );
        respond(['status' => 'pending_verification', 'email' => $email], 201);
    }

    $db->prepare('INSERT INTO users (name,email,password,role,dept) VALUES (?,?,?,?,?)')
       ->execute([$name, $email, $hashed, $role, $dept]);
    respond(_build_token_response($db, $email), 201);
}

elseif ($method === 'POST' && $action === 'verify-email') {
    $email = str_val($body, 'email');
    $code  = strtoupper(trim(str_val($body, 'code')));
    if (!_consume_code($db, $email, $code, 'verify')) {
        respond(['detail' => 'Codi invàlid o caducat'], 400);
    }
    $db->prepare('UPDATE users SET email_verified=1 WHERE email=?')->execute([$email]);
    respond(_build_token_response($db, $email));
}

elseif ($method === 'POST' && $action === 'verify-otp') {
    $email = str_val($body, 'email');
    $code  = trim(str_val($body, 'code'));
    if (!_consume_code($db, $email, $code, 'otp')) {
        respond(['detail' => 'Codi invàlid o caducat'], 400);
    }
    respond(_build_token_response($db, $email));
}

elseif ($method === 'POST' && $action === 'resend-verification') {
    $email = str_val($body, 'email');
    $stmt  = $db->prepare('SELECT email_verified FROM users WHERE email=?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || $row['email_verified']) {
        respond(['status' => 'sent']); // silent
    }
    $code = strtoupper(bin2hex(random_bytes(4)));
    _store_code($db, $email, $code, 'verify', 0, 24);
    send_email($email, 'Nou codi de verificació — TAVIL Portal',
        "<p style='font-family:sans-serif'>El teu nou codi de verificació és:</p>"
        . "<p style='font-family:monospace;font-size:32px;letter-spacing:8px;color:#dc2626'><strong>$code</strong></p>"
        . "<p style='font-family:sans-serif;color:#888'>Caduca en 24 hores.</p>"
    );
    respond(['status' => 'sent']);
}

elseif ($method === 'PATCH' && $action === 'change-password') {
    require_once __DIR__ . '/../auth_middleware.php';
    $user = auth_user();
    $newPwd  = str_val($body, 'new_password');
    $curPwd  = $body['current_password'] ?? null;
    if (strlen($newPwd) < 8) {
        respond(['detail' => 'Mínim 8 caràcters'], 400);
    }
    // Fetch current hash
    $stmt = $db->prepare('SELECT password, must_change_password FROM users WHERE id=?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'Usuari no trobat'], 404);
    // If not forced change, verify current password
    if (!$row['must_change_password'] && $curPwd !== null) {
        if (!password_verify($curPwd, $row['password'])) {
            respond(['detail' => 'Contrasenya actual incorrecta'], 400);
        }
    } elseif (!$row['must_change_password'] && $curPwd === null) {
        respond(['detail' => 'Cal la contrasenya actual'], 400);
    }
    $hashed = password_hash($newPwd, PASSWORD_BCRYPT);
    $db->prepare('UPDATE users SET password=?, must_change_password=0 WHERE id=?')
       ->execute([$hashed, $user['id']]);
    respond(['status' => 'ok']);
}

elseif ($method === 'POST' && $action === 'impersonate') {
    require_once __DIR__ . '/../auth_middleware.php';
    $caller = auth_user();
    if (($caller['email'] ?? '') !== 'unaiclapers@tavil.net') {
        respond(['detail' => 'No autoritzat'], 403);
    }
    $target_id = (int)($segments[2] ?? 0);
    if (!$target_id) respond(['detail' => 'ID invàlid'], 400);
    $stmt = $db->prepare('SELECT ' . _USER_FIELDS_AUTH . ' FROM users WHERE id=?');
    $stmt->execute([$target_id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'Usuari no trobat'], 404);
    $token = jwt_encode([
        'sub'  => $row['email'],
        'id'   => $row['id'],
        'role' => $row['role'],
        'exp'  => time() + JWT_EXPIRY,
    ]);
    respond(['access_token' => $token, 'token_type' => 'bearer', 'user' => _user_out($row)]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
