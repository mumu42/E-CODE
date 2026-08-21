/**
 * @file app/api/ai/plan/route.ts
 * @description 根据用户档案与薄弱点生成 AI 学习计划
 * @author English Agent Team
 * @date 2026-08-11
 */

import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/provider";
import { buildLearningPlanPrompt, parseLearningPlanResponse } from "@/lib/ai/prompts";

/** 生成学习计划的请求体 */
export interface GeneratePlanRequest {
  /** 用户学习目标 */
  target: "SCHOOL" | "STUDY_ABROAD" | "CET" | "IELTS_TOEFL";
  /** 用户当前英语水平 */
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  /** 每日可用学习时长（分钟） */
  availableMinutes: number;
  /** 薄弱点统计 */
  weakPoints: { label: string; count: number }[];
  /** 计划周期（周数，默认 4） */
  weeks?: number;
  /** 自定义学习计划 Prompt */
  customPrompt?: string;
}

/**
 * POST /api/ai/plan
 * 根据用户档案生成学习计划 JSON
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeneratePlanRequest;
    const { target, level, availableMinutes, weakPoints, weeks, customPrompt } = body;

    if (!target || !level || !availableMinutes) {
      return NextResponse.json(
        { error: "Missing required fields: target, level, availableMinutes" },
        { status: 400 }
      );
    }

    const prompt = buildLearningPlanPrompt(
      target,
      level,
      Number(availableMinutes),
      weakPoints ?? [],
      weeks ?? 4,
      customPrompt
    );
    const { result } = await callAI(prompt);
    const plan = parseLearningPlanResponse(result);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Generate learning plan failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
