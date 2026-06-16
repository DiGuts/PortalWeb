<?php

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
