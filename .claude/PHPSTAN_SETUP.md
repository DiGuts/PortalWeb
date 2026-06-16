# PHPStan setup (local)

## One-time install

```bash
# requires PHP >= 8.0 and Composer in PATH
composer install
```

This creates `vendor/` (gitignored — verify .gitignore covers it).

## Run analysis

```bash
composer analyse                 # full check at level 5
composer analyse:baseline        # snapshot current errors → phpstan-baseline.neon
```

After generating a baseline, append it to `phpstan.neon`:

```yaml
includes:
    - phpstan-baseline.neon
```

## Without Composer (PHAR)

```bash
# download once
curl -L https://github.com/phpstan/phpstan/releases/latest/download/phpstan.phar -o phpstan.phar

# run
php phpstan.phar analyse --memory-limit=512M
```

## Tuning

- `phpstan.neon` is at project root.
- Level 5 is the starting point (covers the common bugs). Raise to 6-9 once clean.
- `excludePaths` skips uploads + migrations.
- `ignoreErrors` silences PDO dynamism + route-file globals injected by `api/index.php`.

## CI hook

When CI is added, run:

```bash
composer install --no-progress --prefer-dist
composer analyse -- --error-format=github
```
