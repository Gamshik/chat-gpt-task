import { openai } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
  generateId,
  ModelMessage,
} from "ai";
import { threadsQueries, messagesQueries, messagePartsQueries } from "@db";
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

  const thread = threadsQueries.getById(currentThreadId);

  console.log("messsssa", message);

  // если не получили Id: создаём новый тред
  if (!thread) {
    const firstText =
      message.parts.find((p) => p.type === "text")?.text || "Новый чат";

    currentThreadId = threadsQueries.create({
      title: firstText.slice(0, 30) + (firstText.length > 30 ? "..." : ""),
    });
  }

  const allChatMessages = messagesQueries.getByThreadId(currentThreadId);

  const apiMessages = allChatMessages
    .map((m) => messageModelToApi(m))
    .filter((m): m is UIMessage => m !== null);

  // TODO: фиксить костыль
  apiMessages.push(message);

  for (const part of message.parts) {
    if (part.type === "text") {
      messagesQueries.create({
        threadId: currentThreadId,
        role: MessageRole.User,
        parts: [
          {
            type: "text",
            text: part.text,
          },
        ],
      });
    } else if (part.type.startsWith("tool-")) {
      const toolPart = part as IToolPart;

      if (toolPart.state === "approval-responded" && toolPart.approval) {
        messagesQueries.create({
          threadId: currentThreadId,
          role: MessageRole.User,
          parts: [
            {
              type: toolPart.type,
              state: toolPart.state,
              input: JSON.stringify(toolPart.input ?? ""),
              toolCallId: toolPart.toolCallId,
              approval: {
                approvalId: toolPart.approval.id,
                isApproved: toolPart.approval.approved,
              },
            },
          ],
        });
      }
    }
  }

  threadsQueries.setActiveStream({
    threadId: currentThreadId,
    streamId: null,
  });

  // const allChatMessages = messagesQueries.getByThreadId(currentThreadId);

  // const apiMessages = allChatMessages
  //   .map((m) => messageModelToApi(m))
  //   .filter((m): m is UIMessage => m !== null);

  // for (const m of apiMessages) {
  //   console.log("msg", m);
  //   console.log("parts", m.parts);
  // }

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
    stopWhen: stepCountIs(20),
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
      console.log("res responseMessage", responseMessage);

      const msgId = messagesQueries.create({
        threadId: currentThreadId,
        role: MessageRole.Assistant,
      });

      for (const part of responseMessage.parts) {
        console.log("res part", part);

        if (part.type === "text") {
          messagePartsQueries.create(msgId, {
            type: "text",
            text: part.text,
          });
        } else if (part.type.startsWith("tool-")) {
          const toolPart = part as IToolPart;

          if (toolPart.state === "output-available") {
            messagePartsQueries.create(msgId, {
              type: toolPart.type,
              state: toolPart.state,
              toolCallId: toolPart.toolCallId,
              input: JSON.stringify(toolPart.input ?? ""),
              output: JSON.stringify(toolPart.output),
            });
          } else if (toolPart.state === "approval-requested") {
            console.log("tool part", toolPart);
            messagePartsQueries.create(msgId, {
              type: toolPart.type,
              state: toolPart.state,
              input: JSON.stringify(toolPart.input ?? ""),
              approval: {
                approvalId: toolPart.approval?.id ?? "",
                isApproved: null,
              },
              toolCallId: toolPart.toolCallId,
            });
          }
        }
      }

      threadsQueries.setActiveStream({
        threadId: currentThreadId,
        streamId: null,
      });
    },
    consumeSseStream: async ({ stream }) => {
      const streamId = generateId();

      const streamContext = createResumableStreamContext({ waitUntil: after });
      await streamContext.createNewResumableStream(streamId, () => stream);

      threadsQueries.setActiveStream({
        threadId: currentThreadId,
        streamId,
      });
    },
  });
}
