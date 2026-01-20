import { NextResponse } from "next/server";
import { messagesQueries, threadsQueries } from "@db";
import { ICreateMessageDTO } from "@dto";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const thread = threadsQueries.getById(id);

    if (!thread)
      return new Response(null, {
        status: 404,
        statusText: "Thread not found",
      });

    const messages = messagesQueries.getByThreadId(id);

    return NextResponse.json(messages);
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

    const thread = threadsQueries.getById(body.threadId);

    if (!thread)
      return new Response(null, {
        status: 404,
        statusText: "Thread not found",
      });

    const messageId = messagesQueries.create(body);

    const createdMessage = messagesQueries.getById(messageId);

    if (!createdMessage) {
      return new Response(null, {
        status: 500,
        statusText: "Failed to create message",
      });
    }

    return NextResponse.json(createdMessage);
  } catch (error) {
    console.error("Ошибка API:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 },
    );
  }
}
