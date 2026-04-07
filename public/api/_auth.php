<?php
require_once __DIR__ . '/_config.php';

function get_auth_header(): string {
    // Apache CGI/FastCGI strips HTTP_AUTHORIZATION — try all known sources
    if (!empty($_SERVER['HTTP_AUTHORIZATION']))          return $_SERVER['HTTP_AUTHORIZATION'];
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    // Set via RewriteRule E=HTTP_AUTHORIZATION in .htaccess
    if (!empty($_ENV['HTTP_AUTHORIZATION']))             return $_ENV['HTTP_AUTHORIZATION'];
    // Last resort: apache_request_headers() — works on mod_php
    if (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        foreach ($h as $k => $v) {
            if (strtolower($k) === 'authorization') return $v;
        }
    }
    return '';
}

function require_auth(): array {
    $header = get_auth_header();
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        err('No autoritzat', 401);
    }
    $token = $m[1];
    $db = db();
    $st = $db->prepare(
        'SELECT u.id, u.name, u.email, u.role, u.dept, u.phone, u.ext, u.location
           FROM tokens t JOIN users u ON u.id = t.user_id
          WHERE t.token = ?'
    );
    $st->execute([$token]);
    $user = $st->fetch();
    if (!$user) err('No autoritzat', 401);
    return $user;
}
