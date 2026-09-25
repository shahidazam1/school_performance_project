import type { TableColumn } from "./types";

import styles from "./EnterpriseTable.module.css";

interface TableRowProps<T extends Record<string, any>> {
  row: T;
  index: number;

  columns: TableColumn<T>[];

  selected: boolean;

  selectionMode: "none" | "single" | "multiple";

  actionsColumn?: TableColumn<T>;

  stickyActions: boolean;

  striped: boolean;

  disabled?: boolean;

  rowClassName?: string | ((row: T) => string);

  onRowClick?: (row: T, index: number) => void;

  onRowSelection: (row: T) => void;

  getColumnWidth: (column: TableColumn<T>) => number | string | undefined;
}

function TableRow<T extends Record<string, any>>({
  row,
  index,
  columns,
  selected,
  selectionMode,
  actionsColumn,
  stickyActions,
  striped,
  disabled,
  rowClassName,
  onRowClick,
  onRowSelection,
  getColumnWidth,
}: TableRowProps<T>) {
  const customRowClass =
    typeof rowClassName === "function" ? rowClassName(row) : rowClassName;

  return (
    <tr
      className={[
        styles.tableRow,
        striped && index % 2 === 1 ? styles.stripedRow : "",
        selected ? styles.selectedRow : "",
        disabled ? styles.disabledRow : "",
        customRowClass ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => !disabled && onRowClick?.(row, index)}
    >
      {selectionMode !== "none" && (
        <td
          className={styles.selectionColumn}
          onClick={(event) => event.stopPropagation()}
        >
          {selectionMode === "multiple" ? (
            <input
              type="checkbox"
              checked={selected}
              disabled={disabled}
              onChange={() => onRowSelection(row)}
              aria-label="Select row"
            />
          ) : (
            <input
              type="radio"
              checked={selected}
              disabled={disabled}
              onChange={() => onRowSelection(row)}
              aria-label="Select row"
            />
          )}
        </td>
      )}

      {columns.map((column) => {
        const value = column.dataKey ? row[column.dataKey] : undefined;

        return (
          <td
            key={column.key}
            className={[styles.bodyCell, column.className ?? ""]
              .filter(Boolean)
              .join(" ")}
            style={{
              width: getColumnWidth(column),
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              textAlign: column.align ?? "left",
            }}
          >
            <div
              className={styles.cellContent}
              title={
                column.getTooltip
                  ? undefined
                  : typeof value === "string"
                    ? value
                    : undefined
              }
            >
              {column.render
                ? column.render(value, row, index)
                : value == null
                  ? "—"
                  : String(value)}
            </div>
          </td>
        );
      })}

      {actionsColumn && (
        <td
          className={
            stickyActions ? styles.stickyActionCell : styles.actionColumn
          }
          onClick={(event) => event.stopPropagation()}
        >
          {actionsColumn.render
            ? actionsColumn.render(undefined, row, index)
            : null}
        </td>
      )}
    </tr>
  );
}

export default TableRow;
