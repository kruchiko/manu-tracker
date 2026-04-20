import { useState } from "react";
import { StationForm } from "./StationForm";
import { useCreateStation } from "../hooks/useCreateStation";
import { useAssignEye } from "../hooks/useAssignEye";
import type { CreateStationFormValues, CreateStationRequestBody } from "../stations.schema";
import { clampSlotCapacityForApi } from "../slotCapacity.utils";

interface NewStationViewProps {
  onBack: () => void;
}

export function NewStationView({ onBack }: NewStationViewProps): React.JSX.Element {
  const { mutateAsync: createStation } = useCreateStation();
  const { mutateAsync: assignEye } = useAssignEye();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(values: CreateStationFormValues): Promise<void> {
    setSubmitError(null);
    setIsSaving(true);
    const camera = (values.cameraId ?? "").trim();
    const createBody: CreateStationRequestBody = {
      name: values.name,
      location: values.location,
      slotCapacity: clampSlotCapacityForApi(values.slotCapacity),
    };
    let createdId: string | null = null;
    try {
      const created = await createStation(createBody);
      createdId = created.id;
      if (camera) {
        await assignEye({ stationId: created.id, eyeId: camera });
      }
      onBack();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      if (createdId !== null && camera) {
        setSubmitError(
          `${msg} The station was created. Open it from the list to assign the camera, or try again.`,
        );
      } else {
        setSubmitError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <StationForm
      title="New Station"
      submitLabel="Create Station"
      defaultValues={{ name: "", location: "", slotCapacity: 1, cameraId: "" }}
      isSubmitting={isSaving}
      errorMessage={submitError}
      onBack={onBack}
      onSubmit={handleSubmit}
    />
  );
}
