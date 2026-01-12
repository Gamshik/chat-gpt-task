import { NextResponse } from "next/server";
import { threadQueries } from "@db";

export async function GET() {
  try {
    const threads = threadQueries.getAll();
    return NextResponse.json(threads);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}
