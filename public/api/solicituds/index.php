<?php
require_once __DIR__ . '/../_auth.php';

$me = require_auth();
$db = db();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

function notify(PDO $db, int $user_id, string $title, string $body, string $tab = ''): void {
    $db->prepare('INSERT INTO notifications (user_id, title, body, tab) VALUES (?, ?, ?, ?)')
       ->execute([$user_id, $title, $body, $tab]);
}

if (method() === 'GET') {
    $isRrhh = in_array($me['role'], ['Administrador/a', 'Recursos humans']);
    if ($isRrhh) {
        $st = $db->query('SELECT * FROM solicituds ORDER BY created_at DESC');
    } else {
        // author stores email (consistent with FastAPI)
        $st = $db->prepare('SELECT * FROM solicituds WHERE author = ? ORDER BY created_at DESC');
        $st->execute([$me['email']]);
    }
    json_out($st->fetchAll());
}

if (method() === 'POST') {
    $b = body();
    $db->prepare('INSERT INTO solicituds (date, comments, motive, author) VALUES (?, ?, ?, ?)')
       ->execute([$b['date'] ?? '', $b['comments'] ?? '', $b['motive'] ?? '', $me['email']]);
    $newId = $db->lastInsertId();

    // Notify all RRHH users
    $staff = $db->query("SELECT id FROM users WHERE role IN ('Recursos humans', 'Administrador/a')")->fetchAll();
    foreach ($staff as $s) {
        notify($db, (int)$s['id'],
            'Nova petició rebuda',
            $me['name'] . ' ha enviat una nova petició per al ' . ($b['date'] ?? '') . '.',
            'Solicituds'
        );
    }

    $st = $db->prepare('SELECT * FROM solicituds WHERE id = ?');
    $st->execute([$newId]);
    json_out($st->fetch(), 201);
}

if (method() === 'PATCH' && $id) {
    $b = body();

    // Fetch current status and author email before updating
    $cur = $db->prepare('SELECT author, status FROM solicituds WHERE id = ?');
    $cur->execute([$id]);
    $cur = $cur->fetch();

    $db->prepare('UPDATE solicituds SET status = ?, motive = ? WHERE id = ?')
       ->execute([$b['status'] ?? 'Pendent', $b['motive'] ?? '', $id]);

    // Notify author if status changed from Pendent
    if ($cur && $cur['status'] === 'Pendent' && ($b['status'] ?? '') !== 'Pendent') {
        $author = $db->prepare('SELECT id FROM users WHERE email = ?');
        $author->execute([$cur['author']]);
        $author = $author->fetch();
        if ($author) {
            $label = ($b['status'] === 'Aprovada') ? 'aprovada' : 'denegada';
            $notifBody = "La teva petició ha estat {$label}.";
            if (!empty($b['motive'])) $notifBody .= ' Motiu: ' . $b['motive'];
            notify($db, (int)$author['id'], 'Petició ' . $b['status'], $notifBody, 'Solicituds');
        }
    }

    json_out(['ok' => true]);
}

err('Method not allowed', 405);
