import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  headerAlign?: "left" | "center" | "right";
  /** When `cellVerticalAlign` is `top`, set to `middle` to vertically center this cell in the row (e.g. actions). */
  tdVerticalAlign?: "top" | "middle";
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Default `middle`. Use `top` when row content should align from the top (e.g. paired with a fixed-height title rail). */
  cellVerticalAlign?: "top" | "middle";
  /** Merged onto `<table>` (e.g. column width presets for a specific list). */
  tableClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  cellVerticalAlign = "middle",
  tableClassName,
}: DataTableProps<T>): React.JSX.Element {
  return (
    <table className={[styles.table, tableClassName].filter(Boolean).join(" ")}>
      <thead>
        <tr className={styles.headerRow}>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`${styles.headerCell} ${
                col.headerAlign === "center" || col.align === "center"
                  ? styles.headerCellCenter
                  : col.headerAlign === "right" || col.align === "right"
                    ? styles.headerCellRight
                    : ""
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
                className={`${styles.cell} ${
                  col.align === "center"
                    ? styles.cellCenter
                    : col.align === "right"
                      ? styles.cellRight
                      : ""
                } ${
                  cellVerticalAlign === "top"
                    ? col.tdVerticalAlign === "middle"
                      ? styles.cellTdMiddle
                      : styles.cellTdTop
                    : ""
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
