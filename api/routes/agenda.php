<?php
// Routes: /api/agenda/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

// POST /api/agenda
if ($method === 'POST' && $id === null) {
    require_comunicacions_or_admin();
    $depts = isset($body['target_departments']) && is_array($body['target_departments']) && count($body['target_departments'])
        ? json_encode(array_values(array_filter(array_map('strval', $body['target_departments']))))
        : null;
    $db->prepare('INSERT INTO agenda_events (title,day,month,time,location,type,target_departments) VALUES (?,?,?,?,?,?,?)')
       ->execute([str_val($body,'title'), int_val($body,'day'), int_val($body,'month'), str_val($body,'time'), str_val($body,'location'), str_val($body,'type','Sessió interna'), $depts]);
    $row = $db->query('SELECT * FROM agenda_events WHERE id=' . $db->lastInsertId())->fetch();
    $row['id'] = (int)$row['id'];
    $row['target_departments'] = $row['target_departments'] ? json_decode($row['target_departments'], true) : [];
    respond($row, 201);
}

// PUT /api/agenda/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $depts = isset($body['target_departments']) && is_array($body['target_departments']) && count($body['target_departments'])
        ? json_encode(array_values(array_filter(array_map('strval', $body['target_departments']))))
        : null;
    $db->prepare('UPDATE agenda_events SET title=?,day=?,month=?,time=?,location=?,type=?,target_departments=? WHERE id=?')
       ->execute([str_val($body,'title'), int_val($body,'day'), int_val($body,'month'), str_val($body,'time'), str_val($body,'location'), str_val($body,'type','Sessió interna'), $depts, $id]);
    respond(['ok' => true]);
}

// DELETE /api/agenda/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('DELETE FROM agenda_events WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

// GET /api/agenda
elseif ($method === 'GET' && $id === null) {
    $u = auth_user();
    $is_admin = in_array($u['role'], ['Administrador/a', 'Recursos humans', 'Comunicacions', 'Formacions'], true);
    if (isset($_GET['month'])) {
        $stmt = $db->prepare('SELECT * FROM agenda_events WHERE month=? ORDER BY day, time');
        $stmt->execute([(int)$_GET['month']]);
    } else {
        $stmt = $db->query('SELECT * FROM agenda_events ORDER BY month, day, time');
    }
    $rows = $stmt->fetchAll();
    $user_dept = (string)($u['dept'] ?? '');
    $user_id   = (int)$u['id'];
    $result = [];
    foreach ($rows as &$r) {
        $r['id'] = (int)$r['id'];
        if (!$is_admin) {
            $td = $r['target_departments'] ?? null;
            $tu = $r['target_users'] ?? null;
            if ($td !== null && $td !== '' || $tu !== null && $tu !== '') {
                $target_depts = ($td && $td !== '') ? (json_decode($td, true) ?: []) : [];
                $target_users = ($tu && $tu !== '') ? (json_decode($tu, true) ?: []) : [];
                $dept_ok = !empty($target_depts) && in_array($user_dept, $target_depts, true);
                $user_ok = !empty($target_users) && in_array($user_id, $target_users, true);
                if (!$dept_ok && !$user_ok) continue;
            }
        }
        $r['target_departments'] = ($r['target_departments'] ?? null) ? json_decode($r['target_departments'], true) : [];
        $result[] = $r;
    }
    respond($result);
}

else {
    respond(['detail' => 'Not found'], 404);
}
