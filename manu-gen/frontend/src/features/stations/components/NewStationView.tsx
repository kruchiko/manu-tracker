import { useState } from "react";
import { StationForm } from "./StationForm";
import { useCreateStation } from "../hooks/useCreateStation";
import { useAssignEye } from "../hooks/useAssignEye";
import type { CreateStationFormValues } from "../stations.schema";

interface NewStationViewProps {
  onBack: () => void;
}

export function NewStationView({ onBack }: NewStationViewProps): React.JSX.Element {
  const { mutateAsync: createStation, isPending: isCreating } = useCreateStation();
  const { mutateAsync: assignEye, isPending: isAssigning } = useAssignEye();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = isCreating || isAssigning;

  async function handleSubmit(values: CreateStationFormValues): Promise<void> {
    setSubmitError(null);
    try {
      const created = await createStation(values);
      const camera = (values.cameraId ?? "").trim();
      if (camera) {
        await assignEye({ stationId: created.id, eyeId: camera });
      }
      onBack();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <StationForm
      title="New Station"
      submitLabel="Create Station"
      defaultValues={{ name: "", location: "", slotCapacity: 1, cameraId: "" }}
      isSubmitting={isSubmitting}
      errorMessage={submitError}
      onBack={onBack}
      onSubmit={handleSubmit}
    />
  );
}
