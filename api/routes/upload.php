<?php
// Routes: /api/upload/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config.php';

$id  = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub = $segments[1] ?? '';

const ALLOWED_EXTS = ['jpg','jpeg','png','gif','webp'];

if (!is_dir(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);

// POST /api/upload  — upload image
if ($method === 'POST' && $sub === '') {
    require_content_editor();
    if (empty($_FILES['file'])) respond(['detail' => 'Cal enviar un fitxer (camp "file")'], 400);
    $file = $_FILES['file'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTS, true)) respond(['detail' => 'Format de fitxer no permès'], 400);
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest     = UPLOADS_DIR . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) respond(['detail' => 'Error desant el fitxer'], 500);
    respond(['url' => '/uploads/' . $filename]);
}

// GET /api/upload/images
elseif ($method === 'GET' && $sub === 'images') {
    auth_user();
    $images = [];
    foreach (scandir(UPLOADS_DIR) ?: [] as $f) {
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (in_array($ext, ALLOWED_EXTS, true)) {
            $images[] = ['url' => '/uploads/' . $f, 'name' => $f];
        }
    }
    respond($images);
}

// DELETE /api/upload/images/{filename}
elseif ($method === 'DELETE' && $sub === 'images' && isset($segments[2])) {
    require_admin();
    $filename = basename($segments[2]);
    if ($filename !== $segments[2]) respond(['detail' => 'Nom de fitxer invàlid'], 400);
    $ext  = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $path = UPLOADS_DIR . '/' . $filename;
    if (!file_exists($path) || !in_array($ext, ALLOWED_EXTS, true)) respond(['detail' => 'Imatge no trobada'], 404);
    unlink($path);
    respond(['ok' => true]);
}

// DELETE /api/upload/dedup
elseif ($method === 'DELETE' && $sub === 'dedup') {
    require_admin();
    $db = get_db();

    // Build hash map
    $hash_map = [];
    foreach (scandir(UPLOADS_DIR) ?: [] as $f) {
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXTS, true)) continue;
        $h = md5_file(UPLOADS_DIR . '/' . $f);
        $hash_map[$h][] = $f;
    }

    // Find referenced filenames in news.image
    $referenced = [];
    foreach ($db->query("SELECT image FROM news WHERE image != ''")->fetchAll() as $row) {
        if (preg_match('#/uploads/(.+)$#', $row['image'], $m)) $referenced[$m[1]] = true;
    }

    $deleted = [];
    $kept    = [];
    foreach ($hash_map as $files) {
        if (count($files) <= 1) { $kept[] = $files[0]; continue; }
        // Prefer referenced; then oldest mtime
        usort($files, function($a, $b) use ($referenced) {
            $ra = isset($referenced[$a]) ? 0 : 1;
            $rb = isset($referenced[$b]) ? 0 : 1;
            if ($ra !== $rb) return $ra - $rb;
            return filemtime(UPLOADS_DIR."/$a") <=> filemtime(UPLOADS_DIR."/$b");
        });
        $kept[] = $files[0];
        foreach (array_slice($files, 1) as $dup) {
            unlink(UPLOADS_DIR . '/' . $dup);
            $deleted[] = $dup;
        }
    }

    respond(['deleted' => $deleted, 'kept' => $kept, 'removed_count' => count($deleted)]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
