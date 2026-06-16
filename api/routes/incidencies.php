<?php
// Routes: /api/incidencies/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../email.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

// GET /api/incidencies
if ($method === 'GET' && $id === null) {
    $u = auth_user();
    $is_privileged = user_has_any_role($u, ['Administrador', 'Administrador/a', 'Recursos humans', 'SolicitudsVacances', 'SolicitudsDissabtes']);
    if ($is_privileged) {
        $stmt = $db->query('SELECT * FROM incidencies ORDER BY created_at DESC');
    } else {
        $stmt = $db->prepare('SELECT * FROM incidencies WHERE author=? ORDER BY created_at DESC');
        $stmt->execute([$u['name']]);
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) $r['id'] = (int)$r['id'];
    respond($rows);
}

// POST /api/incidencies
elseif ($method === 'POST' && $id === null) {
    $u = auth_user();
    $db->prepare('INSERT INTO incidencies (title,description,area,priority,author) VALUES (?,?,?,?,?)')
       ->execute([str_val($body,'title'), str_val($body,'description'), str_val($body,'area','General'), str_val($body,'priority','Baixa'), $u['name']]);
    $new_id = (int)$db->lastInsertId();

    // Notify Manteniment users
    $maint = $db->query("SELECT id,email,email_notifs FROM users WHERE role='Manteniment'")->fetchAll();
    foreach ($maint as $m) {
        push_notification($db, (int)$m['id'],
            'Nova incidència: ' . str_val($body,'title'),
            $u['name'] . ' ha registrat una incidència a ' . str_val($body,'area') . ' (prioritat: ' . str_val($body,'priority') . ').',
            'Veu/Incidències'
        );
        if ($m['email_notifs']) {
            send_email($m['email'], 'Nova incidència: ' . str_val($body,'title'),
                "<p>Hola,</p><p>S'ha registrat una nova incidència al portal TAVIL:</p><ul>"
                . '<li><b>Títol:</b> ' . htmlspecialchars(str_val($body,'title')) . '</li>'
                . '<li><b>Àrea:</b> ' . htmlspecialchars(str_val($body,'area')) . '</li>'
                . '<li><b>Prioritat:</b> ' . htmlspecialchars(str_val($body,'priority')) . '</li>'
                . '<li><b>Descripció:</b> ' . htmlspecialchars(str_val($body,'description')) . '</li>'
                . '<li><b>Reportada per:</b> ' . htmlspecialchars($u['name']) . '</li></ul>'
                . '<p>Accedeix al portal per gestionar-la.</p>'
            );
        }
    }

    $row = $db->query("SELECT * FROM incidencies WHERE id=$new_id")->fetch();
    $row['id'] = (int)$row['id'];
    respond($row, 201);
}

// PATCH /api/incidencies/{id}/status
elseif ($method === 'PATCH' && $id !== null && $sub === 'status') {
    require_rrhh_or_admin();
    $db->prepare('UPDATE incidencies SET status=?, assigned_to=?, resolution=? WHERE id=?')
       ->execute([str_val($body,'status'), str_val($body,'assigned_to'), str_val($body,'resolution'), $id]);
    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
