# Portal TAVIL — Audit + critique findings

Output of Phase A. Per-surface score matrix + prioritized punch list. Severities P0 (blocking) / P1 (major) / P2 (minor) / P3 (polish).

---

## Score matrix

| Surface | A11y | Perf | Theming | Responsive | Anti-patterns | Total | Band |
|---|---|---|---|---|---|---|---|
| Backoffice Tauler | 3 | 3 | 3 | 3 | 2 | **14/20** | Good |
| Backoffice Usuaris | 3.5 | 3 | 3 | 3.5 | 3 | **16/20** | Good |
| Backoffice Notícies (admin) | 3 | 3 | 3 | 3 | 3 | **15/20** | Good |
| Notícia extensa editor | 3 | 2.5 | 3 | 2 | 3.5 | **14/20** | Good |
| Perfil | 3.5 | 3 | 3 | 3 | 4 | **16.5/20** | Good |

Overall: ~15/20 (Good, before Phase B–F).

---

## Backoffice Tauler

### Findings

**[P2] Identical 3×2 quick-actions grid** — Anti-pattern  
Location: `src/components/admin/AdminBackoffice.tsx` `AdminDashboard`  
Impact: AI-slop tell. DESIGN.md bans "identical card grids". Currently 6 quick-action cards in perfect 3-col-2-row grid.  
Recommendation: Break to bento (1 hero card span-2 + 4 normal + 1 wide), or 2-col asymmetric.  
Command: `/design-taste-frontend` (variance ↑) + `/impeccable layout`

**[P3] Greeting kicker "Bon dia"** — Static  
Time-aware: bon dia / bona tarda / bona nit per hora.  
Recommendation: simple Date.getHours() switch.  
Command: `/impeccable delight`

**[P3] Module-list counts trigger one big fetch on enter** — Perf  
Location: `AdminBackoffice.tsx` `loadAll` Promise.all 6 endpoints.  
Impact: ~6 round-trips on every tab entry.  
Recommendation: lazy per-module on hover/visible; OR cache w/ 30s TTL.  
Command: `/impeccable optimize`

---

## Backoffice Usuaris

### Findings

**[P1] Inline rgba status colors** — Theming  
Location: `STATUS_MAP` in AdminBackoffice.tsx  
Impact: not tokenized. Dark mode override missing.  
Recommendation: extract to CSS vars `--status-active-bg`, `--status-active-fg` w/ dark variants in `index.css`.  
Command: `/impeccable colorize`

**[P2] No CSV import** — Feature gap  
Location: AdminUsers — handoff promised CSV import; not implemented.  
Impact: bulk user creation manual.  
Recommendation: defer (Phase E) or doc as known gap.  
Command: `/impeccable harden`

**[P2] No empty state when 0 users match filter**  
Recommendation: AdminDetailEmpty pattern; CTA "Esborra filtres".  
Command: `/impeccable onboard`

**[P3] Detail panel "Accions de compte"** — Reenvia invitació + reset password buttons missing  
Handoff specified; not wired. Backend endpoints don't exist either.  
Recommendation: add as backend tasks first.  
Command: `/impeccable harden`

**[P3] Last login column always shows "—"**  
Backend doesn't track `last_login`.  
Recommendation: add `last_login_at` column + update on auth.  
Command: `/impeccable harden`

---

## Backoffice Notícies (admin list)

### Findings

**[P1] Cover edit only via gallery picker** — no direct upload from row  
Location: `AdminNews` — "Triar de la galeria" but no inline "Puja nova" outside the modal.  
Impact: extra clicks to upload + select.  
Recommendation: add `MediaUploader` inline in detail; gallery as supplement.  
Command: `/impeccable craft`

**[P2] Status filter shows only published/draft** — handoff promised 4 (published/draft/scheduled/archived)  
`featured` column maps poorly to status. Backend lacks status enum.  
Recommendation: add `status` column to news table; backend migration.  
Command: `/impeccable harden`

**[P2] Title/summary/category fields are read-only in detail (no onChange wired)**  
Location: AdminNews detail `<AInput value={selected.title} onChange={() => {}} />`  
Impact: edit metadata requires opening extended editor — confusing.  
Recommendation: wire local draft state + Save button → apiUpdateNews.  
Command: `/impeccable craft`

**[P3] Language tabs are decorative** — backend has no per-language storage  
Recommendation: hide until multilingual implemented OR add UI-only persist (advisable: hide).  
Command: `/impeccable distill`

---

## Notícia extensa editor

### Findings

**[P1] No autosave** — risk of lost work on tab close.  
Location: `NewsArticleEditor` in App.tsx ~12000s.  
Recommendation: debounced autosave 5s after last change; toast "Desat ✓".  
Command: `/impeccable harden`

**[P1] Drag-and-drop tile placement not keyboard-accessible** — A11y  
Location: tile system in App.tsx ~11800s.  
Impact: WCAG 2.1.1 fails.  
Recommendation: arrow keys to move selected tile; Shift+arrows to resize.  
Command: `/impeccable adapt`

**[P2] Block-grid uses inline `style` heavy** — Perf + maintain  
Recommendation: move static styles to CSS classes; keep dynamic only.  
Command: `/impeccable extract`

**[P2] No undo/redo** — typical editor expectation  
Recommendation: history stack (state snapshot per change, max 20).  
Command: `/impeccable craft`

**[P3] Tile palette right-rail collapses on narrow viewport**  
Currently desktop-only.  
Recommendation: bottom sheet on mobile (existing pattern).  
Command: `/impeccable adapt`

---

## Perfil

### Findings

**[P2] `prefers-reduced-motion` only applies to `.perfil-stag`** — others untouched  
Recommendation: global media query: `.anim-* { animation: none; }` when reduced.  
Command: `/animate`

**[P3] "Incorporació 12 setembre 2022" is hard-coded**  
Recommendation: add `joined_at` column to users; format via `Intl.DateTimeFormat`.  
Command: `/impeccable harden`

**[P3] Banner image 4.8 MB un-optimized** — Perf  
Recommendation: compress to WebP < 200 KB.  
Command: `/impeccable optimize`

**[P3] Avatar upload via MediaUploader — but tiny preview in modal**  
Recommendation: keep modal flow; ensure preview is at least 96×96.  
Command: `/impeccable polish`

---

## Cross-cutting findings

### Systemic issues

**[P1] Inline-style heavy throughout** — Theming + Perf + Maintain  
~80% of admin section + 40% of App.tsx use inline `style={{ ... }}` for tokens that should be CSS classes. Hard to override, no theme reactivity, no media query response.  
Recommendation: progressive extract to `src/components/admin/primitives.tsx` + utility classes in index.css.  
Command: `/impeccable extract` (Phase B1)

**[P1] Status colors hard-coded as rgba literals across 3 files** — Theming  
Files: AdminBackoffice.tsx, src/index.css (partial), App.tsx (legacy AdminTab).  
Recommendation: single token block in index.css w/ dark variants.  
Command: `/impeccable colorize` (Phase B2)

**[P2] i18n keys for admin section are 100% hard-coded Catalan**  
Recommendation: lift to `src/locales/ca|es|en.json` under `admin.*` namespace.  
Command: `/impeccable harden` (Phase B4)

**[P2] No global toast/notification system for save success / errors**  
Each module reinvents alert() or local toast.  
Recommendation: lift a `<ToastProvider>` to App root.  
Command: `/impeccable craft`

**[P3] Several legacy `font-display` references use Barlow Condensed where Instrument Sans was intended**  
Verify per screen.  
Command: `/impeccable typeset`

### Positives (keep doing)

- Modal backdrops 100% full-screen + blurred ✓
- Touch targets ≥ 34 px in admin (≥ 40 in primary surfaces) ✓
- TAVIL Red usage restrained ✓ (One Voice Rule held)
- No gradient text, no glassmorphism deco, no hero-metric, no nested cards ✓
- AdminTwoPane collapses < 1100 px ✓
- Avatar pipeline end-to-end (DB → fetch → upload → resolve) ✓
- `prefers-reduced-motion` honored on new perfil-stag class ✓

---

## Prioritized punch list (next 90 min)

1. **P1** Extract AdminBackoffice primitives → `src/components/admin/primitives.tsx`. Reduces inline-style and unblocks Phase C.
2. **P1** Consolidate status color tokens in `src/index.css` + add dark variants.
3. **P1** Wire AdminNews detail fields (title/summary/category) to draft + Save.
4. **P2** Add empty state to AdminUsers when filters return 0.
5. **P2** Audit `prefers-reduced-motion` global coverage.

After that:
- News autosave (P1)
- Backend `status` column for news (P2 — coordinate w/ backend)
- i18n lift for admin (P2)
- Banner image compress (P3)

---

## Phase B execution after these findings

Next: extract primitives (B1) — splits AdminBackoffice into ~8 files. Then consolidate tokens (B2). Then re-audit.
