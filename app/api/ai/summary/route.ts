/**
 * @file app/api/ai/summary/route.ts
 * @description 周期性学习摘要 AI 接口
 * @author English Agent Team
 * @date 2026-08-17
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理学习摘要生成请求
 * @param request - HTTP 请求对象
 * @returns AI 生成的学习摘要 JSON 字符串
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
    console.error("AI summary error:", error);
    const message = error instanceof Error ? error.message : "AI summary failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
