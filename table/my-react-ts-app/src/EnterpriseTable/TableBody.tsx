import TableRow from "./TableRow";
import type { TableColumn } from "./types";

interface TableBodyProps<T extends Record<string, any>> {
  data: T[];

  columns: TableColumn<T>[];

  rowKey: (row: T) => string | number;

  selectionMode: "none" | "single" | "multiple";

  selectedKeys: Array<string | number>;

  actionsColumn?: TableColumn<T>;

  stickyActions: boolean;

  striped: boolean;

  rowClassName?: string | ((row: T) => string);

  onRowClick?: (row: T, index: number) => void;

  onRowSelection: (row: T) => void;

  getRowDisabled?: (row: T) => boolean;

  getColumnWidth: (column: TableColumn<T>) => number | string | undefined;
}

function TableBody<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  selectionMode,
  selectedKeys,
  actionsColumn,
  stickyActions,
  striped,
  rowClassName,
  onRowClick,
  onRowSelection,
  getRowDisabled,
  getColumnWidth,
}: TableBodyProps<T>) {
  return (
    <tbody>
      {data.map((row, index) => (
        <TableRow
          key={rowKey(row)}
          row={row}
          index={index}
          columns={columns}
          selected={selectedKeys.includes(rowKey(row))}
          selectionMode={selectionMode}
          actionsColumn={actionsColumn}
          stickyActions={stickyActions}
          striped={striped}
          rowClassName={rowClassName}
          onRowClick={onRowClick}
          onRowSelection={onRowSelection}
          disabled={getRowDisabled?.(row)}
          getColumnWidth={getColumnWidth}
        />
      ))}
    </tbody>
  );
}

export default TableBody;
