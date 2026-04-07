<?php
// ── TAVIL Portal — PHP API front-controller router ───────────────────────────

// Extract the path segment after /api/
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); // e.g. /public_html/portal_web/api
$path = ltrim(substr($uri, strlen($base)), '/');       // e.g. auth/login

// Route to the right handler
if ($path === 'auth/login') {
    require __DIR__ . '/auth/login.php';
} elseif ($path === 'auth/register') {
    require __DIR__ . '/auth/register.php';

} elseif ($path === 'users/me/role') {
    require __DIR__ . '/users/me_role.php';
} elseif ($path === 'users/me') {
    require __DIR__ . '/users/me.php';

} elseif (preg_match('#^solicituds/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/solicituds/index.php';
} elseif ($path === 'solicituds') {
    require __DIR__ . '/solicituds/index.php';

} elseif (preg_match('#^suggestions/(\d+)/vote$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/suggestions/vote.php';
} elseif (preg_match('#^suggestions/(\d+)/status$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/suggestions/status.php';
} elseif (preg_match('#^suggestions/(\d+)/response$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/suggestions/response.php';
} elseif ($path === 'suggestions') {
    require __DIR__ . '/suggestions/index.php';

} elseif (preg_match('#^incidencies/(\d+)/status$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/incidencies/status.php';
} elseif ($path === 'incidencies') {
    require __DIR__ . '/incidencies/index.php';

} elseif (preg_match('#^enquestes/(\d+)/respond$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/enquestes/respond.php';
} elseif ($path === 'enquestes') {
    require __DIR__ . '/enquestes/index.php';

} elseif ($path === 'employees') {
    require __DIR__ . '/employees/index.php';

} elseif (preg_match('#^activities/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/activities/index.php';
} elseif ($path === 'activities') {
    require __DIR__ . '/activities/index.php';

} elseif (preg_match('#^agenda/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/agenda/index.php';
} elseif ($path === 'agenda') {
    require __DIR__ . '/agenda/index.php';

} elseif ($path === 'notices') {
    require __DIR__ . '/notices/index.php';

} elseif (preg_match('#^news/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/news/index.php';
} elseif ($path === 'news') {
    require __DIR__ . '/news/index.php';

} elseif (preg_match('#^notifications/(\d+)/read$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/notifications/read_one.php';
} elseif ($path === 'notifications/read-all') {
    require __DIR__ . '/notifications/read_all.php';
} elseif ($path === 'notifications/clear-all') {
    require __DIR__ . '/notifications/clear_all.php';
} elseif ($path === 'notifications') {
    require __DIR__ . '/notifications/index.php';

} elseif (preg_match('#^courses/(\d+)/progress$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/courses/progress.php';
} elseif ($path === 'courses') {
    require __DIR__ . '/courses/index.php';

} elseif ($path === 'upload') {
    require __DIR__ . '/upload/index.php';

} else {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['detail' => 'Ruta no trobada: ' . $path]);
}
