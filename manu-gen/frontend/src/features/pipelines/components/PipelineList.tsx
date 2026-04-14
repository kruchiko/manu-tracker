import { useState } from "react";
import { PackageOpen } from "lucide-react";
import { usePipelines } from "../hooks/usePipelines";
import { useDeletePipeline } from "../hooks/useDeletePipeline";
import { ListCard } from "../../../shared/components/ListCard";
import { DataTable, type Column } from "../../../shared/components/DataTable";
import { PipelineFlowPreview } from "./PipelineFlowPreview";
import type { Pipeline } from "../pipelines.types";
import styles from "./PipelineList.module.css";

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "";
  return `~${Math.round(seconds / 60)} min expected`;
}

function SkeletonRow({ hasBorder }: { hasBorder: boolean }): React.JSX.Element {
  return (
    <div className={`${styles.skeletonRow} ${hasBorder ? styles.skeletonRowBorder : ""}`}>
      <div className={styles.skeleton} style={{ width: 144 }} />
      <div className={styles.skeleton} style={{ width: 200 }} />
      <div className={styles.skeleton} style={{ width: 96, marginLeft: "auto" }} />
    </div>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeleton} style={{ width: 112 }} />
        <div className={styles.skeleton} style={{ width: 64, height: 12 }} />
      </div>
      <div className={styles.skeletonTableHeader}>
        <div className={styles.skeletonSmall} style={{ width: 72 }} />
        <div className={styles.skeletonSmall} style={{ width: 48 }} />
        <div className={styles.skeletonSmall} style={{ width: 56, marginLeft: "auto" }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonRow key={i} hasBorder={i < 2} />
      ))}
    </div>
  );
}

interface PipelineActionsProps {
  pipeline: Pipeline;
}

function PipelineActions({ pipeline }: PipelineActionsProps): React.JSX.Element {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deletePipeline = useDeletePipeline();

  function handleDelete(): void {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deletePipeline.mutate(pipeline.id, {
      onError: () => setConfirmDelete(false),
    });
  }

  if (confirmDelete) {
    return (
      <div className={styles.actionGroup}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={deletePipeline.isPending}
          className={`${styles.btnGhost} ${styles.btnDanger}`}
        >
          {deletePipeline.isPending ? "Deleting..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(false);
          }}
          className={`${styles.btnGhost} ${styles.btnMuted}`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={styles.actionGroup}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className={`${styles.btnGhost} ${styles.btnDanger}`}
      >
        Delete
      </button>
    </div>
  );
}

interface PipelineListProps {
  onEdit: (pipeline: Pipeline) => void;
}

export function PipelineList({ onEdit }: PipelineListProps): React.JSX.Element {
  const { data, isLoading, error } = usePipelines();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.stateCard} ${styles.errorCard}`}>
        <p className={styles.errorText}>
          Failed to load pipelines: {error.message}
        </p>
      </div>
    );
  }

  const pipelines = data ?? [];

  if (pipelines.length === 0) {
    return (
      <div className={`${styles.stateCard} ${styles.emptyCard}`}>
        <PackageOpen size={40} strokeWidth={1.5} className={styles.emptyIcon} />
        <p className={styles.emptyText}>
          No pipelines yet. Create one to get started.
        </p>
      </div>
    );
  }

  const columns: Column<Pipeline>[] = [
    {
      key: "pipeline",
      header: "Pipeline",
      render: (pipeline) => (
        <div>
          <div className={styles.pipelineName}>{pipeline.name}</div>
          {pipeline.productType && (
            <span className={styles.badge}>{pipeline.productType}</span>
          )}
          <div className={styles.pipelineMeta}>
            {pipeline.steps.length} step{pipeline.steps.length !== 1 ? "s" : ""}
            {pipeline.totalExpectedSeconds !== null && ` · ${formatMinutes(pipeline.totalExpectedSeconds)}`}
          </div>
        </div>
      ),
    },
    {
      key: "flow",
      header: "Flow",
      render: (pipeline) => (
        <PipelineFlowPreview
          steps={pipeline.steps}
          onMore={() => onEdit(pipeline)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (pipeline) => (
        <div className={styles.actionsCell}>
          <PipelineActions pipeline={pipeline} />
        </div>
      ),
    },
  ];

  return (
    <ListCard
      title="All Pipelines"
      count={pipelines.length}
      countLabel={pipelines.length === 1 ? "pipeline" : "pipelines"}
    >
      <DataTable
        columns={columns}
        rows={pipelines}
        getRowKey={(p) => p.id}
        onRowClick={onEdit}
      />
    </ListCard>
  );
}
