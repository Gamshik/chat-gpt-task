import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { threadQueries, messageQueries } from "@db";
import { Headers } from "@app/constants";
import { aiTools } from "@app/ai-tools";
import { MessageRole } from "@models";
import { ISendChatMessageParams } from "@app/interfaces";
import { messageModelToUi } from "@app/utils";
import { createResumableStreamContext } from "resumable-stream";

export async function POST(request: Request) {
  const { message, threadId }: ISendChatMessageParams = await request.json();

  let currentThreadId = threadId;

  // если не получили Id: создаём новый тред
  if (!currentThreadId) {
    const firstText =
      message.parts.find((p) => p.type === "text")?.text || "Новый чат";

    currentThreadId = threadQueries.create({
      title: firstText.slice(0, 30) + (firstText.length > 30 ? "..." : ""),
    });
  }

  const userContent = message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");

  messageQueries.create({
    thread_id: currentThreadId,
    role: MessageRole.User,
    content: userContent,
  });

  const allChatMessages = messageQueries.getByThreadId(currentThreadId);

  const uiMessages = allChatMessages
    .map((m) => messageModelToUi(m))
    .filter((m): m is UIMessage => m !== null);

  const result = streamText({
    model: openai("gpt-4o"),
    system: `
      ## ТВОЯ РОЛЬ
      Ты — интеллектуальный помощник внутри чат-приложения с доступом к инструментам.

      ## ПОВЕДЕНИЕ
      - Отвечай кратко и по делу.
      - Если информации недостаточно — задай уточняющий вопрос.
      - Не придумывай данные, которых нет.

      ## ИЗМЕНЕНИЕ ДАННЫХ
      - Любые действия, изменяющие или удаляющие данные, требуют подтверждения пользователя.
      - Не выполняй изменения без явного запроса или подтверждения.
    `,
    messages: await convertToModelMessages(uiMessages),
    stopWhen: stepCountIs(5),
    tools: aiTools,
    onFinish: async (result) => {
      const { text, toolResults } = result;

      if (text) {
        messageQueries.create({
          thread_id: currentThreadId!,
          role: MessageRole.Assistant,
          content: text,
        });
      }

      if (toolResults.length > 0) {
        for (const res of toolResults) {
          messageQueries.create({
            thread_id: currentThreadId!,
            role: MessageRole.Tool,
            content: JSON.stringify({
              tool: res.toolName,
              output: res.output,
            }),
          });
        }
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
