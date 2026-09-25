import type { TableEmptyState as EmptyState } from "./types";

import styles from "./EnterpriseTable.module.css";

interface Props {
  colSpan: number;
  emptyState?: EmptyState;
  message: string;
}

function TableEmptyState({ colSpan, emptyState, message }: Props) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan}>
          <div className={styles.emptyState}>
            {emptyState?.render ? (
              emptyState.render()
            ) : (
              <>
                {emptyState?.image && (
                  <img
                    src={emptyState.image}
                    alt={emptyState.imageAlt ?? "No data"}
                    className={styles.emptyImage}
                  />
                )}

                <h3>{emptyState?.title ?? "No data found"}</h3>

                <p>{emptyState?.description ?? message}</p>
              </>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

export default TableEmptyState;
