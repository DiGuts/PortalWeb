<?php
// Routes: /api/prevention/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../email.php';

$sub = $segments[1] ?? '';

// GET /api/prevention/status  — which documents the current user still needs to sign
if ($method === 'GET' && $sub === 'status') {
    $user = auth_user();
    if (!$user['requires_prl']) {
        respond(['pending' => []]);
    }
    $db   = get_db();
    $stmt = $db->prepare('SELECT document_key FROM prevention_signatures WHERE user_id=?');
    $stmt->execute([$user['id']]);
    $signed = array_column($stmt->fetchAll(), 'document_key');

    $pending = [];
    if (!in_array('inf_ca', $signed, true) && !in_array('inf_en', $signed, true)) {
        $pending[] = 'inf';
    }
    respond(['pending' => $pending]);
}

// POST /api/prevention/sign  — record a signature, send email
elseif ($method === 'POST' && $sub === 'sign') {
    $user = auth_user();
    $body = request_body();

    $document_key   = str_val($body, 'document_key');
    $signature_data = str_val($body, 'signature_data');

    $valid_keys = ['inf_ca', 'inf_en'];
    if (!in_array($document_key, $valid_keys, true)) {
        respond(['detail' => 'document_key invàlid'], 400);
    }
    if (empty($signature_data) || !str_starts_with($signature_data, 'data:image/')) {
        respond(['detail' => 'Signatura invàlida'], 400);
    }

    $db = get_db();
    try {
        $db->prepare('INSERT INTO prevention_signatures (user_id, document_key, signature_data) VALUES (?,?,?)')
           ->execute([$user['id'], $document_key, $signature_data]);
    } catch (\PDOException $e) {
        if ((string)$e->getCode() === '23000') {
            $db->prepare('UPDATE prevention_signatures SET signature_data=?, signed_at=NOW() WHERE user_id=? AND document_key=?')
               ->execute([$signature_data, $user['id'], $document_key]);
        } else { throw $e; }
    }

    $doc_name = $document_key === 'inf_ca'
        ? 'Informació i Formació (Català)'
        : 'Information and Training (English)';
    $date_str = date('d/m/Y H:i');

    $sig_html = preg_match('/^data:image\/(png|jpeg|gif|webp);base64,/', $signature_data)
        ? '<img src="' . htmlspecialchars($signature_data, ENT_QUOTES) . '" style="max-width:380px;border:1px solid #ddd;border-radius:6px;display:block;margin-top:8px;">'
        : '<em>(signatura no disponible)</em>';

    $html = '
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a2e1a;margin-bottom:16px;">Document PRL signat ✓</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;width:140px;">Treballador</td><td style="padding:8px 12px;">' . htmlspecialchars($user['name'], ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Correu</td><td style="padding:8px 12px;">' . htmlspecialchars($user['email'], ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Departament</td><td style="padding:8px 12px;">' . htmlspecialchars($user['dept'], ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Document</td><td style="padding:8px 12px;">' . htmlspecialchars($doc_name, ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Data i hora</td><td style="padding:8px 12px;">' . $date_str . '</td></tr>
      </table>
      <h3 style="color:#1a2e1a;margin-bottom:8px;">Signatura del treballador:</h3>
      ' . $sig_html . '
    </div>';

    send_email(
        'crmit@tavil.net',
        'Document PRL signat — ' . $user['name'] . ' — ' . $date_str,
        $html
    );

    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
