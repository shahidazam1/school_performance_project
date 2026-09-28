import { useState } from "react";
import type { ColumnVisibilityItem } from "./types";
import styles from "./EnterpriseTable.module.css";

interface ColumnVisibilityMenuProps {
  items: ColumnVisibilityItem[];
  onToggle: (key: string) => void;
  label?: string;
  header?: boolean;
}

function ColumnVisibilityMenu({
  items,
  onToggle,
  label = "Columns",
  header = false,
}: ColumnVisibilityMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.columnMenuWrapper}>
      <button
        type="button"
        className={
          header ? styles.headerColumnMenuTrigger : styles.toolbarButton
        }
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-label={header ? "Choose visible columns" : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span aria-hidden="true">☷</span>
        {!header && label}
      </button>
      {open && (
        <div
          className={styles.columnMenu}
          role="menu"
          aria-label="Choose visible columns"
        >
          <div className={styles.columnMenuTitle}>Show columns</div>
          {items.map((item) => (
            <label key={item.key} className={styles.columnMenuItem}>
              <input
                type="checkbox"
                checked={item.checked}
                disabled={item.disabled}
                onChange={() => onToggle(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default ColumnVisibilityMenu;
