# ManuTracker Design System — v2

**Source of truth for all visual decisions.**
Engineers: reference this document and `tokens/manutracker-tokens-v2.css` when implementing any UI component.

---

## 1. Foundations

### Color Palette

#### Primary Accent — Blue

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#1a5faa` | Buttons, links, active tabs, progress bars, pipeline nodes, order IDs |
| `--accent-dark` | `#134a88` | Hover state for accent elements |
| `--accent-light` | `#e8f0fa` | Tinted backgrounds, hint banners, selected rows |
| `--accent-muted` | `#5a8fd4` | Inactive nodes, muted links |

#### Alert Accent — Orange (restricted use)

| Token | Value | Usage |
|-------|-------|-------|
| `--alert` | `#c45c1a` | Sidebar CTA ("New Order"), Delayed status, threshold violations, logo dot |
| `--alert-dark` | `#a84d14` | Hover on orange elements |
| `--alert-light` | `#fdf0e8` | Alert tinted backgrounds |

> **Rule:** Orange is a signal color. Every orange element means "this needs attention" or is a primary CTA. Never use decoratively.

#### Semantic Status

| Token | Value | Meaning |
|-------|-------|---------|
| `--status-ok` / `--status-ok-bg` | `#1a7a3b` / `#e8f5ec` | On track, completed, camera assigned |
| `--status-warn` / `--status-warn-bg` | `#a06010` / `#fef3e2` | Review, approaching threshold |
| `--status-late` / `--status-late-bg` | `#b83b2a` / `#fde8e4` | Delayed, threshold exceeded, overdue |
| `--status-pending` / `--status-pending-bg` | `#4a5568` / `#edf0f4` | Not started, pending |

#### Batch — Purple (tokenized, usage under review)

| Token | Value |
|-------|-------|
| `--color-batch` | `#7c4dbd` |
| `--color-batch-bg` | `#f0ebfa` |
| `--color-batch-border` | `#e0d5f5` |
| `--color-batch-dark` | `#5a3490` |

#### Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#f2f5f7` | App canvas |
| `--surface` | `#ffffff` | Cards, panels, form backgrounds |
| `--surface-2` | `#eef1f4` | Table header rows, alternating sections |
| `--surface-hover` | `#f8f9fb` | Row hover state |

#### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `#dde2e8` | Default — cards, inputs, dividers |
| `--border-strong` | `#c4cdd6` | Table headers, active input borders |
| `--border-focus` | `rgba(26,95,170,0.12)` | Input focus ring (box-shadow) |

#### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--text` | `#1a1f2e` | Primary — headings, values, strong labels |
| `--text-secondary` | `#4a5568` | Body text, descriptions, form labels |
| `--text-muted` | `#6b7280` | Captions, helper text, timestamps |
| `--text-disabled` | `#a0aab4` | Placeholder text, disabled elements |
| `--text-on-dark` | `#ffffff` | Text on dark backgrounds |

#### Sidebar

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-gradient` | `linear-gradient(170deg, #0d1f3c 0%, #1a3a6e 100%)` | Navigation background |
| `--sidebar-bg` | `#0d1f3c` | Flat reference |
| `--sidebar-bg-hover` | `#162d52` | Nav item hover |
| `--sidebar-active` | `#1a3d6e` | Selected nav item |
| `--sidebar-text` | `#c4d4e8` | Nav labels |
| `--sidebar-text-muted` | `#5a7a9e` | Section labels |
| `--sidebar-border` | `#1a2f4a` | Dividers |
| `--sidebar-active-accent` | `#90c4f0` | Left border on active item |

---

### Typography

#### Font Stack

```css
--font-heading: 'Barlow Condensed', sans-serif;
--font-body:    'Barlow', sans-serif;
--font-mono:    'DM Mono', monospace;
```

**Google Fonts:**
```
Barlow Condensed: wght@500;600;700;800
Barlow: wght@300;400;500;600
DM Mono: wght@400;500
```

#### When to Use Each Font

| Font | Context |
|------|---------|
| **Barlow Condensed** | Page titles, KPI stat values, logo wordmark |
| **Barlow** | Body text, form labels, descriptions, nav items, buttons |
| **DM Mono** | Order/Job/Tray codes, timestamps, durations, table headers, status badges, sidebar section labels, camera IDs |

#### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 11px | Mono labels, table headers, sidebar section labels |
| `--text-sm` | 13px | Helper text, timestamps, secondary metadata |
| `--text-base` | 14px | Body text, form labels, table rows, nav items |
| `--text-md` | 16px | Card titles, panel headings |
| `--text-lg` | 20px | Page section headings |
| `--text-xl` | 28px | KPI values on dashboard |
| `--text-2xl` | 36px | Large stat values (hero KPI) |
| `--text-heading` | 26px | Page-level h1 titles |
| `--text-logo` | 19px | Logo wordmark in sidebar |

#### Font Weights

| Token | Value |
|-------|-------|
| `--weight-light` | 300 |
| `--weight-regular` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--weight-bold` | 700 |
| `--weight-extrabold` | 800 |

#### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | -0.01em | Heading numerals |
| `--tracking-normal` | 0 | Body text |
| `--tracking-wide` | 0.06em | Mono labels, badge text |
| `--tracking-wider` | 0.14em | Table column headers |
| `--tracking-widest` | 0.18em | Sidebar section labels |

---

### Spacing

**Base unit: 4px**

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

---

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, tags |
| `--radius-md` | 6px | Inputs, buttons |
| `--radius-lg` | 8px | Cards, panels, modals |

---

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)` | Cards, list panels |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.10)` | Dropdowns, popovers |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.14)` | Slide-in panels, modals |

---

### Layout

| Property | Value |
|----------|-------|
| Sidebar width | 220px |
| Content padding | 32px 36px |
| Card padding | 24px (sm: 16px) |
| Table cell padding | 13px vertical, 22px horizontal |
| Input height | 36px |
| Button height | 34px (sm: 28px, modal: 36px) |
| Modal/panel width | 460px |
| Minimum viewport width | 1024px |

---

## 2. Component Inventory

### Status Badge

**Font:** DM Mono, 10px, `letter-spacing: 0.06em`, uppercase
**Shape:** `--radius-sm` (4px), colored dot prefix
**Rule:** Always use semantic status tokens. Never raw color values.

| State | Dot Color | Text Color | Background |
|-------|-----------|------------|------------|
| On Track | `--status-ok` | `--status-ok` | `--status-ok-bg` |
| Review | `--status-warn` | `--status-warn` | `--status-warn-bg` |
| Delayed | `--status-late` | `--status-late` | `--status-late-bg` |
| Pending | `--status-pending` | `--status-pending` | `--status-pending-bg` |
| Batched | `--color-batch` | `--color-batch` | `--color-batch-bg` |

**Props:**

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `status` | `'ok' \| 'warn' \| 'late' \| 'pending' \| 'batch'` | Yes | — |
| `label` | `string` | Yes | — |

**States:** Default only — badges are read-only indicators. No hover, focus, or interactive states.

---

### Button

**Font:** Barlow, `--weight-medium` (500)
**Radius:** `--radius-md` (6px)

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `--accent` | white | none | Main action per screen |
| Secondary | transparent | `--accent` | `--border` | Cancel, secondary actions |
| Ghost | transparent | `--accent` | none | Inline row actions |
| Danger Ghost | transparent | `--status-late` | none | Destructive actions |
| Sidebar CTA | `--alert` | white | none | "New Order" — one instance only |

| Size | Height | Context |
|------|--------|---------|
| sm | 28px | Compact contexts |
| md | 34px | Standard |
| lg | 36px | Modal footers |

**Props:**

| Prop | Type | Default |
|------|------|---------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger-ghost'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `disabled` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` |
| `children` | `ReactNode` | — |

**States:**

| State | Appearance |
|-------|------------|
| Default | Standard variant styling |
| Hover | `--accent-dark` background (primary), `--accent-light` background (secondary/ghost) |
| Focus | `2px solid --accent`, `2px offset` focus ring |
| Active | 1px inset appearance (translateY(1px)) |
| Disabled | `--text-disabled` text, `--surface-2` background, `cursor: not-allowed`, 0.6 opacity |
| Loading | Spinner replaces children text, button disabled, maintains width to prevent layout shift |

---

### Form Input

**Font:** Barlow, `--text-base` (14px)
**Height:** `--input-height` (36px)
**Radius:** `--radius-md` (6px)
**Border:** `--border` default, `--border-strong` on focus, `--status-late` on error

**Props:**

| Prop | Type | Default |
|------|------|---------|
| `label` | `string` | — |
| `helperText` | `string` | `undefined` |
| `error` | `string` | `undefined` |
| `required` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `placeholder` | `string` | `undefined` |

**States:**

| State | Border | Background | Helper Text |
|-------|--------|------------|-------------|
| Default | `--border` | `--surface` | `--text-muted` |
| Focus | `--border-strong` + `--border-focus` box-shadow | `--surface` | `--text-muted` |
| Error | `--status-late` | `--status-late-bg` (subtle) | `--status-late` — error message replaces helper text |
| Disabled | `--border` at 0.5 opacity | `--surface-2` | `--text-disabled` |

**Rules:**
- Every input has a visible label above it (never placeholder-only)
- Required fields show `*` after the label in `--status-late` color
- Error messages appear below the input, replacing helper text
- Placeholder text uses real manufacturing examples (e.g., "Kiln A", "Drying Room")

---

### Data Table

**Header row:**
- Font: DM Mono, 10px, uppercase, `--tracking-wider` (0.14em)
- Background: `--surface-2`

**Data rows:**
- Font: Barlow, 14px (`--text-base`)
- Padding: `--table-cell-v` (13px) / `--table-cell-h` (22px)
- Hover: `--surface-hover`

**Conventions:**
- IDs/codes: DM Mono, `--accent`, `--weight-medium`
- Timestamps: DM Mono, 11px, `--text-muted`
- Actions: always right-aligned, always visible (not hover-only)
- Sortable columns: header shows sort arrow (up/down), `--accent` when active, `--text-muted` when inactive

**States:**

| State | Appearance |
|-------|------------|
| Loading (initial) | 5 skeleton rows — pulsing `--surface-2` blocks matching column widths |
| Loading (refresh) | Existing rows remain visible, subtle 0.5 opacity overlay with spinner in table center |
| Empty | No rows — centered empty-state message with icon and CTA button |
| Error | Centered error message with retry button |

---

### Card

**Background:** `--surface`
**Border:** `--border`
**Radius:** `--radius-lg` (8px)
**Shadow:** `--shadow-sm`
**Padding:** `--card-padding` (24px), compact: `--card-padding-sm` (16px)

---

### Modal / Slide-in Panel

**Type:** Right-side slide-in for simple forms (Stations). Full-page builder for complex multi-step forms (Pipeline builder).
**Overlay:** `rgba(13,31,60,0.5)` with `backdrop-filter: blur(3px)`
**Panel width:** `--modal-width` (460px)
**Structure:** Sticky header + sticky footer with action buttons
**Shadow:** `--shadow-lg`

**Animation:**
- Open: panel slides from right, `--duration-normal` (200ms), `--easing-enter`
- Close: panel slides to right, `--duration-fast` (100ms), `--easing-exit`
- Overlay: fades in/out `--duration-normal` (200ms)
- `prefers-reduced-motion`: no slide, instant appear/disappear

**Interaction:**
- Close on overlay click
- Close on Escape key
- Focus trapped inside panel while open
- On close: focus returns to the element that opened the panel

**Confirmation Dialog (for destructive actions):**
- Centered modal, max-width 400px
- Title: "Delete [Entity Name]?"
- Body: "This action cannot be undone. [Entity description] will be permanently removed."
- Actions: "Cancel" (secondary) + "Delete" (danger-ghost, red text)

---

### Pipeline Flow Visualization

Three rendering modes using shared status tokens:

| Mode | Context | Rendering |
|------|---------|-----------|
| Compact | Pipeline list rows | Inline dots — station name + detail line |
| Detail | Job/Order detail view | Horizontal node diagram with completed/active/pending states |
| Builder | Pipeline builder/editor | Table view — one row per step, no flow diagram |

**Node colors:**
- Completed: `--accent`
- Active: `--accent` with highlight ring
- Pending: `--accent-muted`
- Overdue at station: `--status-late`

---

## 3. Navigation Structure

```
MANUTRACKER (logo + dot row)
─────────────────────────────

OPERATIONS
  Dashboard
  Customer Orders
  Jobs

CONFIGURATION
  Pipelines
  Stations
─────────────────────────────
```

**Rules:**
- No collapsible sections — flat labeled list
- Section labels: DM Mono, 10px, `--tracking-widest` (0.18em), uppercase, `--sidebar-text-muted`
- Active item: background `--sidebar-active`, left border `3px solid --sidebar-active-accent`, `--weight-medium`
- Sidebar: sticky, full viewport height, `--sidebar-gradient` background

---

## 4. Branding

### Logo — Treatment B (Stacked, approved for sidebar)

```
MANUTRACKER
● — ● — ● — ●
```

- Line 1: `Manu` in `--logo-manu` (`#90c4f0`), `Tracker` in `--logo-tracker` (`#ffffff`)
- Line 2: 4 dots connected by thin lines. Dots: 6px, `--logo-dot-teal` × 3 + `--logo-dot-orange` × 1. Connectors: `flex:1`, 1.5px, `--logo-connector`
- Font: Barlow Condensed Bold 700, `letter-spacing: 0.07em`, uppercase
- Sidebar size: 19px (`--text-logo`)

### Logo — Treatment A (Single line, landing/external)

```
ManuTracker •
```

- `Manu` in bright teal on dark bg / dark teal on light bg
- `Tracker` in white (dark bg) or `--text` (light bg)
- Trailing dot: orange `--alert`, 8px circle

---

## 5. Screen Inventory

| Screen ID | Description | Status |
|-----------|-------------|--------|
| `dashboard` | KPI cards + Customer Orders tab + Internal Operations tab | Designed |
| `order` | Order Detail — header, summary, job pipeline flows, timeline | Designed |
| `orders` | Customer Orders list — CRUD, filter tabs | Designed |
| `new-order` | New Order builder — line items with pipeline validation | Designed |
| `jobs` | Jobs list — Print Label prominent | Designed |
| `new-job` | Create Job manually — builder with fallback warning | Designed |
| `job-detail` | Job Detail — meta grid, KPIs, QR block, pipeline flow, timeline | Designed |
| `stations` | Stations list as cards | Designed |
| `new-station` | New Station builder with live preview | Designed |
| `station-edit` | Edit Station — pre-populated, danger zone | Designed (v2) |
| `station-detail` | Station Detail — live status, slot occupancy, queue, scan events | Designed |
| `pipelines` | Pipelines list | Designed |
| `pipeline-detail` | Pipeline Detail — flow diagram, per-step stats | Designed |
| `builder` | Pipeline Builder — doubles as Edit mode | Designed |
| `empty` | Empty state + first-time setup checklist | Designed |
| `landing` | Marketing landing page | Designed (needs palette update) |

### Screens Not Yet Designed

| Screen | Priority | Notes |
|--------|----------|-------|
| Customer Orders list (CRUD) | P1 | Designed as `orders` — verify covers full CRUD flow |
| Jobs list | P1 | Designed as `jobs` — verify Print Label action |
| Empty states per entity | P2 | Single `empty` screen exists; need per-entity variants |
| Landing page (blue palette) | P3 | Current version uses teal/orange |

---

## 6. Loading & Submission Behavior

### Page-Level Loading

| Context | Pattern | Details |
|---------|---------|---------|
| Initial page load | Skeleton screen | Sidebar renders immediately. Content area shows skeleton placeholders matching the page layout (KPI cards, table rows). |
| Tab switch (Dashboard) | Instant swap | Tab content switches immediately. If new tab data is not yet loaded, show skeleton inside the tab body only. |
| Navigation between pages | Instant route change | Sidebar active state updates immediately. Content area shows skeleton until data loads. |

### Data Loading

| Context | Pattern | Details |
|---------|---------|---------|
| Table initial load | Skeleton rows | 5 pulsing rows matching column layout |
| Table refresh/filter | Overlay spinner | Existing rows at 0.5 opacity, centered spinner |
| Analytics period change | Inline skeleton | Chart area shows skeleton, KPI cards show pulsing blocks |
| Polling interval | Background | Dashboard data refreshes every 30s. No visible indicator unless data changes — then rows animate briefly with `--accent-light` flash. |

### Form Submission

| Step | Behavior |
|------|----------|
| User clicks Submit | Button enters loading state (spinner, disabled). All form fields become read-only. |
| Validation fails (client) | Button returns to normal. First error field scrolls into view. Error messages appear below each invalid field in `--status-late`. |
| Submission succeeds | Redirect to the entity's list page. Success toast appears (bottom-right, auto-dismiss 4s): green left border, DM Mono text, entity name. |
| Submission fails (server) | Button returns to normal. Error banner appears at top of form: `--status-late-bg` background, `--status-late` text, retry guidance. Form data preserved. |
| Double-click prevention | Button disabled on first click. No debounce needed — disabled state prevents re-submission. |

### Toast Notifications

| Type | Left Border | Icon | Auto-dismiss |
|------|-------------|------|-------------|
| Success | `--status-ok` | Checkmark | 4 seconds |
| Error | `--status-late` | Warning triangle | Manual dismiss only |
| Info | `--accent` | Info circle | 6 seconds |

**Position:** Bottom-right, 24px from edges. Stack upward if multiple.
**Animation:** Slide in from right, `--duration-normal`, `--easing-enter`. Fade out on dismiss.

---

## 7. Icons

**Library:** Lucide React (`lucide-react`)
**Size grid:** 20px default (matching `--text-lg`), 16px small (inline with text), 24px large (empty states, page headers)
**Stroke weight:** 1.5px (default Lucide weight — matches the light, clean aesthetic)
**Color:** Inherits `currentColor` from parent text color. Never hardcode icon colors.

**Recommended icons per context:**

| Context | Icon | Lucide Name |
|---------|------|-------------|
| Dashboard | `LayoutDashboard` | `layout-dashboard` |
| Customer Orders | `ClipboardList` | `clipboard-list` |
| Jobs | `Layers` | `layers` |
| Pipelines | `GitBranch` | `git-branch` |
| Stations | `Radio` | `radio` |
| New / Create | `Plus` | `plus` |
| Edit | `Pencil` | `pencil` |
| Delete | `Trash2` | `trash-2` |
| Search | `Search` | `search` |
| Filter | `Filter` | `filter` |
| Print QR Label | `QrCode` | `qr-code` |
| Close | `X` | `x` |
| Chevron (expand) | `ChevronDown` | `chevron-down` |
| Status: On Track | `CircleCheck` | `circle-check` |
| Status: Warning | `AlertTriangle` | `alert-triangle` |
| Status: Delayed | `Clock` | `clock` |
| Empty state | `PackageOpen` | `package-open` |

---

## 8. Viewport & Responsive Rules

**Minimum supported viewport:** 1024px wide
**Target viewport:** 1280px–1920px (desktop monitors on local network)
**No mobile or tablet layouts required for POC.**

**Behavior below 1024px:** Content area scrolls horizontally. Sidebar remains fixed. No layout collapse, no hamburger menu.

**Sidebar:** Always visible, fixed position, full viewport height, 220px wide. Never collapses.

**Content area:** `calc(100vw - 220px)` width. At 1024px viewport, content area is 804px — all tables and forms must fit within this width.

---

## 9. Data Formatting Rules

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Date format | DD.MM.YYYY (German) vs. YYYY-MM-DD (ISO) | DD.MM.YYYY for display, ISO for data |
| Time format | 24h (14:30) vs. 12h (2:30 PM) | 24h — standard in German manufacturing |
| Duration format | 3h 12m vs. 03:12 vs. "3 hours 12 minutes" | Short: `3h 12m`. Long: `3 hours 12 minutes` |
| Number format | German (1.234,56) vs. English (1,234.56) | German locale — target market |
| Currency | EUR with comma decimal | Not needed for POC |

---

## 10. Chart / Data Visualization Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--chart-1` | `#1a5faa` | Primary series |
| `--chart-2` | `#5a8fd4` | Secondary series |
| `--chart-3` | `#c45c1a` | Alert/bottleneck series |
| `--chart-4` | `#4a90a4` | Quaternary — slate |
| `--chart-grid` | `#e8ecf0` | Gridlines |
