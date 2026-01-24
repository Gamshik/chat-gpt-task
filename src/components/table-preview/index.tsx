"use client";

import { useState } from "react";
import styles from "./styles.module.scss";
import { TableModal } from "./components/table-modal";
import { ITablePreviewProps } from "./interfaces";

export function TablePreview({
  sheet,
  range,
  rows,
  setMention,
}: ITablePreviewProps) {
  // флаг состояния модалки
  const [isModalOpen, setisModalOpen] = useState(false);

  const previewRows = rows.slice(0, 5);

  return (
    <>
      <div className={styles.tableWidget} onClick={() => setisModalOpen(true)}>
        <div className={styles.header}>
          <b>{sheet}</b>
          <span>{range}</span>
        </div>

        {/* это превью, тут особых стилей на ячейки не нужно, поэтому без гридов */}
        <table className={styles.previewTable}>
          <tbody>
            {previewRows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.hint}>Нажмите, чтобы открыть полностью</div>
      </div>

      {isModalOpen && (
        <TableModal
          sheet={sheet}
          rows={rows}
          onClose={() => setisModalOpen(false)}
          onMention={setMention}
        />
      )}
    </>
  );
}
