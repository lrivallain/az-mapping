---
version: alpha
name: az-scout
description: |
  Azure Scout's visual design system. Adopts the Microsoft Fluent 2 design
  language (token surface — brand ramp, neutral ramp, type ramp, corner radii,
  elevation) and implements it with the Fluent UI Web Components v3 (beta)
  library. A thin Bootstrap 5.3 compatibility layer maps the same tokens onto
  `--bs-*` variables so plugin markup using Bootstrap classes stays in theme.
colors:
  # Brand ramp (Fluent 2 Communication blue, brand80)
  brand-primary: "#0F6CBD"
  brand-primary-hover: "#115EA3"
  brand-primary-pressed: "#0C3B5E"
  brand-primary-selected: "#0C3B5E"
  brand-on-primary: "#FFFFFF"
  brand-tint-10: "#2886DE"
  brand-tint-20: "#479EF5"
  brand-tint-30: "#62ABF5"
  brand-tint-40: "#96C6FA"
  brand-tint-50: "#CFE4FA"
  brand-tint-60: "#EBF3FC"
  brand-tint-70: "#F6FAFE"

  # Semantic light theme
  primary: "{colors.brand-primary}"
  secondary: "#616161"     # grey38 — neutral foreground 3
  tertiary: "#D1D1D1"      # grey82 — neutral stroke accessible
  surface: "#FFFFFF"       # canvas
  surface-alt: "#FAFAFA"   # canvas-subtle (grey98)
  surface-raised: "#FFFFFF"
  surface-overlay: "#FFFFFF"
  on-surface: "#242424"    # neutral foreground 1 (grey14)
  on-surface-muted: "#616161"
  on-surface-disabled: "#BDBDBD"
  border: "#D1D1D1"        # neutral stroke 1
  border-subtle: "#E0E0E0" # neutral stroke 2
  divider: "#F0F0F0"       # neutral stroke 3

  # Semantic dark theme (Fluent 2 dark canvas = grey4 #0A0A0A)
  primary-dark: "{colors.brand-tint-20}"
  on-primary-dark: "#FFFFFF"
  surface-dark: "#141414"          # canvas dark (grey8 — slightly raised vs. true #0A0A0A for legibility)
  surface-alt-dark: "#1F1F1F"      # grey12
  surface-raised-dark: "#292929"   # grey16
  surface-overlay-dark: "#333333"  # grey20
  on-surface-dark: "#F5F5F5"       # neutral foreground 1 dark (grey96)
  on-surface-muted-dark: "#D6D6D6"
  on-surface-disabled-dark: "#5C5C5C"
  border-dark: "#525252"           # neutral stroke 1 dark
  border-subtle-dark: "#383838"
  divider-dark: "#292929"

  # Status (Fluent 2 shared colors, shade 30 light / tint 30 dark)
  success: "#107C10"
  success-bg: "#DFF6DD"
  warning: "#F7630C"
  warning-bg: "#FFF4CE"
  danger: "#C50F1F"
  danger-bg: "#FDE7E9"
  info: "{colors.brand-primary}"
  info-bg: "{colors.brand-tint-60}"

typography:
  base:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
  display:
    fontFamily: '"Segoe UI Variable Display", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif'
    fontWeight: 600
  monospace:
    fontFamily: '"Cascadia Code", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace'
  # Fluent 2 type ramp (ramp / line-height / weight)
  caption-2: { fontSize: 10px, lineHeight: 14px, fontWeight: 400 }
  caption-1: { fontSize: 12px, lineHeight: 16px, fontWeight: 400 }
  body-1:    { fontSize: 14px, lineHeight: 20px, fontWeight: 400 }
  body-2:    { fontSize: 16px, lineHeight: 22px, fontWeight: 400 }
  subtitle-2:{ fontSize: 16px, lineHeight: 22px, fontWeight: 600 }
  subtitle-1:{ fontSize: 20px, lineHeight: 28px, fontWeight: 600 }
  title-3:   { fontSize: 24px, lineHeight: 32px, fontWeight: 600 }
  title-2:   { fontSize: 28px, lineHeight: 36px, fontWeight: 600 }
  title-1:   { fontSize: 32px, lineHeight: 40px, fontWeight: 600 }
  large-title: { fontSize: 40px, lineHeight: 52px, fontWeight: 600 }
  display-1: { fontSize: 68px, lineHeight: 92px, fontWeight: 700 }

rounded:
  none: 0
  small: 2px
  medium: 4px   # Fluent 2 default (buttons, inputs, badges)
  large: 6px    # cards, tab pills
  xlarge: 8px   # modals, dialogs, chat panel
  circular: 9999px

spacing:
  # Fluent 2 spacing tokens (4-px base)
  none: 0
  xxs: 2px
  xs: 4px
  s: 8px
  m: 12px
  l: 16px
  xl: 20px
  xxl: 24px
  xxxl: 32px

elevation:
  # Fluent 2 shadow tokens — neutral ambient + key
  shadow-2:  "0 0 2px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.14)"
  shadow-4:  "0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)"
  shadow-8:  "0 0 2px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.14)"
  shadow-16: "0 0 2px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.14)"
  shadow-28: "0 0 8px rgba(0, 0, 0, 0.12), 0 14px 28px rgba(0, 0, 0, 0.14)"
  shadow-64: "0 0 8px rgba(0, 0, 0, 0.12), 0 32px 64px rgba(0, 0, 0, 0.14)"

components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.brand-on-primary}"
    rounded: "{rounded.medium}"
    padding: "5px 12px"
    typography: "{typography.body-1}"
    fontWeight: 600
    minHeight: 32px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.medium}"
    padding: "5px 12px"
    minHeight: 32px
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border-subtle}"
    rounded: "{rounded.large}"
    padding: "{spacing.l}"
    elevation: "{elevation.shadow-4}"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xlarge}"
    padding: "{spacing.xxl}"
    elevation: "{elevation.shadow-28}"
  navbar:
    backgroundColor: "{colors.surface-alt}"
    borderBottom: "1px solid {colors.border-subtle}"
    height: 48px
    padding: "0 {spacing.l}"
  chat-panel:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.xlarge}"
    elevation: "{elevation.shadow-16}"
  focus-ring:
    color: "{colors.brand-primary}"
    width: 2px
    offset: 2px
---

# Azure Scout — Design System

## Overview

Azure Scout's UI adopts the **Microsoft Fluent 2** ([fluent2.microsoft.design](https://fluent2.microsoft.design/)) design language end-to-end:

1. **Component library** — [`@fluentui/web-components`](https://github.com/microsoft/fluentui/tree/master/packages/web-components) **v3** (beta), loaded from CDN as a self-registering UMD bundle. Native browser custom elements; no bundler, no framework, no npm.
2. **Token surface** — brand ramp, neutral ramp, type ramp, corner radii, and elevation tokens defined here and materialised as CSS variables.
3. **Bootstrap 5.3 compatibility layer** — the same tokens are mapped onto `--bs-*` variables so that **plugin** markup using Bootstrap classes (modals, off-canvas, tab strip, grid utilities) keeps working and visually matches. Core templates no longer rely on Bootstrap for layout — they use the Fluent token surface directly.

Plugin authors can use either Fluent web components (`<fluent-button>`, `<fluent-text-input>`, `<fluent-switch>`, …) or Bootstrap classes — both consume the same tokens and stay in sync with the core theme automatically.

### Naming: "Fluent 2" vs "Fluent UI v3"

The two terms appear together throughout this codebase and are **not interchangeable** — they describe different things, and Microsoft itself uses both:

| Term | Meaning | Where you see it |
|---|---|---|
| **Fluent 2** | The **design system** — the spec for color, typography, spacing, radii, elevation, motion. Versioned independently of any implementation. | Token names (`--fl-color-*`, `--fl-radius-*`), DESIGN.md front matter, code comments that reference design semantics. |
| **Fluent UI Web Components v3** (also "Fluent UI v3" / "Fluent v3") | The **library** that implements Fluent 2 as native browser custom elements. Major version 3 of `@fluentui/web-components`. | `<fluent-button>`, `<fluent-tablist>`, …; the CDN bundle URL; any reference to the runtime components. |

When in doubt: use **"Fluent 2"** when referring to tokens or design semantics, and **"Fluent UI v3"** when referring to the components themselves.

**Source of truth:** this file.
**Runtime materialisation:** [`src/az_scout/static/css/style.css`](src/az_scout/static/css/style.css) (the `:root` and `[data-bs-theme="dark"]` blocks at the top).
**Component bundle:** loaded in [`templates/index.html`](src/az_scout/templates/index.html) and [`templates/login.html`](src/az_scout/templates/login.html) via `<script src="https://cdn.jsdelivr.net/npm/@fluentui/web-components@beta/dist/web-components.min.js">` (self-registering UMD; the raw ESM build uses a bare `tslib` import the browser can't resolve).

## Colors

The palette is derived from Fluent 2's **Communication blue** brand ramp (`#0F6CBD` at brand 80) and the neutral grey ramp.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--fl-color-brand-primary` | `#0F6CBD` | `#479EF5` | Accents, links, primary buttons |
| `--fl-color-brand-primary-hover` | `#115EA3` | `#62ABF5` | Hover state |
| `--fl-color-brand-primary-pressed` | `#0C3B5E` | `#96C6FA` | Active/pressed state |
| `--fl-color-surface` | `#FFFFFF` | `#141414` | Cards, modals, panels |
| `--fl-color-surface-alt` | `#FAFAFA` | `#1F1F1F` | Navbar, tertiary backgrounds |
| `--fl-color-on-surface` | `#242424` | `#F5F5F5` | Body text |
| `--fl-color-on-surface-muted` | `#616161` | `#D6D6D6` | Secondary text |
| `--fl-color-border` | `#D1D1D1` | `#525252` | Form controls, tab strip |
| `--fl-color-border-subtle` | `#E0E0E0` | `#383838` | Card borders |
| `--fl-color-success` | `#107C10` | `#54B054` | Healthy / available |
| `--fl-color-warning` | `#F7630C` | `#FCE100` | Attention |
| `--fl-color-danger` | `#C50F1F` | `#E37D80` | Errors, knockouts |

These tokens map onto the standard Bootstrap variables (`--bs-primary`, `--bs-body-bg`, `--bs-border-color`, …) so existing Bootstrap classes pick them up automatically.

The legacy `--az-blue` and `--az-dark` custom properties remain available as `--fl-color-brand-primary` and `--fl-color-brand-primary-pressed` aliases for backward compatibility with sibling plugins.

## Typography

Fluent 2 uses the **Segoe UI Variable** family (with `Display`, `Text`, and `Small` optical sizes). The stack falls back to `Segoe UI` on Windows and to the OS UI font elsewhere — no font is downloaded.

```css
font-family: "Segoe UI Variable Text", "Segoe UI Variable",
             "Segoe UI", system-ui, -apple-system,
             BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
```

Headings use the **Display** optical sub-family at weight 600. Monospace (chat code blocks, JSON output) uses **Cascadia Code** with fallback to `SFMono-Regular`, `Consolas`, and the system monospace font.

The full ramp (Caption 2 → Display 1) is defined in the front matter `typography` block. Bootstrap's `--bs-body-font-size` is set to **14 px** (Fluent body-1) for parity with Fluent surfaces; use `.fs-6` (16 px / body-2) for emphasised body text.

## Layout

- **Grid:** the core templates use plain CSS flex / grid driven by the `--fl-space-*` token scale. Plugins may use the Bootstrap 12-column grid (it stays available via the Bootstrap CSS bundle); both approaches share the same `4-px` spacing rhythm.
- **Page chrome:** 48-px navbar (`{components.navbar.height}`), 1-px border-subtle bottom rule, no shadow.
- **Spacing scale:** 2/4/8/12/16/20/24/32 px (Fluent 2 4-px base). Both Bootstrap utilities (`p-1`, `gap-2`, `mb-3`, …) and the core `--fl-space-*` tokens keep the same 4-px relationship.

## Elevation & Depth

Fluent 2 elevations are ambient + key shadows in 6 stops. Az-scout uses:

| Stop | Used for |
|---|---|
| `--fl-elev-2` | Hovered list rows, dropdowns |
| `--fl-elev-4` | Cards (default) |
| `--fl-elev-8` | Sticky bars, popovers |
| `--fl-elev-16` | **Chat panel** (slide-out) |
| `--fl-elev-28` | **Modals & dialogs** |
| `--fl-elev-64` | Full-screen takeovers (reserved) |

Dark theme uses the **same shadow values** — Fluent treats elevation as a property of the surface, not a colour swap.

## Shapes

- **Buttons, inputs, badges, chips:** `4px` radius (Fluent default — `{rounded.medium}`)
- **Cards, tab pills:** `6px` (`{rounded.large}`)
- **Modals, chat panel, off-canvas:** `8px` (`{rounded.xlarge}`)
- **FAB (chat launcher):** `circular`

## Components

### Component library: Fluent UI Web Components v3

The canonical implementation of every Fluent control is a native browser custom element from `@fluentui/web-components@beta`. The CDN bundle exposes `setTheme` on `globalThis` so the same library powers theme switching between `webLightTheme` and `webDarkTheme`.

Available tags currently used or recommended by az-scout (full list at the [package source](https://github.com/microsoft/fluentui/tree/master/packages/web-components/src)):

| Tag | Use |
|---|---|
| `<fluent-button>` / `<fluent-anchor-button>` / `<fluent-toggle-button>` / `<fluent-compound-button>` / `<fluent-menu-button>` | All buttons, navbar action chips, theme toggle |
| `<fluent-text-input>` / `<fluent-textarea>` | Region search, chat composer |
| `<fluent-dropdown>` / `<fluent-listbox>` / `<fluent-option>` | Tenant selector, region picker |
| `<fluent-tablist>` / `<fluent-tab>` | Main tab strip (long-term — see *Migration plan* below) |
| `<fluent-dialog>` / `<fluent-drawer>` | About, Plugin Manager, plugin off-canvas panels |
| `<fluent-switch>` / `<fluent-checkbox>` / `<fluent-radio-group>` | Settings toggles |
| `<fluent-badge>` / `<fluent-counter-badge>` | Status pills (zones, scoring) |
| `<fluent-tooltip>` | Hover help |
| `<fluent-spinner>` / `<fluent-progress-bar>` | Loading states |
| `<fluent-message-bar>` | Inline alerts |
| `<fluent-divider>` | Section separators |

### Migration plan

This file documents the **target** state. Live migration of every control is incremental and lives under [#165](https://github.com/az-scout/az-scout/issues/165):

| Surface | Today | Target |
|---|---|---|
| Navbar action buttons | ✅ `<fluent-button appearance="subtle">` | done (wave B) |
| Theme toggle | ✅ `<fluent-button>` calling `setTheme()` | done (wave B) |
| Primary chat send / login submit | ✅ `<fluent-button appearance="primary">` | done (wave B) |
| Chat thinking dots | ✅ `<fluent-spinner size="tiny">` | done (wave C) |
| Tool-call status pills | ✅ `<fluent-badge color="warning\|success">` | done (wave C) |
| Chat choice chips | ✅ `<fluent-button shape="circular" appearance="outline">` | done (wave C) |
| Chat mode toggle (pill switch) | ✅ `<fluent-tablist appearance="subtle">` + `<fluent-tab>` | done (wave C) |
| Chat header buttons + tooltips | ✅ `<fluent-button icon-only>` + `<fluent-tooltip>` | done (wave C) |
| About modal links | ✅ `<fluent-anchor-button shape="circular">` | done (wave C) |
| About version + plugin version | ✅ `<fluent-badge appearance="tint">` | done (wave C) |
| About plugin row icon | ✅ `<fluent-avatar color="brand">` | done (wave C) |
| Loading spinners (PM, topology, planner) | ✅ `<fluent-spinner>` | done (wave C) |
| Plugin source badges (pypi / github / built-in / not-loaded) | ✅ `<fluent-badge appearance="filled">` | done (wave C) |
| About / Plugin Manager modals | Bootstrap `.modal` | Kept as Bootstrap `.modal` — these are part of the **plugin surface**: Plugin Manager renders into `.modal-body`, and sibling plugins (e.g. SKU detail) reuse the same Bootstrap modal machinery. Migrating would force every plugin to rewrite its modal calls. |
| Main tab strip (`#mainTabs`) | Bootstrap `.nav-tabs` | Kept as Bootstrap `.nav-tabs` — plugins register tabs by emitting `<button data-bs-toggle="tab">`. This is the **plugin contract**. |
| Plugin off-canvas panels | Bootstrap `.offcanvas` | Kept — also part of the **plugin contract** (plugin navbar actions). |
| Region combobox | Bootstrap input + custom dropdown | `<fluent-dropdown>` (later) |
| Plugin Manager action buttons | Bootstrap `.btn` w/ tooltips | `<fluent-button>` (later — Bootstrap tooltip JS used elsewhere) |

### Core vs plugin surfaces

The migration table above intentionally **stops at the plugin contract boundary**. The core templates (`index.html`, `login.html`) no longer use Bootstrap for layout — they rely on the Fluent token surface and a thin `app-*` utility namespace. But every surface that plugins emit, render into, or open programmatically (modals, off-canvas drawers, the tab strip, form controls inside plugin panels) **stays as Bootstrap markup** so sibling plugins keep working without modification.

The Bootstrap CSS + JS bundles are still loaded in `index.html` for that reason. They are a **compatibility runtime** for plugins, not a core dependency.

### Component contracts

Each component below pins a Fluent 2 spec. Core templates use `<fluent-*>` web components wherever the v3 library provides one; the remaining Bootstrap-classed components below are kept for **plugin compatibility** and are theme-aligned via the `--bs-*` bridge in `style.css`.

### Primary button (`button-primary`)
- Spec: brand fill, white foreground, 32 px min-height, 4 px radius, 2 px brand focus ring
- Selector: `.btn-primary`, `.btn.btn-primary` (Bootstrap)

### Secondary button (`button-secondary`)
- Spec: transparent fill, 1 px border, neutral foreground, same height as primary
- Selector: `.btn-outline-secondary`, `.btn.btn-outline-*`

### Card
- Spec: `--fl-color-surface` fill, 1 px `--fl-color-border-subtle`, 6 px radius, shadow-4
- Selector: `.card`

### Modal / dialog
- Spec: 8 px radius, shadow-28, 24 px padding, brand-coloured close button focus ring
- Selector: `.modal-content`

### Chat panel
- Spec: 8 px radius, shadow-16, brand-tinted header
- Selector: `.chat-panel`

### Navbar
- Spec: 48 px, `--fl-color-surface-alt` fill, no shadow, 1 px bottom rule
- Selector: `.navbar.bg-body-tertiary`

### Focus ring (global)
- Spec: 2 px brand outline at 2 px offset (Fluent 2 default)
- Implementation: `:focus-visible { outline: 2px solid var(--fl-color-brand-primary); outline-offset: 2px; }`

## Do's and Don'ts

### ✅ Do

- Reference tokens via Bootstrap variables (`var(--bs-primary)`, `var(--bs-body-bg)`) or the `--fl-*` aliases — never hardcode a hex.
- Use the existing Bootstrap component classes; the Fluent look comes from token overrides, not from rewriting markup.
- Support both `data-bs-theme="light"` and `data-bs-theme="dark"` — the variables resolve automatically.
- Pick the lowest elevation that still communicates depth.
- Use the `focus-visible` pseudo-class for keyboard focus rings; default browser rings are suppressed.

### ❌ Don't

- Don't introduce new colour hexes outside this file — propose a token first.
- Don't add `box-shadow: 0 4px 12px rgba(0,0,0,0.25)` ad-hoc; pick `--fl-elev-*`.
- Don't depend on the legacy `[data-theme="dark"]` selector — only `[data-bs-theme="dark"]` is emitted.
- Don't load additional font families — the Segoe UI Variable / Cascadia stack is the canonical voice.
- Don't override `:root` tokens from a plugin — plugins extend with their own namespaced variables.

## Versioning

This document follows the [google-labs-code `design.md` spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), `version: alpha`. Token additions are non-breaking; token removals or palette changes require a CalVer minor bump and a CHANGELOG entry.
