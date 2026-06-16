---
name: api-route
description: Scaffold new PHP REST route under api/routes/ following TAVIL conventions (auth_middleware + helpers + switch-by-method + JSON respond). Generates idempotent CRUD shape matching existing routes like news.php and employees.php.
---

# api-route

Create new route file in `api/routes/<resource>.php` and verify it's reachable from `api/index.php` router.

## Usage

`/api-route <resource_name>` (singular noun, snake_case)

Example: `/api-route holidays` → `api/routes/holidays.php` + `/api/holidays/*` endpoints.

## Steps

1. Ask: table name, columns (with types), required role (admin / rrhh / comunicacions / any-auth).
2. Check `api/index.php` to see how it dispatches routes — match its pattern.
3. Write `api/routes/<resource>.php` from template below.
4. If router needs registration, edit `api/index.php`.
5. Suggest matching migration (`/php-migration create_<resource>_table`).

## Template

```php
<?php
// Routes: /api/<resource>/*
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth_middleware.php';
require_once __DIR__ . '/../helpers.php';

$db   = get_db();
$body = request_body();
$id   = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

// POST /api/<resource>
if ($method === 'POST' && $id === null) {
    require_<role>(); // require_admin / require_rrhh / require_comunicacions_or_admin / auth_user
    $db->prepare('INSERT INTO <table> (col1,col2) VALUES (?,?)')
       ->execute([str_val($body,'col1'), str_val($body,'col2')]);
    $row = $db->query('SELECT * FROM <table> WHERE id=' . $db->lastInsertId())->fetch();
    $row['id'] = (int)$row['id'];
    respond($row, 201);
}

// GET /api/<resource>
elseif ($method === 'GET' && $id === null) {
    auth_user();
    $rows = $db->query('SELECT * FROM <table> ORDER BY created_at DESC')->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; }
    respond($rows);
}

// GET /api/<resource>/{id}
elseif ($method === 'GET' && $id !== null) {
    auth_user();
    $stmt = $db->prepare('SELECT * FROM <table> WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['detail' => 'No trobat'], 404);
    $row['id'] = (int)$row['id'];
    respond($row);
}

// PUT /api/<resource>/{id}
elseif ($method === 'PUT' && $id !== null) {
    require_<role>();
    $db->prepare('UPDATE <table> SET col1=?,col2=? WHERE id=?')
       ->execute([str_val($body,'col1'), str_val($body,'col2'), $id]);
    respond(['ok' => true]);
}

// DELETE /api/<resource>/{id}
elseif ($method === 'DELETE' && $id !== null) {
    require_<role>();
    $db->prepare('DELETE FROM <table> WHERE id=?')->execute([$id]);
    http_response_code(204); exit;
}

else {
    respond(['detail' => 'Not found'], 404);
}
```

## Conventions

- Always require auth via `auth_middleware.php` helpers (`auth_user`, `require_admin`, `require_rrhh`, `require_comunicacions_or_admin`).
- Always use prepared statements (PDO `prepare` + `execute`). NEVER concat user input into SQL.
- Always cast `$id` to int.
- Always use `respond()` helper from `helpers.php` (sets JSON header + status code).
- Read-list endpoints: order by `created_at DESC` unless domain says otherwise.
- DELETE returns 204, POST returns 201, others 200.
- Reference files: `api/routes/news.php`, `api/routes/employees.php`.
