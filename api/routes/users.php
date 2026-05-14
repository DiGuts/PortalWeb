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
    $row['must_change_password'] = (int)($row['must_change_password'] ?? 0);
    $row['is_demo_admin'] = ($row['email'] ?? '') === 'unaiclapers@tavil.net' ? 1 : 0;
    return $row;
}

// GET /api/users/me
if ($method === 'GET' && $seg1 === 'me') {
    $u = auth_user();
    respond(_fetch_user($db, (int)$u['id']));
}

// PATCH /api/users/me
elseif ($method === 'PATCH' && $seg1 === 'me' && $seg2 === '') {
    $u   = auth_user();
    $uid = (int)$u['id'];
    $allowed = ['name', 'phone', 'ext', 'location', 'email_notifs'];
    $updates = [];
    foreach ($allowed as $k) {
        if (array_key_exists($k, $body)) $updates[$k] = $body[$k];
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

// PATCH /api/users/me/role
elseif ($method === 'PATCH' && $seg1 === 'me' && $seg2 === 'role') {
    $u = auth_user();
    $db->prepare('UPDATE users SET role=? WHERE id=?')->execute([str_val($body,'role'), (int)$u['id']]);
    respond(_fetch_user($db, (int)$u['id']));
}

// PATCH /api/users/me/dept
elseif ($method === 'PATCH' && $seg1 === 'me' && $seg2 === 'dept') {
    $u    = auth_user();
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
    $db->prepare('UPDATE users SET role=? WHERE id=?')->execute([str_val($body,'role'), $user_id]);
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
    $db->prepare('INSERT INTO users (name, email, password, role, dept, is_head, must_change_password, onboarded, email_verified) VALUES (?,?,?,?,?,?,1,1,1)')
       ->execute([
           str_val($body,'name'), $email, $hashed,
           str_val($body,'role'), str_val($body,'dept'),
           bool_val($body,'is_head') ? 1 : 0,
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
    $allowed = ['name','email','role','dept','is_head'];
    $updates = [];
    foreach ($allowed as $k) {
        if (array_key_exists($k, $body)) {
            $updates[$k] = ($k === 'is_head') ? (bool_val($body,'is_head') ? 1 : 0) : $body[$k];
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
