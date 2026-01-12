import { NextResponse } from "next/server";
import { messageQueries } from "@db";

export async function GET(
  request: Request,
  // Типизируем params как Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ждем разрешения промиса, чтобы получить доступ к id
    const { id } = await params;

    console.log("🔍 Запрос сообщений для треда ID:", id);

    const messages = messageQueries.getByThreadId(id);

    // Преобразуем формат твоей БД в формат UIMessage для frontend
    const uiMessages = messages.map((m) => ({
      id: m.id.toString(), // AI SDK ждет строку
      role: m.role,
      parts: [{ type: "text", text: m.content }],
    }));

    return NextResponse.json(uiMessages);
  } catch (error) {
    console.error("❌ Ошибка API:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
