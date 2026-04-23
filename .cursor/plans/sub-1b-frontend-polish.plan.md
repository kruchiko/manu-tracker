# Sub-plan 1b: Frontend Polish — Live Dashboard + Customer Orders

> **Parent plan:** [Production Architecture Plan](production_architecture_plan_87189a29.plan.md)
> **Stage:** 2
> **Can start:** After Sub-plan 1a (Repo Organization)
> **Blocks:** Sub-plan 3 (Postgres Migration) — complete frontend polish before DB migration
> **Parallel with:** Nothing (focused frontend work)

## Objective

Bring the Live Operations dashboard and Customer Orders views to v2 design fidelity, matching the prototype and design system. These are the two primary user-facing views and should be polished before production deployment.

## Design References

- **Full prototype:** [`docs/design/v2/prototypes/manutracker-full-prototype-v2.html`](../../docs/design/v2/prototypes/manutracker-full-prototype-v2.html) — open in browser for the target visual
- **Design system:** [`docs/design/v2/DESIGN-SYSTEM.md`](../../docs/design/v2/DESIGN-SYSTEM.md) — component specs, states, spacing, typography rules
- **Design tokens (CSS):** [`docs/design/v2/tokens/manutracker-tokens-v2.css`](../../docs/design/v2/tokens/manutracker-tokens-v2.css) — canonical token values
- **Frontend tokens (live):** `manu-gen/frontend/src/tokens/design-tokens.css` — should mirror the doc tokens
- **Design review:** [`docs/design/v2/REVIEW.md`](../../docs/design/v2/REVIEW.md) — resolved criticals + remaining suggestions

## Cursor Skills to Apply

Read and follow these skills before implementation:
- `/Users/maksym/Projects/manu-tracker/.cursor/skills/principal-frontend-engineer/SKILL.md` — token-first styling, prototype reading rules, design fidelity verification
- `/Users/maksym/.claude/skills/code-quality-react/SKILL.md` — React/TanStack Query/RHF patterns

## Current State

Both views are **structured product UIs** (not scaffolds) with:
- Design token usage (CSS variables)
- Section panels, KPI cards, charts, status badges, empty states
- CSS Modules styling throughout

What likely needs alignment with the v2 prototype:
- Visual spacing and layout tweaks
- Typography hierarchy matching the design system
- Component state handling (loading skeletons, error states, empty states per spec)
- Chart styling alignment with token palette
- Any new UI elements present in the prototype but not yet implemented

## Working Directory

After repo split (Sub-plan 1a), work happens in the `agrus-ops/manu-gen` repo at `frontend/src/`.

Design references (`docs/design/v2/`) are included in the manu-gen repo (see Sub-plan 1a filter-repo command).

## Tasks

### 1. Audit: Prototype vs Current Implementation

Open the HTML prototype in a browser. Compare each screen side-by-side with the running app. Document gaps for:

**Live Operations (`/live-operations`):**
- `features/dashboard/components/LiveOperationsPage.tsx`
- `features/dashboard/components/LiveOperationsOverview.tsx`
- `features/dashboard/components/KpiCards.tsx` + `.module.css`
- `features/dashboard/components/JobBoard.tsx` + `JobBoardRow.tsx` + `.module.css`
- `features/dashboard/components/DashboardCharts.tsx`
- `features/dashboard/components/StationDurations.tsx` + `StationBarChart.tsx`
- `features/dashboard/components/ActivitySparklines.tsx`

**Customer Orders (`/customer-orders`):**
- `features/customer-orders/components/CustomerOrdersPage.tsx`
- `features/customer-orders/components/CustomerOrderList.tsx` + `.module.css`
- `features/customer-orders/components/CustomerOrderDetail.tsx` + `.module.css`
- `features/customer-orders/components/CustomerOrderForm.tsx`
- `features/customer-orders/components/CustomerOrderStatusBadge.tsx`

### 2. Token Alignment

Ensure `frontend/src/tokens/design-tokens.css` is fully in sync with `docs/design/v2/tokens/manutracker-tokens-v2.css`. Fix any drift.

Verify charts use token-based colors (the review noted `dashboard.colors.ts` uses raw hex values -- these should reference tokens or at least match the token palette).

### 3. Live Operations — Visual Polish

Implement gaps found in the audit. Likely areas:

- **KPI Cards:** Match layout, typography hierarchy (value size, label style, trend indicator), and spacing from prototype
- **Job Board table:** Row density, column widths, status badge styling, progress bar appearance, hover states per DESIGN-SYSTEM.md
- **Charts:** Bar chart and sparkline styling -- colors, axis labels, grid lines, responsive sizing
- **Section panels:** Padding, border-radius, shadow, header typography per design system
- **Loading states:** Skeleton loading per DESIGN-SYSTEM.md Section 6 (page-level skeleton, tab switch instant, table skeleton rows, analytics inline skeleton)
- **Empty states:** Copy + icon treatment per prototype
- **Polling indicator:** 30s background refresh behavior (loading overlay for table refresh, not full skeleton)

### 4. Customer Orders — Visual Polish

- **List view:** Filter tabs styling, metric tiles layout, table row density, status badges, empty state
- **Order detail:** ScreenHeader "hero band" styling, line item cards, allocation UI, action buttons
- **Create form:** Form layout, input styling, validation error display per DESIGN-SYSTEM.md (scroll to first error, error message below field)
- **Status badges:** Consistent with `CustomerOrderStatusBadge` and design system semantic status tokens

### 5. Remaining Design Review Suggestions (if time permits)

From REVIEW.md, these suggestions can be addressed during this pass:

- **Chart colors on tokens:** Align `dashboard.colors.ts` with token palette
- **Sidebar text contrast:** Verify `--sidebar-text` against WCAG AA (bump to `#d0dff0` if needed)
- **Spacing scale alignment:** Fix any off-scale values (`gap: 7px` etc.) to use the 4px scale
- **Content padding:** Settle on `32px` uniform or `32px 36px` and apply consistently

### 6. Cross-Browser / Basic Responsiveness Check

Per design system: minimum viewport 1024px, horizontal scroll below that, sidebar never collapses. Verify this works. Test in Chrome and Firefox at minimum.

## Validation Criteria

- [ ] Live Operations view visually matches the v2 prototype (side-by-side comparison)
- [ ] Customer Orders view (list + detail + create) visually matches the prototype
- [ ] All colors use design tokens (no raw hex in component CSS except `design-tokens.css`)
- [ ] Loading, empty, and error states implemented per DESIGN-SYSTEM.md Section 6
- [ ] Charts use token-aligned colors
- [ ] `design-tokens.css` is in sync with `manutracker-tokens-v2.css`
- [ ] No lint errors introduced
- [ ] All existing frontend tests pass
