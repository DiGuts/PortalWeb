# Animation Guidelines — TAVIL Portal

Source: `.claude/HANDOFF - Transitions & Color Hierarchy.md`

---

## Motion principles

- Earned, not decorative. Every transition answers "where did content go / come from?"
- Soft, never bouncy. No springs, no overshoot, no rotation.
- Short. 220–400ms total. Longer = feels broken on repeat use.
- Respect `prefers-reduced-motion`. Fallback: 120ms opacity-only fade.
- Never block input. Outgoing layers must have `pointer-events: none` immediately.

---

## Motion tokens (`:root`)

```css
--motion-ease:      cubic-bezier(0.32, 0.72, 0.24, 1);  /* arrivals — corporate ease-out */
--motion-ease-out:  cubic-bezier(0.22, 1, 0.36, 1);     /* departures — get out of the way */
--motion-dur-in:    380ms;   /* arrivals — deliberate */
--motion-dur-out:   220ms;   /* departures — fast */
--motion-dur-quick: 160ms;   /* hovers, toggles, micro-state */
--motion-stagger:   60ms;    /* between sequential section reveals */
```

Asymmetry is intentional: arrivals deserve attention, departures clear the stage.

---

## Two transition modes

### PAGE mode — top-level ↔ top-level (desktop sidebar navigation)

**When:** sidebar item → sidebar item (Inici, Notícies, Agenda, Directori, etc.)

**Feel:** confident editorial cross-fade. New page rises gently; old settles away.

- Outgoing: `opacity 1→0`, `translateY(0→-6px)`, 220ms `--motion-ease-out`
- Incoming: `opacity 0→1`, `translateY(12px→0)`, 380ms `--motion-ease`
- Both layers overlap during swap. Header + sidebar do NOT animate.

CSS classes: `anim-page-enter-v-fwd / exit-v-fwd` (forward), `v-back` (backward)

### SUB mode — drill-down / back (Més sub-tabs, detail pages)

**When:** any navigation that isn't top-level → top-level (Més→Activitats, list→detail)

**Feel:** directional horizontal slide. Reinforces depth model.

- Forward exit: `translateX(0→-18px)` + fade, 220ms `--motion-ease-out`
- Forward enter: `translateX(36px→0)` + fade, 380ms `--motion-ease`
- Backward: mirror X axis

CSS classes: `anim-page-enter-h-fwd / exit-h-fwd` (forward), `h-back` (backward)

### Decision rule

```
top-level → top-level   →  PAGE mode (vertical)
anything else           →  SUB mode (horizontal)
```

---

## Inner-content stagger

After page mount, reveal major sections in sequence:

| Section | Delay | Class |
|---|---|---|
| Page header (kicker + h1 + subtitle) | 0ms | `.stagger-1` |
| Filter bar / hero card | 60ms | `.stagger-2` |
| First content row | 120ms | `.stagger-3` |
| Second content row | 180ms | `.stagger-4` |
| Third+ (cap at 5) | 240ms | `.stagger-5` |

Each: `opacity 0→1`, `translateY(8px→0)`, 420ms `--motion-ease`.

**Do not** stagger individual list items — only section-level containers.

---

## Other motion (shared tokens)

| Interaction | Spec |
|---|---|
| Card hover lift | `translateY(-1px)` + shadow, 180ms `--motion-ease` |
| Button press | `scale(0.985)`, `--motion-dur-quick` |
| Sidebar collapse/expand | `width` 240ms `--motion-ease` |
| Modal open | backdrop fade 220ms; panel `translateY(-2%) scale(0.98)→0/1`, 240ms |
| Toggle (theme, lang) | 200ms `--motion-ease` |
| Theme switch | 320ms cross-fade on background + color |
| Tab change within page | opacity-only fade, 200ms. NOT a page transition. |

---

## CSS class reference

```
/* PAGE mode — desktop */
anim-page-enter-v-fwd   380ms --motion-ease      — enter from below
anim-page-exit-v-fwd    220ms --motion-ease-out  — exit upward
anim-page-enter-v-back  380ms --motion-ease      — enter from above
anim-page-exit-v-back   220ms --motion-ease-out  — exit downward

/* SUB mode — mobile sub-tabs, drill-down */
anim-page-enter-h-fwd   380ms --motion-ease      — enter from right (36px)
anim-page-exit-h-fwd    220ms --motion-ease-out  — exit left (18px)
anim-page-enter-h-back  380ms --motion-ease      — enter from left (36px)
anim-page-exit-h-back   220ms --motion-ease-out  — exit right (18px)

/* Bottom sheet */
anim-sheet-enter        320ms --ease-out-quint   — slide up from bottom
anim-sheet-exit         260ms --ease-in-out-cubic — slide down

/* Components */
anim-fade-in / fade-out  220ms
anim-scale-in            240ms
anim-slide-down/up       220–280ms
anim-tab                 320ms (view swap within page)

/* Stagger */
stagger-1 … stagger-5   420ms --motion-ease, 0/60/120/180/240ms delays
```

---

## Don'ts

- No bouncy/spring easings on page transitions
- No vertical slide for SUB mode (reserved for PAGE)
- No horizontal slide for PAGE mode (reserved for SUB)
- No animation on header or sidebar during page change
- No per-item stagger on list rows (only section containers)
- No `animation-duration: 0ms` globally — only for `prefers-reduced-motion`
