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
<div className="bg-surface text-text-secondary">
<div className="bg-[var(--surface-hover)]">
```

**Prohibited:**
```css
background: #ffffff;
color: #4a5568;
```

```html
<div className="bg-white text-gray-600">
<div className="bg-[--surface-hover]">  <!-- MISSING var() — see Tailwind v4 section -->
```

**Rules:**
- No raw hex values in component CSS or Tailwind classes.
- No default Tailwind palette colors (`bg-gray-50`, `text-blue-700`, etc.) — use token-mapped classes instead.
- If a visual property has no matching token, **stop and ask** — do not invent a token or use a raw value.
- The token file (`manutracker-tokens-v2.css`) always wins over values found inside the HTML prototype if they conflict.

---

## Tailwind v4 + CSS Variables Integration

Tokens are wired into Tailwind via `@theme inline` in `src/index.css`. This makes them available as named utility classes.

### Named utilities via `@theme`

```css
@theme inline {
  --color-surface: var(--surface);   /* enables bg-surface, text-surface */
  --color-accent: var(--accent);     /* enables bg-accent, text-accent */
  --font-heading: "Barlow Condensed", sans-serif;  /* enables font-heading */
}
```

This enables `bg-surface`, `text-accent`, `font-heading` as utility classes.

### Arbitrary value syntax — MUST use `var()`

**Critical rule: Tailwind v4 arbitrary values require explicit `var()` wrapping.**

Tailwind v4 does NOT auto-wrap CSS custom property references in `var()`. Writing `w-[--sidebar-width]` outputs `width: --sidebar-width` (an invalid CSS value). The browser silently ignores it and the property has no effect.

| Syntax | Output CSS | Works? |
|--------|-----------|--------|
| `w-[--sidebar-width]` | `width: --sidebar-width` | **BROKEN** — bare custom property name |
| `w-[var(--sidebar-width)]` | `width: var(--sidebar-width)` | **Correct** |
| `text-[length:--text-heading]` | `font-size: --text-heading` | **BROKEN** |
| `text-[length:var(--text-heading)]` | `font-size: var(--text-heading)` | **Correct** |
| `bg-[image:--sidebar-gradient]` | `background-image: --sidebar-gradient` | **BROKEN** |
| `bg-[image:var(--sidebar-gradient)]` | `background-image: var(--sidebar-gradient)` | **Correct** |
| `bg-surface` | `background-color: var(--color-surface)` | **Correct** — named utility from `@theme` |

**Rule: Every `[--token]` in a className MUST be `[var(--token)]`.** Named utilities (`bg-surface`, `font-heading`, `text-text-muted`) do not need `var()` — Tailwind handles them internally.

### `@theme` circular reference pitfall

When registering a token in `@theme`, the variable name must NOT collide with an existing `:root` variable. If the token file defines `--font-heading` on `:root` and `@theme` declares `--font-heading: var(--font-heading)`, Tailwind outputs a self-referencing declaration that resolves to nothing.

**Broken:**
```css
:root { --font-heading: 'Barlow Condensed', sans-serif; }
@theme { --font-heading: var(--font-heading); }
/* Output: --font-heading: var(--font-heading) → circular, fonts disappear */
```

**Fixed (inline the value):**
```css
:root { --font-heading: 'Barlow Condensed', sans-serif; }
@theme inline { --font-heading: "Barlow Condensed", sans-serif; }
/* Output: --font-heading: "Barlow Condensed", sans-serif → works */
```

This applies to `--font-*`, `--shadow-*`, `--radius-*`, and any `--color-*` whose name matches a `:root` token (e.g., `--color-batch` collides with `:root { --color-batch: ... }`).

### When to use named utilities vs. arbitrary properties

| Approach | Syntax | Use when |
|----------|--------|----------|
| Named utility | `bg-surface` | Token is registered in `@theme` as `--color-surface` |
| Arbitrary property | `bg-[var(--surface-hover)]` | Token is NOT in `@theme`, or is layout-specific (`--sidebar-width`) |

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

## Component Implementation Procedure

Run this for every component you implement or migrate. Do not skip steps.

### Step 1: Extract the design spec (before writing any code)

1. **Read the target screen's HTML** in the prototype. Find the `<div class="screen" id="screen-...">` block for the screen you are implementing. List every CSS class used in that HTML block (e.g., `.ph`, `.lch`, `.dt`, `.cam`, `.btn-g`, `.stn`, `.ra-cell`).

2. **Grep the prototype `<style>` block for every class on that list.** Use a regex like `\.(ph|lch|dt|cam|btn-g|stn)\b` against the prototype HTML file. Read the full CSS rule for each class — every property matters.

3. **Record the extracted values in a reference table before writing code.** Example format:

   ```
   .dt thead th → font: mono 10px/500, tracking 0.14em, uppercase, color text-muted
                   padding: 10px 22px, border-bottom: 1px border, bg: surface-2, whitespace: nowrap
   .dt tbody td → padding: 13px 22px, border-bottom: 1px border, vertical-align: middle
                   NO font-size, NO color (children own their own text styles)
   .cam.on      → mono 11px, padding 3px 9px, radius-sm, bg status-ok-bg, color status-ok
                   ::before pseudo: 5px circle, bg status-ok
   ```

   Pay special attention to:
   - **Properties that are intentionally absent** — e.g., if the prototype `td` has no `color` or `font-size`, your `<td>` must not set them either. Children set their own styles.
   - **Pseudo-elements** (`::before`, `::after`) — these need Tailwind `before:` / `after:` utilities or a child `<span>`.
   - **Hover/active selectors** — e.g., `tr:hover td { background }` means hover bg goes on `td` not `tr`.
   - **Layout properties** like `min-width: 0`, `flex-shrink: 0`, `overflow: hidden` — these prevent visual overflow bugs.
   - **Event behavior implied by structure** — e.g., action buttons inside clickable rows need `event.stopPropagation()`.

4. **Cross-reference each extracted value against the token file.** If a token exists for the value (e.g., `10px` has no token but `#1a5faa` maps to `--accent`), use the token for colors/fonts/radii/shadows and the raw value for sizes/spacing where no token exists. When the prototype and token file conflict, the token file wins.

5. **Read the component spec in DESIGN-SYSTEM.md** for prop APIs, states, and any rules not visible in CSS.

### Step 2: Write the code

- [ ] All colors reference design tokens — no hex, no Tailwind defaults
- [ ] Correct font family per role (heading / body / mono)
- [ ] Font sizes, weights, letter-spacing, and padding match the extracted spec exactly — do not approximate
- [ ] Parent elements only set properties the prototype sets on them — do not add `color` or `font-size` to a container if the prototype leaves it to children
- [ ] Border radius uses `--radius-*` tokens
- [ ] Every arbitrary CSS variable reference uses `var()`: `[var(--token)]`, not `[--token]`
- [ ] Icons use Lucide React, size 20px default, stroke 1.5, `currentColor`
- [ ] All interactive states implemented: default, hover, focus, active, disabled
- [ ] Loading and error states implemented where applicable
- [ ] Keyboard accessible: focusable, Enter/Space activate, visible focus ring
- [ ] Buttons inside clickable rows call `event.stopPropagation()`

### Step 3: Verify

- [ ] Linter passes
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Tests pass (`vitest run`)
- [ ] **Automated visual verification with Playwright** — run a headless browser to extract computed styles and screenshot. Compare against prototype. See "Playwright Verification" section below. This step is not optional.

---

## Playwright Verification

After implementing or changing any frontend component, verify that computed styles match the prototype using Playwright. This catches silent CSS failures (missing `var()`, circular `@theme` refs, broken arbitrary values) that are invisible in source code review.

### Prerequisites

Playwright must be installed. If `npx playwright screenshot` fails with "Executable doesn't exist", run:
```bash
npx playwright install chromium
```
The Playwright package is available in `/tmp/node_modules` (install with `cd /tmp && npm install playwright` if needed). Run scripts from `/tmp` to access it.

### Quick check script

```bash
cd /tmp && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/manu-verify.png', fullPage: false });

  const styles = await page.evaluate(() => {
    const cs = (el) => window.getComputedStyle(el);
    const pick = (el, props) => {
      const s = cs(el);
      const r = {};
      for (const p of props) r[p] = s.getPropertyValue(p);
      return r;
    };
    return {
      body: pick(document.body, ['font-family','font-size','background-color','color']),
      aside: (() => { const el = document.querySelector('aside'); return el ? pick(el, ['width','background-image','position']) : 'NOT FOUND'; })(),
      main: (() => { const el = document.querySelector('main'); return el ? pick(el, ['padding']) : 'NOT FOUND'; })(),
      h1: (() => { const el = document.querySelector('h1'); return el ? { text: el.textContent, ...pick(el, ['font-family','font-size','font-weight']) } : 'NOT FOUND'; })(),
    };
  });
  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
"
```

### What to check

| Element | Expected (from prototype) |
|---------|--------------------------|
| `body` font-family | Contains "Barlow" (not system-ui, not sans-serif alone) |
| `body` background-color | `rgb(242, 245, 247)` — the `--bg` token |
| `aside` width | `220px` — the `--sidebar-width` token |
| `aside` background-image | Contains `linear-gradient` — the sidebar gradient |
| `main` padding | `32px 36px` — the `--content-padding` token |
| `h1` font-family | Contains "Barlow Condensed" |
| `h1` font-size | `26px` — the `--text-heading` token |
| `th` font-family | Contains "DM Mono" |

### Failure patterns

If any computed value shows a default/fallback instead of the token value, the most common causes are:

1. **Missing `var()` in arbitrary value** — `w-[--sidebar-width]` outputs bare `--sidebar-width`. Fix: `w-[var(--sidebar-width)]`.
2. **Circular `@theme` reference** — `@theme { --font-heading: var(--font-heading) }` when `:root` also defines `--font-heading`. Fix: inline the literal value in `@theme`.
3. **Named utility not registered** — using `bg-surface-hover` when `--color-surface-hover` is not in `@theme`. Fix: add to `@theme` or use `bg-[var(--surface-hover)]`.

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

- **Missing `var()` in Tailwind arbitrary values.** `rounded-[--radius-sm]` silently outputs `border-radius: --radius-sm` (invalid CSS). Always use `rounded-[var(--radius-sm)]`. This is the single most common source of "styles not applying" bugs.
- **Guessing pixel values from token names instead of reading the prototype CSS.** Example: using `text-[length:var(--text-xs)]` (11px) when the prototype CSS specifies `font-size: 10px`. Always grep the prototype `<style>` block and use the exact values defined there, then map to tokens where a token exists for that value.
- **Reading only the prototype HTML structure but skipping the CSS.** The HTML tells you *what* elements exist. The CSS tells you *how* they look — sizes, padding, gaps, font sizes, pseudo-elements, border styles. Both are required. Implementing from HTML alone produces structurally correct but visually wrong output.
- **Self-referencing `@theme` variables.** `@theme { --shadow-sm: var(--shadow-sm) }` creates a circular reference when `:root` also defines `--shadow-sm`. Inline the literal value instead.
- **Skipping Playwright verification.** CSS failures from missing `var()` or circular `@theme` refs are invisible in source code. Only computed-style inspection reveals them. Always run the Playwright check after implementing styles.
- **Copying Tailwind defaults from the old code.** `bg-gray-50`, `text-blue-700`, `rounded-lg` — these are the old design. Replace every instance with token-mapped equivalents.
- **Hardcoding font-family in components.** Use the `font-heading`, `font-body`, `font-mono` utility classes via `@theme`.
- **Skipping the mono font for data.** Table headers, IDs, timestamps, badges, and codes must use DM Mono. Barlow in a table header is a design bug.
- **Inventing spacing values.** If `gap-5` (20px) is too small and `gap-6` (24px) is too large, use `gap-[var(--space-5)]` or `gap-[var(--space-6)]`. Never use a value outside the 4px scale.
- **Using inline SVG instead of Lucide React.** The prototype uses inline SVGs for demo purposes. Production code uses `<Icon size={20} strokeWidth={1.5} />` from `lucide-react`.
