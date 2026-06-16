---
name: php-migration
description: Scaffold idempotent PHP migration file under api/migrations/ following TAVIL conventions (YYYY_MM_DD_<slug>.php). Generates ALTER TABLE IF NOT EXISTS pattern, error tolerance, OK/Already-exists output.
disable-model-invocation: true
---

# php-migration

Generate new migration in `api/migrations/`.

## Usage

`/php-migration <slug_snake_case>`

Example: `/php-migration add_phone_to_users` →
`api/migrations/2026_05_27_add_phone_to_users.php`

## Steps

1. Resolve today's date via shell (`date +%Y_%m_%d`). Do NOT hardcode.
2. Confirm slug with user if missing or ambiguous.
3. Ask user which statements to include (ALTER / CREATE / UPDATE seeds).
4. Write file with template below.
5. Print the path + `php api/migrations/<file>` run command.
6. Do NOT execute it — user runs migrations manually.

## Template

```php
<?php
// Migration: <one-line description>
require_once __DIR__ . '/../db.php';
$db = get_db();
$errors = [];

$stmts = [
    // Example:
    // "ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <col> <type> NULL DEFAULT NULL",
];

foreach ($stmts as $sql) {
    try {
        $db->exec($sql);
        echo "OK: $sql\n";
    } catch (PDOException $e) {
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate column') !== false || strpos($msg, 'already exists') !== false) {
            echo "Already exists: $sql\n";
        } else {
            $errors[] = $msg;
            echo "Error: $msg\n";
        }
    }
}

echo count($errors) === 0 ? "\nAll OK\n" : "\nErrors: " . count($errors) . "\n";
```

## Conventions

- File name: `YYYY_MM_DD_<slug>.php` (underscores, lowercase).
- Always idempotent: use `IF NOT EXISTS` / `IF EXISTS` clauses.
- Always tolerate "Duplicate column" + "already exists" errors silently.
- Never run destructive ops (`DROP TABLE`, `TRUNCATE`) without explicit user confirmation in chat.
- Reference: `api/migrations/2026_05_25_news_translations.php`.
