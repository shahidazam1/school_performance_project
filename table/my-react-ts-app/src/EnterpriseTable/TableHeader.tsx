import { useRef, useState } from "react";

import type { TableColumn } from "./types";

import styles from "./EnterpriseTable.module.css";

interface TableHeaderProps<T extends Record<string, any>> {
  columns: TableColumn<T>[];

  selectionMode: "none" | "single" | "multiple";

  allSelected: boolean;
  someSelected: boolean;

  onSelectAll: () => void;

  stickyHeader: boolean;
  stickyActions: boolean;

  hasActions: boolean;

  getColumnWidth: (column: TableColumn<T>) => number | string | undefined;

  resizableColumns: boolean;

  onColumnResize: (key: string, width: number) => void;

  onColumnReorder: (sourceKey: string, targetKey: string) => void;
}

function TableHeader<T extends Record<string, any>>({
  columns,
  selectionMode,
  allSelected,
  someSelected,
  onSelectAll,
  stickyHeader,
  stickyActions,
  hasActions,
  getColumnWidth,
  resizableColumns,
  onColumnResize,
  onColumnReorder,
}: TableHeaderProps<T>) {
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  return (
    <thead className={stickyHeader ? styles.stickyHeader : undefined}>
      <tr>
        {selectionMode !== "none" && (
          <th className={styles.selectionColumn}>
            {selectionMode === "multiple" && (
              <input
                type="checkbox"
                checked={allSelected}
                ref={(element) => {
                  if (element) {
                    element.indeterminate = someSelected;
                  }
                }}
                onChange={onSelectAll}
                aria-label="Select all rows"
              />
            )}
          </th>
        )}

        {columns.map((column) => (
          <ResizableHeader
            key={column.key}
            column={column}
            width={getColumnWidth(column)}
            enabled={resizableColumns && column.resizable !== false}
            onResize={onColumnResize}
            isDragging={draggedKey === column.key}
            isDropTarget={dropTargetKey === column.key}
            onDragStart={() => setDraggedKey(column.key)}
            onDragEnd={() => {
              setDraggedKey(null);
              setDropTargetKey(null);
            }}
            onDragOver={() => setDropTargetKey(column.key)}
            onDrop={(sourceKey) => {
              onColumnReorder(sourceKey, column.key);
              setDraggedKey(null);
              setDropTargetKey(null);
            }}
          />
        ))}

        {hasActions && (
          <th
            className={
              stickyActions ? styles.stickyActionHeader : styles.actionColumn
            }
          >
            Actions
          </th>
        )}
      </tr>
    </thead>
  );
}

interface ResizableHeaderProps<T> {
  column: TableColumn<T>;
  width?: number | string;
  enabled: boolean;
  onResize: (key: string, width: number) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: (sourceKey: string) => void;
}

function ResizableHeader<T>({
  column,
  width,
  enabled,
  onResize,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ResizableHeaderProps<T>) {
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!enabled) {
      return;
    }

    event.preventDefault();

    startX.current = event.clientX;

    const target = event.currentTarget.parentElement;

    startWidth.current =
      target?.getBoundingClientRect().width ?? Number(column.width) ?? 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX.current;

      let nextWidth = startWidth.current + delta;

      nextWidth = Math.max(column.minWidth ?? 80, nextWidth);

      if (column.maxWidth) {
        nextWidth = Math.min(column.maxWidth, nextWidth);
      }

      onResize(column.key, nextWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);

      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);

    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <th
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", column.key);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceKey = event.dataTransfer.getData("text/plain");
        if (sourceKey && sourceKey !== column.key) onDrop(sourceKey);
      }}
      className={[
        styles.headerCell,
        styles.draggableHeader,
        isDragging ? styles.draggingHeader : "",
        isDropTarget ? styles.dropTargetHeader : "",
        column.headerClassName ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
        textAlign: column.headerAlign ?? "left",
      }}
    >
      <div className={styles.headerContent}>
        <span>{column.title}</span>

        {enabled && (
          <span
            className={styles.resizeHandle}
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
          />
        )}
      </div>
    </th>
  );
}

export default TableHeader;
