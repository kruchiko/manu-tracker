# ManuTracker — Design Session Debrief v2
**Version:** 2.0 · April 2026  
**Purpose:** Continuity file — all decisions and known state as of v2.  
**Changes from v1:** Edit forms added, CSS fully resolved, token cleanup complete.

---

## 1. What ManuTracker Is

Passive production order tracking web app for small manufacturers (10–80 people). QR labels on trays + fixed cameras at stations automatically record order progress. Target: German Mittelstand. Berlin-based. POC stage.

**Core entity model (locked):**
- **Customer Order** — customer-facing umbrella (customer name, line items, deadline, status)
- **Job** — floor-level tracking unit. Auto-generated 1 per product-type line item. Carries QR code.
- **Pipeline** — named sequence of Stations for a specific product type. Per step: min/max duration thresholds, min/max items per tray.
- **Station** — physical device/location. Name, location, camera ID, concurrent slot capacity (default 1).
- **Tray** — 1 QR code → 1 Job → Job items may come from multiple Customer Orders (cross-order batching, same pipeline only).

---

## 2. Prototype File

**Single unified prototype:** `manutracker-full-prototype-v2.html`  
16 screens · ~242KB · Navigation via pill bar at the bottom.

| Screen ID | Description |
|---|---|
| `dashboard` | Overview: Customer Orders tab + Internal Operations tab |
| `order` | Order Detail — dark blue header, flat summary table, job flows, timeline |
| `orders` | Customer Orders list — CRUD, filter tabs |
| `new-order` | New Order — full-page builder, line items with pipeline validation |
| `jobs` | Jobs list — Print Label prominent, fallback note |
| `new-job` | Create Job manually — builder, fallback warning |
| `job-detail` | Job Detail — meta grid, KPIs, QR block, pipeline flow, timeline |
| `stations` | Stations list |
| `new-station` | New Station — builder, live preview panel |
| `station-edit` | **NEW** Edit Station — pre-populated (Kiln A), live preview, danger zone |
| `station-detail` | Station Detail — live status, slot occupancy, queue, scan events |
| `pipelines` | Pipelines list |
| `pipeline-detail` | Pipeline Detail — flow diagram, per-step stats, active jobs |
| `builder` | Pipeline Builder — doubles as Edit (title + CTA swap based on source) |
| `empty` | Empty state + first-time setup checklist |

---

## 3. Design System

### CSS Architecture (v2 — fully resolved)

The style block has three layers:

1. **`:root` tokens** — canonical v5 names + short-alias bridge  
2. **Short-alias component layer** — `.ac`, `.bh`, `.bl`, `.ip`, `.sp`, `.lc`, `.btn-p`, etc.  
3. **V5 full-name component layer** — `.app-content`, `.page-header`, `.stat-grid`, `.card`, `.data-table`, `.order-detail-header`, etc.

Both layers are present. Short aliases and full names coexist — consolidation to one set is a pre-production task.

**The short-alias bridge in `:root`** (critical — do not remove):
```css
--fm: var(--font-mono);     --fh: var(--font-heading);
--r4: var(--radius-sm);     --r6: var(--radius-md);     --r8: var(--radius-lg);
--s1: var(--shadow-sm);     --s2: var(--shadow-md);
--text-dim: var(--text-muted);    --text-2: var(--text-secondary);
--ok/warn/late + -bg → var(--status-*)
```

### Colors

| Token | Value | Usage |
|---|---|---|\
| `--accent` | `#1a5faa` | Buttons, links, active states |
| `--alert` | `#c45c1a` | **Signal only** — Delayed, threshold violations, logo dot |
| `--color-batch` | `#7c4dbd` | Batching surfaces (tokenized in v2) |
| `--status-ok/warn/late/pending` | see :root | Status colors |

### Fonts
```
--font-heading: 'Barlow Condensed' 500–800  →  headings, KPI values, logo
--font-body:    'Barlow' 300–600            →  body, forms, nav, buttons
--font-mono:    'DM Mono' 400–500           →  all data: IDs, codes, timestamps
```

---

## 4. What Changed in v2

- ✅ **Station Edit screen** added (`screen-station-edit`) — pre-populated Kiln A, danger zone, pipeline reference list in preview
- ✅ **Pipeline builder edit mode** — CTA button now swaps "Create Pipeline" → "Save changes" based on source screen
- ✅ **Batch purple fully tokenized** — `--color-batch`, `--color-batch-bg`, `--color-batch-border`, `--color-batch-dark`
- ✅ **`--surface-hover` fixed** — `#f8f9fb` (was same as surface-2)
- ✅ **CSS reset added** — `*, *::before, *::after { box-sizing }` + `body { font-family }` (was missing; caused font fallback to browser default)
- ✅ **V5 full-name component layer injected** — `app-content`, `page-header`, `stat-grid`, `card`, `order-summary`, etc. (were missing; caused dashboard/order screens to render as unstyled text)
- ✅ **Short-alias bridge tokens added to `:root`** — `--fm`, `--r4`–`--r8`, `--ok`/`--warn`/`--late`, etc.
- ✅ **Missing component classes added** — `.ov`/`.mp`/`.mh`, `.line-items`, `.jd-*`, `.pb`/`.pb-sep`, `.sidebar-cta`, `.fopt`/`.fhint` etc.
- ✅ **Proto bar fixed** — duplicate orphaned button block removed
- ✅ **Pipeline-detail header** — subtitle fixed to "Product type · Type A" (was redundant "Pipeline")
- ✅ **Station-detail Edit button** — changed from `btn-g` (ghost, invisible) to `btn-s` (secondary)
- ✅ **Edit buttons wired** — all 5 stations list rows + station-detail header → `nav('station-edit')`

---

## 5. Known Open Issues

- **CSS alias consolidation** — short names (`.ac`, `.btn-p`, etc.) and v5 full names (`.app-content`, `.btn-primary`) coexist. Consolidate to v5 names before production.
- **Pipeline Edit screen** — builder doubles as edit via title swap; a dedicated `screen-pipeline-edit` (separate from New Pipeline builder) is cleaner but deferred.
- **Filter tab counts** — removed. Restore when counts come from real data.
- **Multi-tray job support** — post-POC.

---

## 6. Files in This Package

| File | Description |
|---|---|
| `manutracker-full-prototype-v2.html` | **Primary** — 16 screens |
| `manutrack-landing-v2.html` | Landing page |
| `manutracker-tokens-v2.css` | CSS tokens (source of truth) |
| `manutracker-logo-v3-fixed.html` | Approved logo |
| `manutrack-prd-v1.md` | Full PRD |
| `manutracker-design-brief-v1.md` | Design system reference |
| `manutracker-session-debrief-v2.md` | This file |

---

*Session: April 2026 · ManuTracker POC with Maks*
