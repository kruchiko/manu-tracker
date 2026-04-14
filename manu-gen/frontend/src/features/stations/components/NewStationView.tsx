import { StationForm } from "./StationForm";
import { useCreateStation } from "../hooks/useCreateStation";

interface NewStationViewProps {
  onBack: () => void;
}

export function NewStationView({ onBack }: NewStationViewProps): React.JSX.Element {
  const { mutate, isPending, error } = useCreateStation();

  return (
    <StationForm
      title="New Station"
      submitLabel="Create Station"
      defaultValues={{ name: "", location: "", slotCapacity: 1, cameraId: "" }}
      isSubmitting={isPending}
      errorMessage={error?.message ?? null}
      onBack={onBack}
      onSubmit={(values) => mutate(values, { onSuccess: onBack })}
    />
  );
}
