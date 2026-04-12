import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StationList } from "./StationList";
import { NewStationView } from "./NewStationView";
import styles from "./StationsPage.module.css";

type StationsView = "list" | "new";

export function StationsPage(): React.JSX.Element {
  const [view, setView] = useState<StationsView>("list");

  if (view === "new") {
    return <NewStationView onBack={() => setView("list")} />;
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
      <StationList />
    </div>
  );
}
