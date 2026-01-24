import { NextResponse } from "next/server";
import { threadsQueries } from "@db";

export async function GET() {
  try {
    const threads = threadsQueries.getAll();

    return NextResponse.json(threads);
  } catch (error) {
    console.log("Ошибка загрузки тредов:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки тредов" },
      { status: 500 },
    );
  }
}
