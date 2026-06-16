<?php
// Routes: /api/certificates/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config.php';

$db  = get_db();
$id  = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub = $segments[2] ?? '';

// GET /api/certificates/{id}/file — serve certificate file (auth-gated)
if ($method === 'GET' && $id !== null && $sub === 'file') {
    $u   = auth_user();
    $uid = (int)$u['id'];

    $isAdmin = user_has_any_role($u, ['Administrador', 'Administrador/a', 'Formacions', 'Recursos humans']);

    $stmt = $db->prepare('SELECT user_id, filename FROM course_certificates WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        respond(['detail' => 'No trobat'], 404);
    }

    if (!$isAdmin && (int)$row['user_id'] !== $uid) {
        respond(['detail' => 'No autoritzat'], 403);
    }

    $filepath = UPLOADS_DIR . '/certificates/' . basename($row['filename']);

    if (!file_exists($filepath)) {
        respond(['detail' => 'Fitxer no trobat'], 404);
    }

    $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($filepath) ?: 'application/octet-stream';
    $ext  = preg_replace('/[^a-z0-9]/i', '', pathinfo($row['filename'], PATHINFO_EXTENSION));

    header_remove('Content-Type');
    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="certificat.' . $ext . '"');
    header('Content-Length: ' . filesize($filepath));
    header('Cache-Control: private, no-cache');
    readfile($filepath);
    exit;
}

// POST /api/certificates — user uploads certificate for an external course
elseif ($method === 'POST' && $id === null) {
    $u   = auth_user();
    $uid = (int)$u['id'];

    // Validate file upload
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $err = $_FILES['file']['error'] ?? -1;
        $msg = match ((int)$err) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'El fitxer supera la mida màxima permesa',
            UPLOAD_ERR_NO_FILE  => 'No s\'ha rebut cap fitxer',
            default             => 'Error en la pujada del fitxer',
        };
        respond(['detail' => $msg], 400);
    }

    $course_id = isset($_POST['course_id']) ? (int)$_POST['course_id'] : 0;
    if (!$course_id) {
        respond(['detail' => 'course_id requerit'], 400);
    }

    // MIME check on the actual tmp file (not the client-supplied type)
    $finfo    = new \finfo(FILEINFO_MIME_TYPE);
    $mime     = $finfo->file($_FILES['file']['tmp_name']);
    $allowed  = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!in_array($mime, $allowed, true)) {
        respond(['detail' => 'Tipus de fitxer no permès. Acceptats: PDF, JPEG, PNG'], 400);
    }

    // Size check: max 10 MB
    if ($_FILES['file']['size'] > 10 * 1024 * 1024) {
        respond(['detail' => 'El fitxer supera els 10 MB màxims'], 400);
    }

    // Map MIME to extension
    $ext_map = [
        'application/pdf' => 'pdf',
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
    ];
    $ext = $ext_map[$mime];

    // Verify course exists and is external
    $course_stmt = $db->prepare('SELECT id FROM courses WHERE id=? AND is_external=1');
    $course_stmt->execute([$course_id]);
    if (!$course_stmt->fetch()) {
        respond(['detail' => 'Curs no trobat o no és extern'], 404);
    }

    // Generate a safe, unique filename
    $filename = 'cert_' . $uid . '_' . $course_id . '_' . bin2hex(random_bytes(8)) . '.' . $ext;

    // Ensure the certificates subdirectory exists
    $certDir = UPLOADS_DIR . '/certificates';
    if (!is_dir($certDir)) {
        mkdir($certDir, 0755, true);
        file_put_contents($certDir . '/.htaccess',
            "php_flag engine off\nOptions -ExecCGI\nRemoveHandler .php .php3 .php4 .php5 .php7 .phtml .phar\n");
    }

    // Move the uploaded file into place (before transaction so we can detect failure early)
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $certDir . '/' . $filename)) {
        respond(['detail' => 'Error desant el fitxer al servidor'], 500);
    }

    // Atomic: deactivate prior cert + insert new + advance progress
    $db->beginTransaction();
    try {
        $db->prepare(
            'UPDATE course_certificates SET is_active=0 WHERE user_id=? AND course_id=? AND is_active=1'
        )->execute([$uid, $course_id]);

        $db->prepare(
            'INSERT INTO course_certificates (user_id, course_id, filename, status, is_active, uploaded_at)
             VALUES (?, ?, ?, \'pending\', 1, NOW())'
        )->execute([$uid, $course_id, $filename]);

        $new_id = (int)$db->lastInsertId();

        $db->prepare(
            'INSERT INTO user_course_progress (user_id, course_id, status, progress)
             VALUES (?, ?, \'En curs\', 0)
             ON DUPLICATE KEY UPDATE
                 status   = IF(status = \'Pendent\', \'En curs\', status),
                 progress = IF(status = \'Pendent\', 0, progress)'
        )->execute([$uid, $course_id]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        @unlink($certDir . '/' . $filename);
        throw $e;
    }

    respond([
        'id'          => $new_id,
        'course_id'   => $course_id,
        'status'      => 'pending',
        'uploaded_at' => date('Y-m-d H:i:s'),
    ], 201);
}

// GET /api/certificates — admin lists all active certificates
elseif ($method === 'GET' && $id === null) {
    $u = require_formacions_or_admin();

    $status_filter = isset($_GET['status']) ? $_GET['status'] : null;

    $sql = 'SELECT cc.id, cc.user_id, cc.course_id, cc.filename, cc.status,
                   cc.is_active, cc.uploaded_at, cc.reviewed_at,
                   u.name AS user_name, u.dept AS user_dept,
                   c.title AS course_title
            FROM course_certificates cc
            JOIN users u ON u.id = cc.user_id
            JOIN courses c ON c.id = cc.course_id
            WHERE cc.is_active = 1';

    $params = [];
    if ($status_filter !== null && $status_filter !== '') {
        $sql     .= ' AND cc.status = ?';
        $params[] = $status_filter;
    }

    $sql .= ' ORDER BY (cc.status = "pending") DESC, cc.uploaded_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['id']        = (int)$row['id'];
        $row['user_id']   = (int)$row['user_id'];
        $row['course_id'] = (int)$row['course_id'];
    }
    unset($row);

    respond($rows);
}

// PATCH /api/certificates/{id}/review — admin approves or rejects a certificate
elseif ($method === 'PATCH' && $id !== null && $sub === 'review') {
    $u        = require_formacions_or_admin();
    $admin_id = (int)$u['id'];

    $body   = request_body();
    $action = str_val($body, 'action'); // 'approve' or 'reject'

    if (!in_array($action, ['approve', 'reject'], true)) {
        respond(['detail' => 'action invàlida'], 400);
    }

    $stmt = $db->prepare(
        'SELECT cc.id, cc.user_id, cc.course_id, c.title AS course_title
         FROM course_certificates cc
         JOIN courses c ON c.id = cc.course_id
         WHERE cc.id = ? AND cc.is_active = 1'
    );
    $stmt->execute([$id]);
    $cert = $stmt->fetch();

    if (!$cert) {
        respond(['detail' => 'Certificat no trobat'], 404);
    }

    $cert_uid    = (int)$cert['user_id'];
    $cert_cid    = (int)$cert['course_id'];
    $course_title = $cert['course_title'];

    $db->beginTransaction();
    try {
        $new_status = $action === 'approve' ? 'approved' : 'rejected';
        $db->prepare(
            'UPDATE course_certificates SET status=?, reviewed_at=NOW(), reviewed_by=? WHERE id=?'
        )->execute([$new_status, $admin_id, $id]);

        if ($action === 'approve') {
            $db->prepare(
                'INSERT INTO user_course_progress (user_id, course_id, status, progress)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status=VALUES(status), progress=VALUES(progress)'
            )->execute([$cert_uid, $cert_cid, 'Completat', 100]);
        }

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }

    // Notifications after commit — failure should not roll back the review
    try {
        if ($action === 'approve') {
            push_notification($db, $cert_uid, 'Certificat aprovat',
                'El teu certificat de «' . $course_title . '» ha estat aprovat.', 'Campus');
        } else {
            push_notification($db, $cert_uid, 'Certificat rebutjat',
                'El teu certificat de «' . $course_title . '» ha estat rebutjat. Torna\'l a pujar.', 'Campus');
        }
    } catch (Throwable $e) {
        error_log('[certificates] push_notification failed: ' . $e->getMessage());
    }

    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Mètode no permès'], 405);
}
