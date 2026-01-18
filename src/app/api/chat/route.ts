import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { threadQueries, messageQueries, messagePartsQueries } from "@db";
import { Headers } from "@app/constants";
import { aiTools } from "@app/ai-tools";
import { MessageRole } from "@models";
import { ISendChatMessageParams } from "@app/interfaces";
import { messageModelToApi } from "@app/utils";

export async function POST(request: Request) {
  const { message, threadId }: ISendChatMessageParams = await request.json();

  let currentThreadId = threadId ?? "";

  const thread = threadQueries.getById(currentThreadId);

  // если не получили Id: создаём новый тред
  if (!thread) {
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
    threadId: currentThreadId,
    role: MessageRole.User,
    parts: [
      {
        type: "text",
        text: userContent,
      },
    ],
  });

  const allChatMessages = messageQueries.getByThreadId(currentThreadId);

  const uiMessages = allChatMessages
    .map((m) => messageModelToApi(m))
    .filter((m): m is UIMessage => m !== null);

  const result = streamText({
    model: openai("gpt-5-nano"),
    system: `
      ## ТВОЯ РОЛЬ
      Ты — интеллектуальный помощник внутри чат-приложения с доступом к инструментам.

      ## ПОВЕДЕНИЕ
      - Отвечай кратко и по делу.
      - Если информации недостаточно — задай уточняющий вопрос.
      - Не придумывай данные, которых нет.
      - Вызывай только по одному инструменту за запрос.
      - Используй инструменты строго по назначению, у каждого есть своё описание, 
        которое ты должен сопоставить с запросом и использовать нужный инструмент.
    `,
    messages: await convertToModelMessages(uiMessages),
    stopWhen: stepCountIs(5),
    tools: aiTools,
    // onFinish: async (res) => {
    //   console.log("res.toolCalls", res.toolCalls);
    //   console.log("res.toolResults", res.toolResults);
    //   console.log("res.staticToolCalls", res.staticToolCalls);
    //   console.log("res.staticToolResults", res.staticToolResults);
    //   console.log("res.dynamicToolCalls", res.dynamicToolCalls);
    //   console.log("res.dynamicToolResults", res.dynamicToolResults);
    // },
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      console.log(
        "toUIMessageStreamResponse responseMessage:",
        responseMessage,
      );

      const msgId = messageQueries.create({
        thread_id: currentThreadId,
        role: MessageRole.Assistant,
      });

      for (const part of responseMessage.parts) {
        if (part.type === "text") {
          messagePartsQueries.create(msgId, {
            type: "text",
            text: part.text,
          });
        } else if (part.type.startsWith("tool-")) {
          messagePartsQueries.create(msgId, {
            type: part.type,
            // TODO: починить этот костыль
            state:
              part.type === "tool-highlightSection"
                ? "output-available"
                : (part as { state: string }).state,
            // state: (part as { state: string }).state,
            text: JSON.stringify((part as { output: object }).output),
          });
        }
      }
    },
    headers: {
      [Headers.threadId]: currentThreadId,
      "Access-Control-Expose-Headers": Headers.threadId,
    },
  });
}
