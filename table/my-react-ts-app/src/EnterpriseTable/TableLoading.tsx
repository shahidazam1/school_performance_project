import styles from "./EnterpriseTable.module.css";

interface Props {
  columnCount: number;
  rowCount: number;
}

function TableLoading({ columnCount, rowCount }: Props) {
  return (
    <tbody>
      {Array.from({
        length: rowCount,
      }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({
            length: columnCount,
          }).map((_, columnIndex) => (
            <td key={columnIndex}>
              <div className={styles.shimmer} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default TableLoading;
