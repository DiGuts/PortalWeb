<?php
// ── TAVIL Portal — PHP API shared config ─────────────────────────────────────

define('DB_HOST', '192.168.10.168');
define('DB_PORT', 3306);
define('DB_NAME', 'app_db');
define('DB_USER', 'dev_app');
define('DB_PASS', 'Fa0VuwEfJwqLyf2tknj4');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        // Ensure tokens table exists
        $pdo->exec("CREATE TABLE IF NOT EXISTS tokens (
            token      VARCHAR(64) PRIMARY KEY,
            user_id    INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT NOW()
        )");
    }
    return $pdo;
}

function json_out(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function method(): string {
    return strtoupper($_SERVER['REQUEST_METHOD']);
}

function err(string $detail, int $status = 400): never {
    json_out(['detail' => $detail], $status);
}
