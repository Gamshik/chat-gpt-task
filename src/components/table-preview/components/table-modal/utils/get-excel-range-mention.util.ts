import * as XLSX from "xlsx";
import { IGetExcelRangeMentionParams } from "../interfaces";

export const getExcelRangeMention = ({
  rangeData,
  sheet,
}: IGetExcelRangeMentionParams) => {
  const { start, end } = rangeData;

  const startCell = XLSX.utils.encode_cell({ r: start[0], c: start[1] });
  const endCell = XLSX.utils.encode_cell({ r: end[0], c: end[1] });

  if (start[0] === end[0] && start[1] === end[1])
    return `@${sheet}!${startCell}`;

  return `@${sheet}!${startCell}:${endCell}`;
};
