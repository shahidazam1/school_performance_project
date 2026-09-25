import type { TablePagination as Pagination } from "./types";

import styles from "./EnterpriseTable.module.css";

interface Props {
  pagination: Pagination;
}

function TablePagination({ pagination }: Props) {
  const {
    page,
    pageSize,
    totalCount,

    pageSizeOptions = [10, 25, 50, 100],

    showPageSizeSelector = true,
    showTotalCount = true,
    showPageInfo = true,

    onPageChange,
    onPageSizeChange,
  } = pagination;

  const pageCount = Math.ceil(totalCount / pageSize);

  const canPrevious = page > 1;
  const canNext = page < pageCount;

  return (
    <div className={styles.pagination}>
      <div>{showTotalCount && <span>Total: {totalCount}</span>}</div>

      <div className={styles.paginationRight}>
        {showPageSizeSelector && (
          <label>
            Rows per page:
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        {showPageInfo && (
          <span>
            Page {page} of {pageCount}
          </span>
        )}

        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TablePagination;
