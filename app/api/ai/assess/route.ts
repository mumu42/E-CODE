/**
 * @file app/api/ai/assess/route.ts
 * @description 英语水平测评 AI 接口
 * @author English Agent Team
 * @date 2026-08-07
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理英语水平测评请求
 * @param request - HTTP 请求对象
 * @returns AI 测评结果
 */
export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { result } = await callAI(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI assess error:", error);
    const message = error instanceof Error ? error.message : "AI assessment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
