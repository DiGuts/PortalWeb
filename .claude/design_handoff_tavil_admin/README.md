# Handoff: TAVIL Portal — Administració (Backoffice)

## Overview

A backoffice / administration area for the TAVIL internal portal. Lives inside the existing portal as a sidebar group named **"Administració"**, visible only to users with the `admin` role. Contains six modules:

1. **Tauler** — admin dashboard with quick actions + module index.
2. **Usuaris** — CRUD for portal accounts: roles, status, directory visibility, password reset, CSV import.
3. **Notícies** — Editorial CMS for articles, with multilingual content (CA/ES/EN), scheduling, segmented audience, image upload.
4. **Activitats** — Internal events with enrolment (capacity bar, dates, locations).
5. **Formacions** — Campus TAVIL course catalogue (instructor, duration, sessions, level).
6. **Agenda** — Corporate events, recurring meetings, attendee tracking.

Each module follows the same pattern: a search/filter toolbar, a row-based table on the left, and a detail panel on the right that opens when a row is selected. The detail panel is the create/edit form.

---

## About the Design Files

The files in this bundle are **design references created in HTML** — an interactive React prototype showing the intended look, behaviour and feature surface. **They are not production code to copy directly.**

The task is to **recreate this design inside the existing `DiGuts/PortalWeb` codebase** (Create React App + TypeScript + Tailwind + i18next + react-router) using its established conventions: Tailwind palette tokens, the existing `src/components/` patterns, the i18next dictionaries under `src/locales/`, the existing router and protected-route patterns, and the existing role / auth context. Open `TAVIL Portal Desktop.html` to interact with the prototype: navigate to the **Administració** group in the sidebar (the entries with the red **ADMIN** tag) and explore each module.

---

## Fidelity

**High-fidelity.** Colors, spacing, radii, statuses, toolbar/table structure, detail-pane layout and field inventory are final. Recreate pixel-perfectly using the codebase's primitives. Where a value isn't expressible with an existing Tailwind class, add it to the Tailwind config under the existing naming scheme rather than inlining.

---

## ⚠️ Critical implementation principles (read first)

### 1. **Preserve the portal's existing server-side style**
The current `DiGuts/PortalWeb` server already has a defined visual style for the **employee-facing** pages (Home / News / Agenda / Directory / Campus / Profile / etc.). **Do not change it.** This handoff only introduces the new **Administració** section; everything else in the portal must keep the look and behaviour it has today. If recreating the admin section requires touching shared primitives (e.g. the sidebar component), keep the existing primitives intact and extend them — never refactor or restyle the rest of the portal as a side-effect of this work.

### 2. **Preserve "Notícia extensa" (the extended news composer)**
The portal already has an existing rich composer for long-form articles called **"Notícia extensa"** (extended news / journal-style articles). It lives in the existing `design_handoff_extended_news_creator/` bundle and **must be kept**. The new **Notícies** admin module is the *list + metadata* layer that sits in front of it — when the user clicks **"Nou article"** or chooses to edit the body of an existing article, the experience must open the existing **Extended News Creator** composer for the body field, not a plain textarea. The textarea in the prototype's detail panel is a placeholder.

Concretely:
- The list view (this handoff) shows title, category, languages, status, last updated.
- The detail panel handles metadata (title, summary, category, audience, scheduling, languages, cover image).
- The **body** of the article must be edited through the existing Extended News Creator. Wire the "Editar contingut" action (or the body field) to push to that composer's route.
- All existing block types of the Extended News Creator (headline, subhead, byline, paragraph, pullquote, list, caption, image, gallery, video, embed, audio, divider, spacer, stat, quote — see `design_handoff_extended_news_creator/README.md`) must continue to be available.

### 3. **Preserve every type of formació the server can currently create**
The current portal supports a defined set of formació types / categories / levels on the server side (e.g. course categories `Comercial`, `Finances`, `Persones`, `Producció`, `Sostenibilitat`; levels `Bàsic`, `Intermedi`, `Avançat`; plus any other course typology, itinerary type or session format already modelled on the server). The new **Formacions** admin module must let an admin **create every existing type** — do not narrow the form to a subset. If the server model has fields beyond what the prototype shows (e.g. itinerary linking, prerequisites, learning objectives, certification, attendance tracking, multi-session schedules, internal vs external instructors), extend the detail panel to cover them. The prototype shows the minimum visible inventory; the implementation must cover the full server inventory.

---

## Access control

The whole Administració section is gated behind a single permission: `user.role === 'admin'`.

- Hide the **Administració** sidebar group entirely for non-admin users (don't render it dimmed).
- Each admin route must also enforce the role server-side. Client-side hiding is only UX; the route guard is the security boundary.
- Existing roles in the system: `empleat` (default), `editor` (can publish news/activities but not manage users), `admin` (full access). The prototype assumes a single admin gate; if the codebase already has finer-grained permissions, map them as:
  - **Tauler** — admin only
  - **Usuaris** — admin only
  - **Notícies / Activitats / Formacions / Agenda** — editor or admin
- The sidebar must show the group header with a small red `ADMIN` pill so it's clear these are privileged actions.

---

## Design Tokens

The admin section reuses the global TAVIL palette (light + dark + accents) but **overrides the typography** to a more corporate / dense register.

### Typography

| Family | Use | Notes |
|---|---|---|
| **Barlow Condensed** | Display (page titles, detail-panel titles, stat numbers, dashboard module labels) | Weight 500, `letter-spacing` near zero, line-height 1–1.1 |
| **Barlow Semi Condensed** | UI, body, buttons, table cells, form fields | Weights 400/500/600 |
| **JetBrains Mono** | IDs, language codes ("CA · ES · EN"), tabular numerals | Existing portal mono — already loaded |

Sizes in admin:

| Token | px | Use |
|---|---|---|
| `admin-display-xl` | 46 | Page H1 (`Usuaris`, `Notícies`, …) |
| `admin-display-md` | 24 | Detail-panel title |
| `admin-display-sm` | 20 | Module-list entry title |
| `admin-display-stat` | 38 | Stat number |
| `body` | 13.5 | Inputs, primary table cells |
| `body-sm` | 13 | Secondary cells, buttons |
| `caption` | 12–12.5 | Meta, hints |
| `micro` | 11–11.5 | Faint metadata |
| `eyebrow` | 10.5 | Section labels (`ADMIN`, field labels) — uppercase, weight 600, `letter-spacing: 0.12–0.14em` |

> **Important:** This typography is the only deviation from the existing portal style. **Apply Barlow only inside the admin section** (use a wrapper class or a route-level layout component). The rest of the portal — Home, News, Agenda, Directory, Profile, etc. — continues to use the existing portal type stack (Instrument Serif / Instrument Sans / JetBrains Mono).

### Colors (light theme — reused from existing palette)

| Token | Value |
|---|---|
| `theme.bg` | `#f7f7f2` |
| `theme.bgAlt` | `#efefe9` |
| `theme.card` | `#ffffff` |
| `theme.text` | `#222725` |
| `theme.textMuted` | `#5d655c` |
| `theme.textFaint` | `#8b948a` |
| `theme.border` | `#e3e2db` |
| `accent.primary` | `#bf211e` (mahogany) |
| `accent.primaryDark` | `#a21b18` |
| `accent.primaryLight` | `#f9eceb` |

**Status colors** (used by status pills, alerts, badges):

| Status | Dot / Text | Background |
|---|---|---|
| `published` / `active` | `#3f7a52` | `rgba(63,122,82,0.10)` |
| `draft` / `pending` / `full` | `#b6833a` | `rgba(182,131,58,0.10)` |
| `scheduled` / `upcoming` | `accent.primaryDark` | `accent.primaryLight` |
| `archived` / `inactive` | `theme.textFaint` / `theme.textMuted` | `theme.bgAlt` |

Dark theme tokens already exist in the portal — reuse them. Status colors lighten ~10% in dark mode.

### Spacing & shape

- Admin page horizontal padding: inherits the existing portal (`0 56px 72px`).
- Card padding: 14–18px (detail blocks), 11–14px (table rows).
- Card radius: 10px (admin cards), 8px (inputs, switches, segmented controls).
- Pill / badge radius: 4px (status, role), 999px (filter pills, audience chips).
- Toolbar height: 56px (search + filter row).
- Input height: 38px (admin) vs 42px (employee-facing) — admin is tighter.

---

## Sidebar integration

The portal sidebar (`DSidebar` in `desktop-shell.jsx`) gains a new group at the bottom:

```js
{ label: 'Administració', isAdmin: true, items: [
  { id: 'admin-dashboard',  icon: 'grid',     label: 'Tauler' },
  { id: 'admin-users',      icon: 'users',    label: 'Usuaris' },
  { id: 'admin-news',       icon: 'news',     label: 'Notícies' },
  { id: 'admin-activities', icon: 'activity', label: 'Activitats' },
  { id: 'admin-campus',     icon: 'campus',   label: 'Formacions' },
  { id: 'admin-agenda',     icon: 'calendar', label: 'Agenda' },
]}
```

The group header is rendered with the accent color and includes a small filled "ADMIN" pill (9.5px, weight 700, `#fff` on `accent.primary`, padding `1–2px × 5–7px`, radius 3px, letter-spacing 0.12–0.14em). Only the header changes — the nav-item style itself is identical to the rest of the sidebar (active state, hover, collapsed state, the accent rail at `left: -12px` when active).

When the sidebar is collapsed, the header is replaced by the standard hairline separator already used between groups; the items themselves stay icon-only.

---

## Routes (suggested)

Mirror the existing router style:

```
/admin                      → redirect to /admin/dashboard
/admin/dashboard            AdminDashboard
/admin/users                AdminUsers
/admin/users/:id            AdminUsers (with row pre-selected)
/admin/news                 AdminNews
/admin/news/new             AdminNews (create flow opens detail panel)
/admin/news/:id             AdminNews (with row pre-selected)
/admin/news/:id/body        ↳ existing Extended News Creator route
/admin/activities           AdminActivities
/admin/activities/:id       AdminActivities (with row pre-selected)
/admin/campus               AdminCampus
/admin/campus/:id           AdminCampus (with row pre-selected)
/admin/agenda               AdminAgenda
/admin/agenda/:id           AdminAgenda (with row pre-selected)
```

Selecting a row should push `:id` into the URL (`history.replaceState`) so the panel survives reload and deep links.

---

## Shared primitives (admin-primitives.jsx)

These are the building blocks every module uses. Recreate them inside `src/components/admin/` (or your equivalent) once, then compose modules from them.

### `<AdminFont>` — wrapper

Applies Barlow Semi Condensed (body) to every descendant. Place at the root of each admin route. Outside this wrapper, the existing portal type stack continues to apply.

### `<AdminHeader>` — page header

Props: `kicker`, `title`, `subtitle`, `actions`, `badge` (default `"ADMIN"`).

Layout: flex row, `align-items: flex-end`, `justify-content: space-between`, gap 24, padding `32 0 22`, margin-bottom 20, `border-bottom: 1px solid theme.border`.

- Kicker row: `display: inline-flex`, gap 8, 11px, weight 600, uppercase, letter-spacing 0.18em, color `theme.textFaint`. Leading ADMIN pill (see colors above).
- Title (h1): Barlow Condensed, **46px**, weight 500, letter-spacing -0.005em, line-height 1, no margin.
- Subtitle: 14px, color `theme.textMuted`, marginTop 10, max-width 620.
- Actions slot (right): flex row gap 8, contains primary + secondary buttons.

### `<AdminToolbar>` — search + filters row

Container: padding 14 16, marginBottom 14, background `theme.card`, 1px `theme.border`, radius 10, flex row gap 10, `align-items: center`, `flex-wrap: wrap`.

Contents typically: `<AdminSearch>` + `<vertical divider 1×22>` + `<AdminFilterPills>` (status) + optionally more filter groups separated by dividers.

### `<AdminSearch>`

Flex 1, min-width 220, max-width 380.
- Input height 36, padding `0 12 0 34`, background `theme.bgAlt`, color `theme.text`, 1px border `theme.border`, radius 8.
- Search icon 15px, color `theme.textFaint`, absolute-positioned at left 12px.
- Font size 13.

### `<AdminFilterPills>`

A row of small pill buttons. Active pill: background `theme.text`, color `theme.bg`. Inactive: transparent, color `theme.textMuted`. Padding 6 12, radius 6, 12.5px weight 500. Optional count badge (11px, opacity 0.6–0.75) right of the label.

### `<ABtn>` — admin button

Smaller than the portal-wide `DBtn`. Variants: `primary` (text on bg invert: `theme.text` bg / `theme.bg` color), `secondary` (`theme.card` bg, 1px border), `ghost` (transparent, muted text), `accent` (mahogany), `danger` (accent border + text, transparent bg).

Sizes: `sm` (h 28, px 10, fs 12), `md` (h 36, px 14, fs 13). Border radius 7. Font weight 600. Includes optional leading/trailing icon (14px).

### `<AStatusPill>` and `<ARolePill>`

Small pill: padding `3 9 3 7` (status, with 6×6 dot) / `2 8` (role, no dot). Radius 4. 11px weight 600 uppercase letter-spacing 0.08–0.1em.

Statuses: `published / draft / scheduled / archived / active / inactive / pending / full / upcoming` — see Color tokens above.

Roles: `admin` (mahogany), `editor` (neutral), `empleat` (outlined).

### `<AdminTable>` — the table

Props: `columns: [{ key, label, width?, align?, render?, wrap? }]`, `rows`, `selectedId`, `onRowClick`, `emptyMessage`.

- Container: background `theme.card`, 1px `theme.border`, radius 10, overflow hidden.
- Header row: padding 11 16, gap 14, background `theme.bgAlt`, 1px bottom border, 10.5px weight 600 uppercase letter-spacing 0.12em, color `theme.textFaint`.
- Body row: padding 12 16, gap 14, 1px bottom border (none on last), 13px color `theme.text`, hover background `theme.bgAlt`, selected background `accent.primaryLight + '66'` (~40% alpha), 3px accent rail on the left edge when selected.
- Click anywhere on the row triggers `onRowClick(id)`.
- Each cell uses `column.render(row)` if provided; otherwise prints `row[column.key]`.
- Each cell defaults to `white-space: nowrap` with truncation + ellipsis.

### `<AdminTwoPane>` — table left, detail right

Grid `1.8fr 1fr`, gap 18, align-items: start. Detail pane is sticky at `top: 90`, `max-height: calc(100vh - 120px)`, scrolls internally.

### `<AdminDetail>` — detail panel

Container: background `theme.card`, 1px `theme.border`, radius 10, flex column, sticky `top: 90`.

- Header: padding 14 16, 1px bottom border, flex row gap 10. Badge (10px weight 600 uppercase accent color) + title (Barlow Condensed, 24px, weight 500). Close × button (28×28, ghost, 16px icon).
- Body: padding 18, flex column gap 16, `overflow-y: auto`.
- Footer (optional): padding 12 16, 1px top border, background `theme.bgAlt`, flex row justify-end gap 8.

### `<AdminDetailEmpty>` — empty state when no row selected

Dashed border, sticky top 90, padding 60 30 centered. 44×44 circular icon badge, label (14px weight 600), hint (12.5px line-height 1.45 textFaint).

### Detail field primitives

- **`<AField label hint optional>`** — wraps a control. Label: 10.5px weight 600 uppercase letter-spacing 0.12em color `theme.textFaint`, marginBottom 6. Optional "opcional" tag (italic, lowercase, no letter-spacing) inline. Hint: 11.5px textFaint, marginTop 5.
- **`<AInput type icon>`** — height 38, padding `0 12` (or `0 12 0 34` with icon), 1px border, radius 8. Focus: border `accent.primary` + box-shadow `0 0 0 3px accent.primaryLight`. Font 13.5.
- **`<ATextarea rows>`** — same focus pattern, padding 12, resize vertical, line-height 1.5, font 13.5.
- **`<ASelect options>`** — native `<select>` styled to match AInput.
- **`<ASegmented value options>`** — pill row, fills width. Container: background `theme.bgAlt`, 1px border, radius 8, padding 3, gap 2. Active button: background `theme.card`, 1px border, subtle shadow. Sizes: `md` (h 32) / `dense` (h 28).
- **`<AToggle value label hint>`** — boxed switch with label + hint inside `theme.bgAlt`. Switch 34×20, ball 16×16, transition `left 180ms`.
- **`<AChipMulti value options>`** — wrap of rounded chips (radius 999, padding 5 11, 12px). Active: `accent.primaryLight` bg + `accent.primary` border. Multi-select.
- **`<ALangTabs value>`** — three tab buttons (CA / ES / EN) with 2px bottom accent underline on the active tab. Label = ISO code + faded language name.
- **`<AImageDrop ratio label hint>`** — dashed border dropzone. On drag-over: accent border + tinted background. Shows `+` icon + label + hint stacked vertically. Wires to file input + drag/drop events.
- **`<AStatCard label value sub tint>`** — used on dashboard. Padding 18, 1px border, radius 10. Value: Barlow Condensed 38, weight 500, tabular numerals.
- **`<AAvatar name size>`** — initials bubble. Background `accent.primaryLight`, color `accent.primaryDark`. Used in user rows (28px) and detail header (48px).

---

## Module: Tauler (Dashboard)

Per spec, **quick actions only** — no global stats grid.

### Layout

1. `<AdminHeader>` with greeting kicker `"Bon dia, {firstName}"`, title `"Tauler d'administració"`, subtitle.
2. Section label "Accions ràpides" (10.5px eyebrow). 12px gap to grid.
3. **Quick actions grid** — 3 columns × 2 rows, gap 12.

   Each card: padding 18, 1px border, radius 10, flex row gap 14, hover state shifts background to `theme.bgAlt` and border to `accent.primary + '55'`.
   - Left: 38×38 icon badge (radius 8, `accent.primaryLight` bg, `accent.primaryDark` icon).
   - Center: title (Barlow Condensed 19, weight 500, line-height 1.1) + sub (12.5, textMuted, marginTop 4).
   - Right: chevron-right 15px textFaint.

   Cards:
   - **Nou usuari** — `users` icon, sub "Crea un compte i envia-li l'accés". Click → `/admin/users` in create mode.
   - **Importa CSV** — `plus` icon (use `upload` if you add it), sub "Alta massiva des d'un fitxer". Click → `/admin/users` in import mode.
   - **Nova notícia** — `news` icon, sub "Publica o programa un article". Click → `/admin/news` in create mode (opens **Extended News Creator** for the body).
   - **Nova activitat** — `activity` icon, sub "Esdeveniment intern amb inscripció". Click → `/admin/activities` create.
   - **Nova formació** — `campus` icon, sub "Curs o itinerari del Campus". Click → `/admin/campus` create.
   - **Nou esdeveniment** — `calendar` icon, sub "Reunió o jornada corporativa". Click → `/admin/agenda` create.

4. Section label "Mòduls". 12px gap.
5. **Modules list** — single card, padding 0, with 5 rows separated by 1px borders. Grid `38px 1fr auto auto`, align-items center, padding 14 18.
   - Icon (38×38, radius 8, `theme.bgAlt` bg, textMuted icon).
   - Title (Barlow Condensed 20, weight 500).
   - Count column: Barlow Condensed 22 weight 500 (tabular) + sub label (11.5 textFaint). E.g. `128 comptes actius`, `42 articles publicats`, etc.
   - chevron-right 15px textFaint.

   Counts come from the server. Modules listed: Usuaris, Notícies, Activitats, Formacions, Agenda.

---

## Module: Usuaris

### Header

Title `"Usuaris"`, subtitle `"Gestiona els comptes del portal, els rols i l'estat d'activació."` Right actions: secondary **"Importa CSV"** + primary **"Nou usuari"**.

### Toolbar

- Search: placeholder `"Cerca per nom, correu, departament…"`. Filters `name`, `email`, `role`, `dept` (case-insensitive substring).
- Vertical divider (1×22).
- Role filter pills: `Tots {n}` / `Admin {n}` / `Editor {n}` / `Empleat {n}` — with counts.
- Vertical divider.
- Status filter pills: `Tots els estats` / `Actius` / `Inactius`.

### Table columns

| Column | Width | Renders |
|---|---|---|
| Usuari | 2fr | 30px avatar + name (weight 600) + email (11.5 textFaint) stacked |
| Departament | 1fr | dept (12.5 textMuted) |
| Rol | 100px | `<ARolePill role>` |
| Estat | 110px | `<AStatusPill status="active|inactive">` |
| Últim accés | 110px, right-aligned | relative time (12 textFaint) |

### Detail panel

Opens on row click. Header shows badge `"USUARI"` + name (Barlow Condensed 24).

Body, in order:

1. **Identity card** (avatar 48 + name 14 weight 600 + role/dept 12 textMuted + ext/office 11.5 textFaint), inside `theme.bgAlt` block, padding 14, 1px border, radius 8.
2. `<AField label="Nom complet"><AInput></AField>`
3. Grid 1fr 1fr: Correu corporatiu (with `mail` icon) + Extensió.
4. Grid 1fr 1fr: Departament (`<ASelect>` with all departments) + Oficina (`<ASelect>` with all sites).
5. `<AField label="Rol del portal" hint="Determina què pot fer aquest usuari a l'admin.">` + `<ASegmented>` with 3 options: Empleat / Editor / Admin.
6. `<AField label="Estat del compte">` + `<ASegmented>` with: Actiu / Inactiu (icons `check` / `close`).
7. `<AToggle label="Visible al directori" hint="L'usuari apareix a Qui és qui.">`
8. **Accions de compte** block (`theme.bgAlt`, 1px border, radius 8, padding 12). Stack of 3 small secondary/danger buttons:
   - **Reenvia invitació** (icon `mail`) — POSTs to `/api/users/:id/resend-invite`.
   - **Resetejar contrasenya** (icon `settings`) — POSTs to `/api/users/:id/reset-password`. Show a toast.
   - **Elimina usuari** (variant `danger`, icon `logout`) — requires confirm dialog. Soft-delete on the server; the row drops to `inactive` until purged.
9. **Read-only metadata** footer: 2-col grid of `Label: value` pairs — ID (mono), Alta, Últim accés, Telèfon.

Footer (sticky): `Tanca` (ghost) + `Desa` (primary, icon `check`).

### CSV import

Triggered by the "Importa CSV" toolbar button. Opens a modal:
- Step 1: drop / pick CSV. Required columns: `name`, `email`, `dept`. Optional: `role` (default `empleat`), `office`, `ext`, `phone`. Show a sample CSV link.
- Step 2: preview parsed rows in a table (max 20 visible, scroll for more). Show validation badges per row (`ok`, `dup-email`, `missing-name`, …).
- Step 3: confirm + "Importa N usuaris" primary button. On success, append rows to the table.
- All-or-nothing import: if any row fails validation, block submission.

### Role permissions

| Capability | Empleat | Editor | Admin |
|---|---|---|---|
| Browse portal | ✓ | ✓ | ✓ |
| Edit own profile fields (the limited ones — see Profile handoff) | ✓ | ✓ | ✓ |
| Create/edit/publish News, Activities, Formacions, Agenda | — | ✓ | ✓ |
| Manage users, change roles, import CSV | — | — | ✓ |
| Access `Tauler` | — | — | ✓ |

---

## Module: Notícies

### Header

Title `"Notícies"`, subtitle `"Crea, programa i publica articles dirigits a tot el portal o a audiències segmentades."` Primary action: **"Nou article"** (icon `plus`).

### Toolbar

- Search: placeholder `"Cerca articles, autors, categoria…"`.
- Status pills: `Tots {n}` / `Publicats {n}` / `Esborrany {n}` / `Programats {n}` / `Arxivats {n}`.

### Table columns

| Column | Width | Renders |
|---|---|---|
| Article | 2.5fr | 44×32 thumbnail (placeholder for prototype; real cover in production) + title (weight 600, truncate) + author (11.5 textFaint) |
| Categoria | 120px | `Empresa / Persones / Esdeveniments / Sostenibilitat` (12 textMuted) |
| Idiomes | 90px | Mono, e.g. `CA · ES · EN` (11, uppercase, letter-spacing 0.05em) |
| Estat | 110px | `<AStatusPill>` |
| Actualitzat | 110px right | relative time (12 textFaint) |

### Detail panel

Header: badge `"ARTICLE"` + title. Body fields, in order:

1. `<ALangTabs value={editorLang}>` + a single info line "Editant la versió CA." (or ES / EN). All fields below are per-language; switching tabs swaps which language version you're editing.
2. **Portada** — `<AImageDrop ratio="16/9" label="Arrossega la portada" hint="Recomanat 1600×900 · JPG / PNG">`. Image is **shared across all languages** (a single asset per article, not localised) unless the editor explicitly attaches a per-language override.
3. **Títol** — `<AInput>` (single line).
4. **Resum** — `<ATextarea rows={2}>`.
5. **Cos de l'article** — In the prototype this is a plain `<ATextarea rows={6}>`. **In production this MUST be the existing Extended News Creator** (see Critical principle #2 above). The detail panel should show either:
   - An inline embed of the composer (preferred if the existing route can be embedded), or
   - A read-only preview + an "Obre l'editor extens" button that navigates to `/admin/news/:id/body` (the existing composer route) and returns the editor to the article when finished.

   The composer must preserve every block type from `design_handoff_extended_news_creator/README.md`. Do not replace the composer; the admin module is the **list + metadata** wrapper around it.
6. Grid 1fr 1fr: **Categoria** (`<ASelect>` with `Empresa / Persones / Esdeveniments / Sostenibilitat`) + **Autor** (`<AInput>`).
7. **Publicació** — `<ASegmented value=status>` with `Esborrany / Programat / Publicat / Arxivat`. When `Programat`, show a `datetime-local` input below for the scheduled publish time. The server is the source of truth; the segmented control is sugar over `status` and `scheduledFor`.
8. **Audiència** — `<AChipMulti>` with options: `Tothom`, departments (`Comercial`, `Finances`, `Persones`, `IT`, `Producció`, `Sostenibilitat`), sites (`Seu central`, `Planta Terrassa`, `Milà`, `Lió`). If empty, defaults back to `Tothom` (= `['all']`).

Footer: `Tanca` (ghost) + `Desa` (primary, `check`). When publishing immediately, swap the primary to **"Publica ara"**.

### Multilingual model

Each article has three language versions (CA / ES / EN). The list-view "Idiomes" column shows which languages have content. Saving creates the per-language record server-side; if a language has no content, hide its tab badge or mark it as missing (faded). Keep the canonical author + category + audience + schedule shared across languages — only title / summary / body / cover-override differ.

---

## Module: Activitats

### Header

Title `"Activitats"`, subtitle `"Esdeveniments interns amb inscripció: cultura, esport, formació, jornades."` Action: **"Nova activitat"**.

### Toolbar

- Search: `"Cerca activitats, categoria, lloc…"`
- Status pills (same as News).

### Table columns

| Column | Width | Renders |
|---|---|---|
| Activitat | 2.5fr | 44×32 thumbnail (`accent.primaryLight` bg + activity icon for placeholder) + title + location |
| Categoria | 110px | `Benestar / Cultura / Esport / Solidari / Familiar` (12 textMuted) |
| Data | 140px | e.g. `23 abr · 13:30` (tabular nums) |
| Aforament | 110px | Inline progress bar (h 4, radius 2) + `12/20` label (11 textFaint, tabular). Bar `accent.primary`, becomes `#b6833a` when full. |
| Estat | 110px | `<AStatusPill>` |

### Detail panel

Header: badge `"ACTIVITAT"` + title. Fields:

1. `<ALangTabs>` + edit-version info.
2. **Imatge de portada** — `<AImageDrop ratio="16/9">`.
3. **Títol** — `<AInput>`.
4. **Descripció** — `<ATextarea rows={4}>`.
5. Grid 1fr 1fr: **Data i hora** (`<AInput icon="clock">`, accept formatted string "23 abr · 13:30" or use a `datetime-local`) + **Categoria** (`<ASelect>`).
6. **Ubicació** — `<AInput icon="mapPin">`.
7. **Aforament** — `<AInput type="number">`. Show `enrolled/capacity` count read-only beside the field once enrolments exist.
8. **Publicació** + **Audiència** — same as News.

Footer: `Tanca` / `Desa`. When the activity is **full**, the "Desa" button stays primary but a small warning badge near the capacity field appears: "S'ha arribat al límit d'inscripcions." When already published, expose a secondary **"Veure inscripcions"** button next to the close button.

---

## Module: Formacions (Campus)

### Header

Title `"Formacions"`, subtitle `"Catàleg del Campus TAVIL: cursos, itineraris i sessions presencials."` Action: **"Nova formació"**.

### ⚠️ Preserve every existing formació type / category / level

The prototype shows a minimal field set. **The production form must expose every type the server currently supports.** Concretely, that means at least:

- All existing **categories**: `Comercial`, `Finances`, `Persones`, `Producció`, `Sostenibilitat` (do not narrow this; add new categories the server supports today).
- All existing **levels**: `Bàsic`, `Intermedi`, `Avançat`.
- All existing **formation kinds** the server can create — if the database has `kind`, `format`, `modality`, `type` or similar discriminator fields (e.g. self-paced course / instructor-led session / itinerary / certification / external training / workshop / e-learning / hybrid), expose them all. **Do not silently drop any kind from the editor.**
- All existing **session formats** (single-session vs multi-session, recurring, calendar-bound vs always-available).
- Any **certification / accreditation** fields the server supports.
- Any **prerequisite linkage** (a course requiring another course to be completed first).
- Any **itinerary** support (a curated sequence of courses).

If the codebase has a `CourseType` enum (or similar), use that enum to drive a `<ASelect>` or `<ASegmented>` at the top of the detail panel called **"Tipus de formació"**. The rest of the fields below should adapt based on the chosen type (e.g. self-paced shows total duration; instructor-led shows session calendar; itinerary shows a list of child courses).

### Toolbar

- Search: `"Cerca cursos, instructor, categoria…"`
- Status pills.

### Table columns

| Column | Width | Renders |
|---|---|---|
| Formació | 2.5fr | 44×32 thumbnail (`theme.bgAlt`, campus icon for placeholder) + title + instructor |
| Categoria | 120px | category (12 textMuted) |
| Nivell | 90px | level |
| Durada | 70px right | e.g. `6 h` (tabular) |
| Sessions | 70px right | number (textFaint) |
| Estat | 110px | `<AStatusPill>` |

In production, consider adding a **Tipus** column if the server has a course-kind discriminator (replace one of the right-aligned columns).

### Detail panel (minimum visible inventory)

Header: badge `"FORMACIÓ"` + title.

1. `<ALangTabs>` + edit-version info.
2. **Portada del curs** — `<AImageDrop ratio="16/9">`.
3. **Títol** — `<AInput>`.
4. **Descripció** — `<ATextarea rows={4}>`.
5. **Tipus de formació** (new — drive from server `CourseType` enum). `<ASelect>` or `<ASegmented>`.
6. Grid 1fr 1fr: **Instructor** (`<AInput icon="profile">`) + **Categoria** (`<ASelect>`).
7. Grid 1fr 1fr 1fr: **Durada** (free text or hours number) + **Sessions** (`<AInput type="number">`) + **Nivell** (`<ASelect>`).
8. **Publicació** + **Audiència** — same as News.

**Production must add** (if the server supports them):
- Session calendar / schedule editor (one row per session with date/time/location).
- Prerequisite picker (multi-select of other courses).
- Certification fields (certifies what, validity period, issuer).
- Itinerary children (when kind = `itinerary`, list child courses).
- Cost / budget code (when applicable).
- Attendance tracking config.

Footer: `Tanca` / `Desa`.

---

## Module: Agenda

### Header

Title `"Agenda"`, subtitle `"Esdeveniments corporatius, reunions destacades i jornades obertes."` Action: **"Nou esdeveniment"**.

### Toolbar

- Search: `"Cerca esdeveniments, lloc, organitzador…"`
- Status pills.

### Table columns

| Column | Width | Renders |
|---|---|---|
| Esdeveniment | 2fr | 4×32 left color rail (per `color` token: `accent` / `olive` / `carbon`) + title (weight 600) + location |
| Dia · Hora | 180px | e.g. `22 abr · 09:30 – 10:30` (tabular) |
| Assist. | 70px right | number (12 textMuted, tabular) |
| Organitzador | 120px | dept / person (textMuted) |
| Estat | 110px | `<AStatusPill>` |

### Detail panel

Header: badge `"ESDEVENIMENT"` + title.

1. `<ALangTabs>` + edit-version info (most agenda events are CA-only).
2. **Títol** — `<AInput>`.
3. **Descripció** — `<ATextarea rows={3}>`.
4. Grid 1fr 1fr: **Data** (`<AInput type="date">`) + **Hora** (`<AInput icon="clock">`, accept "09:30 – 10:30" string).
5. **Ubicació** — `<AInput icon="mapPin">`.
6. Grid 1fr 1fr: **Organitzador** + **Codi de color** (`<ASegmented dense>` with `Marca (accent) / Cultura (olive) / Neutre (carbon)`).
7. **Recurrència** — `<ASelect>` with `Sense repetició / Cada dia / Setmanal / Mensual`. (Add `Personalitzat` if the server supports cron-style recurrence.)
8. **Publicació** + **Audiència** — same as News.

Footer: `Tanca` / `Desa`. Add a tertiary **"Veure assistents"** action that opens a sub-sheet listing attendees (read-only here; attendance is managed via the employee-facing Agenda screen).

---

## Interactions & Behavior

### Selection model

- Clicking a table row selects it: the row highlights (accent-tinted background + 3px left rail) and the detail panel opens.
- Clicking the **×** on the detail panel header closes the panel and clears the selection.
- Clicking a different row swaps the detail panel content in place (no transition needed — the panel content swaps directly).
- The detail panel is **sticky** (`position: sticky; top: 90px`) so it stays visible as the table scrolls.
- Selection state should be reflected in the URL (`/admin/users/:id`) so deep links / refresh preserve the open record.

### Save model

- Edits to fields in the detail panel mutate a local draft. **Nothing persists until the user presses "Desa".**
- "Desa" → PATCH to `/api/<entity>/:id`, update the row in place, show toast "Desat ✓".
- "Tanca" with unsaved changes → confirm dialog: "Tens canvis sense desar. Vols sortir?".
- "Nou X" → opens a blank detail panel in *create* mode; submit calls POST instead of PATCH.

### Status transitions

The status segmented control writes immediately to the draft. On `Desa`, the server validates the transition (e.g. you can't publish without a title, you can't schedule a date in the past). On error, show the validation error inline below the status field and disable "Desa" until resolved.

### Filtering

All filters compose with AND logic. Search filters by substring across the documented fields (case-insensitive). Filters are URL-encoded: `/admin/news?status=draft&q=primavera`.

### CSV import (Users only)

See Users section above. Validation happens client-side first; final validation is server-side. Show a per-row error trail in the preview table.

### Keyboard

- `↑ / ↓` move selection through the visible table rows.
- `Enter` opens the detail panel for the focused row.
- `Esc` closes the detail panel (with unsaved-changes guard).
- `⌘S / Ctrl+S` saves the open record.
- `⌘N / Ctrl+N` opens "New" for the current module.

---

## State management

The prototype keeps everything in `useState`. In production, prefer the codebase's existing pattern:

- **Server state** (lists, individual records) — react-query or equivalent. Each module gets its own list query (paginated, filterable) + per-row detail query.
- **UI state** — local component state for filters, draft fields, search input.
- **Persisted UI state** (sidebar collapsed, theme, last-selected module) — localStorage as already used by the portal.

Optimistic updates are fine for inline field edits (toggling visibility, role) but **must reconcile** on server response (revert on failure with a toast).

---

## Data shapes (suggested)

```ts
type User = {
  id: string;
  name: string;
  email: string;
  role: 'empleat' | 'editor' | 'admin';
  status: 'active' | 'inactive';
  dept: string;
  office: string;
  ext: string;
  phone: string;
  initials: string;
  visibleInDirectory: boolean;
  lastLogin?: string;     // ISO
  joined?: string;        // ISO
};

type NewsArticle = {
  id: string;
  category: 'Empresa' | 'Persones' | 'Esdeveniments' | 'Sostenibilitat';
  author: string;
  audience: string[];                   // ['all'] or dept/site ids
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledFor?: string;                // ISO datetime, when status === 'scheduled'
  coverImageUrl?: string | null;
  content: {
    ca?: { title: string; summary: string; bodyBlocks: ExtendedNewsBlock[] };
    es?: { title: string; summary: string; bodyBlocks: ExtendedNewsBlock[] };
    en?: { title: string; summary: string; bodyBlocks: ExtendedNewsBlock[] };
  };
  createdAt: string; updatedAt: string;
};

// ExtendedNewsBlock is defined by the existing Extended News Creator. DO NOT redefine it.

type Activity = {
  id: string;
  tag: 'Benestar' | 'Cultura' | 'Esport' | 'Solidari' | 'Familiar';
  date: string;            // server-formatted display string
  startsAt: string;        // ISO datetime (source of truth)
  endsAt?: string;
  location: string;
  capacity: number;
  enrolled: number;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  audience: string[];
  cover: string | null;
  content: { ca?: …, es?: …, en?: … };
};

type Formation = {
  id: string;
  kind: string;            // server enum — preserve every value
  category: string;        // server enum
  level: 'Bàsic' | 'Intermedi' | 'Avançat';
  instructor: string;
  duration: string;        // free text or hours
  sessions: number;
  prerequisites?: string[];
  itineraryChildren?: string[];
  certification?: { issuer: string; validForMonths: number } | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  audience: string[];
  cover: string | null;
  content: { ca?: …, es?: …, en?: … };
};

type AgendaEvent = {
  id: string;
  startsAt: string;
  endsAt: string;
  location: string;
  organizer: string;
  attendees: number;       // enrolled count
  color: 'accent' | 'olive' | 'carbon';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | string; // string = RRULE
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  audience: string[];
  content: { ca?: …, es?: …, en?: … };
};
```

---

## API surface (suggested)

```
GET    /api/admin/users?role=&status=&q=&page=
POST   /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id          (soft delete → status:inactive)
POST   /api/admin/users/:id/resend-invite
POST   /api/admin/users/:id/reset-password
POST   /api/admin/users/import       (multipart CSV)

GET    /api/admin/news?status=&q=&page=
POST   /api/admin/news
GET    /api/admin/news/:id
PATCH  /api/admin/news/:id           (metadata only)
PATCH  /api/admin/news/:id/body      (ExtendedNewsBlock[] payload)
POST   /api/admin/news/:id/publish
POST   /api/admin/news/:id/archive

(same pattern for activities, formations, agenda)
```

PATCH endpoints accept partial bodies. Audience is always stored as an array (`['all']` is the sentinel for "no segmentation").

---

## i18n

Every label in the prototype is in Catalan. Route through the existing i18next dictionaries (`src/locales/{ca,es,en}.json`). Add a new top-level group `admin` with sub-keys for each module:

```json
{
  "admin": {
    "groupLabel": "Administració",
    "badge": "ADMIN",
    "dashboard": { "title": "Tauler d'administració", "kickerGreeting": "Bon dia, {firstName}", ... },
    "users": { "title": "Usuaris", "subtitle": "Gestiona els comptes…", "newUser": "Nou usuari", "importCsv": "Importa CSV", "roleAdmin": "Admin", "roleEditor": "Editor", "roleEmpleat": "Empleat", ... },
    "news": { ... }, "activities": { ... }, "campus": { ... }, "agenda": { ... },
    "common": { "save": "Desa", "close": "Tanca", "cancel": "Cancel·la", "search": "Cerca…", "filter": "Filtra", "publish": "Publica ara", "schedule": "Programa", "all": "Tots", "audienceAll": "Tothom", ... }
  }
}
```

Mirror the same keys in `es.json` and `en.json`. The detail panel's **content tabs** (ALangTabs) are independent of the UI language — they always show CA/ES/EN tabs regardless of which UI language is active, because they're editing the content's language, not the chrome.

---

## Accessibility

- Every icon-only button (close ×, more-menu, sidebar toggle) needs `aria-label`.
- Tables: use `<table>` semantics or expose `role="grid"`, `role="row"`, `role="gridcell"`. Each row must be focusable (`tabindex="0"`).
- Filter pills: `role="tablist"` + `role="tab"` with `aria-selected`.
- Status pills are decorative — pair them with text. Never use color alone.
- Detail panel: when it opens, focus moves to the first field. When it closes, focus returns to the originating row.
- Toggle switches: real `<input type="checkbox">` underneath the styled track. Don't fake it with a div.
- Color contrast: every text/background pair must hit WCAG AA. The mahogany-on-white combos are tight — verify the role pill and status pill backgrounds after your final palette is in.

---

## Performance notes

- Tables can grow to 500+ rows (users, news archive). Virtualise above ~50 visible rows.
- Image uploads on the detail panel: compress client-side (`canvas` resize to ≤ 1920px on the long edge, re-encode as WebP) before posting. The existing portal already does this in the Profile avatar flow.
- Detail-panel saves are debounced; "Desa" submits on intent, but field-level updates should not auto-save (the explicit save model avoids surprise publishes).

---

## Files in this bundle

| File | Purpose |
|---|---|
| `TAVIL Portal Desktop.html` | App shell — loads React, Babel, fonts (incl. Barlow Condensed + Semi Condensed), mounts the desktop app |
| `desktop-app.jsx` | Root component — adds the six admin routes to the switch |
| `desktop-shell.jsx` | Contains `DSidebar` with the new **Administració** group (incl. the ADMIN pill) |
| `desktop-transitions.jsx` | Page transitions (unchanged; the recent bugfix lives here — see commit "fix: cleanup cancels rAFs") |
| `desktop-primitives.jsx` | Shared primitives — `DIcon`, `DBtn`, `DCard`, `DAvatar`, etc. The admin primitives compose against these. |
| `admin-primitives.jsx` | **All shared admin building blocks** — `AdminFont`, `AdminHeader`, `AdminToolbar`, `AdminSearch`, `AdminFilterPills`, `ABtn`, `AStatusPill`, `ARolePill`, `AdminTable`, `AdminTwoPane`, `AdminDetail`, `AdminDetailEmpty`, `AField`, `AInput`, `ATextarea`, `ASelect`, `ASegmented`, `AToggle`, `AChipMulti`, `ALangTabs`, `AImageDrop`, `AStatCard`, `AAvatar` |
| `admin-dashboard.jsx` | `AdminDashboard` — quick actions + module list |
| `admin-users.jsx` | `AdminUsers` — list + detail + CSV import scaffold |
| `admin-content.jsx` | `AdminNews`, `AdminActivities`, `AdminCampus`, `AdminAgenda` + shared `useContentModule` hook |
| `tokens.jsx` | Themes, accents, i18n, seed data (the admin modules reuse `TAVIL_DATA.directory / news / activities / courses / agenda`) |
| `desktop-screens-1.jsx`, `desktop-screens-2.jsx` | Existing portal screens (untouched — included so the prototype runs) |

Open `TAVIL Portal Desktop.html` and navigate to the **Administració** sidebar group to interact.

---

## Out of scope for this handoff

- Backend / endpoints (the API surface above is **suggested**, not specified).
- Real CSV parsing (the import flow is UX only).
- Real image upload / processing.
- Real authentication / SSO / role-elevation flows.
- Detailed audit log views (only the action exists — viewing the log is a follow-up).
- The **Extended News Creator composer itself** — already documented in `design_handoff_extended_news_creator/README.md`. This handoff only specifies how to wire into it.
- Mobile-specific layouts for the admin section (the admin is desktop-first; on tablets it should remain usable, but full mobile parity is out of scope).

---

## Summary checklist for the implementing engineer

- [ ] Add the **Administració** sidebar group, role-gated to `admin`, with the red **ADMIN** pill.
- [ ] Apply **Barlow Condensed + Barlow Semi Condensed** **only inside the admin section** — the rest of the portal keeps its current type stack.
- [ ] Build the six modules using the shared admin primitives.
- [ ] Wire the News "body" field to the existing **Extended News Creator** route — preserve every block type.
- [ ] In Formacions, expose **every formació type / category / level / kind** the server currently supports. Do not narrow.
- [ ] Multilingual content (CA/ES/EN) on News / Activities / Formacions; Agenda is CA by default with optional ES/EN.
- [ ] Status workflow: `draft → scheduled → published → archived`. Server validates transitions.
- [ ] Audience segmentation: array of dept + site ids; `['all']` = no segmentation.
- [ ] Server-side role enforcement on every admin endpoint.
- [ ] Preserve the existing portal style on every other page (Home, News reader, Agenda viewer, Directory, Profile, etc.). **Do not restyle the rest of the portal as a side-effect of this work.**
