---
name: TAVIL Hub
description: Internal employee portal for Tavil Industrial S.A.U., a Catalan packaging-machinery manufacturer.
colors:
  tavil-red: "#bf211e"
  tavil-red-dark: "#a21b18"
  tavil-red-tint: "#f9eceb"
  pressed-linen: "#f7f7f2"
  workshop-stone: "#eeeee9"
  pale-render: "#e3e2db"
  forge-ink: "#222725"
  oxidised-slate: "#5d655c"
  mill-dust: "#788475"
  pale-mortar: "#8b948a"
typography:
  display:
    fontFamily: '"Instrument Serif", "Times New Roman", serif'
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Instrument Serif", "Times New Roman", serif'
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.tavil-red}"
    textColor: "{colors.pressed-linen}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.tavil-red-dark}"
    textColor: "{colors.pressed-linen}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.oxidised-slate}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  chip-active:
    backgroundColor: "{colors.tavil-red}"
    textColor: "{colors.pressed-linen}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  chip-default:
    backgroundColor: "#ffffff"
    textColor: "{colors.oxidised-slate}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  card:
    backgroundColor: "#ffffff"
    textColor: "{colors.forge-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-search:
    backgroundColor: "#e5e5e0"
    textColor: "{colors.forge-ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px 8px 36px"
---

# Design System: TAVIL Hub

## 1. Overview

**Creative North Star: "The Catalan Workshop Floor"**

TAVIL Hub is built on the aesthetic of a serious workshop: warm, tangible, and purposeful. The surface feels like pressed linen and workshop stone — not sterile, not cold. Instrument Serif brings the weight of institutional documentation; the system font carries the efficiency of a tool. Mahogany Red is not decorative. It is the single structural color, appearing where something matters: a primary action, an active state, a today indicator. Its restraint is the point.

The density calibrates to the task. A peon checking vacation status on a phone sees the same information hierarchy as an engineer reviewing training on a desktop. The interface disappears into the task. Every screen should feel like it was drawn by a careful person, not assembled from a template. This is a product the CEO can open in front of a client without apology.

This system explicitly rejects: generic SAP/Workday grey, SaaS blue-and-white commodity design, AI slop aesthetics (gradient text, hero-metric cards, glassmorphism as decoration), and the homogeneous look of every vibe-coded app in 2024 (Inter font, soft shadows, muted palette, rounded everything, no character).

**Key Characteristics:**
- Warm neutral surfaces anchored by a single saturated red
- Instrument Serif display type against system-UI body creates controlled contrast without ornament
- Dark mode inverts surfaces, not intent: the hierarchy reads the same in both
- Motion is functional: arrivals 380ms, departures 220ms, hover 160ms
- Elevation through borders and tonal separation, not heavy shadows
- Every interactive component has full state coverage: hover, focus, active, disabled, loading

## 2. Colors: The Workshop Palette

A restrained palette built on warm neutrals with one structural accent. Nothing competes with TAVIL Red.

### Primary
- **TAVIL Red** (`#bf211e`): The identity anchor. Used exclusively for primary actions, active navigation states, today indicators, category pills, and critical alerts. Never decorative. The red must earn its presence.
- **Deep Lacquer** (`#a21b18`): TAVIL Red on hover and pressed states. Slightly darker to confirm pressure without drama.
- **Ember Wash** (`#f9eceb`): The red's tint for backgrounds under red-accented content. Used for alert backgrounds, red-category tag backgrounds, and accent-tinted surfaces.

### Neutral
- **Pressed Linen** (`#f7f7f2`): Mobile primary surface. Warm white with a faint olive-green undertone. Never pure white.
- **Workshop Stone** (`#eeeee9`): Desktop page background and hover state for interactive rows. Slightly darker than Pressed Linen to create layering without a border.
- **Pale Render** (`#e3e2db`): Border color. The mortar line between surfaces. Used on cards, dividers, input strokes.
- **Forge Ink** (`#222725`): Primary text. Near-black with warmth. Never pure black.
- **Oxidised Slate** (`#5d655c`): Muted body text. Secondary labels, sidebar inactive items, subdued metadata.
- **Mill Dust** (`#788475`): Faint text. Timestamps, tertiary labels, placeholder text.
- **Pale Mortar** (`#8b948a`): Ghost-level text. Barely-there captions, disabled icons, structural dividers.

### Named Rules
**The One Voice Rule.** TAVIL Red occupies at most 10% of any given screen. The rest is neutral. Its rarity is what makes it readable as a signal. A screen where everything is red is a screen where nothing is red.

**The No-White Rule.** Never use pure `#ffffff` as a large surface. Pressed Linen (`#f7f7f2`) is the lightest background the system allows. Card surfaces use `#ffffff` only because they sit on Pressed Linen or Workshop Stone — the contrast reads correctly precisely because the surrounding field is warm, not pure white.

## 3. Typography

**Display Font:** Instrument Serif (with Times New Roman, serif fallback)
**Body Font:** System UI stack (-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif)
**Mono Font:** JetBrains Mono (with Courier New fallback) — used in backoffice/data contexts

**Character:** Instrument Serif brings editorial gravity to section entries without feeling decorative. The system font carries day-to-day UI with zero friction and native platform legibility. The pairing is controlled contrast: the serif is for arrival, the sans is for work.

### Hierarchy
- **Display** (400 weight, 48px, line-height 1, tracking -0.02em): Desktop page titles only. Every section gets one. Never in mobile headers.
- **Headline** (400 weight, 32px mobile / 36px on "Més", line-height 1.1, tracking -0.02em): Mobile screen titles rendered in Instrument Serif. One per screen.
- **Title** (600 weight, 15px, system-ui): Primary section headings within content areas. The threshold between section and metadata.
- **Body** (400 weight, 14px, line-height 1.5, system-ui): All prose content. Max line length 65-75ch on prose surfaces. Data tables may run wider.
- **Label** (600 weight, 11px, uppercase, tracking 0.14em, TAVIL Red): Screen kicker labels above Instrument Serif headlines. Used sparingly as category identifiers.
- **Caption** (400-500 weight, 10-12px, system-ui): Timestamps, secondary metadata, badge text.

### Named Rules
**The Serif-for-Arrival Rule.** Instrument Serif appears exactly once per screen: the page title on desktop (Display), the screen title on mobile (Headline). It signals "you have arrived at a section." All UI below it — buttons, labels, table cells, form fields — uses the system stack. Using serif in a button or chip is prohibited.

## 4. Elevation

TAVIL Hub is flat-by-default. Depth comes from tonal separation and borders, not from shadow stacking. The workshop floor metaphor grounds everything at the same plane; shadows appear only as a response to state or layering intent.

Three tiers of elevation are in use:

1. **Floor** (Workshop Stone `#eeeee9`): The page background. Nothing sits below this.
2. **Surface** (Pressed Linen `#f7f7f2` / card `#ffffff`): Raised content. Defined by a 1px Pale Render border, not a shadow. Cards, panels, sidebar.
3. **Floating** (Dropdowns, popovers, modals, toasts): `box-shadow: 0 8px 32px rgba(34, 39, 37, 0.14)`. Only three component types earn this tier.

### Shadow Vocabulary
- **Ambient Float** (`0 8px 32px rgba(34, 39, 37, 0.14)`): Dropdowns, notification panels, search results. Full page-context lift.
- **Hover Lift** (`0 10px 24px -12px rgba(34, 39, 37, 0.18)` + `translateY(-2px)`): Featured news cards and activity cards on hover. Motion is `220ms ease-out-quint`. Applied via `.hover-lift` utility.
- **Subtle Press** (none): Buttons use transform scale(0.97) on active, not a shadow.

### Named Rules
**The Flat-By-Default Rule.** At rest, surfaces are defined by borders alone. Shadows are earned by one of three conditions: the element floats above the page (dropdown/modal), it is in a hover-lift interactive state, or it carries a hero-level image. No other shadow usage is permitted.

## 5. Components

### Buttons
Solid and non-negotiable. No border-radius softening. No outline ghost that looks undecided.

- **Shape:** Gently rounded (8px / `rounded-md`). Consistent across all variants.
- **Primary:** TAVIL Red background (`#bf211e`), Pressed Linen text, 8px radius, padding 8px 16px. The only red button on any screen.
- **Hover / Focus:** Background shifts to Deep Lacquer (`#a21b18`). Focus ring: 2px TAVIL Red, 2px offset. Transition 160ms ease-out-cubic.
- **Active:** `scale(0.97)` transform at 110ms. No color change on press.
- **Ghost:** Transparent background, Pale Render border, Oxidised Slate text. Hover fills Workshop Stone. Used for cancel/secondary actions.
- **Destructive:** Same shape as primary, `background: #bf211e`. Destruction uses the same red — its context (modal title, confirmation copy) signals the danger, not a different hue.

### Chips (Filter Pills)
Used for category filtering in news, activities, and admin tables. Horizontal scroll strip on mobile.

- **Active:** TAVIL Red background, Pressed Linen text, 8px radius.
- **Default:** White background, Pale Render border, Oxidised Slate text. Hover shifts border to Mill Dust.
- **Behavior:** Only one primary-action chip active at a time. Multiple selections allowed in filter contexts.

### Cards / Containers
Cards are for genuinely distinct, actionable content. Not for wrapping nav lists.

- **Corner Style:** 12px radius (`rounded-xl`).
- **Background:** White (`#ffffff`) on Workshop Stone background. The contrast is created by tonal separation, backed by a 1px Pale Render border.
- **Shadow Strategy:** Flat at rest. `.hover-lift` shadow on news and activity cards only (user-navigable content). Data widgets (calendar, employee rows) do not hover-lift.
- **Internal Padding:** 16px standard (`p-4`). 20px for spacious data widgets (calendar). Never less than 12px.
- **Nested Cards:** Forbidden. Use spacing, dividers, or section labels to create hierarchy within a card.

### Inputs / Fields
Minimal stroke. Functional, not decorative.

- **Search Input:** Workshop Stone background, no border at rest, 8px radius. Transitions to White background + Pale Render border on focus.
- **Form Fields:** Pale Render border, White background, 8px radius. Border shifts to TAVIL Red on focus (2px). Error state: Pale border replaced by `#d44442` with `#f9eceb` background tint.
- **Disabled:** 50% opacity on the entire field. No special color treatment.

### Navigation

**Desktop Sidebar:** Fixed, 240px expanded / 64px collapsed. White surface. Section labels in Pale Mortar, 10px uppercase, 0.14em tracking. Nav items: Oxidised Slate at rest, system-ui 14px 500 weight. Active state: Workshop Stone tinted background + Pale Render border + TAVIL Red icon + 600 weight. Hover fills Workshop Stone.

**Mobile Bottom Nav:** Five primary tabs. Active tab: TAVIL Red icon + label. Inactive: Mill Dust. Background matches Pressed Linen surface.

**Underline Tabs:** Used for sub-section navigation (activities, news categories). `border-bottom: 2px solid TAVIL Red` on active tab. Inactive: transparent border, Mill Dust text. 44px minimum tap target on mobile.

### Kicker + Instrument Serif Pair (Signature Component)
The system's most distinctive pattern. A TAVIL Red uppercase label (11px, 600 weight, 0.14em tracking) sits above an Instrument Serif headline. Used on every screen as the arrival signal.

```
FORMACIÓ                    ← TAVIL Red kicker label
Campus TAVIL               ← Instrument Serif, 32px, weight 400
```

This pair is reserved for screen-level or section-level titles only. Never in a card, button, or list item.

## 6. Do's and Don'ts

### Do:
- **Do** use TAVIL Red (`#bf211e`) for primary actions, active states, and today indicators only. Its rarity is its power.
- **Do** pair the Kicker + Instrument Serif combination for every section entry. The arriving serif is the system's most recognizable gesture.
- **Do** use Workshop Stone (`#eeeee9`) as the hover background for interactive rows and nav items. It reads as "about to act" without introducing color.
- **Do** keep cards flat at rest. Borders define surfaces. Shadows appear only on hover-lift content cards and floating layers.
- **Do** ensure every interactive element has all states: hover, focus-visible, active, disabled. Incomplete states are shipping bugs.
- **Do** use system fonts for all UI text: buttons, labels, table cells, form fields, metadata. Instrument Serif is arrival-only.
- **Do** target WCAG AA contrast across all text/background combinations. The age-diverse workforce (factory floor + office) demands it.
- **Do** vary spacing to create rhythm. Section separations should be visibly larger than intra-section gaps.

### Don't:
- **Don't** use TAVIL Red on inactive or decorative elements. Red is reserved for action and identity. A red border on a hover state that isn't the primary target dilutes the signal.
- **Don't** use side-stripe borders greater than 1px as colored accents on list items, cards, or alerts. Rewrite with background tints, full borders, or leading icons.
- **Don't** use gradient text (`background-clip: text`). Any text that needs emphasis gets weight or size, never a gradient.
- **Don't** use glassmorphism (`backdrop-filter: blur`) decoratively. Blur is permitted only on overlay backdrops where contrast legibility demands it.
- **Don't** build hero-metric layouts (big number, small label, gradient accent). The user asked us explicitly to avoid this pattern.
- **Don't** build identical card grids: same-sized cards, same icon-heading-text structure, repeated across a page. Vary sizes, use lists, mix with non-card content.
- **Don't** default to modals. Every modal should have been a drawer, an inline expansion, or a page before it became a modal.
- **Don't** use Instrument Serif in buttons, chips, labels, table cells, form controls, or nav items. Serif is for display-level titles only.
- **Don't** let the portal look like generic SAP, Workday, Jira, or default MUI. If a screenshot could pass for any other enterprise HR tool, the design has failed.
- **Don't** use pure `#000000` or `#ffffff` as any surface or text color. Forge Ink and Pressed Linen carry warmth; pure values do not.
- **Don't** add animation for its own sake. Motion conveys state change, arrival, or departure. Decorative motion on idle components is prohibited.
- **Don't** nest cards inside cards. Ever.
