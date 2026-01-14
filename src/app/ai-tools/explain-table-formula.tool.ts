import * as XLSX from "xlsx";
import { tool as createTool } from "ai";
import { z } from "zod";
import path from "path";
import { parseTableTargetCell } from "./utils";
import { USERS_TABLE_PATH } from "@app/constants";

export const explainTableFormula = createTool({
  description:
    "Получить формулу из Excel ячейки и объяснить, как вычисляется её значение",

  inputSchema: z.object({
    target: z
      .string()
      .describe(
        "Целевая ячейка для записи значения. " +
          "Можно указать либо через меншон (@SheetName!A1), " +
          "либо в явном виде: sheet=Users, cell=A1"
      ),
  }),

  outputSchema: z.object({
    formula: z.string().nullable().describe("Формула, записанная в ячейке"),

    value: z.number().nullable().describe("Вычисленное значение ячейки"),
  }),

  execute: async ({ target }) => {
    const targetInfo = parseTableTargetCell(target);

    if (!targetInfo) throw new Error("Invalid range format");

    const { sheet, cell } = targetInfo;

    const filePath = path.join(process.cwd(), USERS_TABLE_PATH);

    const workbook = XLSX.readFile(filePath);
    const workbookSheet = workbook.Sheets[sheet];

    if (!workbookSheet) throw new Error(`Sheet ${sheet} not found`);

    const cellObj = workbookSheet[cell];

    return {
      formula: cellObj?.f ?? null,
      value: cellObj?.v ?? null,
    };
  },
});
