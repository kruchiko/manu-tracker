# ManuTracker — Design System Brief
**Version:** 1.0 · April 2026  
**Purpose:** Context file for design continuation in a new conversation.  
**Status:** Approved direction — implemented across 5 design screens and 4 config screens.

---

## 1. Product Context

**ManuTracker** is a production order tracking web application for small manufacturers. The UI must feel like serious operations software — credible to a German Mittelstand owner-operator, not a consumer SaaS product. Density is acceptable; clarity is required.

**Primary user:** Production manager / owner-operator at a 10–80 person manufacturer.  
**Device:** Desktop browser on local network. No mobile requirement for POC.  
**Language:** English (German market, English UI for now).

---

## 2. Logo

### Approved direction: A3.2 + dot row variant

**Two accepted logo treatments:**

#### Treatment A — Single line (compact, sidebar)
```
ManuTracker •
```
- `Manu` in bright teal (`#2ab5a4` on dark bg, `#1a7a6e` on light bg)
- `Tracker` in white (dark bg) or dark text `#1a1f2e` (light bg)
- Trailing dot: orange `#c45c1a`, 8px circle, slight bottom offset

#### Treatment B — Stacked (sidebar with dot row)
```
ManuTracker
● — ● — ● — ●
```
- Line 1: `Manu` in light blue `#90c4f0`, `Tracker` in white
- Line 2: 4 dots (teal / teal / orange / teal) connected by thin lines
- Dot row stretches to exact wordmark width using `inline-flex column + width:100%`
- Dots: 6px circles. Connectors: `flex:1`, `1.5px height`, `rgba(255,255,255,0.15)`
- The dot sequence is a pipeline metaphor — teal nodes with one orange node (alert/bottleneck)

**Active choice in screens:** Treatment B (stacked) in sidebar at 19px. Treatment A can be used in landing page / external contexts.

### Logo font
`Barlow Condensed Bold 700`, `letter-spacing: 0.07em`, `text-transform: uppercase`

### What was rejected
- Original orange accent (`#c45c1a`) as primary brand color — too warm, less credible for industrial B2B
- All-white wordmark — `Manu` was unreadable on dark sidebar
- Dot before the word — visual clutter, no meaning
- Green/teal sidebar — replaced by blue (see color section)

---

## 3. Color System

### Current approved palette (Blue theme — v4+)

**Sidebar / structural**
| Token | Value | Usage |
|---|---|---|
| Sidebar gradient | `#0d1f3c → #1a3a6e` (170deg) | Left navigation background |
| Sidebar hover | `#162d52` | Nav item hover |
| Sidebar active | `#1a3d6e` | Selected nav item background |
| Sidebar text | `#c4d4e8` | Nav labels |
| Sidebar muted | `#5a7a9e` | Section labels (OPERATIONS, CONFIGURATION) |
| Sidebar border | `#1a2f4a` | Dividers between nav sections |
| Active nav accent | `#90c4f0` | Left border on active nav item |

**Page backgrounds**
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f2f5f7` | App canvas (cool near-white) |
| `--surface` | `#ffffff` | Cards, panels, form backgrounds |
| `--surface-2` | `#eef1f4` | Table header rows, alternating sections |
| `--surface-hover` | `#f5f7fa` | Row hover state |

**Borders**
| Token | Value | Usage |
|---|---|---|
| `--border` | `#dde2e8` | Default — cards, inputs, dividers |
| `--border-strong` | `#c4cdd6` | Table headers, active inputs |
| Focus ring | `rgba(26,95,170,0.12)` | Input focus box-shadow |

**Primary accent — Blue**
| Token | Value | Usage |
|---|---|---|
| `--accent` | `#1a5faa` | Buttons, links, active tabs, progress bars, pipeline nodes, order IDs |
| `--accent-dark` | `#134a88` | Hover state for accent elements |
| `--accent-light` | `#e8f0fa` | Tinted backgrounds, hint banners |
| `--accent-muted` | `#5a8fd4` | Secondary blue elements, muted nodes |

**Alert accent — Orange (restricted use)**
| Token | Value | Usage |
|---|---|---|
| `--alert` | `#c45c1a` | Sidebar CTA ("New Order" button), delayed status, threshold violations, deadline warnings, logo dot |
| `--alert-dark` | `#a84d14` | Hover on alert elements |
| `--alert-light` | `#fdf0e8` | Alert tinted backgrounds |

> **Rule:** Orange is a signal color. Never use it decoratively. Every orange element in the UI means "this needs attention" or is a primary CTA.

**Semantic status colors** (do not substitute raw colors)
| Token | Value | When |
|---|---|---|
| `--status-ok` | `#1a7a3b` | On track, completed, camera assigned |
| `--status-ok-bg` | `#e8f5ec` | Badge background for ok states |
| `--status-warn` | `#a06010` | Review, approaching threshold |
| `--status-warn-bg` | `#fef3e2` | Badge background for warn states |
| `--status-late` | `#b83b2a` | Delayed, threshold exceeded |
| `--status-late-bg` | `#fde8e4` | Badge background for late states |
| `--status-pending` | `#4a5568` | Not started, pending |
| `--status-pending-bg` | `#edf0f4` | Badge background for pending states |

**Text hierarchy**
| Token | Value | Usage |
|---|---|---|
| `--text` | `#1a1f2e` | Primary — headings, values, strong labels |
| `--text-secondary` | `#4a5568` | Body text, descriptions, form labels |
| `--text-muted` | `#6b7280` | Captions, helper text, timestamps |
| `--text-disabled` | `#a0aab4` | Placeholder text, disabled elements |

### Color history (rejected)
- **Original teal sidebar** (`#0d3d3a` flat) — replaced with blue gradient after research showed blue is the most trusted color in German B2B context
- **Teal as primary accent** — replaced with blue `#1a5faa` for the same reason
- **Purple for batching** — still in use for the "Batched" badge but flagged as an orphan color; needs future justification or replacement with blue variant

---

## 4. Typography

### Font stack
```css
--font-heading: 'Barlow Condensed', sans-serif;
--font-body:    'Barlow', sans-serif;
--font-mono:    'DM Mono', monospace;
```

**Google Fonts import:**
```
Barlow Condensed: wght@500;600;700;800
Barlow: wght@300;400;500;600
DM Mono: wght@400;500
```

### When to use each font

**Barlow Condensed** — headings, page titles, KPI stat values, logo wordmark  
`letter-spacing: -0.01em to 0.07em` depending on context

**Barlow** — all body text, form labels, descriptions, nav items, buttons  
Default weight: 400. Medium: 500. Semibold: 600.

**DM Mono** — everything that is data, not prose:
- Order numbers, Job numbers, Tray codes (CO-0001, JOB-0014, TRAY-0001)
- Timestamps, durations
- Table column headers (uppercase, letter-spacing: 0.14em)
- Status badges
- Sidebar section labels
- Camera IDs, numeric fields in pipeline builder
- KPI sub-labels

### Type scale
| Name | Size | Usage |
|---|---|---|
| `text-xs` | 11px | Mono labels, table headers, sidebar section labels |
| `text-sm` | 13px | Helper text, timestamps, secondary metadata |
| `text-base` | 14px | Body text, form labels, table rows, nav items |
| `text-md` | 16px | Card titles, panel headings |
| `text-lg` | 20px | Page section headings |
| `text-xl` | 28px | KPI values on dashboard |
| `text-2xl` | 34–36px | Large stat values (dashboard KPI cards) |
| `text-heading` | 26px | Page-level h1 titles |
| Logo | 19px | Sidebar at 19px, header at 24px |

---

## 5. Spacing & Layout

### Base unit: 4px

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |

### Layout structure
| Element | Value |
|---|---|
| Sidebar width | 220px |
| Content padding | 32px 36px |
| Card internal padding | 20–24px |
| Table cell padding | 12–14px vertical, 22–24px horizontal |
| Border radius (small) | 4px — badges, tags |
| Border radius (medium) | 6px — inputs, buttons |
| Border radius (large) | 8px — cards, panels, modals |

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 16px rgba(0,0,0,0.10);
--shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
```
Cards use `shadow-sm`. Modals / slide-in panels use `shadow-lg`.

---

## 6. Navigation Structure

```
MANUTRACKER (logo + dot row)
─────────────────────────────
[New Order — orange CTA button]

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
- Section labels: DM Mono, 10px, 0.18em letter-spacing, uppercase, muted blue
- Active item: background `#1a3d6e`, left border `3px solid #90c4f0`, font-weight 500
- "New Order" CTA: full-width orange button directly under logo, always visible
- Sidebar is sticky, full viewport height

---

## 7. Key Components

### Status badges
DM Mono, 10px, 0.06em letter-spacing, uppercase. Colored dot prefix. Rounded 4px.  
Always use semantic tokens — never raw colors on badges.

### Data tables
- Header: DM Mono, 10px, uppercase, 0.14em tracking, `surface-2` background
- Rows: Barlow 14px, 13px vertical padding
- IDs/codes: DM Mono, accent blue, font-weight 500
- Timestamps: DM Mono, 11px, muted
- Actions: always right-aligned, always visible (no hover-only)

### Buttons
| Variant | Use |
|---|---|
| Primary (blue) | Main action per screen — Create, Save, Assign |
| Secondary (outlined) | Cancel, secondary actions |
| Ghost | Inline row actions — Edit |
| Danger ghost | Destructive actions — Delete |
| Sidebar CTA (orange) | New Order — appears once in sidebar |

Height: 34px standard. 28px small. 36px in modal footers.

### Modals / slide-in panels
- Right-side slide-in for simple creation forms (Stations)
- Full-page builder for complex multi-step forms (Pipeline builder)
- Overlay: `rgba(13,31,60,0.5)` with `backdrop-filter: blur(3px)`
- Panel: 460px wide, sticky header + footer with actions

### Pipeline flow visualization
**In list:** compact inline dots — station name + single detail line `60–180 min · 3–5/tray`  
**In job/order detail:** horizontal node diagram with completed/active/pending states, connecting lines, time-at-station label  
**In pipeline builder:** table view (one row per step) — no flow diagram during editing

---

## 8. Open Design Issues (to address in next session)

1. **Purple for "Batched" badge** — orphan color, no system justification. Options: replace with blue variant, or formally define purple as "system intelligence" color across all automated-action indicators.

2. **KPI stat cards are visually flat** — four identical white boxes. Cards with status meaning (Delayed: 2) should feel more visually urgent than neutral ones (Completed: 4). Consider left-border color accent per card status.

3. **Sidebar CTA orange vs. alert orange** — same color used for "New Order" button and "Delayed" status badge. Creates mild semantic confusion. Consider a slightly different orange shade for the CTA, or accept the dual use.

4. **Logo dots at small sizes** — the pipeline metaphor of the dot row is lost at 19px sidebar rendering. Worth testing whether a simpler two-color wordmark (A3.2) is more readable than the stacked treatment.

5. **Landing page realignment** — landing page (`manutrack-landing.html`) still uses the original teal/orange palette and has not been updated to the blue design system. Needs update in Step 5 of the project.

6. **Batch tag purple (#7c4dbd)** — visually distinctive but not formally part of the system. Should be tokenized if kept.

---

## 9. Design Files Reference

All design files are in the project outputs:

| File | Contents |
|---|---|
| `manutracker-screens-v5.html` | Dashboard + Order Detail (latest approved) |
| `manutracker-config-screens-v4.html` | Stations + Pipelines list + Pipeline builder (latest approved) |
| `manutrack-design-system-v1.css` | Full CSS token file (note: uses original teal palette — tokens need updating to blue values above) |
| `manutracker-logo-v1.html` | All 11 initial logo directions |
| `manutracker-logo-v2.html` | A3 + C2 refinements |
| `manutracker-logo-v3.html` | Stacked wordmark + dot row variants |
| `manutracker-logo-v3-fixed.html` | V5 stacked logo — dot width fixed to wordmark width |

---

## 10. Screens Still to Design

Priority order for next session:

1. **Customer Orders list page** — full CRUD management view with create form, search, filter. Distinct from dashboard (which is read-only overview).
2. **Jobs list page** — floor operations, QR label print action prominent, manual job creation fallback.
3. **Empty states** — what users see before first Station / Pipeline / Order is created. Includes setup guidance checklist on first login.
4. **Landing page update** — align to blue brand, incorporate POC screenshots/demo section.
