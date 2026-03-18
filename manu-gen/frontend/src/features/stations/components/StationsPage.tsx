import { CreateStationForm } from "./CreateStationForm";
import { StationList } from "./StationList";

export function StationsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Stations</h2>

      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">New Station</h3>
        <CreateStationForm />
      </div>

      <StationList />
    </div>
  );
}
