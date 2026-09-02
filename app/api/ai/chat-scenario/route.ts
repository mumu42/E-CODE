/**
 * @file app/api/ai/chat-scenario/route.ts
 * @description AI 对话场景生成接口
 * @author English Agent Team
 * @date 2026-09-02
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理 AI 对话场景生成请求
 * @param request - HTTP 请求对象
 * @returns 生成的对话场景
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
    console.error("AI chat scenario error:", error);
    const message = error instanceof Error ? error.message : "AI chat scenario failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
