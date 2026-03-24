import { useSummary } from "../hooks/useSummary";
import { formatDuration } from "../dashboard.utils";
import { useOverviewVisible } from "../OverviewVisibleContext";

interface KpiCardProps {
  label: string;
  value: string;
  accent?: "default" | "warning" | "danger";
}

function KpiCard({ label, value, accent = "default" }: KpiCardProps) {
  const accentStyles = {
    default: "border-gray-200",
    warning: "border-yellow-300 bg-yellow-50",
    danger: "border-red-300 bg-red-50",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 shadow-sm ${accentStyles[accent]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function KpiCards() {
  const visible = useOverviewVisible();
  const { data, isLoading } = useSummary(visible);

  if (isLoading || !data) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-lg border bg-gray-50" />
        ))}
      </div>
    );
  }

  const violationAccent = data.thresholdViolations > 0 ? "danger" : "default";

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Active orders (30m)"
        value={`${data.activeOrders} / ${data.totalTrackedOrders}`}
      />
      <KpiCard
        label="Avg dwell time"
        value={data.avgDwellSeconds > 0 ? formatDuration(data.avgDwellSeconds) : "--"}
      />
      <KpiCard
        label="Bottleneck station"
        value={data.bottleneckStation ?? "--"}
      />
      <KpiCard
        label="Threshold violations"
        value={String(data.thresholdViolations)}
        accent={violationAccent}
      />
    </div>
  );
}
