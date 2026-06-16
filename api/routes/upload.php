<?php
// Routes: /api/upload/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config.php';

$id  = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$sub = $segments[1] ?? '';

const ALLOWED_IMAGE_EXTS = ['jpg','jpeg','png','gif','webp'];
const ALLOWED_VIDEO_EXTS = ['mp4','webm','mov'];
const ALLOWED_EXTS       = ['jpg','jpeg','png','gif','webp','mp4','webm','mov'];
const MAX_IMAGE_BYTES    = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_BYTES    = 50 * 1024 * 1024;  // 50 MB

if (!is_dir(UPLOADS_DIR)) mkdir(UPLOADS_DIR, 0755, true);

// POST /api/upload  — upload image or video. Image uploads open to any authed user
// (avatar self-edit). Video uploads gated to content editors.
if ($method === 'POST' && $sub === '') {
    if (empty($_FILES['file'])) {
        auth_user();
        respond(['detail' => 'Cal enviar un fitxer (camp "file")'], 400);
    }
    $file = $_FILES['file'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $is_video = in_array($ext, ALLOWED_VIDEO_EXTS, true);
    $is_image = in_array($ext, ALLOWED_IMAGE_EXTS, true);
    if (!$is_video && !$is_image) {
        auth_user();
        respond(['detail' => 'Format de fitxer no permès'], 415);
    }
    // Reject double-extension attacks (e.g. evil.php.jpg)
    if (preg_match('/\.(php\d?|phtml|phar|cgi|pl|py|sh|asp|aspx)(\.|$)/i', $file['name'])) {
        auth_user();
        respond(['detail' => 'Nom de fitxer no permès'], 415);
    }
    // Validate actual file content via MIME sniffing, not just extension
    $finfo    = new \finfo(FILEINFO_MIME_TYPE);
    $detected = $finfo->file($file['tmp_name']);
    $allowed_mimes = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime'];
    if (!in_array($detected, $allowed_mimes, true)) {
        auth_user();
        respond(['detail' => 'Tipus de fitxer no permès (MIME invàlid)'], 415);
    }
    if ($is_video) {
        require_content_editor();
    } else {
        auth_user();
    }
    $cap = $is_video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (($file['size'] ?? 0) > $cap) {
        respond(['detail' => 'Fitxer massa gran (màx ' . ($cap / 1024 / 1024) . ' MB)'], 413);
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest     = UPLOADS_DIR . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) respond(['detail' => 'Error desant el fitxer'], 500);
    @unlink(UPLOADS_DIR . '/.gallery_cache.json');
    respond(['url' => '/uploads/' . $filename, 'kind' => $is_video ? 'video' : 'image']);
}

// GET /api/upload/images  — image-only listing, deduplicated by content hash
elseif ($method === 'GET' && $sub === 'images') {
    auth_user();
    $cache_file = UPLOADS_DIR . '/.gallery_cache.json';
    if (is_file($cache_file) && (time() - filemtime($cache_file)) < 60) {
        $cached = @file_get_contents($cache_file);
        if ($cached !== false) { header('Content-Type: application/json'); echo $cached; exit; }
    }
    $db = get_db();
    $referenced = [];
    foreach ($db->query("SELECT image FROM news WHERE image != ''")->fetchAll() as $row) {
        if (preg_match('#/uploads/(.+)$#', $row['image'], $m)) $referenced[$m[1]] = true;
    }
    $by_hash = [];
    foreach (scandir(UPLOADS_DIR) ?: [] as $f) {
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_IMAGE_EXTS, true)) continue;
        $path = UPLOADS_DIR . '/' . $f;
        if (!is_file($path)) continue;
        $h = md5_file($path);
        $by_hash[$h][] = $f;
    }
    $images = [];
    foreach ($by_hash as $files) {
        usort($files, function($a, $b) use ($referenced) {
            $ra = isset($referenced[$a]) ? 0 : 1;
            $rb = isset($referenced[$b]) ? 0 : 1;
            if ($ra !== $rb) return $ra - $rb;
            return filemtime(UPLOADS_DIR."/$a") <=> filemtime(UPLOADS_DIR."/$b");
        });
        $images[] = ['url' => '/uploads/' . $files[0], 'name' => $files[0]];
    }
    $json = json_encode($images);
    @file_put_contents($cache_file, $json);
    header('Content-Type: application/json');
    echo $json;
    exit;
}

// GET /api/upload/videos
elseif ($method === 'GET' && $sub === 'videos') {
    auth_user();
    $videos = [];
    foreach (scandir(UPLOADS_DIR) ?: [] as $f) {
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (in_array($ext, ALLOWED_VIDEO_EXTS, true)) {
            $videos[] = ['url' => '/uploads/' . $f, 'name' => $f];
        }
    }
    respond($videos);
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
    @unlink(UPLOADS_DIR . '/.gallery_cache.json');
    respond(['ok' => true]);
}

// DELETE /api/upload/dedup
elseif ($method === 'DELETE' && $sub === 'dedup') {
    require_admin();
    $db = get_db();

    // Build hash map (images only — videos rarely duplicate)
    $hash_map = [];
    foreach (scandir(UPLOADS_DIR) ?: [] as $f) {
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_IMAGE_EXTS, true)) continue;
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

    @unlink(UPLOADS_DIR . '/.gallery_cache.json');
    respond(['deleted' => $deleted, 'kept' => $kept, 'removed_count' => count($deleted)]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
