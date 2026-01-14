import * as XLSX from "xlsx";
import { tool as createTool } from "ai";
import { z } from "zod";
import path from "path";
import { USERS_TABLE_PATH } from "@app/constants";
import { parseTableRange } from "./utils";

export const getTableRange = createTool({
  description:
    "Прочитать диапазон ячеек Excel таблицы и вернуть табличные данные. " +
    "Используется для отображения таблицы пользователю или для последующей обработки данных агентом.",

  inputSchema: z.object({
    range: z
      .string()
      .describe(
        "Диапазон ячеек Excel для чтения. " +
          "Можно указать через меншон (@SheetName!A1:B4) " +
          "или в явном виде: sheet=Users, from=A1, to=B4"
      ),
  }),

  outputSchema: z.object({
    sheet: z
      .string()
      .describe(
        "Название листа Excel (worksheet), из которого были прочитаны данные"
      ),

    range: z
      .string()
      .describe(
        "Диапазон ячеек, который был прочитан, в формате SheetName!A1:B4"
      ),

    rows: z
      .array(z.array(z.string()))
      .describe(
        "Двумерный массив значений ячеек, где каждая вложенная строка соответствует строке Excel"
      ),
  }),

  execute: async ({ range }) => {
    const rangeInfo = parseTableRange(range);

    if (!rangeInfo) throw new Error("Invalid range format");

    const { sheet, from, to } = rangeInfo;

    const filePath = path.join(process.cwd(), USERS_TABLE_PATH);

    const workbook = XLSX.readFile(filePath);
    const workbookSheet = workbook.Sheets[sheet];

    if (!workbookSheet) throw new Error(`Sheet ${sheet} not found`);

    const decodedRange = XLSX.utils.decode_range(`${from}:${to}`);
    const rows: string[][] = [];

    for (let R = decodedRange.s.r; R <= decodedRange.e.r; ++R) {
      const row: string[] = [];
      for (let C = decodedRange.s.c; C <= decodedRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        row.push(workbookSheet[cellAddress]?.v ?? "");
      }
      rows.push(row);
    }

    return {
      sheet,
      range: `${sheet}!${from}:${to}`,
      rows,
    };
  },
});
