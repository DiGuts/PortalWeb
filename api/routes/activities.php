<?php
// Routes: /api/activities/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub  = $segments[2] ?? '';

function _parse_activity_date(string $date): ?array {
    // ISO format: "YYYY-MM-DD"
    $parts = explode('-', $date);
    if (count($parts) === 3 && strlen($parts[0]) === 4) {
        return [(int)$parts[0], (int)$parts[1], (int)$parts[2]];
    }
    // Textual format: "12 abr 2026", "3 mai 2026", etc.
    static $map = [
        'gen'=>1,'feb'=>2,'mar'=>3,'abr'=>4,'mai'=>5,'jun'=>6,
        'jul'=>7,'ago'=>8,'set'=>9,'oct'=>10,'nov'=>11,'des'=>12,
        'may'=>5,'ene'=>1,'sep'=>9,'dic'=>12,
    ];
    if (preg_match('/^(\d{1,2})\s+([a-zA-ZàèéíïóòúüçÀÈÉÍÏÓÒÚÜÇ]+)\s+(\d{4})$/', trim($date), $m)) {
        $mon = strtolower(substr($m[2], 0, 3));
        if (isset($map[$mon])) return [(int)$m[3], $map[$mon], (int)$m[1]];
    }
    return null;
}

function _upsert_activity_agenda(PDO $db, int $activity_id, array $body): void {
    $date = str_val($body, 'date');
    if (!$date) return;
    $parsed = _parse_activity_date($date);
    if (!$parsed) return;
    [$year, $month, $day] = $parsed;
    $title    = str_val($body, 'title');
    $time     = str_val($body, 'time');
    $location = str_val($body, 'location');
    $db->prepare(
        'INSERT INTO agenda_events (title, day, month, year, time, location, type, activity_id)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), day=VALUES(day), month=VALUES(month),
           year=VALUES(year), time=VALUES(time), location=VALUES(location)'
    )->execute([$title, $day, $month, $year, $time, $location, 'Activitat', $activity_id]);
}

// POST /api/activities
if ($method === 'POST' && $id === null) {
    require_comunicacions_or_admin();
    $db->prepare('INSERT INTO activities (title,category,description,date,time,location,capacity,link,image,enrolled,past) VALUES (?,?,?,?,?,?,?,?,?,0,0)')
       ->execute([str_val($body,'title'), str_val($body,'category'), str_val($body,'description'), str_val($body,'date'), str_val($body,'time'), str_val($body,'location'), int_val($body,'capacity'), str_val($body,'link'), str_val($body,'image')]);
    $row = $db->query('SELECT * FROM activities WHERE id=' . $db->lastInsertId())->fetch();
    $row['id'] = (int)$row['id'];
    _upsert_activity_agenda($db, (int)$row['id'], $body);
    respond($row, 201);
}

// GET /api/activities/my  — must come before the generic list to avoid id=null match conflict
elseif ($method === 'GET' && $id === null && ($segments[1] ?? '') === 'my') {
    $u = auth_user();
    $stmt = $db->prepare(
        'SELECT activity_id, status FROM activity_enrollments
         WHERE user_id = ? AND status = \'confirmed\''
    );
    $stmt->execute([(int)$u['id']]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) { $r['activity_id'] = (int)$r['activity_id']; }
    respond($rows);
}

// GET /api/activities
elseif ($method === 'GET' && $id === null) {
    auth_user();
    $sql = 'SELECT a.*,
              (SELECT COUNT(*) FROM activity_enrollments ae
               WHERE ae.activity_id = a.id AND ae.status = \'confirmed\') AS enrolled
            FROM activities a';
    if (isset($_GET['past'])) {
        $stmt = $db->prepare($sql . ' WHERE a.past=? ORDER BY a.date');
        $stmt->execute([(int)$_GET['past']]);
    } else {
        $stmt = $db->query($sql . ' ORDER BY a.past, a.date');
    }
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['past'] = (int)$r['past']; $r['enrolled'] = (int)$r['enrolled']; }
    respond($rows);
}

// POST /api/activities/{id}/enroll
elseif ($method === 'POST' && $id !== null && $sub === 'enroll') {
    $u = auth_user();
    $user_id = (int)$u['id'];

    $stmt = $db->prepare('SELECT capacity, enrolled FROM activities WHERE id=?');
    $stmt->execute([$id]);
    $activity = $stmt->fetch();
    if (!$activity) respond(['detail' => 'Activitat no trobada'], 404);

    $capacity = (int)$activity['capacity'];
    $enrolled = (int)$activity['enrolled'];
    if ($capacity > 0 && $enrolled >= $capacity) {
        respond(['detail' => 'Activitat plena'], 409);
    }

    // 1. Purge any stale non-confirmed records (legacy waitlist/cancelled rows)
    $db->prepare('DELETE FROM activity_enrollments WHERE activity_id = ? AND user_id = ? AND status != \'confirmed\'')
       ->execute([$id, $user_id]);

    // 2. After purge, check if a confirmed record already exists
    $stmt = $db->prepare('SELECT id FROM activity_enrollments WHERE activity_id = ? AND user_id = ?');
    $stmt->execute([$id, $user_id]);
    if ($stmt->fetch()) {
        respond(['detail' => 'Ja estàs inscrit/a'], 409);
    }

    // 3. Insert — catch any race-condition duplicate that slips through
    try {
        $db->prepare('INSERT INTO activity_enrollments (activity_id, user_id, status) VALUES (?, ?, \'confirmed\')')
           ->execute([$id, $user_id]);
    } catch (\PDOException $e) {
        if ((string)$e->getCode() === '23000') {
            respond(['detail' => 'Ja estàs inscrit/a'], 409);
        }
        throw $e;
    }
    $db->prepare('UPDATE activities SET enrolled = enrolled + 1 WHERE id = ?')->execute([$id]);
    respond(['ok' => true, 'status' => 'confirmed']);
}

// DELETE /api/activities/{id}/enroll
elseif ($method === 'DELETE' && $id !== null && $sub === 'enroll') {
    $u = auth_user();
    $user_id = (int)$u['id'];

    $stmt = $db->prepare(
        'SELECT id FROM activity_enrollments
         WHERE activity_id = ? AND user_id = ? AND status = \'confirmed\''
    );
    $stmt->execute([$id, $user_id]);
    $enrollment = $stmt->fetch();
    if (!$enrollment) respond(['detail' => 'Inscripció no trobada'], 404);

    // Decrement counter, delete confirmed record, and purge any leftover stale records
    $db->prepare('UPDATE activities SET enrolled=GREATEST(enrolled-1,0) WHERE id=?')->execute([$id]);
    $db->prepare('DELETE FROM activity_enrollments WHERE activity_id = ? AND user_id = ?')->execute([$id, $user_id]);

    http_response_code(204); exit;
}

// GET /api/activities/{id}/enrollments  (admin only)
elseif ($method === 'GET' && $id !== null && $sub === 'enrollments') {
    require_admin();
    $stmt = $db->prepare(
        'SELECT ae.id AS enrollment_id, ae.user_id, ae.enrolled_at, ae.status,
                u.name, u.email, u.dept
         FROM activity_enrollments ae
         JOIN users u ON u.id = ae.user_id
         WHERE ae.activity_id = ? AND ae.status = 'confirmed'
         ORDER BY ae.enrolled_at ASC'
    );
    $stmt->execute([$id]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['enrollment_id'] = (int)$r['enrollment_id'];
        $r['user_id']       = (int)$r['user_id'];
    }
    respond($rows);
}

// PUT /api/activities/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('UPDATE activities SET title=?,category=?,description=?,date=?,time=?,location=?,capacity=?,link=?,image=? WHERE id=?')
       ->execute([str_val($body,'title'), str_val($body,'category'), str_val($body,'description'), str_val($body,'date'), str_val($body,'time'), str_val($body,'location'), int_val($body,'capacity'), str_val($body,'link'), str_val($body,'image'), $id]);
    _upsert_activity_agenda($db, $id, $body);
    respond(['ok' => true]);
}

// DELETE /api/activities/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_comunicacions_or_admin();
    $db->prepare('DELETE FROM agenda_events WHERE activity_id=?')->execute([$id]);
    $db->prepare('DELETE FROM activities WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

else {
    respond(['detail' => 'Not found'], 404);
}
