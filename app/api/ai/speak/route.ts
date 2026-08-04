import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { result } = await callAI(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI speak error:", error);
    const message = error instanceof Error ? error.message : "AI feedback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
