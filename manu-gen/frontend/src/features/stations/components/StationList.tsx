import { PackageOpen } from "lucide-react";
import { useStations } from "../hooks/useStations";
import { ListCard } from "../../../shared/components/ListCard";
import { StationTable } from "./StationTable";

function SkeletonRow({ hasBorder }: { hasBorder: boolean }): React.JSX.Element {
  return (
    <div
      className={`flex gap-[22px] px-[22px] py-[13px] ${hasBorder ? "border-b border-border" : ""}`}
    >
      <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
      <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
      <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
      <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
      <div className="ml-auto h-4 w-24 animate-pulse rounded bg-surface-2" />
    </div>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-[24px] py-[14px]">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="bg-surface-2 px-[22px] py-[10px]">
        <div className="flex gap-[22px]">
          <div className="h-3 w-16 animate-pulse rounded bg-border" />
          <div className="h-3 w-16 animate-pulse rounded bg-border" />
          <div className="h-3 w-20 animate-pulse rounded bg-border" />
          <div className="h-3 w-14 animate-pulse rounded bg-border" />
          <div className="ml-auto h-3 w-14 animate-pulse rounded bg-border" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} hasBorder={i < 4} />
      ))}
    </div>
  );
}

export function StationList(): React.JSX.Element {
  const { data, isLoading, error } = useStations();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-[var(--space-8)] text-center shadow-sm">
        <p className="text-[13px] text-status-late">
          Failed to load stations: {error.message}
        </p>
      </div>
    );
  }

  const stations = data ?? [];

  if (stations.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-[var(--space-12)] text-center shadow-sm">
        <PackageOpen
          size={40}
          strokeWidth={1.5}
          className="mx-auto mb-[var(--space-4)] text-text-muted"
        />
        <p className="text-[13px] text-text-muted">
          No stations yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <ListCard
      title="All Stations"
      count={stations.length}
      countLabel={stations.length === 1 ? "station" : "stations"}
    >
      <StationTable stations={stations} />
    </ListCard>
  );
}
