<?php
// Routes: /api/agenda/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../email.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

// POST /api/agenda
if ($method === 'POST' && $id === null) {
    require_comunicacions_or_admin();
    $depts = isset($body['target_departments']) && is_array($body['target_departments']) && count($body['target_departments'])
        ? json_encode(array_values(array_filter(array_map('strval', $body['target_departments']))))
        : null;
    $title    = str_val($body,'title');
    $day      = int_val($body,'day');
    $month    = int_val($body,'month');
    $time     = str_val($body,'time');
    $time_end = str_val($body,'time_end');
    if ($time_end === '') $time_end = null;
    $location = str_val($body,'location');
    $type     = str_val($body,'type','Sessió interna');
    $db->prepare('INSERT INTO agenda_events (title,day,month,time,time_end,location,type,target_departments) VALUES (?,?,?,?,?,?,?,?)')
       ->execute([$title, $day, $month, $time, $time_end, $location, $type, $depts]);
    $new_id = (int)$db->lastInsertId();
    $stmt = $db->prepare('SELECT * FROM agenda_events WHERE id=?'); $stmt->execute([$new_id]); $row = $stmt->fetch();
    $row['id'] = (int)$row['id'];
    $row['target_departments'] = $row['target_departments'] ? json_decode($row['target_departments'], true) : [];

    // Notify admins (push notif + email if their email_notifs flag is on).
    $notif_title = "Nou event a l'agenda: $title";
    $time_str = $time ? ($time_end ? " de $time a $time_end" : " a les $time") : '';
    $notif_body  = "S'ha creat l'event \"$title\" el $day/$month" . $time_str . ($location ? " · $location" : '') . '.';
    foreach (admin_users($db) as $admin) {
        push_notification($db, (int)$admin['id'], $notif_title, $notif_body, 'Agenda');
        if ((int)$admin['email_notifs'] === 1 && !empty($admin['email'])) {
            $html = '<p>' . htmlspecialchars($notif_body) . '</p>';
            send_email($admin['email'], $notif_title, $html);
        }
    }

    respond($row, 201);
}

// PUT /api/agenda/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $depts = isset($body['target_departments']) && is_array($body['target_departments']) && count($body['target_departments'])
        ? json_encode(array_values(array_filter(array_map('strval', $body['target_departments']))))
        : null;
    $time_end = str_val($body,'time_end');
    if ($time_end === '') $time_end = null;
    $db->prepare('UPDATE agenda_events SET title=?,day=?,month=?,time=?,time_end=?,location=?,type=?,target_departments=? WHERE id=?')
       ->execute([str_val($body,'title'), int_val($body,'day'), int_val($body,'month'), str_val($body,'time'), $time_end, str_val($body,'location'), str_val($body,'type','Sessió interna'), $depts, $id]);
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
    $is_admin = user_has_any_role($u, ['Administrador', 'Administrador/a', 'Recursos humans', 'Comunicacions', 'Comunicació', 'Formacions']);
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
        $r['id']    = (int)$r['id'];
        $r['day']   = (int)$r['day'];
        $r['month'] = (int)$r['month'];
        if (!$is_admin) {
            $td = $r['target_departments'] ?? null;
            $tu = $r['target_users'] ?? null;
            if (($td !== null && $td !== '') || ($tu !== null && $tu !== '')) {
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
