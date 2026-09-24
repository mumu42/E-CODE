/**
 * @file app/api/ai/word-lookup/route.ts
 * @description 单词查询 API（右键查词功能）
 * @author English Agent Team
 * @date 2026-09-24
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";
import { buildWordLookupPrompt } from "@/lib/ai/prompts";

/**
 * 处理单词查询请求
 * @param request - HTTP 请求对象
 * @returns AI 返回的单词释义、词性、例句等信息
 */
export async function POST(request: Request) {
  try {
    const { word } = (await request.json()) as { word: string };

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    if (word.length < 2 || word.length > 200) {
      return NextResponse.json({ error: "Word length must be between 2 and 200 characters" }, { status: 400 });
    }

    const prompt = buildWordLookupPrompt(word);
    const { result } = await callAI(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI word lookup error:", error);
    const message = error instanceof Error ? error.message : "Word lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
