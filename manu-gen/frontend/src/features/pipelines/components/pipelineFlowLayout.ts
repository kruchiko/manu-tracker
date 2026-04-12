const NODE_WIDTH = 75;
const CONNECTOR_WIDTH = 24;
const MORE_CHIP_WIDTH = 70;
const SIDEBAR_WIDTH = 220;
const CONTENT_PADDING = 72;
const PIPELINE_COL = 200;
const ACTIONS_COL = 140;
const TABLE_CELL_PADDING = 44;

/** Layout math for the pipeline flow column — must stay in sync with list + sidebar chrome. */
export function calcMaxVisible(viewportWidth: number, totalSteps: number): number {
  const flowSpace =
    viewportWidth - SIDEBAR_WIDTH - CONTENT_PADDING - PIPELINE_COL - ACTIONS_COL - TABLE_CELL_PADDING;

  if (flowSpace <= 0) return 1;

  const fitsAll = NODE_WIDTH * totalSteps + CONNECTOR_WIDTH * Math.max(0, totalSteps - 1);
  if (fitsAll <= flowSpace) return totalSteps;

  const spaceForNodes = flowSpace - MORE_CHIP_WIDTH - CONNECTOR_WIDTH;
  const perNode = NODE_WIDTH + CONNECTOR_WIDTH;
  return Math.max(1, Math.min(Math.floor(spaceForNodes / perNode), totalSteps));
}
