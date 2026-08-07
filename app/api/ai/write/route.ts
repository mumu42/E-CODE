/**
 * @file app/api/ai/write/route.ts
 * @description 写作批改/题目生成 AI 接口
 * @author English Agent Team
 * @date 2026-08-07
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理写作相关 AI 请求（题目生成/作文批改/薄弱点练习）
 * @param request - HTTP 请求对象
 * @returns AI 结果
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
    console.error("AI write error:", error);
    const message = error instanceof Error ? error.message : "AI writing feedback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
