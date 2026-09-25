import { useCallback, useMemo, useRef, useState } from "react";

import type { EnterpriseTableProps, TableColumn } from "./types";

import TableHeader from "./TableHeader";
import TableBody from "./TableBody";
import TableEmptyState from "./TableEmptyState";
import TableLoading from "./TableLoading";
import TablePagination from "./TablePagination";

import styles from "./EnterpriseTable.module.css";

function EnterpriseTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  loading = false,

  size = "medium",

  height = "auto",
  width = "100%",
  maxHeight,

  headerColor,
  headerTextColor,
  bodyColor,
  borderColor,
  hoverColor,

  striped = false,

  stickyHeader = true,
  stickyActions = true,

  actionsColumn,

  selectionMode = "none",

  selectedRowKeys: controlledSelectedKeys,

  onSelectionChange,

  pagination,

  emptyState,

  emptyMessage = "No data available",

  className,

  rowClassName,

  onRowClick,

  getRowDisabled,

  resizableColumns = true,

  toolbar,

  topContent,

  bottomContent,
}: EnterpriseTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [internalSelectedKeys, setInternalSelectedKeys] = useState<
    Array<string | number>
  >([]);

  const selectedKeys = controlledSelectedKeys ?? internalSelectedKeys;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnOrder, setColumnOrder] = useState(() =>
    columns.map((column) => column.key),
  );

  const orderedColumns = useMemo(() => {
    const orderIndex = new Map(columnOrder.map((key, index) => [key, index]));
    return [...columns].sort(
      (left, right) =>
        (orderIndex.get(left.key) ?? columns.indexOf(left)) -
        (orderIndex.get(right.key) ?? columns.indexOf(right)),
    );
  }, [columns, columnOrder]);

  const visibleColumns = useMemo(() => {
    return orderedColumns.filter((column) => !column.hidden);
  }, [orderedColumns]);

  const getRowId = useCallback(
    (row: T): string | number => {
      if (typeof rowKey === "function") {
        return rowKey(row);
      }

      return row[rowKey] as string | number;
    },
    [rowKey],
  );

  const getSelectedRows = useCallback(
    (keys: Array<string | number>) => {
      return data.filter((row) => keys.includes(getRowId(row)));
    },
    [data, getRowId],
  );

  const updateSelection = useCallback(
    (keys: Array<string | number>) => {
      if (controlledSelectedKeys === undefined) {
        setInternalSelectedKeys(keys);
      }

      const selectedRows = getSelectedRows(keys);

      onSelectionChange?.(selectedRows, keys);
    },
    [controlledSelectedKeys, getSelectedRows, onSelectionChange],
  );

  const handleRowSelection = useCallback(
    (row: T) => {
      const id = getRowId(row);

      if (getRowDisabled?.(row)) {
        return;
      }

      if (selectionMode === "single") {
        updateSelection([id]);
        return;
      }

      if (selectionMode === "multiple") {
        const exists = selectedKeys.includes(id);

        const nextKeys = exists
          ? selectedKeys.filter((key) => key !== id)
          : [...selectedKeys, id];

        updateSelection(nextKeys);
      }
    },
    [getRowId, getRowDisabled, selectionMode, selectedKeys, updateSelection],
  );

  const handleSelectAll = useCallback(() => {
    if (selectionMode !== "multiple") {
      return;
    }

    const selectableRows = data.filter((row) => !getRowDisabled?.(row));

    const selectableKeys = selectableRows.map(getRowId);

    const allSelected = selectableKeys.every((key) =>
      selectedKeys.includes(key),
    );

    updateSelection(
      allSelected
        ? selectedKeys.filter((key) => !selectableKeys.includes(key))
        : Array.from(new Set([...selectedKeys, ...selectableKeys])),
    );
  }, [
    data,
    getRowDisabled,
    getRowId,
    selectedKeys,
    selectionMode,
    updateSelection,
  ]);

  const handleColumnResize = useCallback((key: string, width: number) => {
    setColumnWidths((previous) => ({
      ...previous,
      [key]: width,
    }));
  }, []);

  const handleColumnReorder = useCallback(
    (sourceKey: string, targetKey: string) => {
      setColumnOrder((currentOrder) => {
        const orderIndex = new Map(
          currentOrder.map((key, index) => [key, index]),
        );
        const ordered = [...columns].sort(
          (left, right) =>
            (orderIndex.get(left.key) ?? columns.indexOf(left)) -
            (orderIndex.get(right.key) ?? columns.indexOf(right)),
        );
        const visible = ordered.filter((column) => !column.hidden);
        const sourceIndex = visible.findIndex(
          (column) => column.key === sourceKey,
        );
        const targetIndex = visible.findIndex(
          (column) => column.key === targetKey,
        );

        if (sourceIndex < 0 || targetIndex < 0) return currentOrder;

        const [movedColumn] = visible.splice(sourceIndex, 1);
        visible.splice(targetIndex, 0, movedColumn);

        let visibleIndex = 0;
        return ordered.map((column) =>
          column.hidden ? column.key : visible[visibleIndex++].key,
        );
      });
    },
    [columns],
  );

  const getColumnWidth = (column: TableColumn<T>) => {
    if (columnWidths[column.key]) {
      return columnWidths[column.key];
    }

    return column.width;
  };

  const cssVariables = {
    "--table-width": typeof width === "number" ? `${width}px` : width,

    "--table-height": typeof height === "number" ? `${height}px` : height,

    "--table-max-height":
      typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,

    "--table-header-color": headerColor ?? "#f5f7fa",

    "--table-header-text-color": headerTextColor ?? "#344054",

    "--table-body-color": bodyColor ?? "#ffffff",

    "--table-border-color": borderColor ?? "#e4e7ec",

    "--table-hover-color": hoverColor ?? "#f9fafb",
  } as React.CSSProperties;

  const allSelected =
    data.length > 0 &&
    data
      .filter((row) => !getRowDisabled?.(row))
      .every((row) => selectedKeys.includes(getRowId(row)));

  const someSelected = selectedKeys.length > 0 && !allSelected;

  return (
    <div
      className={[styles.wrapper, styles[size], className]
        .filter(Boolean)
        .join(" ")}
    >
      {topContent}

      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      <div
        ref={containerRef}
        className={styles.tableContainer}
        style={cssVariables}
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <TableHeader
              columns={visibleColumns}
              selectionMode={selectionMode}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={handleSelectAll}
              stickyHeader={stickyHeader}
              stickyActions={stickyActions}
              hasActions={Boolean(actionsColumn)}
              getColumnWidth={getColumnWidth}
              resizableColumns={resizableColumns}
              onColumnResize={handleColumnResize}
              onColumnReorder={handleColumnReorder}
            />

            {loading ? (
              <TableLoading
                columnCount={
                  visibleColumns.length +
                  (selectionMode !== "none" ? 1 : 0) +
                  (actionsColumn ? 1 : 0)
                }
                rowCount={pagination?.pageSize ?? 5}
              />
            ) : data.length === 0 ? (
              <TableEmptyState
                colSpan={
                  visibleColumns.length +
                  (selectionMode !== "none" ? 1 : 0) +
                  (actionsColumn ? 1 : 0)
                }
                emptyState={emptyState}
                message={emptyMessage}
              />
            ) : (
              <TableBody
                data={data}
                columns={visibleColumns}
                rowKey={getRowId}
                selectionMode={selectionMode}
                selectedKeys={selectedKeys}
                actionsColumn={actionsColumn}
                stickyActions={stickyActions}
                striped={striped}
                rowClassName={rowClassName}
                onRowClick={onRowClick}
                onRowSelection={handleRowSelection}
                getRowDisabled={getRowDisabled}
                getColumnWidth={getColumnWidth}
              />
            )}
          </table>
        </div>
      </div>

      {pagination && <TablePagination pagination={pagination} />}

      {bottomContent}
    </div>
  );
}

export default EnterpriseTable;
