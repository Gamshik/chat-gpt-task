import * as XLSX from "xlsx";
import { tool as createTool } from "ai";
import { z } from "zod";
import path from "path";
import { parseTableTargetCell } from "./utils";
import { USERS_TABLE_PATH } from "@app/constants";

export const updateTableCell = createTool({
  needsApproval: true,

  description:
    "Записать значение в ячейку Excel. " +
    "Изменяет файл на диске, требует подтверждения пользователя.",

  inputSchema: z.object({
    target: z
      .string()
      .describe(
        "Целевая ячейка для записи значения. " +
          "Можно указать либо через меншон (@SheetName!A1), " +
          "либо в явном виде: sheet=Users, cell=A1"
      ),
    value: z
      .string()
      .describe(
        "Новое значение для записи в ячейку. " +
          "Может быть текстом, числом (в виде строки) или формулой Excel (например: =SUM(A1:A5))"
      ),
  }),

  outputSchema: z.object({
    updatedCell: z
      .string()
      .describe("Адрес ячейки, которая была изменена (например: A1, F12)"),
    value: z
      .string()
      .describe(
        "Значение, которое было записано в ячейку после подтверждения пользователем"
      ),
    sheet: z
      .string()
      .describe(
        "Название листа Excel (worksheet), в котором была изменена ячейка"
      ),
  }),

  execute: async ({ target, value }) => {
    const targetInfo = parseTableTargetCell(target);

    if (!targetInfo) throw new Error("Invalid range format");

    const { sheet, cell } = targetInfo;

    const filePath = path.join(process.cwd(), USERS_TABLE_PATH);

    const workbook = XLSX.readFile(filePath);
    const workbookSheet = workbook.Sheets[sheet];

    if (!workbookSheet) throw new Error(`Sheet ${sheet} not found`);

    workbookSheet[cell] = { v: value, t: "s" };
    XLSX.writeFile(workbook, filePath);

    return { updatedCell: cell, value, sheet };
  },
});
