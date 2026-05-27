# Fluent UI v3 migration — status snapshot

> Branch: `feat/issue-165-designmd-fluent` · 6 commits ahead of `main` at
> snapshot time. Recorded as a working note so the migration can be
> paused and resumed. See [`DESIGN.md`](DESIGN.md) for the underlying
> design system spec.

This file captures **what is on Fluent today, what is still on Bootstrap
and why, and where the custom CSS leans**. It is descriptive, not
prescriptive — the next iteration of this work may decide to drop
Bootstrap entirely, keep more of it, or take a different shape.

---

## 1. Migrated to Fluent UI Web Components v3

Anything the **core app** owns and renders. Sibling/external plugins
are not in this column.

| Surface | Component |
|---|---|
| All navbar buttons (theme toggle, About, Plugin Manager, sign-out, plugin navbar actions) — [src/az_scout/templates/index.html](src/az_scout/templates/index.html) | `<fluent-button appearance="subtle" icon-only>` |
| About-modal links (Homepage, GitHub, API docs) — [src/az_scout/templates/index.html](src/az_scout/templates/index.html) | `<fluent-anchor-button>` |
| Login screen — primary "Sign in" + admin-consent + tenant submit — [src/az_scout/templates/login.html](src/az_scout/templates/login.html) | `<fluent-button appearance="primary">` / `<fluent-anchor-button>` |
| Topology *Select visible / Clear all / Load / Export PNG / Export CSV* — [src/az_scout/internal_plugins/topology/static/html/topology-tab.html](src/az_scout/internal_plugins/topology/static/html/topology-tab.html) | `<fluent-button>` (primary / outline / icon-only) |
| Planner *Load SKUs / Export CSV / Spot modal Cancel + Get Score* — [src/az_scout/internal_plugins/planner/static/html/planner-tab.html](src/az_scout/internal_plugins/planner/static/html/planner-tab.html) | `<fluent-button>` |
| Planner *Spot / Prices* column toggles | `<fluent-switch>` |
| Spinners across the UI (loading states) | `<fluent-spinner>` |
| Tooltips (D3 graph, etc.) | `<fluent-tooltip>` |
| Avatars in the chat panel | `<fluent-avatar>` |
| Badges emitted by [src/az_scout/static/js/components/sku-badges.js](src/az_scout/static/js/components/sku-badges.js) | `<fluent-badge>` |

Theme is driven by `setTheme(webLightTheme | webDarkTheme)` from
`@fluentui/tokens`, wired through `globalThis.applyFluentTheme()` in
[src/az_scout/templates/index.html](src/az_scout/templates/index.html).

---

## 2. Bootstrap classes still used by the core app (kept on purpose)

These are **not migrated** because they back JS APIs we use, or because
removing them would break the contract that sibling plugins rely on.

| Class family | Why kept | Where |
|---|---|---|
| `.modal`, `.modal-dialog`, `.modal-content`, `.modal-header/-body/-footer`, `.btn-close` | `bootstrap.Modal.getOrCreateInstance()` drives show/hide for Plugin Manager, About, Spot Score, [src/az_scout/static/js/components/sku-detail-modal.js](src/az_scout/static/js/components/sku-detail-modal.js) | both templates + both internal plugins |
| `.offcanvas`, `.offcanvas-header/-title/-body` | `bootstrap.Offcanvas` drives the chat panel + plugin navbar-action panes | [src/az_scout/templates/index.html](src/az_scout/templates/index.html) |
| `.nav-tabs`, `.nav-link`, `.nav-item`, `.tab-content`, `.tab-pane fade` | `bootstrap.Tab` drives the main plugin tab strip; restyling without replacing the JS would break tab switching | [src/az_scout/templates/index.html](src/az_scout/templates/index.html) |
| `.input-group`, `.input-group-sm`, `.input-group-text`, `.form-control`, `.form-select` | Used by Tenant / Region / Subscription / Currency / Filter inputs. No `<fluent-text-input>` / `<fluent-combobox>` parity yet for the dropdown + datalist behaviour we need. | both templates + both internal plugins |
| `.dropdown-menu` | Region combobox autocomplete dropdown — vanilla JS, not Bootstrap-driven, but uses BS styles | [src/az_scout/templates/index.html](src/az_scout/templates/index.html) |
| `.bi-*` icons (Bootstrap Icons font) | Used inside every `<fluent-button>` and every `<fluent-anchor-button>` — Fluent doesn't ship icons | everywhere |
| `.row`, `.col-*`, `.g-*`, `.d-flex`, `.d-none`, `.gap-*`, `.text-body-secondary`, `.me-1`, `.mb-3`, `.h-100`, `.w-100`, `.opacity-75`, `.border`, `.rounded`, `.fw-semibold`, `.pt-0`, `.px-3`, `.small` | Bootstrap utility / grid classes used for layout inside the login card, Spot modal body, planner controls row, topology controls row | both templates + both internal plugins |
| `.card`, `.card-header`, `.card-body` | Container for the topology subscription panel — Fluent v3 has no card component in the beta we ship | [src/az_scout/internal_plugins/topology/static/html/topology-tab.html](src/az_scout/internal_plugins/topology/static/html/topology-tab.html) |
| `data-bs-toggle`, `data-bs-target`, `data-bs-dismiss`, `data-bs-theme` | Bootstrap JS data API + theme attribute (also drives the `data-bs-theme="dark"` selector in CSS) | both templates |

`.btn` / `.alert` / `.form-switch` / `.badge` are the four families that
the **core app no longer emits**. Bootstrap still defines them in the
bundle, but only sibling plugins reach for them now.

---

## 3. Custom CSS in [src/az_scout/static/css/style.css](src/az_scout/static/css/style.css) — 1107 lines, by section

| § | Lines | Section | Leans toward | Notes |
|---|---|---|---|---|
| 1 | 24-37 | `.admin-only`, `select.no-arrow` | neutral | App utilities — no design system equivalent |
| 2 | 40-185 | **`--fl-*` Fluent 2 token layer** | **Fluent** | Brand + neutral + semantic ramps from fluent2.microsoft.design — feeds both `--bs-*` and `--colorBrand*` |
| 3 | 186-248 | Dark-theme overrides (`html[data-bs-theme="dark"]`) | **Fluent** | Re-binds the same `--fl-*` tokens to Fluent's dark palette |
| 4 | 249-272 | `body` typography (Segoe UI Variable stack, weights, monospace) | **Fluent** | Fluent 2 type system |
| 5 | 273-388 | **`.app-*` layout namespace** (body, navbar, brand, actions, main, selector-bar, plugin-tab-pane, footer, alert, alert-warning, alert-danger) | **Fluent** | Built entirely on `--fl-*` tokens — replaces what Bootstrap utilities used to do for our chrome |
| 6 | 390-406 | Fluent focus ring (`:focus-visible` brand 2-px outline) | **Fluent** | Matches Fluent 2 keyboard-focus spec |
| 7 | 407-508 | **Bootstrap component overrides** (`.btn`, `.btn-primary`, `.btn-outline-secondary`, `.card`, `.modal-content`, `.dropdown-menu`, `.offcanvas`, `.navbar.bg-body-tertiary`, `.form-control/.form-select/.input-group-text`, `.nav-tabs`, `.badge`, `.alert`) | **bridge** | Re-skins Bootstrap markup using `--fl-*` tokens — exists *only* so sibling plugins inherit the Fluent palette |
| 8 | 510-591 | Fluent UI Web Components v3 token shims (`--colorBrand*`, `--borderRadius*`, `--shadow*`) + dark-theme variant | **Fluent** | Fallback so `<fluent-*>` elements look right before `setTheme()` resolves |
| 9 | 593-608 | Region combobox dropdown | neutral | Feature-specific, uses `--fl-*` |
| 9 | 610-966 | Chat panel (FAB, slide-out, resize handle, header, messages, bubble, table, tool badges, choice chips, input area, pinned mode) | **Fluent** | All chat-panel chrome uses `--fl-*` tokens + Fluent radii / shadows |
| 9 | 967-1107 | About modal showcase + plugin rows + tab drag-and-drop | **Fluent** | Uses `--fl-*` tokens |

### Lean breakdown

- **Fluent-leaning custom CSS** (sections 2-6, 8, 9): ~**920 lines** — built on `--fl-*` tokens, the Fluent typography stack, Fluent focus ring, and Fluent component variables.
- **Bootstrap-bridge custom CSS** (section 7): ~**100 lines** — the only block that re-skins `.btn / .card / .modal / .form-* / .nav-tabs / .badge / .alert` Bootstrap markup, and it does so *with Fluent tokens*. It is a compatibility shim for sibling plugins; the core app no longer emits this markup.
- **Neutral utilities**: ~**30 lines** (admin-only, no-arrow, region combobox).

---

## TL;DR

| Bucket | Status |
|---|---|
| **Core app buttons / switches / spinners / badges / avatars / anchors** | 100 % Fluent UI v3 |
| **Bootstrap modal / offcanvas / tab JS hosts** | Kept — required by `bootstrap.Modal/Offcanvas/Tab` |
| **Bootstrap form inputs + grid utilities + icons** | Kept — no Fluent v3 parity in the beta we ship; also used by sibling plugins |
| **Custom CSS** | ~83 % Fluent-leaning, ~9 % Bootstrap-compatibility bridge (also written with Fluent tokens), ~3 % neutral utilities |

The only remaining places where the **core app** (not plugins) still
emits Bootstrap component markup are: the modal / offcanvas / tab hosts
(because their JS API is what we use), the input groups + form controls,
the topology `.card` panel, and Bootstrap Icons. Everything else has
moved to Fluent v3.

---

## Commits in this branch (since `main` @ `40b0261`)

```
41ca420  refactor(plugins): migrate built-in topology + planner to Fluent UI v3 (#165)
e54e62c  refactor(frontend): replace Bootstrap layout chrome in core templates with app-* namespace (#165)
9d104c9  refactor(css): clarify style.css section ownership + drop redundant dark-mode Fluent v3 shims (#165)
0ef54db  fix(frontend): load Fluent UI v3 from jsDelivr UMD + clarify Fluent 2 vs v3 terminology (#165)
ba19e76  feat(ui): migrate badges, spinners, tooltips, chips to Fluent UI Web Components v3 (#165)
b6ecb12  feat(ui): adopt DESIGN.md spec and Fluent UI Web Components v3
```

Quality gate green on every commit: `ruff check`, `ruff format --check`,
`mypy`, `pytest` (449 passed, 18 deselected).
