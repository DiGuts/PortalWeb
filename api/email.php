<?php
require_once __DIR__ . '/config.php';

/**
 * Send an HTML email via SMTP (TLS/STARTTLS), with optional attachments.
 * $attachments = [['filename' => 'doc.pdf', 'mime' => 'application/pdf', 'data' => '<base64>'], ...]
 * Silent no-op if SMTP_HOST is not configured.
 */
function send_email(string $to, string $subject, string $html, array $attachments = []): void {
    if (!SMTP_HOST) return;

    $outer = bin2hex(random_bytes(16));
    $inner = bin2hex(random_bytes(16));

    if (empty($attachments)) {
        // Simple multipart/alternative (original behavior)
        $ct   = "Content-Type: multipart/alternative; boundary=\"$outer\"";
        $body = implode("\r\n", [
            "--$outer",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "",
            chunk_split(base64_encode($html)),
            "--$outer--",
        ]);
    } else {
        // multipart/mixed wraps (multipart/alternative + attachments)
        $ct = "Content-Type: multipart/mixed; boundary=\"$outer\"";
        $html_part = implode("\r\n", [
            "--$inner",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "",
            chunk_split(base64_encode($html)),
            "--$inner--",
        ]);
        $body = "--$outer\r\n"
              . "Content-Type: multipart/alternative; boundary=\"$inner\"\r\n\r\n"
              . $html_part . "\r\n";
        foreach ($attachments as $att) {
            $body .= "\r\n--$outer\r\n"
                   . "Content-Type: " . $att['mime'] . "\r\n"
                   . "Content-Transfer-Encoding: base64\r\n"
                   . "Content-Disposition: attachment; filename=\"" . addslashes($att['filename']) . "\"\r\n\r\n"
                   . chunk_split($att['data']) . "\r\n";
        }
        $body .= "--$outer--";
    }

    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM . ">",
        "To: $to",
        "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
        $ct,
    ]);

    $errno = 0; $errstr = '';
    $port    = SMTP_PORT;
    $use_ssl = ($port === 465);
    $host    = ($use_ssl ? 'ssl://' : '') . SMTP_HOST;
    $ctx     = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);

    $sock = @stream_socket_client($host . ':' . $port, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
    if (!$sock) {
        error_log("[EMAIL ERROR] Cannot connect to " . SMTP_HOST . ":$port — $errstr ($errno)");
        return;
    }

    $read = function() use ($sock): string {
        $buf = '';
        while ($line = fgets($sock, 512)) {
            $buf .= $line;
            if ($line[3] === ' ') break;
        }
        return $buf;
    };

    $cmd = function(string $c) use ($sock, $read): string {
        fwrite($sock, $c . "\r\n");
        return $read();
    };

    try {
        $read();
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
