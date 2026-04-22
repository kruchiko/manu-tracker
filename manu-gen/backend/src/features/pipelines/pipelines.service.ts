import crypto from "node:crypto";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreatePipelineInput,
  UpdatePipelineInput,
  ReplacePipelineStepsInput,
  UpdatePipelineWithStepsInput,
  Pipeline,
  PipelineRow,
  PipelineStepJoinRow,
} from "./pipelines.schema.js";
import { toPipeline } from "./pipelines.schema.js";

const stmtInsert = db.prepare(
  `INSERT INTO pipelines (id, name, description, product_type) VALUES (@id, @name, @description, @product_type)`,
);

const stmtGetById = db.prepare(
  `SELECT id, name, description, product_type, created_at FROM pipelines WHERE id = ?`,
);

const stmtList = db.prepare(
  `SELECT id, name, description, product_type, created_at FROM pipelines ORDER BY name LIMIT ? OFFSET ?`,
);

const stmtGetByProductType = db.prepare(
  `SELECT id, name, description, product_type, created_at FROM pipelines WHERE product_type = ?`,
);

const stmtUpdate = db.prepare(
  `UPDATE pipelines SET name = COALESCE(@name, name), description = COALESCE(@description, description), product_type = COALESCE(@product_type, product_type) WHERE id = @id`,
);

const stmtReplacePipelineFields = db.prepare(
  `UPDATE pipelines SET name = @name, description = @description, product_type = @product_type WHERE id = @id`,
);

const stmtDelete = db.prepare(`DELETE FROM pipelines WHERE id = ?`);

const stmtStepsByPipeline = db.prepare(
  `SELECT ps.id, ps.pipeline_id, ps.station_id, ps.position, ps.min_duration_seconds, ps.max_duration_seconds, ps.min_capacity, ps.max_capacity, s.name AS station_name
   FROM pipeline_steps ps
   JOIN stations s ON s.id = ps.station_id
   WHERE ps.pipeline_id = ?
   ORDER BY ps.position`,
);

const stmtInsertStep = db.prepare(
  `INSERT INTO pipeline_steps (pipeline_id, station_id, position, min_duration_seconds, max_duration_seconds, min_capacity, max_capacity)
   VALUES (@pipeline_id, @station_id, @position, @min_duration_seconds, @max_duration_seconds, @min_capacity, @max_capacity)`,
);

const stmtDeleteStepsByPipeline = db.prepare(
  `DELETE FROM pipeline_steps WHERE pipeline_id = ?`,
);

const stmtJobsUsingPipeline = db.prepare(
  `SELECT COUNT(*) AS cnt FROM jobs WHERE pipeline_id = ?`,
);

function generateId(): string {
  return `pipeline-${crypto.randomUUID().slice(0, 8)}`;
}

function getStepRows(pipelineId: string): PipelineStepJoinRow[] {
  return stmtStepsByPipeline.all(pipelineId) as PipelineStepJoinRow[];
}

function insertSteps(
  pipelineId: string,
  steps: ReplacePipelineStepsInput["steps"],
): void {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    stmtInsertStep.run({
      pipeline_id: pipelineId,
      station_id: step.stationId,
      position: i + 1,
      min_duration_seconds: step.minDurationSeconds ?? null,
      max_duration_seconds: step.maxDurationSeconds ?? null,
      min_capacity: step.minCapacity ?? null,
      max_capacity: step.maxCapacity ?? null,
    });
  }
}

const createPipelineTx = db.transaction((input: CreatePipelineInput): string => {
  const id = generateId();
  stmtInsert.run({
    id,
    name: input.name,
    description: input.description ?? "",
    product_type: input.productType,
  });
  insertSteps(id, input.steps);
  return id;
});

export function createPipeline(input: CreatePipelineInput): Pipeline {
  const id = createPipelineTx(input);
  return getPipelineById(id);
}

export function getPipelineById(id: string): Pipeline {
  const row = stmtGetById.get(id) as PipelineRow | undefined;
  if (!row) {
    throw new AppError(404, `Pipeline with id ${id} not found`);
  }
  return toPipeline(row, getStepRows(id));
}

export function listPipelines({
  limit = 50,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Pipeline[] {
  const rows = stmtList.all(limit, offset) as PipelineRow[];
  return rows.map((row) => toPipeline(row, getStepRows(row.id)));
}

function assertProductTypeChangeAllowed(
  pipelineId: string,
  currentProductType: string,
  nextProductType: string | undefined,
): void {
  if (nextProductType === undefined || nextProductType === currentProductType) {
    return;
  }
  const jobCount = countJobsUsingPipeline(pipelineId);
  if (jobCount > 0) {
    throw new AppError(
      422,
      `Cannot change product type while ${jobCount} job(s) still reference this pipeline`,
    );
  }
}

export function updatePipeline(id: string, input: UpdatePipelineInput): Pipeline {
  const row = stmtGetById.get(id) as PipelineRow | undefined;
  if (!row) {
    throw new AppError(404, `Pipeline with id ${id} not found`);
  }
  assertProductTypeChangeAllowed(id, row.product_type, input.productType);
  stmtUpdate.run({
    id,
    name: input.name ?? null,
    description: input.description ?? null,
    product_type: input.productType ?? null,
  });
  return getPipelineById(id);
}

const updatePipelineAndReplaceStepsTx = db.transaction(
  (id: string, input: UpdatePipelineWithStepsInput): void => {
    const row = stmtGetById.get(id) as PipelineRow | undefined;
    if (!row) {
      throw new AppError(404, `Pipeline with id ${id} not found`);
    }
    assertProductTypeChangeAllowed(id, row.product_type, input.productType);
    stmtReplacePipelineFields.run({
      id,
      name: input.name,
      description: input.description ?? "",
      product_type: input.productType,
    });
    stmtDeleteStepsByPipeline.run(id);
    insertSteps(id, input.steps);
  },
);

export function updatePipelineAndReplaceSteps(
  id: string,
  input: UpdatePipelineWithStepsInput,
): Pipeline {
  updatePipelineAndReplaceStepsTx(id, input);
  return getPipelineById(id);
}

const replaceStepsTx = db.transaction(
  (pipelineId: string, input: ReplacePipelineStepsInput): void => {
    const row = stmtGetById.get(pipelineId) as PipelineRow | undefined;
    if (!row) {
      throw new AppError(404, `Pipeline with id ${pipelineId} not found`);
    }
    stmtDeleteStepsByPipeline.run(pipelineId);
    insertSteps(pipelineId, input.steps);
  },
);

export function replaceSteps(
  pipelineId: string,
  input: ReplacePipelineStepsInput,
): Pipeline {
  replaceStepsTx(pipelineId, input);
  return getPipelineById(pipelineId);
}

const deletePipelineTx = db.transaction((id: string): void => {
  const row = stmtGetById.get(id) as PipelineRow | undefined;
  if (!row) {
    throw new AppError(404, `Pipeline with id ${id} not found`);
  }
  const jobCount = countJobsUsingPipeline(id);
  if (jobCount > 0) {
    throw new AppError(
      409,
      `Cannot delete pipeline "${row.name}": ${jobCount} job(s) still reference it`,
    );
  }
  stmtDeleteStepsByPipeline.run(id);
  stmtDelete.run(id);
});

export function deletePipeline(id: string): void {
  deletePipelineTx(id);
}

export function countJobsUsingPipeline(id: string): number {
  const row = stmtJobsUsingPipeline.get(id) as { cnt: number };
  return row.cnt;
}

export function getPipelineByProductType(productType: string): Pipeline | null {
  const row = stmtGetByProductType.get(productType) as PipelineRow | undefined;
  if (!row) return null;
  return toPipeline(row, getStepRows(row.id));
}
