import { NextResponse } from "next/server";
import { messageQueries } from "@db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const messages = messageQueries.getByThreadId(id);

    const uiMessages = messages.map((m) => ({
      id: m.id.toString(),
      role: m.role,
      parts: [{ type: "text", text: m.content }],
    }));

    return NextResponse.json(uiMessages);
  } catch (error) {
    console.error("Ошибка API:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
