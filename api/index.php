<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

// JSON error handler — never leak HTML to clients
set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    error_log('[api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    echo json_encode(['detail' => api_msg('internal_error')]);
    exit;
});
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// ── CORS ──────────────────────────────────────────────────────────────────────
$allowed_origin = getenv('CORS_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $allowed_origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Parse URI ─────────────────────────────────────────────────────────────────
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = rawurldecode($uri);

// Strip full script name first (PATH_INFO mode: /api/index.php/auth/login)
$script_name = $_SERVER['SCRIPT_NAME'] ?? '';
if ($script_name && str_starts_with($uri, $script_name)) {
    $uri = substr($uri, strlen($script_name));
} else {
    // Fallback: strip script directory (rewrite mode)
    $script_dir = rtrim(dirname($script_name), '/');
    if ($script_dir && str_starts_with($uri, $script_dir)) {
        $uri = substr($uri, strlen($script_dir));
    }
}

$uri    = '/' . ltrim($uri, '/');
$method = strtoupper($_SERVER['REQUEST_METHOD']);

// ── Serve uploads statically (supports subdirectories) ───────────────────────
if (preg_match('#^/uploads/(.+)$#', $uri, $m)) {
    $rel      = str_replace('\\', '/', $m[1]);
    $filepath = realpath(UPLOADS_DIR . '/' . $rel);
    $uploadsR = realpath(UPLOADS_DIR);
    // Path-traversal guard: resolved path must be inside UPLOADS_DIR
    if (!$filepath || !$uploadsR || strpos($filepath, $uploadsR . DIRECTORY_SEPARATOR) !== 0) {
        http_response_code(404);
        echo json_encode(['detail' => 'Not found']);
        exit;
    }
    if (!file_exists($filepath)) {
        http_response_code(404);
        echo json_encode(['detail' => 'Not found']);
        exit;
    }
    $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($filepath) ?: 'application/octet-stream';
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($filepath));
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($filepath);
    exit;
}

// ── Strip /api prefix (optional — handles both /api/... and /...) ─────────────
if (str_starts_with($uri, '/api/')) {
    $uri = substr($uri, 4); // -> /auth/login etc
} elseif ($uri === '/api') {
    $uri = '/';
}

// ── Route segments ────────────────────────────────────────────────────────────
$segments = array_values(array_filter(explode('/', $uri), fn($s) => $s !== ''));
$base     = $segments[0] ?? '';

// ── Dispatch ──────────────────────────────────────────────────────────────────
$route_file = match ($base) {
    'auth'          => __DIR__ . '/routes/auth.php',
    'users'         => __DIR__ . '/routes/users.php',
    'suggestions'   => __DIR__ . '/routes/suggestions.php',
    'incidencies'   => __DIR__ . '/routes/incidencies.php',
    'solicituds'    => __DIR__ . '/routes/solicituds.php',
    'vacances'      => __DIR__ . '/routes/vacances.php',
    'notifications' => __DIR__ . '/routes/notifications.php',
    'activities'    => __DIR__ . '/routes/activities.php',
    'agenda'        => __DIR__ . '/routes/agenda.php',
    'certificates'  => __DIR__ . '/routes/certificates.php',
    'courses'       => __DIR__ . '/routes/courses.php',
    'employees'     => __DIR__ . '/routes/employees.php',
    'enquestes'     => __DIR__ . '/routes/enquestes.php',
    'news'          => __DIR__ . '/routes/news.php',
    'notices'       => __DIR__ . '/routes/notices.php',
    'upload'        => __DIR__ . '/routes/upload.php',
    'quizzes'       => __DIR__ . '/routes/quizzes.php',
    'debug-mail'    => __DIR__ . '/routes/debug-mail.php',
    'prevention'    => __DIR__ . '/routes/prevention.php',
    default         => null,
};

if ($route_file === null) {
    http_response_code(404);
    echo json_encode(['detail' => 'Not found']);
    exit;
}

require $route_file;
