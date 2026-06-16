<?php
// Routes: /api/suggestions/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

// GET /api/suggestions
if ($method === 'GET' && $id === null) {
    $u    = auth_user();
    $rows = $db->query('SELECT * FROM suggestions ORDER BY votes DESC, created_at DESC')->fetchAll();

    $votes_stmt = $db->prepare('SELECT suggestion_id, vote_type FROM suggestion_votes WHERE user_id=?');
    $votes_stmt->execute([(int)$u['id']]);
    $vote_map = [];
    foreach ($votes_stmt->fetchAll() as $v) $vote_map[$v['suggestion_id']] = $v['vote_type'];

    foreach ($rows as &$s) {
        $s['id']        = (int)$s['id'];
        $s['votes']     = (int)$s['votes'];
        $s['anonymous'] = (bool)$s['anonymous'];
        $s['user_vote'] = $vote_map[$s['id']] ?? null;
    }
    respond($rows);
}

// POST /api/suggestions
elseif ($method === 'POST' && $id === null) {
    $u      = auth_user();
    $anon   = bool_val($body, 'anonymous', true);
    $author = $anon ? 'Anònim' : $u['name'];
    $stmt   = $db->prepare('INSERT INTO suggestions (title,description,category,anonymous,author) VALUES (?,?,?,?,?)');
    $stmt->execute([str_val($body,'title'), str_val($body,'description'), str_val($body,'category','General'), $anon ? 1 : 0, $author]);
    $new_id = $db->lastInsertId();
    $st = $db->prepare('SELECT * FROM suggestions WHERE id=?');
    $st->execute([$new_id]);
    $row = $st->fetch();
    $row['id']        = (int)$row['id'];
    $row['votes']     = (int)$row['votes'];
    $row['anonymous'] = (bool)$row['anonymous'];
    $row['user_vote'] = null;
    respond($row, 201);
}

// POST /api/suggestions/{id}/vote
elseif ($method === 'POST' && $id !== null && $sub === 'vote') {
    $u         = auth_user();
    $uid       = (int)$u['id'];
    $vote_type = str_val($body, 'vote_type', 'up');

    $stmt = $db->prepare('SELECT vote_type FROM suggestion_votes WHERE suggestion_id=? AND user_id=?');
    $stmt->execute([$id, $uid]);
    $existing = $stmt->fetch();

    if (!$existing) {
        $db->prepare('INSERT INTO suggestion_votes (suggestion_id,user_id,vote_type) VALUES (?,?,?)')->execute([$id,$uid,$vote_type]);
        $delta = $vote_type === 'up' ? 1 : -1;
    } elseif ($existing['vote_type'] === $vote_type) {
        $db->prepare('DELETE FROM suggestion_votes WHERE suggestion_id=? AND user_id=?')->execute([$id,$uid]);
        $delta = $vote_type === 'up' ? -1 : 1;
    } else {
        $db->prepare('UPDATE suggestion_votes SET vote_type=? WHERE suggestion_id=? AND user_id=?')->execute([$vote_type,$id,$uid]);
        $delta = $vote_type === 'up' ? 2 : -2;
    }

    $db->prepare('UPDATE suggestions SET votes=votes+? WHERE id=?')->execute([$delta, $id]);
    respond(['ok' => true]);
}

// PATCH /api/suggestions/{id}/status
elseif ($method === 'PATCH' && $id !== null && $sub === 'status') {
    require_rrhh_or_admin();
    $db->prepare('UPDATE suggestions SET status=? WHERE id=?')->execute([str_val($body,'status'), $id]);
    respond(['ok' => true]);
}

// PATCH /api/suggestions/{id}/response
elseif ($method === 'PATCH' && $id !== null && $sub === 'response') {
    require_rrhh_or_admin();
    $db->prepare('UPDATE suggestions SET response=? WHERE id=?')->execute([str_val($body,'response'), $id]);
    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
