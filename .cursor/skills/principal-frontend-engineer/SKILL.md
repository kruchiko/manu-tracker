---
name: principal-frontend-engineer
description: >-
  Translates the ManuTracker v2 design system into React/Tailwind components.
  Enforces token-first styling, correct font roles, prototype reading rules,
  and design fidelity verification. Apply when implementing or migrating any
  frontend component, page, or layout. Complements principal-engineer (coding
  style) and code-quality-react (review checklist).
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

## Token-First Styling Contract

Every visual property in a React component must resolve to a CSS custom property from the token file. No exceptions.

**Allowed:**
```css
background: var(--surface);
color: var(--text-secondary);
```

```html
<div className="bg-[--surface] text-[--text-secondary]">
```

**Prohibited:**
```css
background: #ffffff;
color: #4a5568;
```

```html
<div className="bg-white text-gray-600">
```

**Rules:**
- No raw hex values in component CSS or Tailwind classes.
- No default Tailwind palette colors (`bg-gray-50`, `text-blue-700`, etc.) — use token-mapped classes instead.
- If a visual property has no matching token, **stop and ask** — do not invent a token or use a raw value.
- The token file (`manutracker-tokens-v2.css`) always wins over values found inside the HTML prototype if they conflict.

---

## Tailwind v4 + CSS Variables Integration

Tokens are wired into Tailwind via `@theme` in `src/index.css`. This makes them available as utility classes.

**Pattern — `@theme` mapping:**
```css
@theme {
  --color-surface: var(--surface);
  --color-accent: var(--accent);
  --font-heading: var(--font-heading);
}
```

This enables `bg-surface`, `text-accent`, `font-heading` as utility classes.

**When to use `@theme` aliases vs. arbitrary properties:**

| Approach | Syntax | Use when |
|----------|--------|----------|
| `@theme` alias | `bg-surface` | Token is used in 3+ components — worth a named utility |
| Arbitrary property | `bg-[--surface-hover]` | Token is used in 1-2 places, or is layout-specific (`--sidebar-width`) |

Prefer `@theme` aliases for all tokens in sections 1-8 of the token file (colors, text, spacing, radii, shadows). Use arbitrary properties for layout dimensions and one-off values.

---

## Font Roles — Three Fonts, Three Jobs

Every text element must use the correct font family. This is a design contract, not a preference.

| Font | Token | Use for |
|------|-------|---------|
| Barlow Condensed | `--font-heading` | Page titles, KPI stat values, logo wordmark |
| Barlow | `--font-body` | Body text, form labels, descriptions, nav items, buttons |
| DM Mono | `--font-mono` | Codes, IDs, timestamps, durations, table headers, status badges, sidebar section labels |

**Common mistake:** Using Barlow (body) for table column headers. Table headers use DM Mono, 10px, uppercase, `--tracking-wider`.

---

## Prototype Reading Rules

The HTML prototype is a **layout and structure reference**, not a copy-paste source.

1. **Use full token names only.** The prototype contains short aliases (`.ac`, `.btn-p`, `.dt`, `.lc`) — these are deprecated. Map them to their full equivalents (`.app-content`, `.btn-primary`, `.data-table`, etc.).
2. **Inline SVGs in the prototype are placeholders.** Use Lucide React components instead. See DESIGN-SYSTEM.md Section 7 for the icon mapping table.
3. **Prototype JS is throwaway.** The `nav()`, `switchTab()`, and modal functions are vanilla JS demos. Implement equivalent behavior in React with proper state management.
4. **When prototype and token file conflict, the token file wins.** Example: prototype may show `32px` button height; token file defines `--btn-height: 34px`. Use the token.

---

## Component Implementation Checklist

Run this for every component you implement or migrate.

### Before writing code
- [ ] Read the component spec in DESIGN-SYSTEM.md (props, states, tokens)
- [ ] Open the prototype in a browser and find the component in context
- [ ] Identify which tokens apply (color, spacing, typography, radius, shadow)

### While writing code
- [ ] All colors reference design tokens — no hex, no Tailwind defaults
- [ ] Correct font family per role (heading / body / mono)
- [ ] Correct font size, weight, and letter-spacing tokens
- [ ] Spacing uses `--space-*` tokens (4px base scale)
- [ ] Border radius uses `--radius-*` tokens
- [ ] Icons use Lucide React, size 20px default, stroke 1.5, `currentColor`
- [ ] All interactive states implemented: default, hover, focus, active, disabled
- [ ] Loading and error states implemented where applicable
- [ ] Keyboard accessible: focusable, Enter/Space activate, visible focus ring

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

- **Copying Tailwind defaults from the old code.** `bg-gray-50`, `text-blue-700`, `rounded-lg` — these are the old design. Replace every instance with token-mapped equivalents.
- **Hardcoding font-family in components.** Use the `font-heading`, `font-body`, `font-mono` utility classes via `@theme`.
- **Skipping the mono font for data.** Table headers, IDs, timestamps, badges, and codes must use DM Mono. Barlow in a table header is a design bug.
- **Inventing spacing values.** If `gap-5` (20px) is too small and `gap-6` (24px) is too large, use `gap-[--space-5]` or `gap-[--space-6]`. Never use a value outside the 4px scale.
- **Using inline SVG instead of Lucide React.** The prototype uses inline SVGs for demo purposes. Production code uses `<Icon size={20} strokeWidth={1.5} />` from `lucide-react`.
