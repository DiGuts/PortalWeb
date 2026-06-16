<?php
// ── TAVIL Portal — PHP Backend Config ─────────────────────────────────────────
// Loads api/.env if present, then falls back to real environment variables.

$_env_file = __DIR__ . '/.env';
if (is_file($_env_file)) {
    foreach (file($_env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $_line) {
        if ($_line[0] === '#' || !str_contains($_line, '=')) continue;
        [$_k, $_v] = explode('=', $_line, 2);
        $_k = trim($_k);
        $_v = trim($_v);
        if (!getenv($_k)) putenv("$_k=$_v");
    }
}
unset($_env_file, $_line, $_k, $_v);

define('DB_DSN',      getenv('DB_DSN')   ?: 'mysql:host=localhost;dbname=tavil_portal;charset=utf8mb4');
define('DB_USER',     getenv('DB_USER')  ?: 'root');
define('DB_PASS',     getenv('DB_PASS')  ?: '');
$_jwt_secret = getenv('JWT_SECRET') ?: '';
if (!$_jwt_secret || $_jwt_secret === 'change-me-in-production-use-a-long-random-string') {
    error_log('[SECURITY] JWT_SECRET no configurat o és el valor per defecte. Configura-la al .env!');
    // Keep a non-empty fallback so the app boots, but log loudly.
    if (!$_jwt_secret) $_jwt_secret = 'change-me-in-production-use-a-long-random-string';
}
define('JWT_SECRET', $_jwt_secret);
unset($_jwt_secret);
define('JWT_EXPIRY',  8 * 3600);  // 8 hours in seconds

define('SMTP_HOST',      getenv('SMTP_HOST')      ?: '');
define('SMTP_PORT',      (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_USER',      getenv('SMTP_USER')      ?: '');
define('SMTP_PASS',      getenv('SMTP_PASS')      ?: '');
define('SMTP_FROM',      getenv('SMTP_FROM')      ?: 'notifications@tavil.net');
define('SMTP_FROM_NAME', 'Portal TAVIL');

define('EMAIL_VERIFY_ENABLED', getenv('EMAIL_VERIFY_ENABLED') === 'true');
define('LOGIN_2FA_ENABLED',    getenv('LOGIN_2FA_ENABLED')    === 'true');

define('UPLOADS_DIR', __DIR__ . '/uploads');
