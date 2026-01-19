import { NextResponse } from "next/server";
import { threadQueries } from "@db";

export async function GET() {
  try {
    const threads = threadQueries.getAll();

    return NextResponse.json(threads);
  } catch (error) {
    console.log("Failed to fetch threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}
