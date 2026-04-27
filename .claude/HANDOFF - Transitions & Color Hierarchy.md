# TAVIL Portal — Page Transitions & Visual Hierarchy
## Handoff brief for Claude Code

This document specifies the **page-transition motion system** and the **active-state color hierarchy** for the TAVIL internal portal (web / desktop). Implement both as a coherent system — they work together to make navigation feel calm, deliberate, and corporate.

The motion system has been prototyped in HTML/JSX (see `desktop-transitions.jsx` in the design project). Use it as the visual reference; reimplement in your real stack (React + your router of choice — Next.js App Router, React Router 6, Remix, etc.).

---

## 1 · Motion principles

The TAVIL portal is a serious internal tool used daily by 128+ people. Motion must:

- **Feel earned, not decorative.** Every transition should answer the question "where did the content go / come from?".
- **Be soft, never bouncy.** No springs, no overshoot, no rotation.
- **Stay short.** 220–400ms total. Anything longer feels broken on repeat use.
- **Respect `prefers-reduced-motion`.** Fall back to a 120ms opacity-only fade.
- **Never block input.** Outgoing layers must `pointer-events: none` immediately.

### Shared tokens (use these everywhere)

```css
--motion-ease:      cubic-bezier(0.32, 0.72, 0.24, 1);  /* corporate ease-out */
--motion-ease-out:  cubic-bezier(0.22, 1, 0.36, 1);     /* for departures */
--motion-dur-in:    380ms;  /* arrivals — anchored, deliberate */
--motion-dur-out:   220ms;  /* departures — quick, get out of the way */
--motion-dur-quick: 160ms;  /* hovers, toggles, micro-state */
--motion-stagger:   60ms;   /* between sequential child reveals */
```

The asymmetry (in slower than out) is intentional: arrivals deserve attention, departures should clear the stage.

---

## 2 · Two transition standards

There are exactly **two** page-transition modes. Don't invent a third.

### A. `page` — top-level navigation (sidebar destinations)

**When:** the user clicks a sidebar item (Inici, Notícies, Agenda, Directori, Activitats, Veu, Sol·licituds, Campus, Espai, Perfil, Notificacions) or any peer top-level page.

**Feel:** confident editorial cross-fade. The new page rises gently into place; the old one settles down and away.

**Specs:**
- Outgoing: `opacity 1 → 0`, `translateY(0) → translateY(-6px)` over 220ms with `--motion-ease-out`.
- Incoming: `opacity 0 → 1`, `translateY(12px) → translateY(0)` over 380ms with `--motion-ease`.
- Layers overlap during the swap (cross-fade), not a wipe.
- The header (top bar) and sidebar **do not animate** — only the `<main>` content.

### B. `sub` — subpage / detail navigation

**When:** drilling into a detail (e.g. News list → News article, Directory → Person profile, Requests → Request detail) and the corresponding back-out.

**Feel:** directional horizontal slide. Reinforces the user's mental model of going "deeper" or "back".

**Specs:**
- Forward (list → detail):
  - Outgoing: `translateX(0) → translateX(-18px)`, fade 1→0, 220ms.
  - Incoming: `translateX(36px) → translateX(0)`, fade 0→1, 380ms.
- Backward (detail → list):
  - Mirror the X axis. Outgoing slides right, incoming comes from the left.
- Direction is **always inferred from intent**, never random. A "Back" button or breadcrumb click → `backward`. A card / link click → `forward`.

### Decision rule

```
if (newRoute is top-level && oldRoute is top-level) → mode = 'page'
else                                                → mode = 'sub'
```

Edge cases:
- Top-level → detail (e.g. clicking a featured news on Home that opens the article): `sub` forward.
- Detail → unrelated top-level (e.g. from an article you click "Agenda" in the sidebar): `page` (the user explicitly chose a top-level destination, treat it as a fresh page).
- Login → first authenticated page: `page` mode is fine, but consider a slightly longer 480ms entry to make the moment feel intentional.

---

## 3 · Inner-content stagger

Inside a freshly-mounted page, reveal **major sections** with a 60ms stagger so the page composes itself:

1. Page header (kicker + h1 + subtitle): 0ms
2. Filter bar / hero card: 60ms
3. First content row: 120ms
4. Subsequent rows: 180ms, 240ms… (cap the cascade at 5 items; rest appear together at 300ms)

Each item: opacity 0→1, `translateY(8px → 0)` over 420ms with `--motion-ease`.

Don't stagger inside list rows themselves — only the section-level containers. Per-item stagger feels twee on a corporate tool.

---

## 4 · Other motion (for consistency)

These are not page transitions, but they share the same easing/duration tokens so the whole product feels cohesive.

| Interaction | Spec |
|---|---|
| Card hover lift | `translateY(-1px)` + soft shadow, 180ms `--motion-ease` |
| Button press | `scale(0.985)`, 160ms `--motion-ease` |
| Sidebar collapse / expand | `width` 240ms `--motion-ease` |
| Modal open | overlay fade 220ms; modal `translateY(-2%) scale(0.98) → 0/1` 240ms `--motion-ease` |
| Toggle (theme, lang) | 200ms `--motion-ease` |
| Theme switch (light↔dark) | 320ms cross-fade on `background` + `color`. No flicker. |
| Tab change within a page | opacity-only fade, 200ms. **Not** a sub-transition. |

---

## 5 · Active-state color hierarchy

The portal uses red (mahogany `#bf211e`) as a single, restrained accent. Don't paint it everywhere. The hierarchy is what makes the system legible.

### Color tokens (light mode — see `tokens.jsx` for dark)

```
accent.primary       #bf211e   Mahogany red — the ONE accent
accent.primaryDark   #a21b18   Hover/pressed accent
accent.primaryLight  #f9eceb   Tinted backgrounds for accent surfaces

theme.text           #222725   Carbon — primary text
theme.textMuted      #5d655c   Secondary text, metadata
theme.textFaint      #8b948a   Tertiary, captions, kickers
theme.olive          #788475   Soft secondary accent (use sparingly)

theme.bg             #f7f7f2   Porcelain — page background
theme.bgAlt          #efefe9   Sidebar, subtle surfaces
theme.card           #ffffff   Card / elevated surface
theme.border         #e3e2db   Hairlines
```

### Weight & color rules — sidebar navigation

The sidebar is the most-seen surface. Get this right.

| State | Background | Text color | Font weight | Icon | Indicator |
|---|---|---|---|---|---|
| **Active** (current top-level page) | `theme.card` (white card chip) with `theme.border` | `theme.text` | **600** | `accent.primary` color, stroke 1.9 | 3px tall `accent.primary` rail at left edge of the chip |
| **Hover** (non-active) | `theme.bg` (subtle wash) | `theme.text` | 500 | `currentColor` (inherits muted) | none |
| **Default** (non-active) | transparent | `theme.textMuted` | 500 | inherits muted, stroke 1.6 | none |
| **Group label** (e.g. "GENERAL") | n/a | `theme.textFaint` | 600, uppercase, 0.14em letter-spacing, 10px | n/a | n/a |

Only **one** sidebar item is active at a time. When viewing a subpage (e.g. news detail), the parent top-level page (News) stays active.

### Weight & color rules — top bar

- Search input: `theme.card` background, `theme.border`, no accent until focus. On focus, accent ring (`accent.primaryLight` 3px ring + `accent.ring` border).
- Notification bell with unread count: bell icon stays `theme.text`, the badge is `accent.primary` solid with white text. **Never** color the bell itself red — only the badge.
- User avatar pill: neutral. The avatar's color is derived from name hash, not the brand red.

### Weight & color rules — page content

- **Page H1** (Instrument Serif, 48–60px): always `theme.text`. Never red. Red H1 reads as "marketing", we're an internal tool.
- **Kicker** (small uppercase eyebrow above H1): `accent.primary`, 11px, weight 600, letter-spacing 0.14em. This is the *only* place the brand red is allowed at the top of a page.
- **Section headings (H2)**: Instrument Serif, 28px, `theme.text`. Their kicker (above) can also be `accent.primary`.
- **Body copy**: `theme.text` for primary, `theme.textMuted` for secondary/metadata, `theme.textFaint` for captions/timestamps.
- **Links inside body copy**: `accent.primary`, no underline by default, underline on hover.

### Weight & color rules — interactive elements

| Element | Default | Hover | Pressed | Disabled |
|---|---|---|---|---|
| Primary button | bg `accent.primary`, text `#fff` | bg `accent.primaryDark` | + scale 0.985 | opacity 0.5 |
| Secondary button | bg `theme.card`, text `theme.text`, border `theme.border` | bg `theme.bgAlt` | + scale 0.985 | opacity 0.5 |
| Ghost button | transparent, text `theme.text` | bg `theme.bgAlt` | + scale 0.985 | opacity 0.5 |
| Subtle/accent button | bg `accent.primaryLight`, text `accent.primaryDark` | same | + scale 0.985 | opacity 0.5 |
| Danger / sign-out | bg transparent, text + border `accent.primary` | bg `accent.primaryLight` | + scale 0.985 | opacity 0.5 |

Use **primary** sparingly — typically once per view (the main CTA). On a screen with both "New article" and "Filter", "New article" is primary, "Filter" is secondary.

### Weight & color rules — badges & status

| Badge variant | Use for | Bg | Text |
|---|---|---|---|
| `neutral` | tags, categories, read-time | `theme.bgAlt` | `theme.textMuted` |
| `accent` | "Featured", "New", current category match | `accent.primaryLight` | `accent.primaryDark` |
| `olive` | secondary tags (e.g. activity category) | olive 14% tint | `theme.olive` |
| `success` | approved, completed | green 12% tint | `#3f7a52` |
| `warning` | pending, full, waitlist | amber 14% tint | `#b6833a` |
| `solid` | strong status, urgent | `accent.primary` | `#fff` |

Status hierarchy:
- **Urgent / blocking** (e.g. "AVÍS URGENT" banner on Home): full-bleed red surface, white text. Use **at most one** per screen.
- **Approved / Completed**: success green badge. Never use the red accent for "good news".
- **Pending / Awaiting**: warning amber. Not red — red implies error or urgency.
- **Rejected / Error**: red text on red-light background. Reserve for true negatives.

### Visual weight cheat-sheet

When in doubt, ask: *what's the single thing the user needs to find?*

```
Strongest  →  Page H1 (serif, 48–60px, carbon)
              Primary CTA (red button)
              Active sidebar item (card chip + red rail + red icon)
              Urgent banner (full red surface)
Medium     →  Section H2 (serif, 28px, carbon)
              Secondary buttons / cards
              Accent badges (red-tinted)
Soft       →  Body copy (carbon)
              Olive / neutral badges
              Card hover lift
Faintest   →  Kickers, captions, timestamps (faint olive-grey)
              Hairlines, borders
              Background washes
```

Aim for **3–4 visual weights per screen**, not 7. If everything shouts, nothing is heard.

---

## 6 · Files to study

In the design project (`PortalWeb1`):

- `desktop-transitions.jsx` — reference implementation of both transition modes + `DEnter` stagger primitive.
- `desktop-app.jsx` — wiring example: how `mode` and `direction` are inferred from navigation events.
- `desktop-shell.jsx` — sidebar + top-bar with the active-state styling described above.
- `desktop-primitives.jsx` — `DBtn`, `DBadge`, `DCard` with all hover/active states.
- `tokens.jsx` — full color tokens (light + dark + EN/ES/CA strings).

---

## 7 · Implementation checklist

- [ ] Add motion CSS custom properties at `:root`.
- [ ] Build a `<PageTransition>` component (or use `framer-motion`'s `AnimatePresence` with `mode="wait"` disabled — we want the cross-fade overlap).
- [ ] Wire route changes through a single navigation function that infers `mode` and `direction` from old/new route metadata. Do **not** sprinkle transition logic into individual links.
- [ ] Mark each route as `topLevel: true | false` in your route config.
- [ ] Add `prefers-reduced-motion` fallback (instant-ish opacity fade).
- [ ] Apply the active-state color rules to the real sidebar component.
- [ ] Audit every button, badge, and status indicator against the tables above. Replace ad-hoc colors.
- [ ] Confirm only **one** sidebar item is "active" per route, including for subpages (parent stays lit).
- [ ] Confirm the brand red appears at most: 1 active-rail + 1 page kicker + 1 primary CTA + (optional) 1 urgent banner per view.

---

## 8 · Don'ts

- Don't animate the sidebar or top bar on page change. They are constants.
- Don't use bouncy / spring easings.
- Don't slide vertically for sub-navigation (reserved for `page` mode).
- Don't slide horizontally for top-level navigation (reserved for `sub` mode).
- Don't paint H1 red.
- Don't use the brand red for "success" or "info".
- Don't stack two red elements adjacent (banner + primary button + active-rail in the same fold = noise).
- Don't disable transitions globally — only for `prefers-reduced-motion`.
