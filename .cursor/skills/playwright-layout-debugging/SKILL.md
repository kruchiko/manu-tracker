---
name: playwright-layout-debugging
description: >-
  Use Playwright to verify CSS table/grid/flex layout in a real browser when
  source-only fixes fail or regress. Covers browser install (sandbox paths),
  ManuTracker docker ports, measurement snippets, and jsdom test polyfills.
  Apply when debugging horizontal gaps, column widths, truncation, or any
  layout that depends on table-layout, width:100%, or ResizeObserver.
---

# Playwright layout debugging (ManuTracker)

CSS layout bugs often **do not show up in source review**. `table-layout: fixed`, `width: 100%`, percentage columns, and shrink-wrapped children interact in ways that only appear in **computed layout**. Use Playwright to read **actual pixel geometry** before changing more CSS.

## The workflow — measure, diagnose, change, re-measure

Never skip straight to a CSS fix. Follow this loop:

1. **Measure the current state.** Write a short Playwright script (see snippets below) that reports pixel widths, gaps, and `gridTemplateColumns` for the elements involved.
2. **Identify which element owns the gap.** For every cell, measure both the `<td>` width and its first child's width. The difference tells you whether the gap is inside the cell (child smaller than cell) or between cells (padding / column boundary). Check the **preceding and following** cells — the gap is often in a neighbour, not the element you expect.
3. **Change one thing.** Make a single CSS or JS change.
4. **Re-measure.** Run the same script. Compare numbers. If the gap moved rather than shrank, you changed the wrong property.

Do not iterate CSS by guessing — every change must be validated by a measurement.

## When to reach for this

- User reports a gap, clip, or misalignment that "should" be fixed by a CSS tweak but **looks unchanged** in the app.
- You are tuning **how many items fit** before "+N more" — formula constants are easy to get wrong; **measure the container** the component actually uses.
- Suspected issues: `width: 1%` tricks, `table-layout: auto` vs `fixed`, `min-width` on flex children, **right-aligned** content inside a column that absorbed extra width.

## Project context

- **Frontend URL (docker-compose):** `http://localhost:5173` (not 5180). Check with `docker ps`. Paths like `/pipelines` for the pipelines table.
- **Always run from the repo root** (`manu-tracker/`), where `node_modules/playwright-core` lives.

## Installing Playwright Chromium

If `chromium.launch()` fails with **"Executable doesn't exist"** under a sandbox or temp cache path, install browsers into the project's `node_modules` so Node resolves them consistently:

```bash
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium
```

Then run scripts with the same env:

```bash
PLAYWRIGHT_BROWSERS_PATH=0 node your-script.mjs
```

`npx playwright install chromium` alone may report success while binaries land in a sandbox cache path the runner cannot see.

## Measurement snippets

Use **Chromium** (matches the user's browser). Set viewport to match the bug report (e.g. `1440x900`). Wait for a real selector (`table tbody tr`, `[role="group"]`, etc.).

**Cell widths, child widths, and the gap between them:**

```javascript
await page.evaluate(() => {
  const row = document.querySelector("table tbody tr");
  const cells = row.querySelectorAll("td");
  return Array.from(cells).map((c, i) => {
    const r = c.getBoundingClientRect();
    const child = c.firstElementChild;
    const cr = child?.getBoundingClientRect();
    return {
      i,
      cellWidth: Math.round(r.width),
      childWidth: cr ? Math.round(cr.width) : null,
      innerGap: cr ? Math.round(r.width - cr.width) : null,
      paddingL: getComputedStyle(c).paddingLeft,
      paddingR: getComputedStyle(c).paddingRight,
    };
  });
});
```

**Gap between two elements (e.g. "+N more" and Delete):**

```javascript
const chipRight = moreBtn.getBoundingClientRect().right;
const deleteLeft = deleteBtn.getBoundingClientRect().left;
Math.round(deleteLeft - chipRight);
```

**CSS Grid track sizes (flow preview):**

```javascript
getComputedStyle(flowEl).gridTemplateColumns;
```

Compare measured column widths to your `NODE_WIDTH` / token values. If they differ, **update the constant to match the browser** — the browser is authoritative.

## Lessons learned (pipelines list)

### Diagnosis patterns (reusable)

1. **`width: 100%` on `<table>` forces some column to eat leftover width.** Switching `table-layout` alone does not fix this — the table is still full width. Identify *which* column absorbs the excess and whether that is acceptable.
2. **Always measure both cells and their children.** The gap between "+N more" and Delete turned out to be mostly inside the Actions column (`min-width: 130px` on a flex wrapper + `justify-content: flex-end`), not the Flow column. Measuring only the Flow cell would have missed it entirely.
3. **Guessing container width from `window.innerWidth` minus hardcoded constants drifts.** Padding, borders, scrollbar, and table column distribution all eat pixels the formula does not account for. Measure the actual container.

### Fixes we applied (project-specific)

4. **ResizeObserver on the flow container** replaced the `window.innerWidth` formula so `calcMaxVisible` always uses the real available width.
5. **Visual spacing without stretching connectors:** `margin-left` on the "+N more" chip (token-aligned, e.g. `var(--space-6)`) plus a matching bump to `PIPELINE_FLOW_LAYOUT.moreTailReservePx` in the truncation formula (and `--pipeline-flow-more-tail-min` in `design-tokens.css`).

## jsdom test polyfills

When components depend on `ResizeObserver` or `getBoundingClientRect`:

- Add a no-op `ResizeObserver` polyfill in `manu-gen/frontend/src/test-setup.ts` (documented there: it does not fire callbacks).
- Guard recalc logic with `if (width > 0)` so jsdom's zero-width containers don't collapse visible items to 1.
- **Regression coverage without Playwright:** `pipelineFlowLayout.contract.test.ts` ties `PIPELINE_FLOW_LAYOUT` literals to `design-tokens.css` strings; `PipelineFlowPreview.test.tsx` includes a describe block that temporarily replaces `ResizeObserver` and mocks `getBoundingClientRect` on `data-testid="pipeline-flow-root"` to assert “+N more” and `onMore`.

## Hygiene

- Delete one-off debug scripts (`_verify.mjs`, screenshots) before committing.
- After layout fixes, run `npm test -- --run` in `manu-gen/frontend`; update tests if `calcMaxVisible` contracts or polyfills change.

## Related skills

- **principal-engineer** — verify in browser / computed styles; do not approve layout fixes on source alone.
- **principal-frontend-engineer** — token-first spacing; align chip margins with design tokens.
