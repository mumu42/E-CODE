/**
 * @file app/api/ai/translate/route.ts
 * @description 翻译与解析 AI 接口
 * @author English Agent Team
 * @date 2026-09-30
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理翻译请求
 * POST /api/ai/translate
 */
export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { result } = await callAI({ prompt, maxTokens: 3072 });
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI translate error:", error);
    const message = error instanceof Error ? error.message : "AI translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
