import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { threadQueries, messageQueries } from "@db";
import { Headers } from "@app/constants";
import { deleteThread, highlightSection, showStockPrice } from "@app/ai-tools";

export async function POST(request: Request) {
  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } =
    await request.json();

  let currentThreadId = threadId;

  // если не получили Id: создаём новый тред
  if (!currentThreadId) {
    const firstText =
      messages[0]?.parts.find((p) => p.type === "text")?.text || "Новый чат";
    currentThreadId = threadQueries.create({
      title: firstText.slice(0, 30) + (firstText.length > 30 ? "..." : ""),
    });
  }

  // сохраняем в бд последнее сообщение
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
      showStockPrice,
      highlightSection,
      deleteThread,
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
      [Headers.threadId]: currentThreadId,
      "Access-Control-Expose-Headers": Headers.threadId,
    },
  });
}
