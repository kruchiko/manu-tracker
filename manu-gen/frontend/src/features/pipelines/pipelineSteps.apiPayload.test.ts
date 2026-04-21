import { describe, expect, it } from "vitest";
import type { StepFormValue } from "./pipelines.schema";
import { serializePipelineStepsForApi } from "./pipelineSteps.apiPayload";

describe("serializePipelineStepsForApi", () => {
  it("coerces undefined optional fields to explicit null for JSON bodies", () => {
    const steps = [
      {
        stationId: "s-1",
        minDurationSeconds: undefined,
        maxDurationSeconds: 120,
        minCapacity: undefined,
        maxCapacity: 4,
      },
    ] as unknown as StepFormValue[];

    expect(JSON.stringify({ steps: serializePipelineStepsForApi(steps) })).toContain('"minDurationSeconds":null');
    expect(JSON.stringify({ steps: serializePipelineStepsForApi(steps) })).toContain('"minCapacity":null');
  });
});
