<?php
// Routes: /api/users/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db     = get_db();
$body   = request_body();
// $segments[0]='users', $segments[1]=sub-resource or user_id, $segments[2]=action
$seg1   = $segments[1] ?? '';
$seg2   = $segments[2] ?? '';

function _fetch_user(PDO $db, int $id): array {
    $stmt = $db->prepare('SELECT ' . USER_FIELDS . ' FROM users WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'Usuari no trobat'], 404);
    return _cast_user($row);
}

function _cast_user(array $row): array {
    $row['id']           = (int)$row['id'];
    $row['onboarded']    = (int)$row['onboarded'];
    $row['email_notifs'] = (int)$row['email_notifs'];
    $row['is_head']      = (int)$row['is_head'];
    $row['visible_in_directory'] = (int)($row['visible_in_directory'] ?? 1);
    $row['must_change_password'] = (int)($row['must_change_password'] ?? 0);
    $row['active']               = (int)($row['active'] ?? 1);
    $row['requires_prl']         = (int)($row['requires_prl'] ?? 0);
    $row['is_demo_admin'] = ($row['email'] ?? '') === 'unaiclapers@tavil.net' ? 1 : 0;
    $rolesRaw = $row['roles'] ?? '[]';
    if (!is_array($rolesRaw)) {
        $decoded = json_decode((string)$rolesRaw, true);
        $rolesRaw = is_array($decoded) ? $decoded : [];
    }
    $row['roles'] = array_values(array_filter($rolesRaw, 'is_string'));
    return $row;
}

const _ALLOWED_NEW_ROLES = [
    'Treballador/a', 'Cap de departament', 'Administrador',
    'Formacions', 'Comunicacions', 'SolicitudsDissabtes', 'SolicitudsVacances',
];

function _sanitize_roles_payload($raw): string {
    if (!is_array($raw)) return '[]';
    $clean = array_values(array_unique(array_filter(
        array_map(fn($r) => is_string($r) ? trim($r) : '', $raw),
        fn($r) => in_array($r, _ALLOWED_NEW_ROLES, true)
    )));
    return json_encode($clean, JSON_UNESCAPED_UNICODE);
}

// GET /api/users/me
if ($method === 'GET' && $seg1 === 'me') {
    $u = auth_user();
    respond(_fetch_user($db, (int)$u['id']));
}

// PATCH /api/users/me — user may change own avatar, directory visibility, and notif prefs.
// All other personal data is admin-managed.
elseif ($method === 'PATCH' && $seg1 === 'me' && $seg2 === '') {
    $u   = auth_user();
    $uid = (int)$u['id'];
    $allowed = ['email_notifs', 'avatar_url', 'visible_in_directory'];
    $updates = [];
    foreach ($allowed as $k) {
        if (array_key_exists($k, $body)) {
            if ($k === 'email_notifs' || $k === 'visible_in_directory') {
                $updates[$k] = bool_val($body, $k) ? 1 : 0;
            } elseif ($k === 'avatar_url') {
                $v = $body[$k];
                if ($v !== null && $v !== '' && !str_starts_with((string)$v, '/uploads/')) {
                    respond(['detail' => 'avatar_url invàlid'], 400);
                }
                $updates[$k] = $v === '' ? null : $v;
            } else {
                $updates[$k] = $body[$k];
            }
        }
    }
    if (!empty($updates)) {
        $set  = implode(', ', array_map(fn($k) => "$k=?", array_keys($updates)));
        $vals = array_values($updates);
        $vals[] = $uid;
        $db->prepare("UPDATE users SET $set WHERE id=?")->execute($vals);
    }
    respond(_fetch_user($db, $uid));
}

// POST /api/users/me/onboarding
elseif ($method === 'POST' && $seg1 === 'me' && $seg2 === 'onboarding') {
    $u   = auth_user();
    $uid = (int)$u['id'];
    $db->prepare('UPDATE users SET dept=?, is_head=?, onboarded=1 WHERE id=?')
       ->execute([str_val($body,'dept'), bool_val($body,'is_head') ? 1 : 0, $uid]);
    respond(_fetch_user($db, $uid));
}

// PATCH /api/users/me/role  (admin/demo only — used for role-switcher view)
elseif ($method === 'PATCH' && $seg1 === 'me' && $seg2 === 'role') {
    $u = require_admin();
    $role = str_val($body, 'role');
    if (!in_array($role, _ALLOWED_NEW_ROLES, true)) {
        respond(['detail' => 'Rol no permès'], 400);
    }
    $db->prepare('UPDATE users SET role=? WHERE id=?')->execute([$role, (int)$u['id']]);
    respond(_fetch_user($db, (int)$u['id']));
}

// PATCH /api/users/me/dept
elseif ($method === 'PATCH' && $seg1 === 'me' && $seg2 === 'dept') {
    $u    = auth_user();
    if (!user_has_any_role($u, ['Administrador', 'Administrador/a'])) {
        respond(['detail' => 'No autoritzat'], 403);
    }
    $uid  = (int)$u['id'];
    $dept = str_val($body, 'dept');
    $head = bool_val($body, 'is_head');
    if ($head) {
        $conflict = $db->prepare('SELECT id FROM users WHERE dept=? AND is_head=1 AND id!=? LIMIT 1');
        $conflict->execute([$dept, $uid]);
        if ($conflict->fetch()) respond(['detail' => 'Aquest departament ja té un responsable assignat'], 409);
    }
    $db->prepare('UPDATE users SET dept=?, is_head=? WHERE id=?')->execute([$dept, $head ? 1 : 0, $uid]);
    respond(_fetch_user($db, $uid));
}

// GET /api/users/dept-head/{dept}
elseif ($method === 'GET' && $seg1 === 'dept-head' && isset($segments[2])) {
    $u    = auth_user();
    $dept = urldecode($segments[2]);
    $uid  = (int)$u['id'];
    $stmt = $db->prepare('SELECT id FROM users WHERE dept=? AND is_head=1 AND id!=? LIMIT 1');
    $stmt->execute([$dept, $uid]);
    respond(['has_head' => (bool)$stmt->fetch()]);
}

// PATCH /api/users/{user_id}/role  (admin only)
elseif ($method === 'PATCH' && is_numeric($seg1) && $seg2 === 'role') {
    require_admin();
    $user_id = (int)$seg1;
    $role = str_val($body, 'role');
    if (!in_array($role, _ALLOWED_NEW_ROLES, true)) {
        respond(['detail' => 'Rol no permès'], 400);
    }
    $db->prepare('UPDATE users SET role=? WHERE id=?')->execute([$role, $user_id]);
    respond(_fetch_user($db, $user_id));
}

// PATCH /api/users/{user_id}/active  (admin or RRHH: activate/deactivate)
elseif ($method === 'PATCH' && is_numeric($seg1) && $seg2 === 'active') {
    $caller  = require_rrhh_or_admin();
    $user_id = (int)$seg1;
    if ($user_id === (int)$caller['id']) {
        respond(['detail' => 'No et pots desactivar a tu mateix'], 400);
    }
    $active = bool_val($body, 'active', true) ? 1 : 0;
    $db->prepare('UPDATE users SET active=? WHERE id=?')->execute([$active, $user_id]);
    respond(_fetch_user($db, $user_id));
}

// GET /api/users  (admin: list all)
elseif ($method === 'GET' && $seg1 === '') {
    require_admin();
    $stmt = $db->query('SELECT ' . USER_FIELDS . ' FROM users ORDER BY name');
    $rows = $stmt->fetchAll();
    respond(array_map(fn($r) => _cast_user($r), $rows));
}

// POST /api/users  (admin: create)
elseif ($method === 'POST' && $seg1 === '') {
    require_admin();
    $email = str_val($body, 'email');
    $exists = $db->prepare('SELECT id FROM users WHERE email=?');
    $exists->execute([$email]);
    if ($exists->fetch()) respond(['detail' => 'Ja existeix un usuari amb aquest correu'], 409);

    $hashed = password_hash(str_val($body, 'temp_password'), PASSWORD_BCRYPT);
    $rolesJson = _sanitize_roles_payload($body['roles'] ?? []);
    $rolesArr  = json_decode($rolesJson, true) ?? [];
    $isHead    = in_array('Cap de departament', $rolesArr) ? 1 : 0;
    $primaryRole = count($rolesArr) > 0 ? $rolesArr[0] : 'Treballador/a';
    $db->prepare('INSERT INTO users (name, email, password, role, roles, dept, is_head, must_change_password, onboarded, email_verified, requires_prl) VALUES (?,?,?,?,?,?,?,1,1,1,1)')
       ->execute([
           str_val($body,'name'), $email, $hashed,
           $primaryRole, $rolesJson, str_val($body,'dept'),
           $isHead,
       ]);
    $stmt = $db->prepare('SELECT ' . USER_FIELDS . ' FROM users WHERE email=?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    respond(_cast_user($row), 201);
}

// PATCH /api/users/{user_id}  (admin: update)
elseif ($method === 'PATCH' && is_numeric($seg1) && $seg2 === '') {
    require_admin();
    $user_id = (int)$seg1;
    $allowed = ['name','email','role','dept','phone','ext','location','avatar_url','email_notifs','epi_grup'];
    $updates = [];
    foreach ($allowed as $k) {
        if (array_key_exists($k, $body)) {
            if ($k === 'email_notifs') {
                $updates[$k] = bool_val($body, $k) ? 1 : 0;
            } else {
                $updates[$k] = $body[$k];
            }
        }
    }
    if (array_key_exists('requires_prl', $body)) {
        $updates['requires_prl'] = bool_val($body, 'requires_prl') ? 1 : 0;
    }
    if (array_key_exists('roles', $body)) {
        $rolesJson = _sanitize_roles_payload($body['roles']);
        $rolesArr  = json_decode($rolesJson, true) ?? [];
        $updates['roles']   = $rolesJson;
        $updates['is_head'] = in_array('Cap de departament', $rolesArr) ? 1 : 0;
        // Auto-derive primary role for display/legacy
        if (!array_key_exists('role', $body)) {
            $updates['role'] = count($rolesArr) > 0 ? $rolesArr[0] : 'Treballador/a';
        }
    }
    if (array_key_exists('new_password', $body)) {
        $np = str_val($body, 'new_password');
        if (strlen($np) < 8) respond(['detail' => 'Mínim 8 caràcters'], 400);
        $updates['password'] = password_hash($np, PASSWORD_BCRYPT);
        $updates['must_change_password'] = 1;
    }
    if (!empty($updates)) {
        $set  = implode(', ', array_map(fn($k) => "$k=?", array_keys($updates)));
        $vals = array_values($updates);
        $vals[] = $user_id;
        $db->prepare("UPDATE users SET $set WHERE id=?")->execute($vals);
    }
    respond(_fetch_user($db, $user_id));
}

// DELETE /api/users/{user_id}  (admin: delete)
elseif ($method === 'DELETE' && is_numeric($seg1) && $seg2 === '') {
    $admin = require_admin();
    $user_id = (int)$seg1;
    if ($user_id === (int)$admin['id']) respond(['detail' => 'No et pots eliminar a tu mateix'], 400);
    // Remove child rows that reference this user before deleting
    foreach (['notifications','quiz_progress','user_course_progress','suggestion_votes','vacances'] as $tbl) {
        $db->prepare("DELETE FROM `$tbl` WHERE user_id=?")->execute([$user_id]);
    }
    $db->prepare('DELETE FROM users WHERE id=?')->execute([$user_id]);
    http_response_code(204); exit;
}

else {
    respond(['detail' => 'Not found'], 404);
}
