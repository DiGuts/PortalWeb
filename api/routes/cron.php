<?php
/**
 * GET /api/cron/deadline-reminders?token=CRON_SECRET
 *
 * Finds courses and quizzes whose end_at is exactly 2 days from today.
 * Sends a summary email to crmit@tavil.net listing the affected trainings.
 * Safe to call daily via cron: 0 8 * * * curl -s "https://…/api/cron/deadline-reminders?token=SECRET"
 */
declare(strict_types=1);
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../email.php';

// ── Auth ──────────────────────────────────────────────────────────────────────
if (!CRON_SECRET) {
    http_response_code(500);
    echo json_encode(['detail' => 'CRON_SECRET not configured']);
    exit;
}
$token = $_GET['token'] ?? '';
if (!hash_equals(CRON_SECRET, $token)) {
    http_response_code(401);
    echo json_encode(['detail' => 'Unauthorized']);
    exit;
}

$db = new PDO(DB_DSN, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Target date: 2 days from today (date only, ignoring time)
$target = date('Y-m-d', strtotime('+2 days'));

// ── Courses (externes) ────────────────────────────────────────────────────────
$courses = $db->prepare(
    "SELECT id, title, end_at, mandatory, departments, target_users
     FROM courses
     WHERE is_external = 1
       AND end_at IS NOT NULL
       AND DATE(end_at) = ?"
);
$courses->execute([$target]);
$courseRows = $courses->fetchAll(PDO::FETCH_ASSOC);

// ── Quizzes (internes / presencials) ─────────────────────────────────────────
$quizzes = $db->prepare(
    "SELECT id, title, end_at, mandatory, target_departments, target_users
     FROM quizzes
     WHERE end_at IS NOT NULL
       AND DATE(end_at) = ?"
);
$quizzes->execute([$target]);
$quizRows = $quizzes->fetchAll(PDO::FETCH_ASSOC);

// Nothing to do
if (empty($courseRows) && empty($quizRows)) {
    echo json_encode(['sent' => false, 'reason' => 'no deadlines in 2 days']);
    exit;
}

// ── Fetch all active users once ───────────────────────────────────────────────
$all_users = $db->query("SELECT id, name, email, department FROM users WHERE active = 1")->fetchAll(PDO::FETCH_ASSOC);

function get_affected_users(array $all_users, array $depts_json, array $user_ids_json): array {
    if (empty($depts_json) && empty($user_ids_json)) {
        return $all_users;
    }
    $result = [];
    foreach ($all_users as $u) {
        $in_dept  = !empty($depts_json)   && in_array($u['department'], $depts_json, true);
        $in_users = !empty($user_ids_json) && in_array((int)$u['id'], $user_ids_json, true);
        if ($in_dept || $in_users) $result[] = $u;
    }
    return $result;
}

// ── Build email body ──────────────────────────────────────────────────────────
$sections = '';

foreach ($courseRows as $c) {
    $depts   = json_decode($c['departments'] ?? '[]', true) ?: [];
    $tusers  = json_decode($c['target_users'] ?? '[]', true) ?: [];
    $users   = get_affected_users($all_users, $depts, $tusers);
    $count   = count($users);
    $names   = implode(', ', array_slice(array_column($users, 'name'), 0, 10));
    if ($count > 10) $names .= " (i " . ($count - 10) . " més)";

    $sections .= "
    <tr>
      <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;'>
        <strong style='color:#111827;'>" . htmlspecialchars($c['title']) . "</strong><br>
        <span style='font-size:12px;color:#6b7280;'>Formació externa · Termini: <strong>" . htmlspecialchars($c['end_at']) . "</strong></span>
      </td>
      <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;'>
        {$count} persona" . ($count !== 1 ? 'es' : '') . "<br>
        <span style='color:#9ca3af;font-size:12px;'>" . htmlspecialchars($names ?: '—') . "</span>
      </td>
    </tr>";
}

foreach ($quizRows as $q) {
    $depts   = json_decode($q['target_departments'] ?? '[]', true) ?: [];
    $tusers  = json_decode($q['target_users'] ?? '[]', true) ?: [];
    $users   = get_affected_users($all_users, $depts, $tusers);
    $count   = count($users);
    $names   = implode(', ', array_slice(array_column($users, 'name'), 0, 10));
    if ($count > 10) $names .= " (i " . ($count - 10) . " més)";

    $sections .= "
    <tr>
      <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;'>
        <strong style='color:#111827;'>" . htmlspecialchars($q['title']) . "</strong><br>
        <span style='font-size:12px;color:#6b7280;'>Formació interna · Termini: <strong>" . htmlspecialchars($q['end_at']) . "</strong></span>
      </td>
      <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;'>
        {$count} persona" . ($count !== 1 ? 'es' : '') . "<br>
        <span style='color:#9ca3af;font-size:12px;'>" . htmlspecialchars($names ?: '—') . "</span>
      </td>
    </tr>";
}

$total = count($courseRows) + count($quizRows);
$html = "
<!DOCTYPE html>
<html lang='ca'>
<head><meta charset='UTF-8'></head>
<body style='font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:24px;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;'>
    <div style='background:#222725;padding:20px 24px;'>
      <p style='margin:0;color:#a3b3a0;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;'>Portal TAVIL · Campus</p>
      <h1 style='margin:6px 0 0;color:#fff;font-size:20px;font-weight:700;'>Termini de formació en 2 dies</h1>
    </div>
    <div style='padding:20px 24px;'>
      <p style='color:#374151;font-size:14px;margin:0 0 16px;'>
        Hi ha <strong>{$total} formació" . ($total !== 1 ? 'ns' : '') . "</strong> amb data límit el
        <strong>" . date('d/m/Y', strtotime($target)) . "</strong>.
      </p>
      <table style='width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;'>
        <thead>
          <tr style='background:#f3f4f6;'>
            <th style='padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em;'>Formació</th>
            <th style='padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em;'>Destinataris</th>
          </tr>
        </thead>
        <tbody>{$sections}</tbody>
      </table>
      <p style='color:#9ca3af;font-size:12px;margin:16px 0 0;'>
        Aquest correu s'envia automàticament 2 dies abans del termini de cada formació.
        Per gestionar les formacions, accedeix al <a href='https://tavil.net/portal' style='color:#5b7a5e;'>Portal TAVIL</a>.
      </p>
    </div>
  </div>
</body>
</html>";

send_email('crmit@tavil.net', "⚑ Termini de formació en 2 dies ({$total} formació" . ($total !== 1 ? 'ns' : '') . ")", $html);

echo json_encode(['sent' => true, 'target_date' => $target, 'trainings' => $total]);
