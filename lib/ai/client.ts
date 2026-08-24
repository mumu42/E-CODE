/**
 * @file lib/ai/client.ts
 * @description 前端 AI 能力统一调用客户端
 * @author English Agent Team
 * @date 2026-08-07
 */

import {
  buildAssessmentPrompt,
  buildSpeakPrompt,
  buildDailyTopicPrompt,
  buildWritePrompt,
  buildWritingTopicPrompt,
  buildChatPrompt,
  buildWeakPointDrillPrompt,
  buildReadingPrompt,
  buildListeningPrompt,
  buildAdvisorPrompt,
  parseReadingResponse,
  parseListeningResponse,
} from "./prompts";
import { buildSummaryPrompt } from "./memory";
import type {
  AssessmentResult,
  Level,
  Target,
  SpeakFeedback,
  WritingTopic,
  WritingFeedback,
  ChatRole,
  DrillQuestion,
  PracticeRecord,
  ErrorItem,
  ReadingPassage,
  ListeningItem,
} from "@/lib/types";

/**
 * 安全解析 AI 返回的 JSON 字符串，支持去除 markdown 代码块标记
 * @param text - AI 返回的原始文本
 * @returns 解析后的对象，解析失败返回 null
 */
function safeParseJson<T>(text: string): T | null {
  try {
    // Sometimes the AI wraps JSON in markdown code fences
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/**
 * 评估用户英语水平
 * @param answers - 用户测评答案
 * @param sample - 用户输入样本
 * @returns 水平测评结果
 * @example
 * ```ts
 * const result = await assessLevel(answers, sample);
 * ```
 */
export async function assessLevel(
  answers: Record<string, string>,
  sample: string,
  customPrompt?: string
): Promise<AssessmentResult> {
  const res = await fetch("/api/ai/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildAssessmentPrompt(answers, sample, customPrompt) }),
  });

  if (!res.ok) {
    throw new Error("Assessment failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<AssessmentResult>(result);
  if (!parsed) {
    throw new Error("Failed to parse assessment result");
  }
  return parsed;
}

/**
 * 获取口语练习反馈
 * @param target - 学习目标
 * @param level - 当前等级
 * @param topic - 话题
 * @param scenario - 场景
 * @param userInput - 用户输入
 * @param learningContext - 学习画像上下文（可选）
 * @returns 口语反馈结果
 */
export async function getSpeakFeedback(
  target: Target,
  level: Level,
  topic: string,
  scenario: string,
  userInput: string,
  learningContext = "",
  customPrompt?: string
): Promise<SpeakFeedback> {
  const res = await fetch("/api/ai/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildSpeakPrompt(target, level, topic, scenario, userInput, learningContext, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Feedback failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<SpeakFeedback>(result);
  if (!parsed) {
    throw new Error("Failed to parse feedback result");
  }
  return parsed;
}

/**
 * 生成每日口语话题
 * @param target - 学习目标
 * @param level - 当前等级
 * @returns 每日话题
 */
export async function generateDailyTopic(
  target: Target,
  level: Level,
  customPrompt?: string
): Promise<{ topic: string; scenario: string; hints: string[] }> {
  const res = await fetch("/api/ai/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildDailyTopicPrompt(target, level, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Topic generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<{ topic: string; scenario: string; hints: string[] }>(result);
  if (!parsed) {
    throw new Error("Failed to parse topic result");
  }
  return parsed;
}

/**
 * 生成写作题目
 * @param target - 学习目标
 * @param level - 当前等级
 * @returns 写作题目
 */
export async function generateWritingTopic(
  target: Target,
  level: Level,
  customPrompt?: string
): Promise<WritingTopic> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildWritingTopicPrompt(target, level, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Writing topic generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<WritingTopic>(result);
  if (!parsed) {
    throw new Error("Failed to parse writing topic");
  }
  return parsed;
}

/**
 * 获取写作批改反馈
 * @param target - 学习目标
 * @param level - 当前等级
 * @param topic - 题目
 * @param instructions - 写作要求
 * @param userInput - 用户作文
 * @returns 写作批改结果
 */
export async function getWritingFeedback(
  target: Target,
  level: Level,
  topic: string,
  instructions: string,
  userInput: string,
  learningContext = "",
  customPrompt?: string
): Promise<WritingFeedback> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildWritePrompt(target, level, topic, instructions, userInput, learningContext, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Writing feedback failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<WritingFeedback>(result);
  if (!parsed) {
    throw new Error("Failed to parse writing feedback");
  }
  return parsed;
}

/**
 * 发送聊天消息并获取 AI 回复
 * @param target - 学习目标
 * @param level - 当前等级
 * @param role - 聊天角色
 * @param history - 历史消息
 * @param userMessage - 用户当前消息
 * @returns AI 回复及纠错信息
 */
export async function sendChatMessage(
  target: Target,
  level: Level,
  role: ChatRole,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  learningContext = "",
  scenario?: string,
  voiceMode = false,
  customPrompt?: string
): Promise<{ reply: string; corrections: string[]; pronunciationTips?: string[] }> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildChatPrompt(target, level, role, history, userMessage, learningContext, scenario, voiceMode, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Chat failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<{ reply: string; corrections: string[]; pronunciationTips?: string[] }>(result);
  if (!parsed) {
    throw new Error("Failed to parse chat result");
  }
  return parsed;
}

/**
 * 根据薄弱点生成专项练习题
 * @param weakPoint - 薄弱点类型
 * @param count - 题目数量
 * @returns 练习题列表
 */
export async function generateWeakPointDrill(
  weakPoint: string,
  count: number,
  customPrompt?: string
): Promise<DrillQuestion[]> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildWeakPointDrillPrompt(weakPoint, count, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Drill generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<DrillQuestion[]>(result);
  if (!parsed) {
    throw new Error("Failed to parse drill result");
  }
  return parsed;
}

/**
 * 生成周期性学习摘要
 * @param profile - 当前档案基本信息
 * @param sessions - 练习记录
 * @param errors - 错题记录
 * @param assessments - 测评记录
 * @returns 学习摘要对象
 */
export async function generateLearningSummary(
  profile: { target: string; level: string } | null,
  sessions: PracticeRecord[],
  errors: ErrorItem[],
  customPrompt?: string
): Promise<{ summary: string; strengths: string[]; weaknesses: string[]; nextSteps: string[] }> {
  const res = await fetch("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildSummaryPrompt(profile, sessions, errors, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Summary generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<{ summary: string; strengths: string[]; weaknesses: string[]; nextSteps: string[] }>(result);
  if (!parsed) {
    throw new Error("Failed to parse summary result");
  }
  return parsed;
}

/**
 * 生成阅读理解文章与题目
 * @param target - 学习目标
 * @param level - 当前等级
 * @returns 阅读理解文章与题目
 */
export async function generateReadingPassage(
  target: Target,
  level: Level,
  customPrompt?: string
): Promise<ReadingPassage> {
  const res = await fetch("/api/ai/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildReadingPrompt(target, level, customPrompt) }),
  });

  if (!res.ok) {
    throw new Error("Reading generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  return parseReadingResponse(result);
}

/**
 * 生成听力理解材料与题目
 * @param target - 学习目标
 * @param level - 当前等级
 * @returns 听力文本与题目
 */
export async function generateListeningItem(
  target: Target,
  level: Level,
  customPrompt?: string
): Promise<Omit<ListeningItem, "id" | "userId" | "date" | "score">> {
  const res = await fetch("/api/ai/listening", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildListeningPrompt(target, level, customPrompt) }),
  });

  if (!res.ok) {
    throw new Error("Listening generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  return parseListeningResponse(result);
}

/**
 * 向 AI 学习顾问提问
 * @param target - 学习目标
 * @param level - 当前等级
 * @param question - 用户问题
 * @param context - 额外上下文（可选）
 * @param errorItem - 相关错题（可选）
 * @param learningContext - 学习画像上下文（可选）
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 顾问回复
 */
export async function askAdvisor(
  target: Target,
  level: Level,
  question: string,
  context?: string,
  errorItem?: ErrorItem,
  learningContext?: string,
  customPrompt?: string
): Promise<{ reply: string; examples: string[]; followUpQuestions: string[] }> {
  const res = await fetch("/api/ai/advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildAdvisorPrompt(target, level, question, context, errorItem, learningContext, customPrompt),
    }),
  });

  if (!res.ok) {
    throw new Error("Advisor failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<{ reply: string; examples: string[]; followUpQuestions: string[] }>(result);
  if (!parsed) {
    throw new Error("Failed to parse advisor response");
  }
  return parsed;
}

