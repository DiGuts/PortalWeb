# TAVIL Portal — Design Handoff

**Date:** 2026-05-07
**Author:** Claude Opus 4 (impl agent)
**Audience:** Claude Design (polish + token spec)
**Stack:** React 18 + TS + Tailwind 3 (CRA) + CSS custom properties; PHP 8.4 backend; i18next ca/es/en

---

## 1. Current state

### Tokens (defined `src/index.css:398-416`)

```css
:root {
  --tavil-bg:           #eeeee9;
  --tavil-card:         #ffffff;
  --tavil-border:       #e3e2db;
  --tavil-text:         #222725;
  --tavil-muted:        #5d655c;
  --tavil-faint:        #8b948a;
  --tavil-accent:       #bf211e;  /* corporate red */
  --tavil-accent-light: #f9eceb;
  --tavil-accent-dark:  #a21b18;
}
html.dark { --tavil-bg: #121212; --tavil-card: #242624; --tavil-border: #33362f; --tavil-text: #f0efe8; --tavil-muted: #a8afa6; --tavil-faint: #7a8178; }
@media (max-width: 767px) { :root { --tavil-bg: #f7f7f2; } }
```

Motion tokens (`src/index.css:13-20`):
```
--motion-ease: cubic-bezier(.22,1,.36,1)
--motion-dur-in: 380ms
--motion-dur-out: 220ms
```

### Existing animations (`src/index.css:5-299`)
- `anim-fade-in`, `anim-slide-down`, `anim-tab`, `anim-page-enter-h-fwd`
- `anim-drawer-down`
- `hover-lift`, `press`
- skeleton: `tavil-shimmer` 1.4s

### Inconsistencies (must fix)

| Issue | Where | Count |
|---|---|---|
| Hardcoded `#bf211e` instead of `var(--tavil-accent)` | `src/App.tsx` | 106 |
| Hardcoded `#bf211e` mobile auth screens | `src/components/mobile/auth/*` | 26 |
| Hardcoded `#bf211e` in CSS | `src/index.css` | 7 |
| Quiz player playing-screen blue/indigo | `App.tsx` `QuizPlayerPage` ~9450 | gradient `#0f172a→#1e1b4b` |
| Quiz editor + intro mahogany | `App.tsx` ~9846 | gradient `#181010→#221717→#2a1c1b→#221615` |

Total `#bf211e`: **139 occurrences across 6 files**.

### Backoffice (CRUD-only today)

`BackofficeTab` `App.tsx:8758-9219` — 4 sub-tabs (Usuaris, Notícies, Formacions, Convenis). Pure list + inline form. Zero metrics surface. Only `QuizResultsDrawer` shows numbers (passed/avg %).

### Quiz formacions

- Editor: mahogany dark gradient ✓ corporate
- Intro: mahogany dark ✓ corporate
- **Playing screen: blue/indigo** ✗ inconsistent
- Zero progress persistence — close tab = lose all answers
- No "X / N" position chip (user can lose track on long quiz)

---

## 2. Design intent

### Palette ask (user)

> "Colors mes corporatius: blancs, crema, grisos i vermells"

Map:
- White / cream — surfaces (cards, modals, quiz slides)
- Gray scale — text hierarchy, borders, dividers
- Red `#bf211e` — accent only (CTA, active state, focus, score chip, brand)

### Backoffice → dashboard

Each sub-tab opens with **stats header** (3-4 metric cards), then list/table.

| Tab | Metrics |
|---|---|
| Usuaris | total, active 30d, must-change-pwd, dept distribution sparkline |
| Notícies | published, drafts, last published, (views if tracked) |
| Formacions | quizzes total, attempts this month, avg pass rate, in-progress count |
| Convenis | active conveni, days off used / allocated, pending requests |

Reusable: `<MetricCard icon title value delta? trend?>`.

### Quiz formacions

- Slide bg: cream surface (`--tavil-cream`?) with red accent border-l on question card
- Or: warm white → light cream gradient (no dark)
- "X / N" chip top-right (always visible)
- Resume modal on mount if progress exists

### Scroll-into-view

When user opens drawer/modal/inline-form below 60% viewport → smooth scroll to center.

---

## 3. Open questions for Claude Design

1. **Cream tone** — exact hex? `#f5f1e8`? `#faf6ed`? Need swatch.
2. **Gray scale** — proposed ramp 50/100/200/300/400/500/600/700/800/900? Reuse Tailwind `stone` or custom?
3. **MetricCard** — elevation (shadow vs flat-with-border)? Icon style (solid color vs outlined)? Trend indicator color (green/red OK in corporate red palette?)?
4. **Quiz slide bg** — pure cream, gradient, or white card on cream page bg? Should question text be `--tavil-text` or muted serif?
5. **Position chip** — pill `12 / 30` top-right, or progress bar on top edge, or both?
6. **Backoffice dashboard density** — desktop grid 4-col metrics, tablet 2-col, mobile 1-col? Or 2-col desktop with bigger cards?
7. **Dark mode** — keep current `html.dark`? Or scope dashboard to light only since corporate?
8. **Replacement for blue/indigo quiz gradient** — match editor mahogany OR new cream? Pick one direction (consistency between editor/play OR consistency with corporate ask).
9. **Charts** — sparklines / bars in metric cards? If yes, recommend library (recharts? raw SVG?).
10. **Token additions to ratify** —
    ```
    --tavil-cream: ?
    --tavil-gray-{50..900}: ?
    --tavil-shadow-sm/md/lg: ?
    --tavil-radius-sm/md/lg: ?
    --tavil-quiz-bg: ?
    ```

---

## 4. Constraints

- **No design system rewrite.** Tailwind 3 + custom properties stay.
- **No new heavy deps** without ask. Charts: prefer raw SVG sparkline; if needed, `recharts` already-allowed.
- **i18n** — every label via `t('key')`. New copy → add to `src/i18n/{ca,es,en}.json`.
- **Mobile tokens diverge** at `(max-width:767px)` — design must respect that or unify.
- **Dark mode** still expected on desktop (`html.dark` toggle in PerfilTab Configuració).
- **No mobile profile coherence this round** (deferred). Polish but don't restructure mobile tabs.
- **Accessibility** — keep contrast AA (current `--tavil-text` `#222725` on `--tavil-card` `#ffffff` = 16.4:1 ✓).

---

## 5. Critical files (for design reference)

| File | Lines | What |
|---|---|---|
| `src/index.css` | 398-416 | Tokens |
| `src/index.css` | 13-299 | Motion + animations |
| `src/App.tsx` | 8758-9219 | BackofficeTab |
| `src/App.tsx` | 9448-9842 | QuizPlayerPage |
| `src/App.tsx` | 9846-10308 | QuizEditorPage |
| `src/App.tsx` | 6510-7128 | PerfilTab desktop |
| `src/components/mobile/auth/*` | — | Mobile auth (unify red) |

---

## 6. Deliverable from Claude Design

A markdown reply with:
1. Final cream + gray ramp hex values
2. MetricCard spec (HTML structure + Tailwind classes)
3. Quiz slide bg recipe (gradient stops or solid)
4. Updated `:root { --tavil-* }` block (additive, no breaking renames)
5. Decision on each numbered question above
6. Optional: SVG sparkline pattern for metric cards

After Claude Design responds → impl agent applies in Phases 2-5 of plan `bright-frolicking-spring.md`.
