import { NextResponse } from "next/server";
import { threadsQueries } from "@db";

export async function GET() {
  try {
    const threads = threadsQueries.getAll();

    return NextResponse.json(threads);
  } catch (error) {
    console.log("Failed to fetch threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 },
    );
  }
}
