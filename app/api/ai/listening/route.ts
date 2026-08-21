/**
 * @file app/api/ai/listening/route.ts
 * @description 听力理解材料生成 AI 接口
 * @author English Agent Team
 * @date 2026-08-21
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";

/**
 * 处理听力理解生成请求
 * @param request - HTTP 请求对象
 * @returns AI 生成结果
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
    console.error("AI listening error:", error);
    const message = error instanceof Error ? error.message : "Listening generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
