/**
 * @file lib/ai/prompts.ts
 * @description AI 提示词构建工具函数
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { Level, Target, ChatRole, LearningPlan } from "@/lib/types";
import { renderPromptTemplate } from "@/lib/settings/promptTemplate";

/** 弱项概览 */
export interface WeakPointSummary {
  label: string;
  count: number;
}

/**
 * 构建 AI 学习计划提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param availableMinutes - 每日可用学习时间（分钟）
 * @param weakPoints - 薄弱点列表
 * @param weeks - 计划周数
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 学习计划提示词字符串
 */
export function buildLearningPlanPrompt(
  target: Target,
  level: Level,
  availableMinutes: number,
  weakPoints: WeakPointSummary[],
  weeks = 4,
  customPrompt?: string
): string {
  const weak = weakPoints.length
    ? weakPoints.map((w) => `${w.label}(${w.count}次)`).join(", ")
    : "暂无记录";

  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      target,
      level,
      availableMinutes,
      weakPoints: weak,
      weeks,
      totalDays: weeks * 7,
    });
  }

  return `You are an expert English learning planner. Create a ${weeks}-week study plan for a learner preparing for ${target} at CEFR level ${level}.

Daily available study time: ${availableMinutes} minutes.
Observed weak points: ${weak}.

Return a JSON object with this exact shape:
{
  "id": "unique-plan-id",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "description": "overall plan description in Chinese",
  "tasks": [
    {
      "id": "task-1",
      "title": "task description in Chinese",
      "type": "speak|write|chat|review|exam",
      "duration": minutes,
      "completed": false,
      "date": "YYYY-MM-DD"
    }
  ]
}

Rules:
- Generate exactly one task per day for ${weeks * 7} days.
- Keep total daily duration close to but not exceeding ${availableMinutes} minutes.
- Balance task types across the week.
- Address weak points with review/exam tasks at least twice a week.

Return only valid JSON, no markdown.`;
}

/** 从 AI 返回的字符串安全解析学习计划 JSON */
export function parseLearningPlanResponse(raw: string): LearningPlan {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.id || !parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error("Invalid learning plan response");
  }
  return parsed as LearningPlan;
}

/**
 * 构建英语水平评估提示词
 * @param answers - 用户测验答案
 * @param sample - 用户口语或写作样本
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 英语水平评估提示词字符串
 */
export function buildAssessmentPrompt(
  answers: Record<string, string>,
  sample: string,
  customPrompt?: string
): string {
  const answersText = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      answers: answersText,
      sample,
    });
  }

  return `You are an expert English assessor. Evaluate the user's English level based on their quiz answers and a speaking/writing sample.

Quiz answers:
${answersText}

User sample:
${sample}

Output a JSON object with this exact shape:
{
  "level": "A1|A2|B1|B2|C1|C2",
  "scores": {
    "listening": 0-100,
    "speaking": 0-100,
    "reading": 0-100,
    "writing": 0-100,
    "grammar": 0-100
  },
  "feedback": "brief Chinese feedback about the user's level and what to focus on"
}

Return only valid JSON, no markdown.`;
}

/**
 * 构建口语练习反馈提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param topic - 练习主题
 * @param scenario - 练习场景
 * @param userInput - 用户输入的口语内容
 * @param learningContext - 学习画像上下文（可选）
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 口语练习反馈提示词字符串
 */
export function buildSpeakPrompt(
  target: Target,
  level: Level,
  topic: string,
  scenario: string,
  userInput: string,
  learningContext = "",
  customPrompt?: string
): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      target,
      level,
      topic,
      scenario,
      userInput,
      learningContext,
    });
  }

  return `You are a friendly and rigorous English speaking coach. The user's goal is ${target} and their current level is ${level}.

Scenario: ${scenario}
Topic: ${topic}
User's answer: ${userInput}
${learningContext ? `Learning context:\n${learningContext}\n` : ""}
Provide feedback in JSON with this exact shape:
{
  "grammarIssues": ["issue 1", "issue 2"],
  "betterExpressions": ["better way 1", "better way 2"],
  "pronunciationTips": ["tip 1", "tip 2"],
  "score": 0-100,
  "feedback": "overall Chinese feedback with encouragement and next steps"
}

Return only valid JSON, no markdown.`;
}

/**
 * 构建每日口语练习主题提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 每日口语练习主题提示词字符串
 */
export function buildDailyTopicPrompt(target: Target, level: Level, customPrompt?: string): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, { target, level });
  }

  return `Generate a daily English speaking practice topic for a learner preparing for ${target} at level ${level}.

Return a JSON object with this exact shape:
{
  "topic": "a clear English speaking question or prompt",
  "scenario": "context describing the situation (e.g., IELTS Speaking Part 2)",
  "hints": ["hint 1", "hint 2", "hint 3"]
}

Return only valid JSON, no markdown.`;
}

/**
 * 构建写作练习反馈提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param topic - 写作主题
 * @param instructions - 写作指导
 * @param userInput - 用户输入的写作内容
 * @param learningContext - 学习画像上下文（可选）
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 写作批改反馈提示词字符串
 */
export function buildWritePrompt(
  target: Target,
  level: Level,
  topic: string,
  instructions: string,
  userInput: string,
  learningContext = "",
  customPrompt?: string
): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      target,
      level,
      topic,
      instructions,
      userInput,
      learningContext,
    });
  }

  return `You are a rigorous English writing coach. The user's goal is ${target} and their current level is ${level}.

Writing topic: ${topic}
Instructions: ${instructions}
User's writing: ${userInput}
${learningContext ? `Learning context:\n${learningContext}\n` : ""}
Evaluate the writing and return feedback in JSON with this exact shape:
{
  "score": 0-100,
  "grammarScore": 0-100,
  "vocabularyScore": 0-100,
  "structureScore": 0-100,
  "errors": [
    {
      "id": "unique-id-string",
      "original": "the incorrect text snippet",
      "correction": "the corrected text",
      "explanation": "explanation in Chinese",
      "type": "grammar|vocabulary|spelling|structure|expression"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "improvedVersion": "a polished version of the user's writing in English",
  "feedback": "overall Chinese feedback with encouragement and next steps"
}

Return only valid JSON, no markdown.`;
}

/**
 * 构建写作练习主题提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 写作练习主题提示词字符串
 */
export function buildWritingTopicPrompt(target: Target, level: Level, customPrompt?: string): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, { target, level });
  }

  return `Generate a writing topic for an learner preparing for ${target} at level ${level}.

Return a JSON object with this exact shape:
{
  "title": "short title of the writing task",
  "instructions": "detailed instructions for the writing task in Chinese with some English examples",
  "wordLimit": 150,
  "timeLimit": 30
}

Return only valid JSON, no markdown.`;
}

/**
 * 构建 AI 对话提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param role - 对话角色
 * @param history - 对话历史
 * @param userMessage - 用户当前消息
 * @param learningContext - 学习画像上下文（可选）
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns AI 对话提示词字符串
 */
export function buildChatPrompt(
  target: Target,
  level: Level,
  role: ChatRole,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  learningContext = "",
  customPrompt?: string
): string {
  const roleDescriptions: Record<ChatRole, string> = {
    friend: "a friendly native speaker chatting casually",
    interviewer: "a job interviewer asking behavioral and situational questions",
    examiner: "an IELTS/TOEFL speaking examiner conducting Part 1-3 style questions",
    teacher: "a patient English teacher helping the user improve",
    colleague: "a professional colleague discussing work topics",
  };

  const historyText = history
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      target,
      level,
      role,
      roleDescription: roleDescriptions[role],
      history: historyText,
      userMessage,
      learningContext,
    });
  }

  return `You are ${roleDescriptions[role]}. The user is preparing for ${target} and is at level ${level}.
${learningContext ? `Learning context:\n${learningContext}\n` : ""}
Keep the conversation natural. After your reply, optionally include a short correction or suggestion if the user made a clear mistake, but keep it brief and encouraging.

Conversation history:
${historyText}

User: ${userMessage}

Reply in JSON with this exact shape:
{
  "reply": "your natural reply in English",
  "corrections": ["optional correction 1", "optional correction 2"]
}

Return only valid JSON, no markdown.`;
}

/**
 * 构建薄弱点专项练习提示词
 * @param weakPoint - 用户的薄弱知识点
 * @param count - 练习题目数量
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 薄弱点专项练习提示词字符串
 */
export function buildWeakPointDrillPrompt(
  weakPoint: string,
  count: number,
  customPrompt?: string
): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, { weakPoint, count });
  }

  return `The user is weak in the following English area: ${weakPoint}. They want to practice ${count} questions.

Return a JSON array with this exact shape:
[
  {
    "question": "the question in English or Chinese-English mix",
    "options": ["A", "B", "C", "D"],
    "answer": "the correct option",
    "explanation": "explanation in Chinese"
  }
]

Return only valid JSON, no markdown.`;
}
