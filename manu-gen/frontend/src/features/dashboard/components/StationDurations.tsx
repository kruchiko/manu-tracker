import { useDurations } from "../hooks/useDurations";
import { formatDuration } from "../dashboard.utils";
import { StationBarChart } from "./StationBarChart";
import { useOverviewVisible } from "../OverviewVisibleContext";

export function StationDurations() {
  const visible = useOverviewVisible();
  const { data, isLoading, error } = useDurations(visible);

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
    <div className="space-y-6">
      <StationBarChart durations={durations} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Station</th>
              <th className="py-2 pr-4 font-medium">Avg</th>
              <th className="py-2 pr-4 font-medium">Median</th>
              <th className="py-2 pr-4 font-medium">Min</th>
              <th className="py-2 pr-4 font-medium">Max</th>
              <th className="py-2 pr-4 font-medium">P95</th>
              <th className="py-2 pr-4 font-medium">Orders</th>
              <th className="py-2 font-medium">Threshold</th>
            </tr>
          </thead>
          <tbody>
            {durations.map((d) => {
              const avgExceeds = d.maxDurationSeconds !== null && d.avgSeconds >= d.maxDurationSeconds;
              const maxExceeds = d.maxDurationSeconds !== null && d.maxSeconds >= d.maxDurationSeconds;
              return (
                <tr key={d.stationId} className="border-b">
                  <td className="py-3 pr-4 font-medium text-gray-900">{d.stationName}</td>
                  <td className={`py-3 pr-4 ${avgExceeds ? "font-medium text-red-600" : ""}`}>
                    {formatDuration(d.avgSeconds)}
                  </td>
                  <td className="py-3 pr-4">{formatDuration(d.medianSeconds)}</td>
                  <td className="py-3 pr-4">{formatDuration(d.minSeconds)}</td>
                  <td className={`py-3 pr-4 ${maxExceeds ? "font-medium text-red-600" : ""}`}>
                    {formatDuration(d.maxSeconds)}
                  </td>
                  <td className={`py-3 pr-4 ${d.maxDurationSeconds !== null && d.p95Seconds >= d.maxDurationSeconds ? "font-medium text-red-600" : ""}`}>
                    {formatDuration(d.p95Seconds)}
                  </td>
                  <td className="py-3 pr-4">{d.orderCount}</td>
                  <td className="py-3">
                    {d.maxDurationSeconds !== null ? (
                      formatDuration(d.maxDurationSeconds)
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
