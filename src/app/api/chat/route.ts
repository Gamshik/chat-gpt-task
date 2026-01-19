import { openai } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
  generateId,
} from "ai";
import { threadQueries, messageQueries, messagePartsQueries } from "@db";
import { Headers } from "@app/constants";
import { aiTools } from "@app/ai-tools";
import { MessageRole } from "@models";
import { ISendChatMessageParams, IToolPart } from "@app/interfaces";
import { messageModelToApi } from "@app/utils";
import { createResumableStreamContext } from "resumable-stream";
import { after } from "next/server";

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

  threadQueries.setActiveStream({
    threadId: currentThreadId,
    streamId: null,
  });

  const allChatMessages = messageQueries.getByThreadId(currentThreadId);

  const apiMessages = allChatMessages
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
    messages: await convertToModelMessages(apiMessages),
    stopWhen: stepCountIs(5),
    tools: aiTools,
  });

  return result.toUIMessageStreamResponse({
    headers: {
      [Headers.threadId]: currentThreadId,
      "Access-Control-Expose-Headers": Headers.threadId,
    },
    originalMessages: apiMessages,
    generateMessageId: generateId,
    onFinish: async ({ responseMessage }) => {
      const msgId = messageQueries.create({
        threadId: currentThreadId,
        role: MessageRole.Assistant,
      });

      for (const part of responseMessage.parts) {
        if (part.type === "text") {
          messagePartsQueries.create(msgId, {
            type: "text",
            text: part.text,
          });
        } else if (part.type.startsWith("tool-")) {
          const toolPart = part as IToolPart;

          if (toolPart.state !== "output-available") continue;

          messagePartsQueries.create(msgId, {
            type: part.type,
            state: toolPart.state,
            output: JSON.stringify(toolPart.output),
          });
        }
      }

      threadQueries.setActiveStream({
        threadId: currentThreadId,
        streamId: null,
      });
    },
    consumeSseStream: async ({ stream }) => {
      const streamId = generateId();

      const streamContext = createResumableStreamContext({ waitUntil: after });
      await streamContext.createNewResumableStream(streamId, () => stream);

      threadQueries.setActiveStream({
        threadId: currentThreadId,
        streamId,
      });
    },
  });
}
