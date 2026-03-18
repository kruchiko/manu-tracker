import { useDurations } from "../hooks/useDurations";
import { formatDuration } from "../dashboard.utils";

export function StationDurations() {
  const { data, isLoading, error } = useDurations();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading analytics...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load analytics: {error.message}</p>;
  }

  const durations = data ?? [];

  if (durations.length === 0) {
    return <p className="text-sm text-gray-500">No stage duration data yet. Durations appear once orders move between stations.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="grid">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Station</th>
            <th className="py-2 pr-4 font-medium">Avg Duration</th>
            <th className="py-2 pr-4 font-medium">Max Duration</th>
            <th className="py-2 font-medium">Orders Passed</th>
          </tr>
        </thead>
        <tbody>
          {durations.map((d) => (
            <tr key={d.stationId} className="border-b">
              <td className="py-3 pr-4 font-medium text-gray-900">{d.stationName}</td>
              <td className="py-3 pr-4">{formatDuration(d.avgSeconds)}</td>
              <td className="py-3 pr-4">{formatDuration(d.maxSeconds)}</td>
              <td className="py-3">{d.orderCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
