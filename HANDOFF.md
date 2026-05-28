# TAVIL Portal — Session Handoff

**Date:** 2026-05-27
**Branch:** `feature/remote-backend`
**Last commit:** `78b329f fix(editor): force consistent Enter via execCommand insertLineBreak`
**Working tree:** large uncommitted change set (13 modified files + new files). Nothing committed this session yet.

---

## 1. What this session is about

Two intertwined threads, both in progress on top of the last committed state:

1. **Multi-role refactor** — move user permissions from a single `role` string to a `roles[]` array, with a new, smaller role vocabulary.
2. **`/impeccable` critique remediation** — fixing problems found in the Phase-A audit (`.claude/plans/findings.md`): admin backoffice polish, theming tokens, news editor, profile, accessibility.

Plus several adjacent backend features that landed alongside (avatar self-edit, directory visibility, agenda `time_end`, news translations, media/video upload).

---

## 2. Current state of the app

### Live baseline (from prior sprints, on prod srlnxweb01)
Auth + JWT + force-password-change, role-based backoffice, external courses, quiz/formacions player, agenda (desktop), notifications, campus/catàleg, i18n (ca/es/en). See `memory/project_state_2026_05_12.md` for the full shipped list.

### Backend — DONE this session (uncommitted)

**Multi-role (`api/`)**
- `migrations/2026_05_26_users_roles_multi.php` — adds `users.roles TEXT NOT NULL DEFAULT '[]'`. Keeps single `role` column for back-compat. Initial value `'[]'` for everyone (admin must re-assign).
- `auth_middleware.php` — added `decode_user_roles()` + `user_has_any_role()`. All `require_*` gates now check **both** old `role` strings and new `roles[]`, so old and new vocab both work during transition:
  - `require_admin` → `Administrador` | `Administrador/a`
  - `require_rrhh_or_admin` → + `Sol·licituds` | `Recursos humans`
  - `require_formacions_or_admin` → + `Formacions`
  - `require_comunicacions_or_admin` → + `Comunicació` | `Comunicacions`
  - `require_content_editor` → union of the above
  - `USER_FIELDS` now includes `roles, avatar_url, visible_in_directory`.
- `routes/users.php` — `_cast_user` returns `roles[]`. New `_ALLOWED_NEW_ROLES = [Administrador, Formacions, Comunicació, Sol·licituds, Bàsic]` + `_sanitize_roles_payload()`. POST and PATCH `/api/users` accept and persist `roles`.
- `routes/auth.php` — `_user_out` + `_USER_FIELDS_AUTH` return `roles`, `avatar_url`, `visible_in_directory`.

**Other migrations (uncommitted, NOT YET applied to prod)**
- `2026_05_25_user_extended_fields.php`
- `2026_05_25_users_directory_visibility.php` — `visible_in_directory`
- `2026_05_25_agenda_time_end.php` — `agenda_events.time_end`
- `2026_05_25_news_translations.php` — `news.translations` (JSON)
- `2026_05_26_users_roles_multi.php`

**Feature backend**
- `routes/users.php` — `PATCH /api/users/me` now only allows self-edit of `email_notifs`, `avatar_url`, `visible_in_directory`. All other personal data is admin-managed (name/phone/ext/location/role/dept moved to admin PATCH `/api/users/{id}`).
- `routes/employees.php` — directory query LEFT JOINs `users` for `avatar_url` and filters out `visible_in_directory = 0`.
- `routes/agenda.php` — `time_end` on POST/PUT. On create, notifies all admins (push notif + email if their `email_notifs` on). Fixed an operator-precedence bug in the GET visibility filter (added parens around the `||`/`&&` mix).
- `routes/news.php` — `translations` column read/written on GET/POST/PUT. Dropped `author` from writes (deprecated).
- `routes/upload.php` — accepts **video** (mp4/webm/mov, 50 MB cap) in addition to images (5 MB cap). Image upload now open to any authed user (avatar self-edit); video gated to content editors. Added `GET /api/upload/videos`. Image gallery listing now dedupes by content hash + caches to `.gallery_cache.json` (60 s TTL), invalidated on upload/delete/dedup.
- `routes/debug-mail.php` (new) + registered in `index.php` — mail debugging endpoint. **Review before prod — likely should not ship.**

### Frontend — state

**api.ts — DONE**
- `User` interface gained `roles: string[]`, `avatar_url`, `visible_in_directory`.
- `AdminRole` type + `ADMIN_ROLES = [Administrador, Formacions, Comunicació, Sol·licituds, Bàsic]`.
- `apiUploadMedia()` (image+video, XHR progress), `apiGetVideos()`.
- `apiUpdateMe()` narrowed to `{ email_notifs?, avatar_url?, visible_in_directory? }`.
- News: `NewsTranslations` / `NewsWritePayload` / `pickTranslation()` / `localizeNews()`. `author` deprecated.
- Agenda: `time_end?` on create/update payloads + `AgendaEvent`.
- `Employee.avatar_url?`.

**App.tsx (~1289 lines of diff) — DONE**
- Profile: avatar upload/remove via `apiUpdateMe`, directory-visibility toggle (`visible_in_directory`), hero cover band + overlapping avatar. Personal data now read-only (admin-managed).
- Employee directory: renders `avatar_url` with initials fallback.
- Agenda: shows `time_end` ("HH–HH") across views; create/edit forms send `time_end`.
- Imports new `MediaUploader` + shared `ConfirmModal` (`ConfirmDialog.tsx`).
- Glass header system (`header-glass` / `header-anchored` / `header-glass-dark`) — see index.css.

**index.css — DONE**
- ~253 added lines: glass-header classes (GPU-composited, backdrop-filter static, only transform/opacity animated), hg-text/hg-search states for light+dark.

**New components — present**
- `components/MediaUploader.tsx`, `components/ConfirmDialog.tsx`
- `components/admin/`: `primitives.tsx`, `AdminBackoffice.tsx`, `ImageGalleryPicker.tsx`, and Create*Modal set (User/News/Notice/Agenda/Activity/ExternalCourse).

### Frontend — NOT DONE (the gap)

Multi-role UI is **not wired**. Backend accepts `roles[]` but the UI still edits a single `role` with the **old** vocabulary:
- `apiAdminCreateUser` / `apiAdminUpdateUser` signatures lack `roles?: string[]`.
- `CreateUserModal.tsx` — single `ASelect`, old `ROLE_OPTIONS` (`Treballador/a`, `Recursos humans`, …). Does not send `roles`.
- `AdminBackoffice.tsx` — detail panel single role `ASelect` (line ~424); old `ROLE_OPTIONS` (line ~202); `mapServerRoleToPill` + `modulesForRole` key on old strings.
- App.tsx sidebar/module gating presumed to use old `role` strings (not yet audited).

---

## 3. `/impeccable` findings status (`.claude/plans/findings.md`)

| Finding | Sev | Status |
|---|---|---|
| Extract AdminBackoffice primitives | P1 | ✅ `primitives.tsx` exists |
| AdminNews wire title/summary/category to draft+Save | P1 | ✅ langDraft + translations editor |
| AdminUsers empty state on 0 filter results | P2 | ✅ "Esborra filtres" |
| Inline rgba status colors → tokens | P1 | ⚠️ partial — verify dark variants in index.css |
| News autosave (debounced 5s) | P1 | ❓ unverified |
| Tile drag-and-drop keyboard a11y | P1 | ❓ unverified |
| Direct cover upload from row (MediaUploader inline) | P1 | likely addressed via MediaUploader — verify |
| Tauler bento (break 3×2 grid) | P2 | ❓ |
| `prefers-reduced-motion` global coverage | P2 | ❓ |
| i18n lift for admin section | P2 | ❌ still hard-coded Catalan |
| Banner image compress to WebP | P3 | ❌ (`public/perfil-banner.png` added) |

---

## 4. Plan (recommended order)

**A. Finish multi-role frontend** (backend already done — close the loop)
1. Add `roles?: string[]` to `apiAdminCreateUser` + `apiAdminUpdateUser` in api.ts.
2. `CreateUserModal` — replace single role select with multi-select chips over `ADMIN_ROLES`; send `roles` (+ derive a primary `role` for back-compat).
3. `AdminBackoffice` detail — same multi-select; `save()` send `roles`.
4. Rewrite `mapServerRoleToPill` + `modulesForRole` against new role keys (support both during transition).
5. Audit App.tsx sidebar/module gating; switch to a `userHasRole()` helper checking `roles[]` with old-string fallback.
6. Decide pill vocabulary (3 buckets admin/editor/empleat vs 5 new roles) — pick one, align filters + counts.

**B. Remaining `/impeccable` P1s**
- Verify/implement news autosave + toast.
- Verify/implement keyboard tile move (WCAG 2.1.1).
- Confirm status color tokens have dark variants.

**C. Cleanup before any commit / deploy**
- Decide fate of `routes/debug-mail.php` (probably drop).
- Compress `perfil-banner.png` → WebP.
- Group the large diff into logical commits (backend roles / backend features / frontend profile / frontend admin / css).
- Migrations to run on prod (manual, not yet applied): all 5 `2026_05_25_*` + `2026_05_26_users_roles_multi.php`.

---

## 5. Constraints / gotchas

- **No auto-deploy.** User runs live demos; never FTP-push to srlnxweb01 unless explicitly asked (`memory/feedback_no_auto_deploy.md`).
- Prod uses the **PHP** backend (`api/`), not Python (`memory/project_php_deploy.md`).
- Prod MariaDB: `192.168.10.168:3306`, db `app_db`, user `dev_app`. Migrations are run manually by the user (or via pymysql on request).
- Back-compat is intentional: gates accept both old role strings and new `roles[]`. Don't remove the old `role` column.
- Main component `src/App.tsx` is ~9900+ lines; admin logic lives in `src/components/admin/`.

---

## 6. Open decisions for the user

1. Role pills — keep 3-bucket (admin/editor/empleat) or show all 5 new roles?
2. Ship `debug-mail.php`? (recommend no)
3. Commit strategy — one big commit or split into the logical chunks in §4C?
