---
description: "Frontend conventions for az-scout: vanilla JS, CSS theming, Jinja2 templates, chat panel, marked.js. USE WHEN editing static JS/CSS files, HTML templates, or UI components."
applyTo: "src/az_scout/static/**,src/az_scout/templates/**"
---

# Frontend conventions

## JavaScript

- Vanilla JS only — no npm, no bundler, no frameworks.
- Use `const`/`let` (never `var`). Functions and variables use `camelCase`.
- Biome lint is enforced via pre-commit hooks.
- Scripts load order: auth.js → app.js → components/*.js → chat.js → plugins.js → plugin scripts → inline setup

## Shared JS components (`static/js/components/`)

Reusable renderers available to all plugins via the `window.azScout.components` namespace:

| Module | Functions |
|---|---|
| `sku-badges.js` | `scoreLabel()`, `renderConfidenceBadge()`, `renderSpotBadges()`, `renderSpotBadge()`, `renderZoneBadges()`, `renderQuotaBar()` |
| `sku-detail-modal.js` | `renderVmProfile()`, `renderZoneAvailability()`, `renderQuotaPanel()`, `renderConfidenceBreakdown()`, `renderPricingPanel()`, `showSkuDetailModal()` |
| `data-filters.js` | `parseNumericFilter()`, `matchNumericFilter()`, `buildColumnFilters()`, `applyColumnFilters()` |

## CSS

- The visual design system lives in [`DESIGN.md`](../../DESIGN.md) at the repo root — it documents the Fluent 2 token surface (brand, neutrals, type, radii, elevation) and the Fluent UI Web Components v3 component library that az-scout adopts.
- Tokens are materialised in [`src/az_scout/static/css/style.css`](../../src/az_scout/static/css/style.css) as `--fl-*` semantic variables and mapped onto Bootstrap (`--bs-*`) and Fluent v3 (`--colorBrand*`, `--borderRadius*`, `--shadow*`) variables. Use those rather than hardcoded hexes.
- Both light and dark themes **must** be maintained. The theme switch sets `data-bs-theme` on `<html>`; the `[data-bs-theme="dark"]` selector branch in `style.css` overrides the dark palette. The Fluent v3 bridge in `templates/index.html` mirrors the choice via `setTheme(webLightTheme|webDarkTheme)`.
- The legacy `[data-theme="dark"]` selector is no longer emitted; do not write new rules against it.

## Component library (Fluent UI Web Components v3)

- Loaded from CDN as an ES module: `<script type="module" src="https://unpkg.com/@fluentui/web-components@beta">`.
- Theme tokens from `@fluentui/tokens` are imported in the same `<script type="module">` block in [`templates/index.html`](../../src/az_scout/templates/index.html) and exposed via `globalThis.applyFluentTheme(name)`; `app.js`'s `applyTheme()` calls it whenever the user toggles light/dark.
- New chrome should prefer `<fluent-button>`, `<fluent-text-input>`, `<fluent-dropdown>`, `<fluent-dialog>`, `<fluent-switch>`, `<fluent-badge>`, etc. — see [`DESIGN.md`](../../DESIGN.md) for the migration table.
- Bootstrap markup keeps working: token overrides on `--bs-*` make plain `.btn`, `.card`, `.modal` look Fluent. Use Bootstrap where Fluent has no equivalent (grid, off-canvas, tab-strip drag-and-drop).

## HTML templates

- Minimal Jinja2 templating in `templates/index.html`.
- Static assets referenced via `url_for('static', ...)`.
- Plugin tabs/actions injected dynamically from `get_plugin_metadata()`.

## Shared globals (available to plugins)

| Global | Description |
|---|---|
| `apiFetch(url)` | GET with JSON parsing + error handling |
| `apiPost(url, body)` | POST helper |
| `aiComplete(prompt, options?)` | Non-streaming AI completion (returns `{content, tool_calls}`) |
| `aiEnabled` | `true` if AI chat/completion is configured |
| `renderMarkdown(md)` | Render Markdown to HTML via marked.js |
| `tenantQS(prefix)` | Returns `?tenantId=…` or `""` |
| `escapeHtml(str)` | OWASP Rule #1 entity encoding (`& < > " '`). **Must** be used on every value interpolated into `innerHTML` or attribute contexts. Handles both body and attribute (including `title="..."`, `data-*="..."`) safely. |
| `subscriptions` | `[{id, name}]` array |
| `regions` | `[{name, displayName}]` array |

## Chat panel

- `_renderMarkdown()` in chat.js uses marked.js with custom extensions:
  - `[[choice text]]` → clickable chip buttons
  - Tables get `chat-table` CSS class
  - Headers use compact margins
  - Lists of all-chip items become compact chip groups
- Chat bubbles use `overflow-x: auto` for wide tables.

## Context changes

Plugins react to tenant/region changes via DOM events or MutationObserver on `#region-select`.

## XSS prevention

- **Every** value from Azure APIs or user input interpolated into `innerHTML` **must** be escaped with `escapeHtml()`.
- This applies to both element body (`<span>${escapeHtml(name)}</span>`) and attribute contexts (`title="${escapeHtml(tip)}"`).
- `escapeHtml()` encodes the 5 OWASP-mandated characters: `& < > " '`.
- Do **not** define local escape helpers in plugin JS — reuse the global `escapeHtml()` from `app.js`.
- For standalone HTML fragments loaded outside `app.js` (e.g. `catalog.html`), use a local fallback that applies the same 5 replacements.
