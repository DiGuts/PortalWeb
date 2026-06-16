<?php
require_once __DIR__ . '/config.php';

/**
 * Send an HTML email via SMTP (TLS/STARTTLS).
 * Silent no-op if SMTP_HOST is not configured.
 */
function send_email(string $to, string $subject, string $html): void {
    if (!SMTP_HOST) return;

    $boundary = md5(uniqid('', true));
    $headers  = implode("\r\n", [
        'MIME-Version: 1.0',
        "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM . ">",
        "To: $to",
        "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
        "Content-Type: multipart/alternative; boundary=\"$boundary\"",
    ]);
    $body = implode("\r\n", [
        "--$boundary",
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        chunk_split(base64_encode($html)),
        "--$boundary--",
    ]);

    // Open socket to SMTP server
    $errno = 0; $errstr = '';
    $port = SMTP_PORT;
    // Use TLS wrapper for port 465, STARTTLS for 587/25
    $use_ssl = ($port === 465);
    $host    = ($use_ssl ? 'ssl://' : '') . SMTP_HOST;

    $sock = @fsockopen($host, $port, $errno, $errstr, 10);
    if (!$sock) {
        error_log("[EMAIL ERROR] Cannot connect to " . SMTP_HOST . ":$port — $errstr ($errno)");
        return;
    }

    $read = function() use ($sock): string {
        $buf = '';
        while ($line = fgets($sock, 512)) {
            $buf .= $line;
            if ($line[3] === ' ') break; // last line of response
        }
        return $buf;
    };

    $cmd = function(string $c) use ($sock, $read): string {
        fwrite($sock, $c . "\r\n");
        return $read();
    };

    try {
        $read(); // banner
        $cmd('EHLO ' . gethostname());

        if (!$use_ssl) {
            $r = $cmd('STARTTLS');
            if (substr($r, 0, 3) === '220') {
                stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $cmd('EHLO ' . gethostname());
            }
        }

        if (SMTP_USER) {
            $cmd('AUTH LOGIN');
            $cmd(base64_encode(SMTP_USER));
            $cmd(base64_encode(SMTP_PASS));
        }

        $cmd('MAIL FROM:<' . SMTP_FROM . '>');
        $cmd("RCPT TO:<$to>");
        $cmd('DATA');
        fwrite($sock, "$headers\r\n\r\n$body\r\n.\r\n");
        $read();
        $cmd('QUIT');

        error_log("[EMAIL OK] to=$to subject=$subject");
    } catch (Throwable $e) {
        error_log("[EMAIL ERROR] to=$to subject=$subject error=" . $e->getMessage());
    } finally {
        fclose($sock);
    }
}
