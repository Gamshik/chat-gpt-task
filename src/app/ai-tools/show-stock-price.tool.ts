import { IShowStockPriceToolResult } from "@app/interfaces";
import { tool as createTool } from "ai";
import { z } from "zod";

export const showStockPrice = createTool({
  description:
    "Получить текущую цену акции или криптовалюты по тикеру. " +
    "Используется для отображения пользователю актуальной рыночной информации.",

  inputSchema: z.object({
    symbol: z
      .string()
      .describe("Тикер финансового актива (например: AAPL, TSLA, BTC, ETH)"),
  }),

  outputSchema: z.object({
    symbol: z.string().describe("Тикер запрошенного финансового актива"),

    price: z.number().describe("Текущая цена актива"),

    change: z
      .number()
      .describe(
        "Изменение цены за период (положительное или отрицательное значение)",
      ),

    lastUpdated: z
      .string()
      .describe("Дата и время последнего обновления цены в формате ISO 8601"),
  }),

  execute: async ({ symbol }): Promise<IShowStockPriceToolResult> => {
    const price = Math.floor(Math.random() * 50000) + 100;
    const change = Number((Math.random() * 10 - 5).toFixed(2));

    return {
      symbol,
      price,
      change,
      lastUpdated: new Date().toISOString(),
    };
  },
});
