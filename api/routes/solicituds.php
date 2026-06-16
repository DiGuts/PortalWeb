<?php
// Routes: /api/solicituds/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../email.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

// GET /api/solicituds
if ($method === 'GET' && $id === null) {
    $u = auth_user();
    if (user_has_any_role($u, ['Administrador/a', 'Recursos humans', 'SolicitudsDissabtes', 'SolicitudsVacances'])) {
        $rows = $db->query('SELECT * FROM solicituds ORDER BY created_at DESC')->fetchAll();
    } else {
        $stmt = $db->prepare('SELECT * FROM solicituds WHERE author=? ORDER BY created_at DESC');
        $stmt->execute([$u['email']]);
        $rows = $stmt->fetchAll();
    }
    foreach ($rows as &$r) $r['id'] = (int)$r['id'];
    respond($rows);
}

// POST /api/solicituds
elseif ($method === 'POST' && $id === null) {
    $u = auth_user();
    $db->prepare('INSERT INTO solicituds (date,motive,comments,author) VALUES (?,?,?,?)')
       ->execute([str_val($body,'date'), str_val($body,'motive'), str_val($body,'comments'), $u['email']]);
    $new_id = (int)$db->lastInsertId();

    // Notify RRHH
    $rrhh = $db->query("SELECT id,email,email_notifs FROM users WHERE JSON_CONTAINS(roles, '\"SolicitudsDissabtes\"') OR JSON_CONTAINS(roles, '\"Administrador\"') OR role='Recursos humans'")->fetchAll();
    foreach ($rrhh as $r) {
        push_notification($db, (int)$r['id'],
            'Nova petició rebuda',
            $u['name'] . ' ha enviat una nova petició per al ' . str_val($body,'date') . '.',
            'Solicituds/Dies no ordinaris'
        );
        if ($r['email_notifs']) {
            $comments = str_val($body,'comments');
            send_email($r['email'], 'Nova petició de dies no ordinaris — ' . $u['name'],
                '<p>Hola,</p><p><b>' . htmlspecialchars($u['name']) . '</b> ha sol·licitat un dia no ordinari per al <b>' . htmlspecialchars(str_val($body,'date')) . '</b>.</p>'
                . ($comments ? '<p><b>Comentaris:</b> ' . htmlspecialchars($comments) . '</p>' : '')
                . '<p>Accedeix al portal per gestionar la petició.</p>'
            );
        }
    }

    $stmt = $db->prepare('SELECT * FROM solicituds WHERE id=?'); $stmt->execute([$new_id]); $row = $stmt->fetch();
    $row['id'] = (int)$row['id'];
    respond($row, 201);
}

// DELETE /api/solicituds/{id}
elseif ($method === 'DELETE' && $id !== null) {
    $u = auth_user();
    $stmt = $db->prepare('SELECT author, status FROM solicituds WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) { respond(['detail' => 'Not found'], 404); }
    $is_approver = user_has_any_role($u, ['Administrador/a', 'Recursos humans', 'Aprovacions', 'SolicitudsDissabtes']) || !empty($u['is_head']);
    $is_author   = $row['author'] === $u['email'];
    if (!$is_approver && !$is_author) {
        respond(['detail' => 'No autoritzat'], 403);
    }
    $db->prepare('DELETE FROM solicituds WHERE id=?')->execute([$id]);
    respond(['ok' => true]);
}

// PATCH /api/solicituds/{id}
elseif ($method === 'PATCH' && $id !== null) {
    require_rrhh_or_admin();
    $row = $db->prepare('SELECT author, status FROM solicituds WHERE id=?');
    $row->execute([$id]);
    $current = $row->fetch();

    $new_status = str_val($body,'status');
    $new_motive = str_val($body,'motive');
    $db->prepare('UPDATE solicituds SET status=?, motive=? WHERE id=?')->execute([$new_status, $new_motive, $id]);

    if ($current && $current['status'] === 'Pendent' && $new_status !== 'Pendent') {
        $author_stmt = $db->prepare('SELECT id,email,email_notifs FROM users WHERE email=?');
        $author_stmt->execute([$current['author']]);
        $author = $author_stmt->fetch();
        if ($author) {
            $label      = $new_status === 'Aprovada' ? 'aprovada' : 'denegada';
            $notif_body = "La teva petició ha estat $label." . ($new_motive ? " Motiu: $new_motive" : '');
            push_notification($db, (int)$author['id'], "Petició $new_status", $notif_body, 'Solicituds/Dies no ordinaris');
            if ($author['email_notifs']) {
                send_email($author['email'], "Petició de dies no ordinaris $new_status",
                    "<p>Hola,</p><p>La teva petició de dies no ordinaris ha estat <b>$label</b>.</p>"
                    . ($new_motive ? '<p><b>Motiu:</b> ' . htmlspecialchars($new_motive) . '</p>' : '')
                    . '<p>Accedeix al portal per veure els detalls.</p>'
                );
            }
        }
    }

    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
