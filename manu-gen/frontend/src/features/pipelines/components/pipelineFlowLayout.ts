/**
 * Horizontal layout budget for pipeline flow preview truncation (`PipelineFlowPreview`).
 * These literals approximate **computed** CSS — they are not read from the cascade at runtime.
 *
 * Keep aligned with:
 * - `src/tokens/design-tokens.css`: `--pipeline-flow-step-width`, `--space-6`
 * - `PipelineFlowPreview.module.css`: step column width + “+N more” chip (incl. margin)
 *
 * CI guard: `pipelineFlowLayout.contract.test.ts` asserts token strings still match these values.
 */
export const PIPELINE_FLOW_LAYOUT = {
  /** Effective max step column width — must match `--pipeline-flow-step-width` (77px). */
  stepColumnWidthPx: 77,
  /** Connector / gap between step columns — must match `--space-6` (24px). */
  connectorWidthPx: 24,
  /**
   * When truncated: reserve space for the last connector + “+N more” chip
   * (chip + `margin-left: var(--space-6))`. Re-measure in a real browser if chip styles change.
   */
  moreTailReservePx: 94,
} as const;

/**
 * How many steps fit in `availableWidth` pixels (measured container width).
 *
 * When all steps fit:  N × step + (N−1) × connector
 * When truncated:      N × (step + connector) + moreTailReserve
 */
export function calcMaxVisible(availableWidth: number, totalSteps: number): number {
  if (availableWidth <= 0) return 1;

  const { stepColumnWidthPx, connectorWidthPx, moreTailReservePx } = PIPELINE_FLOW_LAYOUT;
  const perNode = stepColumnWidthPx + connectorWidthPx;
  const fitsAll =
    stepColumnWidthPx * totalSteps + connectorWidthPx * Math.max(0, totalSteps - 1);
  if (fitsAll <= availableWidth) return totalSteps;

  const spaceForNodes = availableWidth - moreTailReservePx;
  return Math.max(1, Math.min(Math.floor(spaceForNodes / perNode), totalSteps));
}
