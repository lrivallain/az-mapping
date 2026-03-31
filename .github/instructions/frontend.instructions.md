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
| `sku-detail-modal.js` | `renderVmProfile()`, `renderZoneAvailability()`, `renderQuotaPanel()`, `renderConfidenceBreakdown()`, `renderPricingPanel()` |
| `data-filters.js` | `parseNumericFilter()`, `matchNumericFilter()`, `buildColumnFilters()`, `applyColumnFilters()` |

## CSS

- Use CSS custom properties (defined in `:root`) for all theme colors.
- Both light and dark themes **must** be maintained.
- Dark mode uses `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` selectors.

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
| `escapeHtml(str)` | Escape HTML entities |
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
