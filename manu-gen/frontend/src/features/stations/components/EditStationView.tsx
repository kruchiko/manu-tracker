import { useMemo, useState } from "react";
import { StationForm } from "./StationForm";
import { StationEditDangerZone } from "./StationEditDangerZone";
import { useUpdateStation } from "../hooks/useUpdateStation";
import { useAssignEye } from "../hooks/useAssignEye";
import { useUnassignEye } from "../hooks/useUnassignEye";
import { usePipelines } from "../../pipelines/hooks/usePipelines";
import type { Station } from "../stations.types";
import type { CreateStationFormValues } from "../stations.schema";

interface EditStationViewProps {
  station: Station;
  onBack: () => void;
}

export function EditStationView({ station, onBack }: EditStationViewProps): React.JSX.Element {
  const { mutateAsync: updateStation } = useUpdateStation();
  const { mutateAsync: assignEye } = useAssignEye();
  const { mutateAsync: unassignEye } = useUnassignEye();
  const { data: pipelines } = usePipelines();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const defaultValues = useMemo<CreateStationFormValues>(
    () => ({
      name: station.name,
      location: station.location,
      slotCapacity: station.slotCapacity ?? 1,
      cameraId: station.eyeId ?? "",
    }),
    [station],
  );

  const pipelineRefs = useMemo(() => {
    if (!pipelines) {
      return [];
    }
    return pipelines.flatMap((p) =>
      p.steps
        .filter((s) => s.stationId === station.id)
        .map((s) => ({
          pipelineId: p.id,
          name: p.name,
          stepPosition: s.position,
          stepTotal: p.steps.length,
        })),
    );
  }, [pipelines, station.id]);

  async function handleSubmit(values: CreateStationFormValues): Promise<void> {
    setSubmitError(null);
    setIsSaving(true);
    const oldEye = (station.eyeId ?? "").trim();
    const newEye = (values.cameraId ?? "").trim();

    try {
      await updateStation({
        id: station.id,
        name: values.name,
        location: values.location ?? "",
      });

      if (oldEye !== newEye) {
        if (oldEye && !newEye) {
          await unassignEye(station.id);
        } else if (newEye) {
          await assignEye({ stationId: station.id, eyeId: newEye });
        }
      }

      onBack();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <StationForm
      key={station.id}
      title="Edit Station"
      submitLabel="Save changes"
      defaultValues={defaultValues}
      isSubmitting={isSaving}
      errorMessage={submitError}
      onBack={onBack}
      onSubmit={handleSubmit}
      backLabel={station.name}
      capacityPreview="utilized"
      pipelineRefs={pipelineRefs}
      dangerZone={<StationEditDangerZone station={station} onDeleted={onBack} />}
    />
  );
}
