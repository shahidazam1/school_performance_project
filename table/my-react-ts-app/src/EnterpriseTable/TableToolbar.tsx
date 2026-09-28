import type { ReactNode } from "react";
import styles from "./EnterpriseTable.module.css";
import ColumnVisibilityMenu from "./ColumnVisibilityMenu";
import type { ColumnVisibilityItem } from "./types";

export interface TableToolbarProps {
  /**
   * Search input
   */
  search?: {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onClear?: () => void;
  };

  /**
   * Left-side custom content
   */
  leftContent?: ReactNode;

  /**
   * Right-side custom content
   */
  rightContent?: ReactNode;

  /**
   * Filter button
   */
  filter?: {
    label?: string;
    count?: number;
    onClick: () => void;
  };

  /**
   * Column visibility button
   */
  columns?: {
    label?: string;
    onClick?: () => void;
    items?: ColumnVisibilityItem[];
    onToggle?: (key: string) => void;
  };

  /**
   * Refresh button
   */
  refresh?: {
    loading?: boolean;
    onClick: () => void;
  };

  /**
   * Export button
   */
  export?: {
    label?: string;
    onClick: () => void;
  };

  /**
   * Custom toolbar class
   */
  className?: string;
}

export function TableToolbar({
  search,
  leftContent,
  rightContent,
  filter,
  columns,
  refresh,
  export: exportConfig,
  className,
}: TableToolbarProps) {
  return (
    <div className={[styles.tableToolbar, className].filter(Boolean).join(" ")}>
      {/* LEFT */}
      <div className={styles.toolbarLeft}>
        {search && (
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>

            <input
              type="text"
              value={search.value}
              placeholder={search.placeholder ?? "Search..."}
              onChange={(event) => search.onChange(event.target.value)}
              className={styles.searchInput}
            />

            {search.value && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={search.onClear ?? (() => search.onChange(""))}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}

        {filter && (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={filter.onClick}
          >
            <span>⚙</span>

            {filter.label ?? "Filter"}

            {!!filter.count && (
              <span className={styles.filterCount}>{filter.count}</span>
            )}
          </button>
        )}

        {columns &&
          (columns.items ? (
            <ColumnVisibilityMenu
              items={columns.items}
              onToggle={(key) => columns.onToggle?.(key)}
              label={columns.label}
            />
          ) : (
            <button
              type="button"
              className={styles.toolbarButton}
              onClick={columns.onClick}
            >
              <span aria-hidden="true">☷</span>
              {columns.label ?? "Columns"}
            </button>
          ))}

        {refresh && (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={refresh.onClick}
            disabled={refresh.loading}
          >
            <span className={refresh.loading ? styles.refreshLoading : ""}>
              ↻
            </span>
            Refresh
          </button>
        )}

        {leftContent}
      </div>

      {/* RIGHT */}
      <div className={styles.toolbarRight}>
        {rightContent}

        {exportConfig && (
          <button
            type="button"
            className={styles.primaryToolbarButton}
            onClick={exportConfig.onClick}
          >
            ↓{exportConfig.label ?? "Export"}
          </button>
        )}
      </div>
    </div>
  );
}

export default TableToolbar;
