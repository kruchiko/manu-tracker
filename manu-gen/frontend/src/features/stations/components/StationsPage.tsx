import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StationList } from "./StationList";
import { NewStationView } from "./NewStationView";

type StationsView = "list" | "new";

export function StationsPage(): React.JSX.Element {
  const [view, setView] = useState<StationsView>("list");

  if (view === "new") {
    return <NewStationView onBack={() => setView("list")} />;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Stations"
        subtitle="Physical devices and locations where production happens"
        action={
          <button
            type="button"
            onClick={() => setView("new")}
            className="inline-flex h-[32px] items-center gap-[6px] rounded-[var(--radius-md)] border border-accent bg-accent px-[14px] font-body text-[13px] font-medium text-white transition-all duration-[var(--duration-fast)] hover:bg-accent-dark"
          >
            <Plus size={13} strokeWidth={2} />
            New Station
          </button>
        }
      />
      <StationList />
    </div>
  );
}
