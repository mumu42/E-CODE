/**
 * @file app/api/ai/exam-questions/route.ts
 * @description 模拟考试 AI 实时出题：按考试类型生成真题风格题目
 * @author English Agent Team
 * @date 2026-09-22
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";
import { buildExamQuestionsPrompt } from "@/lib/ai/prompts";
import type { ExamQuestionType } from "@/lib/types";

/**
 * POST /api/ai/exam-questions
 * 根据考试类型实时生成真题风格题目 JSON
 * @param request - 请求体，包含 examType / count / sections / difficulty / excludeQuestions
 * @returns 生成的题目列表
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      examType?: string;
      count?: number;
      sections?: ExamQuestionType[];
      difficulty?: "easy" | "medium" | "hard";
      excludeQuestions?: string[];
    };

    const { examType, count } = body;
    if (!examType) {
      return NextResponse.json({ error: "Missing examType" }, { status: 400 });
    }

    const prompt = buildExamQuestionsPrompt(examType, count ?? 20, {
      sections: body.sections,
      difficulty: body.difficulty,
      excludeQuestions: body.excludeQuestions,
    });

    const { result } = await callAI({ prompt, maxTokens: 4096 });
    const cleaned = result.replace(/^```json\s*|\s*```$/g, "").trim();
    const questions = JSON.parse(cleaned);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Generate exam questions failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
