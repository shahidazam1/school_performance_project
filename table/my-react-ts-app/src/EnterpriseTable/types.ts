import type { ReactNode } from "react";

export type TableSize = "small" | "medium" | "large";

export type SelectionMode = "none" | "single" | "multiple";

export type SortDirection = "asc" | "desc";

export interface TablePagination {
  page: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showTotalCount?: boolean;
  showPageInfo?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface TableEmptyState {
  image?: string;
  title?: string;
  description?: string;
  imageAlt?: string;
  render?: () => ReactNode;
}

export interface TableColumn<T> {
  key: string;
  title: string;

  dataKey?: keyof T;

  width?: number | string;
  minWidth?: number;
  maxWidth?: number;

  hidden?: boolean;
  hideable?: boolean;
  resizable?: boolean;

  headerAlign?: "left" | "center" | "right";
  align?: "left" | "center" | "right";

  render?: (value: any, row: T, index: number) => ReactNode;

  getTooltip?: (value: any, row: T) => ReactNode;

  className?: string;
  headerClassName?: string;
}

export interface ColumnVisibilityItem {
  key: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
}

export interface EnterpriseTableProps<T extends Record<string, any>> {
  data: T[];

  columns: TableColumn<T>[];

  rowKey: keyof T | ((row: T) => string | number);

  loading?: boolean;

  size?: TableSize;

  height?: number | string;

  width?: number | string;

  maxHeight?: number | string;

  minWidth?: number | string;

  headerColor?: string;

  headerTextColor?: string;

  bodyColor?: string;

  borderColor?: string;

  hoverColor?: string;

  striped?: boolean;

  stickyHeader?: boolean;

  stickyActions?: boolean;

  actionsColumn?: TableColumn<T>;

  selectionMode?: SelectionMode;

  selectedRowKeys?: Array<string | number>;

  onSelectionChange?: (
    selectedRows: T[],
    selectedKeys: Array<string | number>,
  ) => void;

  pagination?: TablePagination;

  emptyState?: TableEmptyState;

  emptyMessage?: string;

  className?: string;

  rowClassName?: string | ((row: T) => string);

  onRowClick?: (row: T, index: number) => void;

  getRowDisabled?: (row: T) => boolean;

  /**
   * Enable column resize.
   */
  resizableColumns?: boolean;

  /**
   * Allow users to hide/show columns.
   */
  columnVisibilityControl?: boolean;

  /**
   * Render a column visibility menu in the leftmost table header.
   */
  columnVisibility?: {
    items: ColumnVisibilityItem[];
    onToggle: (key: string) => void;
  };

  /**
   * Custom table toolbar.
   */
  toolbar?: ReactNode;

  /**
   * Custom content above table.
   */
  topContent?: ReactNode;

  /**
   * Custom content below table.
   */
  bottomContent?: ReactNode;
}
