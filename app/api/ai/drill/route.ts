/**
 * @file app/api/ai/drill/route.ts
 * @description 根据薄弱点生成专项练习题
 * @author English Agent Team
 * @date 2026-08-11
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";
import { buildWeakPointDrillPrompt } from "@/lib/ai/prompts";

/**
 * POST /api/ai/drill
 * 根据薄弱点生成练习题 JSON
 */
export async function POST(request: Request) {
  try {
    const { weakPoint, count } = (await request.json()) as { weakPoint?: string; count?: number };
    if (!weakPoint) {
      return NextResponse.json({ error: "Missing weakPoint" }, { status: 400 });
    }
    const prompt = buildWeakPointDrillPrompt(weakPoint, count ?? 5);
    const { result } = await callAI(prompt);
    const cleaned = result.replace(/^```json\s*|\s*```$/g, "").trim();
    const questions = JSON.parse(cleaned);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Generate drill failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
