import { NextResponse } from "next/server";
import { messageQueries, threadQueries } from "@db";
import { messageModelToUi } from "@app/utils";
import { UIMessage } from "ai";
import { ICreateMessageDTO } from "@dto";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const thread = threadQueries.getById(id);

    if (!thread)
      return new Response(null, {
        status: 404,
        statusText: "Thread not found",
      });

    const messages = messageQueries.getByThreadId(id);

    const uiMessages = messages
      .map((m) => messageModelToUi(m))
      .filter((m): m is UIMessage => m !== null);

    return NextResponse.json(uiMessages);
  } catch (error) {
    console.error("Ошибка API:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: ICreateMessageDTO = await request.json();

    const thread = threadQueries.getById(body.threadId);

    if (!thread)
      return new Response(null, {
        status: 404,
        statusText: "Thread not found",
      });

    const messageId = messageQueries.create(body);

    const createdMessage = messageQueries.getById(messageId);

    if (!createdMessage) {
      return new Response(null, {
        status: 500,
        statusText: "Failed to create message",
      });
    }

    const uiMessage = messageModelToUi(createdMessage);

    return NextResponse.json(uiMessage);
  } catch (error) {
    console.error("Ошибка API:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 },
    );
  }
}
