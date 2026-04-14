import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StationList } from "./StationList";
import { NewStationView } from "./NewStationView";
import { EditStationView } from "./EditStationView";
import type { Station } from "../stations.types";
import styles from "./StationsPage.module.css";

type StationsView = "list" | "new" | "edit";

export function StationsPage(): React.JSX.Element {
  const [view, setView] = useState<StationsView>("list");
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  if (view === "new") {
    return <NewStationView onBack={() => setView("list")} />;
  }

  if (view === "edit" && editingStation) {
    return (
      <EditStationView
        station={editingStation}
        onBack={() => {
          setEditingStation(null);
          setView("list");
        }}
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Stations"
        subtitle="Physical devices and locations where production happens"
        action={
          <button
            type="button"
            onClick={() => setView("new")}
            className={styles.newButton}
          >
            <Plus size={13} strokeWidth={2} />
            New Station
          </button>
        }
      />
      <StationList
        onSelectStation={(station) => {
          setEditingStation(station);
          setView("edit");
        }}
      />
    </div>
  );
}
