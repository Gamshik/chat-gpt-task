import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { threadQueries, messageQueries } from "@db";

export async function POST(request: Request) {
  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } =
    await request.json();

  let currentThreadId = threadId;

  if (!currentThreadId) {
    const firstText =
      messages[0]?.parts.find((p) => p.type === "text")?.text || "New Chat";

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
    system: "You are a friendly assistant!",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      messageQueries.create({
        thread_id: currentThreadId,
        role: "assistant",
        content: text,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-thread-id": currentThreadId,
    },
  });
}
