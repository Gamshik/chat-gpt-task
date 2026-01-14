import { openai } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
  tool,
} from "ai";
import { threadQueries, messageQueries } from "@db";
import { z } from "zod";
import {
  IDeleteThreadResult,
  IShowStockPriceResult,
  HIGHLIGHT_SECTIONS,
} from "@app/interfaces";

export async function POST(request: Request) {
  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } =
    await request.json();

  let currentThreadId = threadId;
  if (!currentThreadId) {
    const firstText =
      messages[0]?.parts.find((p) => p.type === "text")?.text || "Новый чат";
    currentThreadId = threadQueries.create({
      title: firstText.slice(0, 30) + (firstText.length > 30 ? "..." : ""),
    });
  }

  const lastUserMessage = messages[messages.length - 1];
  const userContent = lastUserMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");

  messageQueries.create({
    thread_id: currentThreadId,
    role: "user",
    content: userContent,
  });

  const result = streamText({
    model: openai("gpt-4o"),
    system: "Ты помощник с доступом к инструментам.",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      showStockPrice: tool({
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
      }),

      highlightSection: tool({
        description: "Подсветить визуально секцию интерфейса",
        inputSchema: z.object({
          section: z.enum(HIGHLIGHT_SECTIONS),
          color: z.string().describe("CSS цвет"),
        }),
      }),

      deleteThread: tool({
        needsApproval: true,
        description: "Удалить тред из базы данных.",
        inputSchema: z.object({ threadId: z.string() }),
        execute: async ({ threadId }): Promise<IDeleteThreadResult> => {
          threadQueries.delete(threadId);
          return { deletedId: threadId, message: "Тред успешно удален" };
        },
      }),
    },
    onFinish: async ({ text }) => {
      if (text) {
        messageQueries.create({
          thread_id: currentThreadId!,
          role: "assistant",
          content: text,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-thread-id": currentThreadId,
      "Access-Control-Expose-Headers": "x-thread-id",
    },
  });
}
