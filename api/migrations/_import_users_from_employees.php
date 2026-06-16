<?php
ini_set('display_errors', 1); error_reporting(E_ALL);
require_once __DIR__ . '/../db.php';
$db = get_db();

$created = 0; $skipped = 0; $errors = [];

$default_pass = password_hash('123456789', PASSWORD_BCRYPT);

// Get all employees
$employees = $db->query('SELECT name, email, dept, ext FROM employees WHERE email != "" AND email LIKE "%@%"')->fetchAll();

// Get existing user emails
$existing = $db->query('SELECT email FROM users')->fetchAll(PDO::FETCH_COLUMN);
$existing_set = array_flip(array_map('strtolower', $existing));

$stmt = $db->prepare(
    'INSERT INTO users (name, email, password, role, roles, dept, ext, is_head, must_change_password, onboarded, email_verified, email_notifs, active)
     VALUES (?,?,?,?,?,?,?,0,1,1,1,0,1)'
);

foreach ($employees as $emp) {
    $email = trim($emp['email']);
    if (!$email || !str_contains($email, '@')) { $skipped++; continue; }
    if (isset($existing_set[strtolower($email)])) { $skipped++; continue; }
    try {
        $stmt->execute([
            $emp['name'],
            $email,
            $default_pass,
            'Treballador/a',
            '[]',
            $emp['dept'],
            $emp['ext'] ?? '',
        ]);
        $created++;
    } catch (Throwable $e) {
        $errors[] = $email . ': ' . $e->getMessage();
        $skipped++;
    }
}

// Fix Ricard: dept=SAP, is_head=1, role=Cap de departament
$ricard = $db->prepare("UPDATE users SET dept='SAP', is_head=1, role='Cap de departament' WHERE email='ricardgarcia@tavil.net'");
$ricard->execute();
$ricard_updated = $ricard->rowCount();

// Also fix in employees table
$db->prepare("UPDATE employees SET dept='SAP', role='Cap de departament SAP' WHERE email='ricardgarcia@tavil.net'")->execute();

echo json_encode([
    'created' => $created,
    'skipped' => $skipped,
    'ricard_updated' => $ricard_updated,
    'errors' => array_slice($errors, 0, 5),
]);
