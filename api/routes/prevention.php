<?php
// Routes: /api/prevention/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../email.php';

$sub = $segments[1] ?? '';

// ── Department → EPI group mapping ───────────────────────────────────────────
// GRUP 1: Mecànics/Elèctrics + SAT (taller) + Magatzem i logística (Taller) + Manteniment
// GRUP 2: Oficina Tècnica + Qualitat i seguretat
// GRUP 3: Posta en marxa + Magatzem i logística (Oficines) + I+D
// GRUP 4: Compres + RRHH + SAT (Oficines) + Informàtica + resta personal oficines
function dept_to_epi_grup(string $dept): string {
    $d = mb_strtolower(trim($dept), 'UTF-8');

    // GRUP 2: Oficina Tècnica + Qualitat i seguretat
    if (str_contains($d, 'oficina tècnica') || str_contains($d, 'oficina tecnica') ||
        str_contains($d, 'qualitat i seguretat') || str_contains($d, 'qualitat i seg')) {
        return '2';
    }

    // GRUP 3: Posta en marxa + Magatzem/Logística (oficines) + I+D
    if (str_contains($d, 'posta en marxa') || $d === 'i+d' ||
        str_contains($d, 'sat (posta en marxa') ||
        $d === 'almacen y logística (logística)' ||
        $d === 'almacen y logística (admin. logística)' ||
        $d === 'dual sat - pmx') {
        return '3';
    }

    // GRUP 1: Mecànics/Elèctrics + SAT taller + Magatzem taller + Manteniment
    if (in_array($d, [
        'mecanització', 'it industrial', 'manteniment', 'conductor', 'jardiner', 'neteja',
        'sat (elèctric - sat)', 'sat (mecànic sat)',
        'magatzem', 'logística',
        'almacen y logística (magatzem)',
        'almacen y logística (sat - recanvis / magatzem)',
        'almacen y logística (devolucions)',
    ], true)) {
        return '1';
    }

    // GRUP 4: tot el resta (compres, rrhh, sat oficines, informàtica, admin, etc.)
    return '4';
}

// ── GET /api/prevention/status ────────────────────────────────────────────────
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

    // 1. INF document
    $inf_signed = in_array('inf_ca', $signed, true) || in_array('inf_en', $signed, true);
    if (!$inf_signed) {
        $pending[] = 'inf';
    }

    // 2. EPI document (only after INF is signed)
    if ($inf_signed) {
        $grup = $user['epi_grup'] ?: dept_to_epi_grup($user['dept'] ?? '');
        if ($grup) {
            $epi_key = 'epi_' . $grup;  // epi_1, epi_2, epi_3, epi_3i, epi_4
            if (!in_array($epi_key, $signed, true)) {
                $pending[] = $epi_key;
            }
        }
    }

    respond(['pending' => $pending]);
}

// ── POST /api/prevention/sign ─────────────────────────────────────────────────
elseif ($method === 'POST' && $sub === 'sign') {
    $user = auth_user();
    $body = request_body();

    $document_key   = str_val($body, 'document_key');
    $signature_data = str_val($body, 'signature_data');
    $pdf_data       = str_val($body, 'pdf_data');  // base64 PDF, optional

    $valid_keys = ['inf_ca', 'inf_en', 'epi_1', 'epi_2', 'epi_3', 'epi_3i', 'epi_4'];
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

    $doc_names = [
        'inf_ca'  => 'Informació i Formació (Català)',
        'inf_en'  => 'Information and Training (English)',
        'epi_1'   => 'Lliurament EPI – Grup 1 (Mecànics/Taller/Magatzem)',
        'epi_2'   => 'Lliurament EPI – Grup 2 (Oficina Tècnica / Qualitat)',
        'epi_3'   => 'Lliurament EPI – Grup 3 (Posta en Marxa / I+D)',
        'epi_3i'  => 'Lliurament EPI – Grup 3 Internacional',
        'epi_4'   => 'Lliurament EPI – Grup 4 (Oficines)',
    ];
    $doc_name = $doc_names[$document_key] ?? $document_key;
    $date_str = date('d/m/Y H:i');

    // Save signed PDF to disk if provided
    $attachments = [];
    if (!empty($pdf_data)) {
        $signed_dir = UPLOADS_DIR . '/prevention/signed/';
        if (!is_dir($signed_dir)) mkdir($signed_dir, 0755, true);
        $safe_name = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $user['name']);
        $filename  = $safe_name . '_' . $document_key . '_' . date('Ymd_Hi') . '.pdf';
        file_put_contents($signed_dir . $filename, base64_decode($pdf_data));
        $attachments[] = [
            'filename' => $filename,
            'mime'     => 'application/pdf',
            'data'     => $pdf_data,
        ];
    }

    $sig_html = (!empty($attachments))
        ? '<p style="color:#1a7a1a;">PDF signat adjunt a aquest correu.</p>'
        : (preg_match('/^data:image\/(png|jpeg|gif|webp);base64,/', $signature_data)
            ? '<img src="' . htmlspecialchars($signature_data, ENT_QUOTES) . '" style="max-width:380px;border:1px solid #ddd;border-radius:6px;display:block;margin-top:8px;">'
            : '<em>(signatura no disponible)</em>');

    $html = '
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a2e1a;margin-bottom:16px;">Document PRL signat ✓</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;width:140px;">Treballador</td><td style="padding:8px 12px;">' . htmlspecialchars($user['name'], ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Correu</td><td style="padding:8px 12px;">' . htmlspecialchars($user['email'], ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Departament</td><td style="padding:8px 12px;">' . htmlspecialchars($user['dept'] ?? '', ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Document</td><td style="padding:8px 12px;">' . htmlspecialchars($doc_name, ENT_QUOTES) . '</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f7f5;font-weight:600;">Data i hora</td><td style="padding:8px 12px;">' . $date_str . '</td></tr>
      </table>
      ' . (empty($attachments) ? '<h3 style="color:#1a2e1a;margin-bottom:8px;">Signatura del treballador:</h3>' . $sig_html : $sig_html) . '
    </div>';

    send_email(
        'crmit@tavil.net',
        'Document PRL signat — ' . $user['name'] . ' — ' . $date_str,
        $html,
        $attachments
    );

    respond(['ok' => true]);
}

else {
    respond(['detail' => 'Not found'], 404);
}
