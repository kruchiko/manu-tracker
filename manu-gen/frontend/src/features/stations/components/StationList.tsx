import { useStations } from "../hooks/useStations";
import { StationCard } from "./StationCard";

export function StationList() {
  const { data, isLoading, error } = useStations();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading stations...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Failed to load stations: {error.message}
      </p>
    );
  }

  const stations = data ?? [];

  if (stations.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No stations yet. Create one above.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );
}
