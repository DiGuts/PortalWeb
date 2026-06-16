<?php
// Routes: /api/vacances/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../email.php';
require_once __DIR__ . '/../conveni.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

function _vac_row(array $r): array {
    $r['id'] = (int)$r['id'];
    $r['user_id'] = (int)$r['user_id'];
    return $r;
}

// GET /api/vacances
if ($method === 'GET' && $id === null) {
    $u    = auth_user();
    $uid  = (int)$u['id'];
    $role = $u['role'];
    $dept = $u['dept'] ?? '';

    if (in_array($role, ['Administrador/a','Recursos humans'], true)) {
        $rows = $db->query('SELECT * FROM vacances ORDER BY created_at DESC')->fetchAll();
    } elseif (!empty($u['is_head'])) {
        $stmt = $db->prepare("SELECT * FROM vacances WHERE user_id=? OR (author_dept=? AND head_status='Pendent') ORDER BY created_at DESC");
        $stmt->execute([$uid, $dept]);
        $rows = $stmt->fetchAll();
    } else {
        $stmt = $db->prepare('SELECT * FROM vacances WHERE user_id=? ORDER BY created_at DESC');
        $stmt->execute([$uid]);
        $rows = $stmt->fetchAll();
    }
    respond(array_map('_vac_row', $rows));
}

// POST /api/vacances
elseif ($method === 'POST' && $id === null) {
    $u          = auth_user();
    $uid        = (int)$u['id'];
    $start_iso  = str_val($body, 'start_date');
    $end_iso    = str_val($body, 'end_date');
    $dept       = $u['dept'] ?? '';

    // Load existing for quota/streak checks
    $ex_stmt = $db->prepare('SELECT start_date, end_date, status FROM vacances WHERE user_id=?');
    $ex_stmt->execute([$uid]);
    $existing = $ex_stmt->fetchAll();

    $errors = validate_vacanca($start_iso, $end_iso, $existing);
    if ($errors) {
        respond(['detail' => ['conveni_errors' => $errors]], 400);
    }

    $db->prepare('INSERT INTO vacances (user_id,author_name,author_dept,start_date,end_date,comments) VALUES (?,?,?,?,?,?)')
       ->execute([$uid, $u['name'], $dept, $start_iso, $end_iso, str_val($body,'comments')]);
    $new_id = (int)$db->lastInsertId();

    // Notify department head(s)
    $heads = $db->prepare("SELECT id,email,email_notifs FROM users WHERE is_head=1 AND dept=?");
    $heads->execute([$dept]);
    foreach ($heads->fetchAll() as $head) {
        push_notification($db, (int)$head['id'],
            'Nova sol·licitud de vacances — ' . $u['name'],
            $u['name'] . " ha sol·licitat vacances del $start_iso al $end_iso.",
            'Solicituds/Vacances'
        );
        if ($head['email_notifs']) {
            $comments = str_val($body,'comments');
            send_email($head['email'], 'Sol·licitud de vacances de ' . $u['name'],
                '<p>Hola,</p><p><b>' . htmlspecialchars($u['name']) . '</b> ha sol·licitat vacances:</p><ul>'
                . "<li><b>Del:</b> $start_iso</li><li><b>Al:</b> $end_iso</li>"
                . ($comments ? '<li><b>Comentaris:</b> ' . htmlspecialchars($comments) . '</li>' : '')
                . '</ul><p>Accedeix al portal per aprovar o denegar la petició.</p>'
            );
        }
    }

    $st = $db->prepare('SELECT * FROM vacances WHERE id=?');
    $st->execute([$new_id]);
    $row = $st->fetch();
    respond(_vac_row($row), 201);
}

// PATCH /api/vacances/{id}/head
elseif ($method === 'PATCH' && $id !== null && $sub === 'head') {
    $u = auth_user();
    if (!in_array($u['role'], ['Administrador/a','Recursos humans'], true) && empty($u['is_head'])) {
        respond(['detail' => 'No autoritzat'], 403);
    }
    $row_stmt = $db->prepare('SELECT * FROM vacances WHERE id=?');
    $row_stmt->execute([$id]);
    $row = $row_stmt->fetch();
    if (!$row) respond(['detail' => 'No trobat'], 404);

    $status  = str_val($body,'status');
    $comment = str_val($body,'comment');
    $db->prepare('UPDATE vacances SET head_status=?, head_comment=? WHERE id=?')->execute([$status, $comment, $id]);

    if ($status === 'Aprovada') {
        // Notify RRHH for final approval
        $rrhh = $db->query("SELECT id,email,email_notifs FROM users WHERE role='Recursos humans'")->fetchAll();
        foreach ($rrhh as $r) {
            push_notification($db, (int)$r['id'],
                "Vacances pendents d'aprovació RRHH — {$row['author_name']}",
                "El responsable de {$row['author_dept']} ha aprovat les vacances de {$row['author_name']}. Cal la vostra aprovació final.",
                'Solicituds/Vacances'
            );
            if ($r['email_notifs']) {
                send_email($r['email'], "Vacances pendents d'aprovació RRHH — {$row['author_name']}",
                    "<p>Hola,</p><p>El responsable de <b>{$row['author_dept']}</b> ha aprovat les vacances de "
                    . "<b>{$row['author_name']}</b> del {$row['start_date']} al {$row['end_date']}.</p>"
                    . '<p>Cal la vostra aprovació final. Accedeix al portal.</p>'
                );
            }
        }
    } else {
        // Head denied — mark overall as Denegada + notify user
        $db->prepare("UPDATE vacances SET status='Denegada' WHERE id=?")->execute([$id]);
        $author = $db->prepare('SELECT id,email,email_notifs FROM users WHERE id=?');
        $author->execute([$row['user_id']]);
        $author = $author->fetch();
        if ($author) {
            $msg = "El responsable ha denegat la teva sol·licitud de vacances del {$row['start_date']} al {$row['end_date']}."
                 . ($comment ? " Motiu: $comment" : '');
            push_notification($db, (int)$author['id'], 'Sol·licitud de vacances denegada', $msg, 'Solicituds/Vacances');
            if ($author['email_notifs']) {
                send_email($author['email'], 'Sol·licitud de vacances denegada pel responsable',
                    "<p>Hola {$row['author_name']},</p><p>El teu responsable ha <b>denegat</b> la sol·licitud de vacances del {$row['start_date']} al {$row['end_date']}.</p>"
                    . ($comment ? '<p><b>Motiu:</b> ' . htmlspecialchars($comment) . '</p>' : '')
                );
            }
        }
    }
    respond(['ok' => true]);
}

// PATCH /api/vacances/{id}/rrhh
elseif ($method === 'PATCH' && $id !== null && $sub === 'rrhh') {
    $u = auth_user();
    if (!in_array($u['role'], ['Recursos humans','Administrador/a'], true)) {
        respond(['detail' => 'No autoritzat'], 403);
    }
    $row_stmt = $db->prepare('SELECT * FROM vacances WHERE id=?');
    $row_stmt->execute([$id]);
    $row = $row_stmt->fetch();
    if (!$row) respond(['detail' => 'No trobat'], 404);

    $status       = str_val($body,'status');
    $comment      = str_val($body,'comment');
    $final_status = $status === 'Aprovada' ? 'Aprovada' : 'Denegada';
    $db->prepare('UPDATE vacances SET rrhh_status=?, rrhh_comment=?, status=? WHERE id=?')
       ->execute([$status, $comment, $final_status, $id]);

    $author = $db->prepare('SELECT id,email,email_notifs FROM users WHERE id=?');
    $author->execute([$row['user_id']]);
    $author = $author->fetch();
    if ($author) {
        $label = $status === 'Aprovada' ? 'aprovada' : 'denegada';
        $msg   = "RRHH ha {$label} la teva sol·licitud de vacances del {$row['start_date']} al {$row['end_date']}."
               . ($comment ? " Motiu: $comment" : '');
        push_notification($db, (int)$author['id'], "Vacances $final_status", $msg, 'Solicituds/Vacances');
        if ($author['email_notifs']) {
            send_email($author['email'], "Les teves vacances han estat {$label}s per RRHH",
                "<p>Hola {$row['author_name']},</p><p>RRHH ha <b>$label</b> la teva sol·licitud de vacances del {$row['start_date']} al {$row['end_date']}.</p>"
                . ($comment ? '<p><b>Motiu:</b> ' . htmlspecialchars($comment) . '</p>' : '')
            );
        }
    }
    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
