<?php
require_once __DIR__ . '/../_auth.php';
require_auth();

if (method() !== 'GET') err('Method not allowed', 405);
json_out(db()->query('SELECT * FROM notices WHERE active = 1 ORDER BY id DESC')->fetchAll());
