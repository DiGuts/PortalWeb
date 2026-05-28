<?php
// Routes: /api/debug-mail — admin smoke test for SMTP
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../email.php';

$u = require_admin();

if ($method !== 'POST' || !isset($_GET['send']) || $_GET['send'] !== '1') {
    respond(['detail' => 'Use POST /api/debug-mail?send=1'], 400);
}

$to = $body['to'] ?? $u['email'];
$subject = 'Portal TAVIL — SMTP smoke test';
$html = '<p>SMTP funciona correctament.</p><p>From: ' . htmlspecialchars(SMTP_FROM) . '</p>';
send_email($to, $subject, $html);
respond(['ok' => true, 'sent_to' => $to, 'from' => SMTP_FROM]);
