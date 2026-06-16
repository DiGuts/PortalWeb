<?php

/** Return the preferred API language: 'ca', 'es', or 'en'. Defaults to 'ca'. */
function api_lang(): string {
    $header = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
    if (str_starts_with($header, 'es')) return 'es';
    if (str_starts_with($header, 'en')) return 'en';
    return 'ca';
}

/** Return a translated error message for the given key. */
function api_msg(string $key): string {
    static $msgs = [
        'internal_error' => [
            'ca' => "S'ha produït un error intern",
            'es' => 'Se ha producido un error interno',
            'en' => 'An internal error occurred',
        ],
        'unauthorized' => [
            'ca' => 'No autoritzat',
            'es' => 'No autorizado',
            'en' => 'Unauthorized',
        ],
        'forbidden' => [
            'ca' => 'Accés denegat',
            'es' => 'Acceso denegado',
            'en' => 'Access denied',
        ],
        'not_found' => [
            'ca' => 'No trobat',
            'es' => 'No encontrado',
            'en' => 'Not found',
        ],
    ];
    $lang = api_lang();
    return $msgs[$key][$lang] ?? $msgs[$key]['ca'] ?? $key;
}

function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_body(): array {
    static $body = null;
    if ($body === null) {
        $raw   = file_get_contents('php://input');
        $body  = $raw ? (json_decode($raw, true) ?? []) : [];
    }
    return $body;
}

function str_val(array $body, string $key, string $default = ''): string {
    return isset($body[$key]) ? (string)$body[$key] : $default;
}

function int_val(array $body, string $key, int $default = 0): int {
    return isset($body[$key]) ? (int)$body[$key] : $default;
}

function bool_val(array $body, string $key, bool $default = false): bool {
    if (!isset($body[$key])) return $default;
    $v = $body[$key];
    return $v === true || $v === 1 || $v === '1' || $v === 'true';
}

/** Insert a notification row (fire and forget — no transaction needed separately). */
function push_notification(PDO $db, int $user_id, string $title, string $body, string $tab = ''): void {
    $stmt = $db->prepare('INSERT INTO notifications (user_id, title, body, tab) VALUES (?,?,?,?)');
    $stmt->execute([$user_id, $title, $body, $tab]);
}

/** Return [['id'=>int,'email'=>string,'email_notifs'=>int], ...] for admin users. */
function admin_users(PDO $db): array {
    $stmt = $db->query("SELECT id, email, email_notifs FROM users WHERE role='Administrador/a'");
    return $stmt->fetchAll() ?: [];
}
