---
name: principal-frontend-engineer
description: >-
  Translates the ManuTracker v2 design system into React components styled with
  CSS Modules and design tokens. Enforces token-first styling, correct font
  roles, prototype reading rules, and design fidelity verification. Apply when
  implementing or migrating any frontend component, page, or layout. Complements
  principal-engineer (coding style) and code-quality-react (review checklist).
---

# Principal Frontend Engineer — Design-to-Code Translation

This skill bridges the gap between the design system artifacts in `docs/design/v2/` and the React frontend in `manu-gen/frontend/src/`. It defines how to consume design specs, not how to create them.

## Canonical Design References

Read these on demand — do not memorize, do read before implementing.

| Document | When to read |
|----------|-------------|
| [tokens/manutracker-tokens-v2.css](docs/design/v2/tokens/manutracker-tokens-v2.css) | Before styling any component — this is the single source of truth for all CSS custom properties |
| [DESIGN-SYSTEM.md](docs/design/v2/DESIGN-SYSTEM.md) | Before implementing a component — contains prop tables, states, and usage rules |
| [prototypes/manutracker-full-prototype-v2.html](docs/design/v2/prototypes/manutracker-full-prototype-v2.html) | For layout reference — open in browser, navigate with the bottom pill bar |
| [REVIEW.md](docs/design/v2/REVIEW.md) | Before starting a new screen — check for known open items |

---

## Styling Architecture — CSS Modules

All component styling uses **CSS Modules** (`.module.css` files). Vite has built-in CSS module support — no extra dependencies.

**File convention:** one `.module.css` per component that needs styles, co-located next to the `.tsx` file. Components with no visual styling (like `App.tsx`) have no CSS file.

```
src/
  shared/components/
    Sidebar.tsx
    Sidebar.module.css
  features/stations/components/
    StationCard.tsx
    StationCard.module.css
```

**Class naming inside modules:** flat, descriptive names (`root`, `header`, `card`, `active`, `badge`). CSS Modules scope them automatically — no BEM needed.

**TSX import pattern:**
```tsx
import styles from './MyComponent.module.css';

<div className={styles.root}>
  <h2 className={styles.heading}>Title</h2>
</div>
```

**Conditional classes:** use template literals, not a classnames library:
```tsx
<a className={`${styles.navItem} ${isActive ? styles.active : styles.idle}`}>
```

**No Tailwind.** The project does not use Tailwind CSS. Do not add Tailwind utility classes, `@apply` directives, `@theme` blocks, or Tailwind-style arbitrary properties (`bg-[--token]`). All styling lives in `.module.css` files referencing design tokens via `var()`.

---

## Token-First Styling Contract

Every visual property in a component's CSS module must resolve to a CSS custom property from the token file. No exceptions.

**Allowed:**
```css
.card {
  background: var(--surface);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  padding: var(--card-padding);
}
```

**Prohibited:**
```css
.card {
  background: #ffffff;
  color: #4a5568;
  border-radius: 8px;
  padding: 24px;
}
```

**Rules:**
- No raw hex values in `.module.css` files.
- No hardcoded pixel values for properties that have a token (spacing, radii, font sizes, shadows, etc.). Raw `px` is only acceptable for structural values with no token (e.g., `1px` border width).
- If a visual property has no matching token, **stop and ask** — do not invent a token or use a raw value.
- The token file (`manutracker-tokens-v2.css`) always wins over values found inside the HTML prototype if they conflict.

---

## Responsive Design

Use standard CSS media queries inside `.module.css` files. The primary breakpoint is `1024px` (desktop).

```css
.main {
  padding: var(--content-padding-sm);
}

@media (min-width: 1024px) {
  .main {
    padding: var(--content-padding);
  }
}
```

Group media queries at the bottom of each `.module.css` file, or inline with the class they modify — pick one approach per file and be consistent.

---

## Font Roles — Three Fonts, Three Jobs

Every text element must use the correct font family. This is a design contract, not a preference.

| Font | Token | CSS usage | Use for |
|------|-------|-----------|---------|
| Barlow Condensed | `--font-heading` | `font-family: var(--font-heading)` | Page titles, KPI stat values, logo wordmark |
| Barlow | `--font-body` | `font-family: var(--font-body)` | Body text, form labels, descriptions, nav items, buttons |
| DM Mono | `--font-mono` | `font-family: var(--font-mono)` | Codes, IDs, timestamps, durations, table headers, status badges, sidebar section labels |

**Common mistake:** Using Barlow (body) for table column headers. Table headers use DM Mono, 10px, uppercase, `--tracking-wider`.

---

## Prototype Reading Rules

The HTML prototype is the **authoritative reference for what to render** — which elements exist, their structure, and layout. It is not a copy-paste source.

**Hierarchy of truth:**
- **What to render** (structure, which elements exist, screen layout): prototype wins over DESIGN-SYSTEM.md if they conflict. DESIGN-SYSTEM.md may contain stale descriptions of removed or changed elements.
- **How to style it** (token values — colors, spacing, sizes): token file wins over prototype if they conflict.
- **Component prop APIs and state specs**: DESIGN-SYSTEM.md is authoritative (prototype has no prop tables).

1. **Use full token names only.** The prototype contains short aliases (`.ac`, `.btn-p`, `.dt`, `.lc`) — these are deprecated. Map them to their full equivalents (`.app-content`, `.btn-primary`, `.data-table`, etc.).
2. **Inline SVGs in the prototype are placeholders.** Use Lucide React components instead. See DESIGN-SYSTEM.md Section 7 for the icon mapping table.
3. **Prototype JS is throwaway.** The `nav()`, `switchTab()`, and modal functions are vanilla JS demos. Implement equivalent behavior in React with proper state management.
4. **When prototype and token file conflict on values, the token file wins.** Example: prototype may show `32px` button height; token file defines `--btn-height: 34px`. Use the token.

---

## Component Implementation Checklist

Run this for every component you implement or migrate.

### Before writing code
- [ ] Read the component spec in DESIGN-SYSTEM.md (props, states, tokens)
- [ ] Open the prototype in a browser and find the component in context
- [ ] Identify which tokens apply (color, spacing, typography, radius, shadow)

### While writing code
- [ ] All colors reference design tokens via `var()` — no hex, no hardcoded values
- [ ] Correct font family per role (heading / body / mono) via `var(--font-*)`
- [ ] Correct font size, weight, and letter-spacing tokens
- [ ] Spacing uses `var(--space-*)` tokens (4px base scale)
- [ ] Border radius uses `var(--radius-*)` tokens
- [ ] Icons use Lucide React, size 20px default, stroke 1.5, `currentColor`
- [ ] All interactive states implemented: default, hover, focus, active, disabled
- [ ] Loading and error states implemented where applicable
- [ ] Keyboard accessible: focusable, Enter/Space activate, visible focus ring
- [ ] Transitions use `var(--duration-*)` and `var(--easing-*)` tokens

### After writing code
- [ ] Visual comparison against prototype — layout, spacing, typography match
- [ ] Linter passes
- [ ] TypeScript compiles (`tsc --noEmit`)

---

## Escalation Rules

**Defer to the design spec when:**
- Token values, component props, and state definitions are documented
- Layout structure is clear from the prototype
- Icon mapping is listed in DESIGN-SYSTEM.md Section 7

**Raise a question (ask the user) when:**
- A component state is not documented (e.g., empty state for a specific entity)
- The prototype shows a value that contradicts the token file
- Responsive behavior below 1024px is unclear for a specific layout
- A new token is needed that doesn't exist in the token file
- The prototype uses a pattern not covered in DESIGN-SYSTEM.md

---

## Anti-Patterns

- **Using Tailwind utility classes.** The project does not use Tailwind. No `bg-white`, `flex`, `rounded-lg`, `text-gray-600`, `@apply`, or arbitrary value syntax (`bg-[--token]`). All styling goes in `.module.css` files.
- **Putting styles in `className` strings.** Do not inline styles or use string-based class utilities. Use CSS Module references: `className={styles.card}`.
- **Hardcoding font-family in TSX.** Use `var(--font-heading)`, `var(--font-body)`, `var(--font-mono)` in the `.module.css` file.
- **Skipping the mono font for data.** Table headers, IDs, timestamps, badges, and codes must use DM Mono. Barlow in a table header is a design bug.
- **Inventing spacing values.** Use `var(--space-5)` (20px) or `var(--space-6)` (24px). Never use a pixel value outside the 4px token scale.
- **Using inline SVG instead of Lucide React.** The prototype uses inline SVGs for demo purposes. Production code uses `<Icon size={20} strokeWidth={1.5} />` from `lucide-react`.
- **Global CSS for component styles.** Each component's styles live in its own `.module.css` file. Only `index.css` and `design-tokens.css` are global.
