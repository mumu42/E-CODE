/**
 * @file app/api/ai/chat/route.ts
 * @description AI 对话陪练接口
 * @author English Agent Team
 * @date 2026-08-07
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理 AI 对话请求
 * @param request - HTTP 请求对象
 * @returns AI 回复与纠错信息
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
    console.error("AI chat error:", error);
    const message = error instanceof Error ? error.message : "AI chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
