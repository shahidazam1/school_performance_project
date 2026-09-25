import { useState, type ReactNode } from "react";
import styles from "./EnterpriseTable.module.css";

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
    items?: Array<{
      key: string;
      label: string;
      checked: boolean;
      disabled?: boolean;
    }>;
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
  const [columnsOpen, setColumnsOpen] = useState(false);

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

        {columns && (
          <div className={styles.columnMenuWrapper}>
            <button
              type="button"
              className={styles.toolbarButton}
              onClick={() => {
                if (columns.items) {
                  setColumnsOpen((open) => !open);
                } else {
                  columns.onClick?.();
                }
              }}
              aria-expanded={columns.items ? columnsOpen : undefined}
              aria-haspopup={columns.items ? "menu" : undefined}
            >
              <span aria-hidden="true">☷</span>
              {columns.label ?? "Columns"}
            </button>
            {columns.items && columnsOpen && (
              <div
                className={styles.columnMenu}
                role="menu"
                aria-label="Choose visible columns"
              >
                <div className={styles.columnMenuTitle}>Show columns</div>
                {columns.items.map((item) => (
                  <label key={item.key} className={styles.columnMenuItem}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      disabled={item.disabled}
                      onChange={() => columns.onToggle?.(item.key)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

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
