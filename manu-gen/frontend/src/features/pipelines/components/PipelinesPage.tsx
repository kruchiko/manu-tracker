import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { HintBanner } from "./HintBanner";
import { PipelineList } from "./PipelineList";
import { NewPipelineView } from "./NewPipelineView";
import { EditPipelineView } from "./EditPipelineView";
import type { Pipeline } from "../pipelines.types";
import styles from "./PipelinesPage.module.css";

type PipelinesView =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; pipeline: Pipeline };

export function PipelinesPage(): React.JSX.Element {
  const [view, setView] = useState<PipelinesView>({ kind: "list" });

  function handleEdit(pipeline: Pipeline): void {
    setView({ kind: "edit", pipeline });
  }

  function handleBack(): void {
    setView({ kind: "list" });
  }

  if (view.kind === "new") {
    return <NewPipelineView onBack={handleBack} />;
  }

  if (view.kind === "edit") {
    return <EditPipelineView pipeline={view.pipeline} onBack={handleBack} />;
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Pipelines"
        subtitle="Station sequences that define how each product type moves through production"
        action={
          <button
            type="button"
            onClick={() => setView({ kind: "new" })}
            className={styles.newButton}
          >
            <Plus size={13} strokeWidth={2} />
            New Pipeline
          </button>
        }
      />
      <HintBanner />
      <PipelineList onEdit={handleEdit} />
    </div>
  );
}
