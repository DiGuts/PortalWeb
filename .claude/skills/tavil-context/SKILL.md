# TAVIL Portal — Context Skill

Everything a new Claude session needs to know about this project before touching code.

---

## Stack

- **Frontend:** React 19 + TypeScript, `src/App.tsx` (~14k lines, monolith), Tailwind + CSS custom tokens
- **Backend:** PHP (api/routes/*.php), front-controller at `api/index.php`
- **DB:** MariaDB `app_db` on `192.168.10.169:3306`
- **i18n:** react-i18next, `useTranslation()` + `t()`, locales at `src/locales/{ca,es,en}.json` — **ca = canonical**
- **Server:** Apache on `srlnxweb01` (internal), no mod_wsgi — Python FastAPI was abandoned

---

## Two environments

| | Prod | Dev/staging |
|---|---|---|
| Branch | `master` | `DevPortal` |
| URL | `http://192.168.10.169/public_html/portal_web/` | `http://192.168.10.169/public_html/dev_portal_web/` |
| `package.json` homepage | `/public_html/portal_web` | `/public_html/dev_portal_web` |
| API | `api/` in same folder | **Shares prod** `portal_web/api/` — dev writes hit real data |

`src/api.ts`: non-localhost `API_BASE` hardcoded to `/public_html/portal_web/api/index.php` (both envs share same api/).

**NEVER auto-deploy** unless user says "puja al servidor", "deploy", etc. User runs live demos.

---

## FTP Deploy

Credentials in `ftp_deploy.cfg` (project root, gitignored). **NEVER** pass password inline on CLI — `!` in password gets mangled by Git Bash even with single quotes. Always use `-K ftp_deploy.cfg`.

```bash
# Upload a file
curl -K ftp_deploy.cfg -T build/static/js/main.HASH.js \
  "ftp://192.168.10.169/public_html/portal_web/static/js/main.HASH.js" -s

# Fix permissions (uploads land 0600 → Apache 403)
curl -K ftp_deploy.cfg -s \
  -Q "SITE CHMOD 644 public_html/portal_web/static/js/main.HASH.js" \
  "ftp://192.168.10.169/" > /dev/null

# PHP files (same pattern, target api/routes/foo.php)
curl -K ftp_deploy.cfg -T api/routes/foo.php \
  "ftp://192.168.10.169/public_html/portal_web/api/routes/foo.php" -s
curl -K ftp_deploy.cfg -s \
  -Q "SITE CHMOD 644 public_html/portal_web/api/routes/foo.php" \
  "ftp://192.168.10.169/" > /dev/null
```

Dev target: replace `portal_web` with `dev_portal_web`. API changes always go to `portal_web/api/` (shared).

---

## DB Migrations

No mysql CLI locally. Pattern:
1. Write PHP script → upload to `api/migrations/_fix.php` + CHMOD 644
2. Call `http://192.168.10.169/public_html/portal_web/api/migrations/_fix.php` (this folder executes directly, outside front-controller)
3. Delete via FTP: `curl -K ftp_deploy.cfg -Q "DELE public_html/portal_web/api/migrations/_fix.php" "ftp://192.168.10.169/" -s`

DB creds: host `192.168.10.169:3306`, user `dev_app`, pass `Fa0VuwEfJwqLyf2tknj4`, db `app_db`.

---

## PHP Role Names

**NEVER** use lowercase shorthands like `'admin'`, `'comunicacions'`, `'rrhh'`. Copy exact strings from `require_*` functions in `api/auth_middleware.php`.

Real role names: `'Administrador'`, `'Administrador/a'`, `'Comunicacions'`, `'Comunicació'`, `'Recursos humans'`, `'Treballador/a'`, `'Tècnic/a'`, etc.

Wrong names = `user_has_any_role()` always false = silent always-blocked = users treated as no-role.

---

## Key File Locations

| What | Where |
|---|---|
| Main monolith | `src/App.tsx` |
| API helpers | `src/api.ts` |
| AgendaTab | `src/components/tabs/AgendaTab.tsx` ← **live code** (was dead until 2026-06-01 extraction) |
| PHP routes | `api/routes/*.php` |
| PHP auth middleware | `api/auth_middleware.php` |
| Locales | `src/locales/{ca,es,en}.json` |
| SolicitudsTab | inline in `App.tsx` — search `function SolicitudsTab` |
| VeuEmpleatTab | inline in `App.tsx` — search `function VeuEmpleatTab` |
| VacancesInfo | inline in `App.tsx` — search `function VacancesInfo` |
| AgendaTab (was dead) | Old standalone file was overwritten 2026-06-01. Trust `AgendaTab.tsx` now. |
| Admin backoffice | `src/components/admin/AdminBackoffice.tsx` |
| Mobile Més tab | `src/components/mobile/MesTab.tsx` |

---

## i18n Rules

- ca.json = canonical (Catalan values). es + en must have **exact same key set** — always add in all 3.
- Always `grep` existing keys before adding new ones — duplicates break JSON silently.
- Run `i18n-sync` agent after i18n changes to verify parity.
- Namespace pattern: `namespace.camelCaseKey`. Existing namespaces: `common.*`, `nav.*`, `agenda.*`, `campus.*`, `veu.*`, `solicituds.*`, `solicituds.vac*`, `corporate.*`, `directory.*`, `perfil.*`, `adminDash.*`, `adminUsers.*`.
- Interpolation: `t('key', { count: n })` for plurals (`key` + `key_other`), `t('key', { var: val })` for named vars `{{var}}`.

---

## UX / State Patterns

- **Optimistic updates** by default for mutations (toggle, edit, status change). Local state override + rollback on error. Do NOT `refresh()` after every mutation — resets loading state, collapses panes.
- **Sidebar navigation** (`App.tsx` ~line 8593): `SidebarSections` array. Items have `id` = tab name used in `setActiveTab()`.
- **Sub-tab routing from mobile**: colon-separated ID e.g. `'Solicituds:Vacances'` → split in `onNavigate` handler → `setNotifSubTab(sub); setActiveTab(base)`.
- **Portal = sol-drawer CSS pattern** for collapsible processed-items drawers: `data-open` attribute + CSS animation.

---

## Impersonate Feature

- Backend: `api/routes/auth.php` — allowlist `['unaiclapers@tavil.net', 'crmit@tavil.net']` + env var `IMPERSONATE_ENABLED=true`
- Frontend button visible: `is_demo_admin=1` in token — returned when caller email is in same allowlist (same file, `_user_out()`)
- Both users can now impersonate. Re-login required after any auth.php change.

---

## Pending (as of 2026-06-22)

1. **Cron reminder** (`api/routes/cron.php`): implemented but not configured on server. Needs `CRON_SECRET` in `.env` + cron entry. Currently sends to `crmit@tavil.net` only (test mode).
2. **Admin backoffice i18n**: `AdminBackoffice.tsx` + `CreateUserModal.tsx` still largely hardcoded Catalan — admin-only, lower priority.

---

## Agents Available (`.claude/agents/`)

Auto-spawn by task type:
- `tavil-frontend` — React/TS UI work
- `tavil-backend` — PHP api/ work  
- `tavil-ux` — UX/copy consistency
- `tavil-impeccable` — visual polish
- `agenda-specialist` — agenda feature
- `i18n-sync` — audit locale parity after i18n changes
- `php-security-reviewer` — audit PHP before committing

---

## Symptom Cheatsheet

| Symptom | Cause | Fix |
|---|---|---|
| Blank white page after deploy | JS chunk 403 or missing | SITE CHMOD 644 all JS/CSS |
| `530 Access denied` FTP | `!` in password mangled | Use `-K ftp_deploy.cfg` |
| `500` empty body PHP | File is `0600` | SITE CHMOD 644 |
| i18n key shows raw key | Missing in one locale | Add to all 3 locales |
| Admin role check always false | Wrong role string | Copy from `auth_middleware.php` |
| Agenda edits do nothing | Edited dead standalone file | Edit `src/components/tabs/AgendaTab.tsx` |
| Impersonate button missing | `is_demo_admin=0` in token | Check `_user_out()` allowlist in `auth.php:64` |
