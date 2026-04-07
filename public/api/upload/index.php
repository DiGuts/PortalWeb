<?php
require_once __DIR__ . '/../_auth.php';
require_auth();

if (method() !== 'POST') err('Method not allowed', 405);
if (empty($_FILES['file'])) err('No s\'ha rebut cap fitxer');

$file = $_FILES['file'];
$ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
if (!in_array($ext, $allowed)) err('Tipus de fitxer no permès');

// Save to portal_web/uploads/
$uploadsDir = realpath(__DIR__ . '/../../..') . '/uploads';
if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

$filename = bin2hex(random_bytes(8)) . '.' . $ext;
$dest     = $uploadsDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) err('Error desant el fitxer', 500);

// Derive base URL from current request
$base = rtrim(dirname(dirname(dirname($_SERVER['SCRIPT_NAME']))), '/');
json_out(['url' => $base . '/uploads/' . $filename]);
