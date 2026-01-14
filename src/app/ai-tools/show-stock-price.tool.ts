import { IShowStockPriceResult } from "@app/interfaces";
import { tool as createTool } from "ai";
import { z } from "zod";

export const showStockPrice = createTool({
  description: "Показать текущую цену акции или криптовалюты",
  inputSchema: z.object({
    symbol: z.string().describe("Тикер актива, например BTC или AAPL"),
  }),
  execute: async ({ symbol }): Promise<IShowStockPriceResult> => {
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
