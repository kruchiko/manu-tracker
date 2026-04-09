import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
}: DataTableProps<T>): React.JSX.Element {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-surface-2">
          {columns.map((col) => (
            <th
              key={col.key}
              className={`whitespace-nowrap border-b border-border px-[22px] py-[10px] font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted ${
                col.align === "right" ? "text-right" : "text-left"
              }`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`group ${onRowClick ? "cursor-pointer" : ""} ${
              rowIndex < rows.length - 1 ? "[&>td]:border-b [&>td]:border-border" : ""
            }`}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`px-[22px] py-[13px] align-middle transition-colors duration-[var(--duration-fast)] group-hover:bg-surface-hover ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
