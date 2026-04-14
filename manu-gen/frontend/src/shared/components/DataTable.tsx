import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

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
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow}>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`${styles.headerCell} ${col.align === "right" ? styles.headerCellRight : ""}`}
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
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            className={`${styles.row} ${onRowClick ? styles.rowClickable : ""} ${
              rowIndex < rows.length - 1 ? styles.rowBorder : ""
            }`}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`${styles.cell} ${col.align === "right" ? styles.cellRight : ""}`}
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
