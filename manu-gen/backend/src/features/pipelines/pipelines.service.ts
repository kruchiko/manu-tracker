import crypto from "node:crypto";
import db from "../../db.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreatePipelineInput,
  UpdatePipelineInput,
  ReplacePipelineStepsInput,
  Pipeline,
  PipelineRow,
  PipelineStepJoinRow,
} from "./pipelines.schema.js";
import { toPipeline } from "./pipelines.schema.js";

const stmtInsert = db.prepare(
  `INSERT INTO pipelines (id, name, description) VALUES (@id, @name, @description)`,
);

const stmtGetById = db.prepare(
  `SELECT id, name, description, created_at FROM pipelines WHERE id = ?`,
);

const stmtList = db.prepare(
  `SELECT id, name, description, created_at FROM pipelines ORDER BY name LIMIT ? OFFSET ?`,
);

const stmtUpdate = db.prepare(
  `UPDATE pipelines SET name = COALESCE(@name, name), description = COALESCE(@description, description) WHERE id = @id`,
);

const stmtDelete = db.prepare(`DELETE FROM pipelines WHERE id = ?`);

const stmtStepsByPipeline = db.prepare(
  `SELECT ps.id, ps.pipeline_id, ps.station_id, ps.position, ps.max_duration_seconds, s.name AS station_name
   FROM pipeline_steps ps
   JOIN stations s ON s.id = ps.station_id
   WHERE ps.pipeline_id = ?
   ORDER BY ps.position`,
);

const stmtInsertStep = db.prepare(
  `INSERT INTO pipeline_steps (pipeline_id, station_id, position, max_duration_seconds)
   VALUES (@pipeline_id, @station_id, @position, @max_duration_seconds)`,
);

const stmtDeleteStepsByPipeline = db.prepare(
  `DELETE FROM pipeline_steps WHERE pipeline_id = ?`,
);

const stmtOrdersUsingPipeline = db.prepare(
  `SELECT COUNT(*) AS cnt FROM orders WHERE pipeline_id = ?`,
);

function generateId(): string {
  return `pipeline-${crypto.randomUUID().slice(0, 8)}`;
}

function getStepRows(pipelineId: string): PipelineStepJoinRow[] {
  return stmtStepsByPipeline.all(pipelineId) as PipelineStepJoinRow[];
}

function insertSteps(
  pipelineId: string,
  steps: CreatePipelineInput["steps"],
): void {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    stmtInsertStep.run({
      pipeline_id: pipelineId,
      station_id: step.stationId,
      position: i + 1,
      max_duration_seconds: step.maxDurationSeconds,
    });
  }
}

const createPipelineTx = db.transaction((input: CreatePipelineInput): string => {
  const id = generateId();
  stmtInsert.run({ id, name: input.name, description: input.description ?? "" });
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

export function updatePipeline(id: string, input: UpdatePipelineInput): Pipeline {
  const row = stmtGetById.get(id) as PipelineRow | undefined;
  if (!row) {
    throw new AppError(404, `Pipeline with id ${id} not found`);
  }
  stmtUpdate.run({ id, name: input.name ?? null, description: input.description ?? null });
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
  const orderCount = countOrdersUsingPipeline(id);
  if (orderCount > 0) {
    throw new AppError(
      409,
      `Cannot delete pipeline "${row.name}": ${orderCount} order(s) still reference it`,
    );
  }
  stmtDeleteStepsByPipeline.run(id);
  stmtDelete.run(id);
});

export function deletePipeline(id: string): void {
  deletePipelineTx(id);
}

export function countOrdersUsingPipeline(id: string): number {
  const row = stmtOrdersUsingPipeline.get(id) as { cnt: number };
  return row.cnt;
}
