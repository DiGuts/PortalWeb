# Handoff: TAVIL Portal — Mobile Web

## Overview

A responsive mobile-web redesign of TAVIL's internal employee portal (React CRA app at `DiGuts/PortalWeb`, branch `feature/mobileLayout`). Covers the full mobile flow: authentication (login / register / email verification / forgot password), the main tabbed app (Home / News / Agenda / Directory / More), and every pushed screen reachable from those tabs (News detail, Activities, Who-is-who, Employee Voice, Personal Requests, Profile, Notifications center, Campus TAVIL training, Espai corporatiu documents).

Target viewport: ~390×844 px (iPhone-class). All layouts are fluid and work down to ~340 px width. The portal is Catalan-first with Spanish and English translations; all copy flows through an i18n dictionary that mirrors the existing `src/locales/` structure in the repo.

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive prototypes that show intended look, layout, copy, and behavior. **They are not production code to copy directly.**

The task is to **recreate these HTML designs inside the existing `DiGuts/PortalWeb` React codebase** (Create React App + TypeScript + Tailwind 3 + i18next + react-router + sql.js + dnd-kit). Reuse the app's established patterns: the Tailwind `theme.extend.colors` palette (porcelain / dusty-olive / mahogany / carbon / ink), the i18next JSON dictionaries, the existing dark-mode `darkMode: 'class'` toggle, the `src/components/` folder conventions, and the existing router structure.

Do **not** bring in Instrument Serif, Instrument Sans, or JetBrains Mono as net-new fonts unless the team wants to adopt them — the mocks use them to illustrate a distinct editorial tone. If the codebase already standardises on a different stack (the repo currently has no committed font decision), swap in the house fonts and keep the **type hierarchy** (serif display + sans UI + mono for codes/metadata) rather than the specific families.

## Fidelity

**High-fidelity.** All colors, spacing, type sizes, border radii, shadows, animation durations and copy are final. The developer should recreate the UI pixel-perfectly. Where a Tailwind class maps cleanly to a used value, prefer Tailwind; where a one-off value is used (e.g. an `oklch` accent tint), add it to the Tailwind config under the existing naming scheme rather than inline.

## Source Files In This Bundle

| File | Role |
|---|---|
| `TAVIL Portal Mobile.html` | Host page for the full interactive prototype. Scales a 390×844 phone frame to viewport. |
| `TAVIL Mobile — Design Canvas.html` | Side-by-side canvas of all 29 screen variants (light, dark, accents, languages). |
| `tokens.jsx` | Design tokens: palette, themes (light/dark), accent variants, i18n dictionaries, seed data. |
| `primitives.jsx` | Shared primitives: `PhoneFrame`, `AppCtx`, `Icon`, `Btn`, `Card`, `Badge`, `Input`, `Textarea`, `Field`, `AppHeader`, `ImgPh` (image placeholder). |
| `screens-core.jsx` | Shell + core screens: `TabBar`, `Drawer`, `LoginScreen`, `RegisterScreen`, `VerifyScreen`, `HomeScreen`, `NewsScreen`, `NewsDetailScreen`, `LangSwitch`. |
| `screens-more.jsx` | Secondary screens: `AgendaScreen`, `ActivitiesScreen`, `DirectoryScreen`, `VoiceScreen`, `RequestsScreen`, `ProfileScreen`, `MoreScreen`, `CampusScreen`, `EspaiScreen`, `NotificationsScreen`, `ForgotScreen`, plus `Sheet`, `SettingsGroup`, `SettingsRow`. |
| `app.jsx` | Router/shell: manages `screen` (login / register / verify / forgot / app), tab state, push stack, drawer, theme/accent/lang tweaks, and page-transition animations. |

Open `TAVIL Portal Mobile.html` for the interactive prototype and `TAVIL Mobile — Design Canvas.html` for the screens map.

---

## Design Tokens

### Color palette (from existing `tailwind.config.js` — already in the repo)

```
porcelain-50   #faf9f6     light app bg
porcelain-100  #f0eee9     card bg / soft divider bg
porcelain-200  #e3e2db     borders, hairlines
porcelain-300  #d2d0c6     stronger borders
dusty-olive    #7a8a6b     success / positive accent
mahogany-600   #bf211e     primary accent (default)
mahogany-500   #d63a37
mahogany-100   #fbe4e3     primary-tint / unread-row bg
carbon-900     #1a1d1c     dark mode bg
carbon-800     #22272530   dark mode card bg
carbon-700     #2f3432     dark mode borders
ink-900        #222725     primary text
ink-700        #4a5250     muted text
ink-500        #7d8683     faint text
```

### Light theme (composed from palette)

```
bg         #faf9f6      (porcelain-50)
bgAlt      #f0eee9      (porcelain-100)
card       #ffffff
border     #e3e2db      (porcelain-200)
borderSoft #eeece6
text       #222725      (ink-900)
textMuted  #4a5250      (ink-700)
textFaint  #7d8683      (ink-500)
olive      #7a8a6b      (dusty-olive — success)
```

### Dark theme

```
bg         #1a1d1c      (carbon-900)
bgAlt      #22272530
card       #23282630
border     #2f3432      (carbon-700)
borderSoft #282c2a
text       #f0eee9      (porcelain-100)
textMuted  #b7bbb8
textFaint  #7d8683
olive      #9aad87      (dimmed)
```

### Accent variants (all in the red/earth family — toggleable via Tweaks)

```
mahogany    primary #bf211e  light #fbe4e3  ring #d63a37   (default)
terracotta  primary #c2532a  light #fbe7dd  ring #d66d46
oxblood     primary #8a2623  light #eadad9  ring #a03936
clay        primary #b55139  light #f5e1d9  ring #c66e4f
```

For dark mode the primary is lightened ~10% and the `light` tint is composited at ~18% alpha over the card color.

### Typography

- **Display / serif** — Instrument Serif, 400 regular / 400 italic. Used for page titles (H1), featured card titles, large numeric stats. `letter-spacing: -0.02em` at ≥28 px, `-0.01em` at 20-27 px, `0` below. `line-height: 1.02-1.1`. Use `text-wrap: balance` on multi-line titles.
- **UI / sans** — Instrument Sans, 400 / 500 / 600 / 700. Body, buttons, labels, inputs, nav.
- **Mono** — JetBrains Mono, 400 / 500. Verification code slots, format hints (`E2A76B29`), file extensions in doc rows, `font-feature-settings: "tnum"` on any counter/timestamp column.

### Scale

| Token | px | Use |
|---|---|---|
| display-xl | 40 | Login title |
| display-lg | 36 | Register title |
| display-md | 32 | Section / screen titles |
| display-sm | 26-28 | Featured card / sheet titles |
| title | 22 | Large card titles |
| body-lg | 15 | Primary body |
| body | 14 | Secondary body |
| body-sm | 13 | Meta / form labels |
| caption | 12 | Card labels |
| micro | 11-11.5 | Tab labels, faint metadata |
| eyebrow | 10.5 | `UPPERCASE`, `letter-spacing: 0.14em`, primary-accent color — appears above every screen title |

### Spacing & shape

- Page horizontal padding: 20 px (most screens), 24 px (auth screens).
- Card padding: 14-16 px (list cards), 18-24 px (featured cards).
- Gap between stacked cards: 10 px.
- Card radius: 14 px (list), 15-16 px (featured), 12 px (inputs), 18 px (phone inner content).
- Button radius: 12 px (standard), 999 px (chips / pills / icon buttons).
- Phone frame: 44 px outer radius, 34 px inner content radius, 10 px bezel, notch 110×30 px.
- Hairline dividers: 1 px solid `border` color; never use `box-shadow` as a substitute for a border.

### Shadows

- Phone: `0 1px 2px rgba(34,39,37,.06), 0 20px 50px -18px rgba(34,39,37,.28), 0 0 0 1px #e3e2db`
- Featured cards: **none** — rely on 1 px border. Avoid heavy card shadows; the palette is hairline-driven.
- Sheets: `0 -8px 32px -12px rgba(34,39,37,.18)` on the top edge only.

### Motion

```
push-right  380ms cubic-bezier(.23,1,.32,1)   new screen slides in from right, previous fades 28% left
push-left   same curve, mirrored              for back navigation
tab-change  260ms cubic-bezier(.4,0,.2,1)     cross-fade + 12 px horizontal parallax
sheet-up    320ms cubic-bezier(.23,1,.32,1)   bottom sheet, overshoot 2 px
drawer      280ms ease-out                    backdrop 200ms fade
badge-dot   no animation                      static 8 px unread marker
progress    400ms ease-out                    width transition on course bars
```

Respect `prefers-reduced-motion`: collapse all transitions to ≤ 50 ms and disable the parallax.

---

## Screens / Views

### 01. Login · `/login`

**Purpose** — Corporate sign-in.

**Layout** — Single-column, top-aligned. 20 px top / 24 px sides / 32 px bottom padding.

**Anatomy (top → bottom)**

1. Top row (60 px below): 36×36 mahogany square logo "T" on the left, inline language switch (CA / ES / EN pills) on the right.
2. Eyebrow: `PORTAL INTERN` — 10.5 px, `letter-spacing: 0.14em`, primary accent color, 12 px bottom margin.
3. H1: "Portal intern TAVIL" — Instrument Serif, 40 px, weight 400, `letter-spacing: -0.02em`, `line-height: 1.02`. 8 px bottom margin.
4. Subtitle: "Entra amb el teu compte corporatiu" — 15 px, `textMuted`, `line-height: 1.4`. 36 px bottom margin.
5. Email field (label above, `mail` icon inside, 48 px tall, 12 px radius, 1 px `border`, placeholder "nom.cognom@tavil.com").
6. Password field (same treatment, no icon).
7. "Has oblidat la contrasenya?" — right-aligned text button, 13 px, primary accent. → pushes `ForgotScreen`.
8. Primary button "Inicia sessió" — full-width, 48 px tall, primary accent bg, `#fff` text, 12 px radius.
9. Flex-grow spacer.
10. Registration prompt: centered row, 13.5 px. "Encara no tens compte? **Crear compte**" (the action is a text button in primary accent, weight 600). → pushes `RegisterScreen`.
11. Footer: `TAVIL · v2026.4 · support@tavil.com` — 11 px, `textFaint`, center.

**Removed from the repo's current design:** the "Inici de sessió únic" (SSO) button and the `o continua amb` divider.

### 01b. Register · `/register`

**Purpose** — New-account enrolment step 1 of 2.

**Anatomy**

1. 40×40 circular back-button (`card` bg, 1 px border, `chevronLeft` icon) on the left, language switch on the right.
2. Step indicator: two 3 px bars side-by-side with 6 px gap — first bar primary accent, second bar `border` color.
3. Eyebrow: `PAS 1 DE 2`.
4. H1: "Crea el teu compte" — 36 px Instrument Serif.
5. Subtitle: "Uneix-te al portal intern TAVIL".
6. Fields (each with label above, hint below where shown):
   - `Nom complet` — profile icon, placeholder "Nom i cognoms".
   - `Correu electrònic` — mail icon.
   - `Contrasenya` — hint "Mínim 6 caràcters" (turns into a live strength label once typing starts). Below the input: a 4-segment strength meter, 3 px tall, 3 px gap. Strength 1 `#c87158`, 2 `#b6833a`, 3 `#7a8a6b`, 4 `#3f7a52`. Formula: +1 each for len≥6, len≥10, has uppercase, has digit, has symbol (cap 4).
   - `Confirma la contrasenya` — shows error text "Les contrasenyes no coincideixen" in primary accent when `confirm && pass !== confirm`.
7. Flex spacer.
8. Primary button "Continua" with right `arrowRight` icon. Disabled until all fields valid and passwords match.

### 01c. Email verification · `/register/verify`

**Purpose** — Confirm ownership of the address entered in step 1.

**Anatomy**

1. Back-button + language switch (back returns to Register, preserving form).
2. Step indicator: both bars primary accent.
3. Eyebrow: `PAS 2 DE 2`. H1: "Verifica el teu correu" — 34 px.
4. Subtitle: "Hem enviat un codi de 8 caràcters a **{email}**" (email in primary text color, weight 500).
5. Code entry:
   - Label "Codi de verificació" (13 px, weight 500).
   - 8 input slots side-by-side, 34×48 each, 10 px radius, `space-between`. Each accepts a single uppercase hex character (`[0-9A-F]`). On focus: border primary accent, `box-shadow: 0 0 0 3px primaryLight80`. Auto-advance to next slot on input; backspace on empty slot goes back; ArrowLeft / ArrowRight move focus; paste distributes across slots.
   - Font inside slot: JetBrains Mono, 19 px, weight 500, `text-transform: uppercase`.
   - Format hint below: `Format: 8 car. hex · e.g. E2A76B29` — 11.5 px mono, `textFaint`.
6. Resend row: "No l'has rebut? **Tornar a enviar el codi**" (button in primary accent, 600). Shows "✓ Codi reenviat" in olive once tapped.
7. Flex spacer.
8. Primary button "Inicia sessió" — disabled until all 8 slots filled. On click, calls `onVerified(code)` and transitions to `app` / Home.

### 01d. Forgot password · `/forgot`

**Purpose** — Request a reset link.

Two states in one screen:

**State A (entry)** — Eyebrow `RECUPERACIÓ`, H1 "Restableix la contrasenya" (32 px), subtitle explains the flow, single email field, primary button "Envia l'enllaç" disabled until `email.includes('@')`.

**State B (sent)** — Replaces the body with a centered 72×72 circular icon badge (`primaryLight` bg, `mail` icon, primary accent color), H1 "Revisa la safata" (28 px Serif), body "Hem enviat un enllaç de recuperació a **{email}**. Caduca en 30 minuts." (14 px, `max-width: 260 px`), primary button "Tornar a l'accés" that calls `onBack`.

### 02. Home / dashboard · `/` (tab: home)

**Purpose** — Landing after sign-in.

**Anatomy (top → bottom)**

1. 48 px header: 40×40 drawer button (`menu` icon, circle), centered logo lockup (6 px mahogany square + "TAVIL" wordmark in Instrument Sans 700), 40×40 bell button with 8 px unread dot in primary accent, 2 px `card`-colored ring. → pushes `NotificationsScreen`.
2. Greeting: "Bon dia," (13 px, `textMuted`) / "**{firstName}**" (Instrument Serif 32 px, `-0.02em`). Different verbs per time of day (`Bon dia` / `Bona tarda` / `Bona nit`).
3. Urgent notice strip (only if `data.urgent`): primary-tinted card, eyebrow `AVÍS URGENT` in primary accent, title, and a dismiss (`×`) button.
4. Latest news row: eyebrow + "Veure tot →" button. Horizontal scroll rail of 240 px news cards, 12 px gap, `scroll-snap-type: x mandatory`. Each card: 16:10 image placeholder on top, padding 14, category badge, title (15 px, weight 600, clamp 2 lines), date+min-read row (11 px, `textFaint`).
5. Upcoming agenda: eyebrow, vertical list of 2-3 event rows. Each row: 56 px wide month+day chip (`card` bg, 1 px border, month in 10 px `textFaint` uppercase, day in 22 px Serif), title (14 px, weight 600), time+room (12 px, `textMuted`, with `clock` and `mapPin` 11 px icons).
6. Quick access: eyebrow + 2×3 grid of action cards (Campus, Espai, Activitats, Veu empleat, Sol·licituds, Directori). Each card: 40×40 tinted rounded square (`primaryLight` bg, primary accent icon), title 13.5 px weight 600, subtitle 11.5 px `textFaint`, 14 px padding, 14 px radius.
7. Bottom tab bar (see "TabBar" below).

### 02b. Notifications center · pushed from Home bell

1. `AppHeader` with "Notificacions" title, `onBack` to Home, trailing text button "Marca-ho tot" (only when `unread > 0`).
2. Eyebrow `ACTIVITAT`, H1 "Notificacions" (32 px), subtitle: "Tens **{n} sense llegir**." or "Estàs al dia.".
3. Grouped list: "AVUI" (items with time containing `h`) and "ABANS" (everything else). Section header 11 px uppercase `textFaint` in 24 px inset.
4. List container: single `card` panel with 14 px radius; rows separated by 1 px hairlines, no bottom hairline on the last row.
5. Each row: 36×36 circular icon badge (unread: primary accent bg, white icon; read: `bgAlt` bg, `textMuted` icon). Icon picked by type: `news | requests | agenda | voice | bell`. Title 14 px (weight 600 if unread, else 500), right-aligned timestamp 11 px tnum. Body 12.5 px `textMuted`. From-line 11 px `textFaint`. Unread rows have `primaryLight + '55'` bg and a 7 px primary accent dot on the right.
6. Empty state: bell icon 30% opacity, "No hi ha notificacions" 14 px.

### 03. News feed · tab: news

1. `AppHeader` with drawer + "Notícies".
2. Eyebrow `COMUNICACIÓ`, H1 "Notícies" (32 px), subtitle.
3. Featured article (first item): full-width card, 16:9 image placeholder, gradient fade at bottom, category badge + date overlaid, H2 22 px Serif.
4. Category filter pills row (horizontal scroll, `hide-sb`): `Tot` / `Empresa` / `Persones` / `Esdeveniments` / `Sostenibilitat` — 7×14 padding, 999 px radius, 12.5 px, selected state = `text` bg / `bg` fg.
5. Vertical list of article cards: 96×96 image placeholder left, content right. Title 14.5 px weight 600 clamp 2, meta row (category badge + min-read).
6. Tapping any card pushes `NewsDetailScreen` with that id.

### 04. News detail · pushed

1. `AppHeader` with back + share button (`share` icon).
2. Hero image: full-width, 16:10 ratio, no rounding.
3. Body padding 20 px: category badge, H1 Serif 28-32 px, author row (24 px circle avatar, name 13 px weight 600, date 11 px `textFaint`), body paragraphs 15 px, `line-height: 1.55`.
4. **Swipe navigation**: on touchend with `|deltaX| > 60 px`, move to previous/next article. Edge-rubber-band animation when at either end. Also wire left/right arrow keys for desktop.
5. Footer: 1 px top hairline + "Article següent →" preview row.

### 05. Calendar / agenda · tab: agenda

1. `AppHeader` with drawer + "Agenda" + `calendar` icon toggle between month and list views.
2. Month view: 7-column grid, day cells 40 px square, current day outlined in primary accent (2 px), days with events have a 4 px dot under the number. Muted days for adjacent months.
3. Selected day detail below: eyebrow "{weekday} {day} {month}", list of 2-4 event cards. Each card: 4 px left accent bar (primary or olive), title 15 px weight 600, time row 12 px `textMuted` with `clock` icon, location row with `mapPin`, attendee avatars (3 overlapping 20 px circles + "+{n}" chip).
4. "Afegeix a Outlook" link at bottom, subtle.

### 06. Who is who · tab: directory

1. `AppHeader` with drawer + "Qui és qui" + `filter` icon.
2. Search field (magnifying-glass icon) placeholder "Cerca persones, departaments…".
3. Recent / favourites rail: horizontal scroll of 64 px circular avatars with name underneath (11 px clamp 1).
4. Alphabetically grouped list: section labels (A, B, C…) in `textFaint` 11 px uppercase, 24 px inset.
5. Person row: 44 px avatar, name 14 px weight 600, role+dept 12 px `textMuted`, right-side 32×32 icon buttons (`mail`, `phone`) spaced 4 px apart.
6. Tapping a row opens a bottom sheet with full profile (photo, name, role, dept, location, extensions, direct chat link).

### 07. Activities · pushed from quick-access

1. `AppHeader` back + "Activitats".
2. Featured banner: 16:8 image, H1 Serif overlay.
3. Filter pills: `Tot` / `Esport` / `Familiar` / `Formació` / `Solidari`.
4. Grid of 2-column activity cards: 1:1 image, 14 px padding under, category badge, title 14 px weight 600, date+place 11.5 px, capacity bar (thin 2 px, primary accent) with "12/30 places" label.
5. Tapping a card opens enrolment sheet: description body, "Inscriure'm" primary button, confirmation state swaps to ✓ and "Inscripció confirmada · 12 maig · 18:30".

### 08. Employee voice · pushed

1. `AppHeader` back + "Veu de l'empleat".
2. Eyebrow + H1 "Veu de l'empleat" + subtitle.
3. Two primary action cards (full-width, 14 px padding, 14 px radius, 1 px border):
   - "Nou suggeriment" — `lightbulb` icon, 60 px height, ends with `chevronRight`.
   - "Nova incidència" — `alert` icon, olive-accent left 4 px bar.
4. Tabs (pill switcher): "Suggeriments" / "Incidències" / "Enquestes".
5. List of items for the active tab. Suggestion: status badge (`Nou` / `En revisió` / `Aprovada` / `Rebutjada`), title 14 px weight 600, body 12.5 px `textMuted` clamp 2, votes count row with `arrowUp` / `arrowDown` buttons, comments count with `message` icon.
6. "Nou suggeriment" / "Nova incidència" open a bottom sheet form: `Títol` input, `Categoria` select, `Descripció` textarea (4 rows), attachment button (`paperclip`, opens native file picker), "Envia suggeriment" primary button. Success state replaces form with ✓ icon + "S'ha enviat · El rebràs a la teva bústia" + "Tornar" button.

### 09. Personal requests · pushed

1. `AppHeader` back + "Sol·licituds personals".
2. Eyebrow + H1 + subtitle.
3. Status chips at top: "Pendents · 2" (primary accent bg), "En curs · 1" (olive), "Tancades · 8" (`textFaint`).
4. Primary button "Nova sol·licitud" full-width with `plus` icon.
5. List of request rows: type icon (44×44 rounded tinted), title 14 px weight 600 ("Vacances 12 maig", "Canvi de torn", "Certificat d'empresa"), status badge, date 11.5 px `textFaint`, right chevron.
6. "Nova sol·licitud" sheet: segmented selector at top (6 request types, 2 columns of icon+label tiles), dynamic form below (date range picker for vacations, free text for certificates, select+textarea for shift swap), `Comentaris` textarea, "Envia sol·licitud" primary button.

### 10. Profile · pushed from More

1. `AppHeader` back + "Perfil".
2. Hero: centred 88 px avatar, name Serif 28 px, role 14 px `textMuted`, dept+location row 13 px.
3. `SettingsGroup` "Dades personals": SettingsRow rows — Email, Telèfon, Extensió, Data d'alta. Each row: 40×40 tinted icon left, label+value stack (label 12 px `textFaint` above, value 14 px `text`), optional `chevronRight` on the right when editable.
4. `SettingsGroup` "Preferències": dark-mode toggle, language select, notification toggles (3 switches: Notícies, Esdeveniments, Sol·licituds).
5. `SettingsGroup` "Compte": "Canvia la contrasenya" row, "Política de privacitat" row, destructive "Tanca sessió" row (primary accent text, no icon).

### 11. More (nav shell) · tab: more

A mirror of the drawer but as a dedicated tab. Groups: **General** (Inici, Notícies, Notificacions, Agenda, Directori), **Empresa** (Campus TAVIL, Espai corporatiu, Activitats), **Personal** (Veu de l'empleat, Sol·licituds, Perfil). Each row: 40×40 icon square left, title 14.5 px weight 600, optional 11.5 px `textFaint` sub, right chevron. Section headers: 11 px uppercase `textFaint`, 24 px inset.

Footer: logout row in primary accent + app version string `v2026.4` centered 11 px `textFaint`.

### 12. Campus TAVIL (training) · pushed

1. `AppHeader` back + "Campus TAVIL".
2. Eyebrow `FORMACIÓ`, H1 "Campus TAVIL" 32 px, subtitle "Cursos i itineraris interns…".
3. 3-stat grid (3 equal columns, 12 px padding, centered): `inProgress` count (primary accent Serif 26 px), `completed` count (olive), "31h aquest any" (text). Each stat has a 10.5 px `textMuted` label underneath.
4. Continue-where-you-left-off (if any in-progress): one featured card, 16:7 image placeholder, 16 px body with badge + Serif 22 px title + 5 px progress bar + "Continuar" button.
5. Category pills: `Tot` / `Comercial` / `Finances` / `Persones` / `Producció` / `Sostenibilitat`.
6. Course list: each card 14 px padding, badge row (category in olive + optional `Nou` / `Completat`), title 15 px weight 600, meta row (instructor with `profile` icon / duration with `clock` icon / `★ rating`), progress bar only for in-progress courses.
7. Tap opens a detail sheet: 16:7 image, badges, Serif 26 px title, meta line, primary button "Començar curs" or "Continuar".

### 13. Espai corporatiu (documents) · pushed

1. `AppHeader` back + "Espai corporatiu".
2. Eyebrow `EMPRESA`, H1, subtitle "Documents, procediments i recursos corporatius.".
3. Search field (magnifying-glass icon).
4. "ENLLAÇOS RÀPIDS" section: 2-column grid of 4 link cards. Each card: 34×34 tinted icon square, title 13.5 px weight 600, subtitle 11.5 px `textFaint`.
5. Document groups (by `section` field): section header in 11 px `textFaint` uppercase at 24 px inset. Each group is a single `card`-colored panel with 14 px radius and 1 px hairlines between rows. Row: 40×48 format badge (`bgAlt` bg, 1 px border, primary-accent 9 px mono text — "PDF" / "PPTX"), title 14 px weight 600 truncate, meta row 11.5 px `textFaint` ("{size} · Actualitzat {date}"), optional `NEW` badge inline with title, right chevron.
6. Tapping a row would open the document (out of scope for the prototype).

---

## Global components

### `PhoneFrame` (prototype-only)

Device bezel used to present screens in both the prototype and design canvas. Scales to viewport inside a `phone-wrap` flex container. Inner content area is `width × (height - 44)` (44 px reserved for status bar). **Do not port to production** — a real mobile web app fills the viewport.

### `AppCtx` (React context)

Provides `{ theme, accent, t, user, lang, darkMode, accentKey, setDarkMode, setAccentKey, setLang }` to every screen. Replace with the app's existing i18next + theme context.

### `TabBar`

Fixed bottom bar, 64 px tall, `card` bg with 1 px top border. 5 tabs: home (`home` icon) / news (`news`) / agenda (`agenda`) / directory (`people`) / more (`menu`). Active tab: icon primary accent, label primary accent weight 600. Inactive: `textMuted`. Tapping a tab calls `onChange(key)` — `app.jsx` computes direction from `tabOrder.indexOf()` to decide push-left vs push-right animation. When a pushed screen is on the stack, the tab bar is hidden.

### `Drawer`

Left slide-in panel, 280 px wide, `card` bg, 1 px right border. Grouped nav (General / Empresa / Personal) mirroring the More tab. Tapping backdrop (fixed inset 0, `rgba(0,0,0,.35)` 200 ms fade) closes.

### `AppHeader`

56 px tall, 20 px side padding, flex row. Left: 40×40 circular button (back `chevronLeft` or drawer `menu`). Center: title, 15 px weight 600. Right: slot for trailing content (share, filter, mark-all-read, etc.). 1 px bottom border.

### `Btn` (variants)

- **primary** — `accent.primary` bg, `#fff` text, 12 px radius. Hover: 4% lightness decrease. Press: scale 0.98. Disabled: 40% opacity, no pointer events.
- **secondary** — `card` bg, 1 px border, `text` fg.
- **ghost** — transparent, `text` fg, no border.
- **danger** — primary accent text on transparent bg, primary accent border.

Sizes: `sm` 36 px / `md` 40 px / `lg` 48 px. `full` stretches to container. Optional `icon` (left) and `iconRight` slots.

### `Card`

14 px radius, `card` bg, 1 px `border`, 16 px default padding. When `interactive`, 1% bg-shift on hover, scale 0.99 on active.

### `Badge`

Small rounded-6 label. Variants:
- `default` — `bgAlt` bg, `textMuted` fg
- `accent` — `primaryLight` bg, `primary` fg
- `olive` — `olive` bg 15% alpha, `olive` fg
- `success` — olive full
- `warning` — amber 15% (`#b6833a` fg)
- `danger` — primary accent 15%
Size: 10.5 px text, 3/8 padding, 0.08em letter-spacing, uppercase.

### `Input` / `Textarea` / `Field`

48 px height (Input), 12 px radius, 1 px border, 14 px font. Focus: border primary accent, 3 px `primaryLight` ring (box-shadow). Optional left icon at 14 px inset. `Field` wraps with a 12.5 px label above (weight 500, `textMuted`), optional 11.5 px `hint` or primary-accent `error` below.

### `Sheet`

Bottom sheet. Full-width, 20 px top radius, `card` bg, appears with `sheet-up` animation. Header: 36×4 px handle bar centered, title 15 px weight 600, 24×24 `×` close button. Padding 20 px. Backdrop: `rgba(0,0,0,.35)` fade. Max height 85% of viewport, scrollable.

### `ImgPh`

Image placeholder — 1 px dashed `border` overlay on `bgAlt` bg, hatched pattern via repeating-linear-gradient at 5 px × 45°, centered mono label in `textFaint` at 10 px. **Do not ship** — replace with real assets (see below).

### `LangSwitch`

Pills row for CA / ES / EN. Active pill: `text` bg / `bg` fg. 6 px horizontal, 3 px vertical padding, 999 px radius, 11 px uppercase letter-spaced 0.06em.

---

## Interactions & Behavior

### Screen-level transitions

- **Login → Register / Forgot** — `pushInRight` on the new screen.
- **Register → Verify** — same.
- **Back from Verify** — Register remounts with preserved form state; use `pushInLeft` on Register.
- **Tab change** — cross-fade + 12 px parallax based on tab-order index delta.
- **Tab → pushed screen** — `pushInRight` on the new screen; tab bar hidden while stack non-empty.
- **Back from pushed** — `pushOutRight` on outgoing; tab bar reappears when stack empty.

### News detail swipe

- `touchstart` → record `startX`; `touchmove` → set `transform: translateX(dx)` on the article container; `touchend` → if `|dx| > 60 px` OR `|velocity| > .4 px/ms`, commit to prev/next; else spring back.
- At list edges, rubber-band with 0.35 resistance and don't commit.

### Verification code

- One-character-per-slot, `[0-9A-F]` only (`toUpperCase` + regex replace).
- Auto-advance to next empty slot on input.
- `Backspace` on empty slot moves focus back and clears the previous slot on the second press.
- `ArrowLeft` / `ArrowRight` navigate slots.
- Paste event on any slot distributes up to 8 valid chars from the clipboard.
- Primary button enabled only when all 8 slots filled. On submit, `onVerified(code)` receives the concatenated string.

### Password strength

Update on every keystroke. Hide the meter until `pass.length > 0`. Show label `Feble / Correcta / Bona / Forta` as part of the field hint. Confirm-mismatch error appears only after `confirm.length > 0`.

### Forms (Voice suggestion, Request, Activity enrolment)

- Validate on blur, clear errors on next input.
- Submit button disabled until required fields filled.
- On submit: replace the form body with a success state (✓ icon in `primaryLight` circle, "S'ha enviat" + detail line + "Tornar" button). Optimistically prepend the new item to the list in the caller screen.

### Notifications

- `markAllRead` clears unread flags across all items.
- Tapping a single row marks only that row read.
- Grouping: "Avui" = items whose `time` string includes `h` (i.e. "fa N h"); everything else → "Abans".

### Search

In Espai corporatiu, search filters documents by `title + section`, case-insensitive, substring. In Directory (implied from the codebase — not fully implemented in the canvas), same approach across `name + role + dept`.

---

## State management

Everything lives in `app.jsx` as React `useState`. Translate into the existing codebase's conventions (likely local state + react-router for navigation + i18next for `t`).

```
darkMode     boolean                                  persisted in localStorage
accentKey    'mahogany' | 'terracotta' | 'oxblood' | 'clay'
lang         'ca' | 'es' | 'en'
screen       'login' | 'register' | 'verify' | 'forgot' | 'app'
regEmail     string            email carried between register → verify
tab          'home' | 'news' | 'agenda' | 'directory' | 'more'
stack        Array<screen>     push stack over tabs (news-detail, activities, voice, requests, profile, agenda, campus, espai, notifications, forgot)
newsId       string | null     id of current news article for detail
drawer       boolean
nav          { prev, cur, dir } used to drive tab-change animation direction
editOpen     boolean           Tweaks panel visibility
```

**Router mapping suggestion** — in the real app, mirror the screen state with routes:

```
/login                  LoginScreen
/register               RegisterScreen (step 1/2)
/register/verify        VerifyScreen (step 2/2)
/forgot                 ForgotScreen
/                       Home (tab)
/noticies               News (tab)
/noticies/:id           NewsDetail (pushed)
/agenda                 Agenda (tab)
/directori              Directory (tab)
/mes                    More (tab)
/notificacions          Notifications (pushed)
/campus                 Campus (pushed)
/espai                  Espai corporatiu (pushed)
/activitats             Activities (pushed)
/veu-empleat            Voice (pushed)
/solicituds             Requests (pushed)
/perfil                 Profile (pushed)
```

---

## Data shapes (see `tokens.jsx` for seed data)

```ts
type User = { name: string; email: string; role: string; dept: string; avatar: string; extension: string; location: string };

type NewsArticle = {
  id: string; title: string; excerpt: string; body: string;
  category: 'Empresa' | 'Persones' | 'Esdeveniments' | 'Sostenibilitat';
  author: string; date: string; minRead: number; image: string; featured?: boolean;
};

type AgendaEvent = { id: string; title: string; date: string; time: string; duration: string; location: string; room?: string; attendees: User[]; color: 'primary' | 'olive' };

type Activity = { id: string; title: string; category: 'Esport' | 'Familiar' | 'Formació' | 'Solidari'; date: string; time: string; location: string; capacity: { current: number; total: number }; image: string; description: string };

type Suggestion = { id: string; title: string; body: string; author: string; date: string; status: 'Nou' | 'En revisió' | 'Aprovada' | 'Rebutjada'; votes: number; comments: number };

type Request = { id: string; type: 'Vacances' | 'Canvi de torn' | 'Certificat' | 'Absència' | 'Dieta' | 'Altres'; title: string; date: string; status: 'Pendent' | 'En curs' | 'Aprovada' | 'Rebutjada'; comments?: string };

type Notification = { id: string; title: string; body: string; time: string; unread: boolean; type: 'news' | 'request' | 'agenda' | 'voice'; from: string };

type Course = { id: string; title: string; instructor: string; duration: string; level: 'Bàsic' | 'Intermedi' | 'Avançat'; category: string; progress: number; rating: number; lessons: number; isNew?: boolean };

type Document = { id: string; title: string; section: 'Polítiques' | 'Marca' | 'Seguretat' | 'Persones'; format: 'PDF' | 'PPTX' | 'DOCX' | 'XLSX'; size: string; updated: string; isNew?: boolean };
```

All strings are user-facing copy in Catalan. Wrap every literal string in `t('...')` against the i18next dictionary; do not inline Catalan in JSX in the production app.

---

## i18n

The prototype uses three dictionaries `TAVIL_I18N.ca | es | en` defined in `tokens.jsx`. They mirror and extend the existing `src/locales/{ca,es,en}.json` structure. Port all new keys under the same `nav`, `common`, `home`, `news`, `login`, `voice`, `req`, `profile`, `campus`, `espai`, `notifications` groups. Specifically, **add** these keys to the existing `login` group: `createAccount`, `noAccount`, `signUp`, `name`, `confirm`, `regTitle`, `regSubtitle`, `next`, `verify`, `verifySub`, `codeLabel`, `resend`, `welcome`. **Remove** the unused `sso` key. The `continueWith` value changes from "o continua amb" to just "o".

---

## Assets

**Images** — the prototype uses `ImgPh` placeholders everywhere a photo would appear (news thumbnails, activity covers, course hero images, profile photo). The production build needs:

- News: 16:9 cover image per article (source: existing news CMS, suggested 1600×900 WebP with a 800×450 WebP fallback).
- Activities: 4:3 or 1:1 cover per activity, plus a wider hero for the top banner (16:8).
- Courses: 16:9 cover per course.
- Profile avatars: square 256×256, displayed at 44 / 64 / 88 px.

Avatars in the prototype are rendered as initials (first+last letter) on a primary-tint background. Keep this as the fallback when no avatar is set.

**Icons** — the prototype has an inline SVG icon set in `primitives.jsx` (`Icon` component) with these names: `chevronLeft`, `chevronRight`, `mail`, `lock`, `profile`, `home`, `news`, `agenda`, `people`, `menu`, `close`, `bell`, `search`, `filter`, `share`, `plus`, `clock`, `mapPin`, `globe`, `settings`, `logout`, `arrowRight`, `arrowUp`, `arrowDown`, `message`, `voice`, `requests`, `lightbulb`, `alert`, `paperclip`, `finance`, `calendar`. Each icon is a single-stroke 24×24 SVG at 1.5 px stroke. Replace with the codebase's chosen icon library (e.g. `lucide-react` — the set maps 1:1 aside from `voice` which would be `megaphone` and `requests` which would be `inbox`).

**Fonts** — see Typography section. If the team keeps the existing CRA stack without a font decision, load Instrument Serif + Instrument Sans via Google Fonts in `public/index.html` with `preconnect` hints. Adding the Google Fonts link adds ~45 kB; preload the 400-weight subset to keep FCP clean.

---

## Responsive behavior

The mocks assume 390 px width. Implement breakpoints:

- **< 360 px** — all side paddings drop from 20 px → 16 px; news card rail item width drops to 220 px.
- **360-480 px** — default (the mocks).
- **480-768 px** — same mobile layout, content capped at `max-width: 440 px` centered with 20 px side padding, placed on a `porcelain-100` page bg so the content column reads as a card.
- **≥ 768 px** — the existing desktop layout takes over (out of scope for this handoff). Add a breakpoint redirect at the router level or render both and toggle via a `useMediaQuery` hook consistent with the rest of the app.

---

## Accessibility

- All icon-only buttons must have `aria-label`.
- The 8-slot verification input: give each slot `aria-label="Caràcter {i+1} de 8"` and expose the combined value via a `role="group"` wrapper with `aria-label="Codi de verificació"`.
- Focus ring: `3 px primaryLight` box-shadow on any focusable element. Do not remove outlines without a visible replacement.
- Minimum tap target 44×44 — the icon buttons in AppHeader already meet this; double-check the language-switch pills and tab-bar items.
- Color contrast: all text/background pairs in the light theme hit WCAG AA; the dark theme was tuned with the same ratios. Validate after porting to the real palette.

---

## Out of scope for this handoff

- Real search behavior (the mocks filter in-memory).
- Offline / sync handling.
- Push notification subscription.
- Actual file downloads from Espai corporatiu.
- Integration with SAP / Concur / IT ticketing (only "quick links" tiles are shown).
- Desktop breakpoint — the existing desktop layout in `src/App.tsx` is untouched.
