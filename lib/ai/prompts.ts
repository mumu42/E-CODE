/**
 * @file lib/ai/prompts.ts
 * @description AI 提示词构建工具函数
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { Level, Target, ChatRole, LearningPlan, ReadingPassage, ListeningItem, ErrorItem } from "@/lib/types";
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
 * @param scenario - 场景描述（可选）
 * @param voiceMode - 是否为语音对话模式（可选）
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
  scenario?: string,
  voiceMode = false,
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
      scenario: scenario || "",
      voiceMode: String(voiceMode),
    });
  }

  const scenarioText = scenario ? `Scenario: ${scenario}\n` : "";
  const voiceText = voiceMode
    ? "This is a voice conversation. The user is speaking, so keep your reply natural, short, and easy to pronounce. After your reply, provide up to 2 pronunciation tips if you noticed any issues.\n"
    : "";

  return `You are ${roleDescriptions[role]}. The user is preparing for ${target} and is at level ${level}.
${scenarioText}${voiceText}${learningContext ? `Learning context:\n${learningContext}\n` : ""}
Keep the conversation natural. After your reply, optionally include a short correction or suggestion if the user made a clear mistake, but keep it brief and encouraging.

Conversation history:
${historyText}

User: ${userMessage}

Reply in JSON with this exact shape:
{
  "reply": "your natural reply in English",
  "corrections": ["optional correction 1", "optional correction 2"]
${voiceMode ? '  ,"pronunciationTips": ["tip 1", "tip 2"]' : ""}
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

/**
 * 构建阅读理解生成提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 阅读理解生成提示词字符串
 */
export function buildReadingPrompt(target: Target, level: Level, customPrompt?: string): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, { target, level });
  }

  return `You are an expert English reading coach. Generate a reading comprehension passage and 3-5 multiple-choice questions for a learner preparing for ${target} at CEFR level ${level}.

Return a JSON object with this exact shape:
{
  "title": "short title in English",
  "passage": "the reading passage text in English",
  "questions": [
    {
      "question": "question text in English or Chinese-English mix",
      "options": ["A. option 1", "B. option 2", "C. option 3", "D. option 4"],
      "answerIndex": 0,
      "explanation": "explanation in Chinese"
    }
  ]
}

Rules:
- The passage length and vocabulary should match level ${level}.
- Each question should test reading comprehension, not just vocabulary.
- answerIndex is the zero-based index of the correct option.
- Include concise explanations in Chinese.

Return only valid JSON, no markdown.`;
}

/** 从 AI 返回的字符串安全解析阅读理解 JSON */
export function parseReadingResponse(raw: string): ReadingPassage {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.passage || !Array.isArray(parsed.questions)) {
    throw new Error("Invalid reading response");
  }
  return parsed as ReadingPassage;
}

/**
 * 构建听力理解生成提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns 听力理解生成提示词字符串
 */
export function buildListeningPrompt(target: Target, level: Level, customPrompt?: string): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, { target, level });
  }

  return `You are an expert English listening coach. Generate a short listening comprehension script (about 80-120 words) and 3-5 multiple-choice questions for a learner preparing for ${target} at CEFR level ${level}.

Return a JSON object with this exact shape:
{
  "transcript": "the listening script in English",
  "questions": [
    {
      "question": "question text in English or Chinese-English mix",
      "options": ["A. option 1", "B. option 2", "C. option 3", "D. option 4"],
      "answerIndex": 0,
      "explanation": "explanation in Chinese"
    }
  ]
}

Rules:
- The transcript should be suitable for ${level} listening practice.
- Questions should test comprehension, not just literal matching.
- answerIndex is the zero-based index of the correct option.
- Include concise explanations in Chinese.

Return only valid JSON, no markdown.`;
}

/** 从 AI 返回的字符串安全解析听力理解 JSON */
export function parseListeningResponse(raw: string): Omit<ListeningItem, "id" | "userId" | "date" | "score"> {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.transcript || !Array.isArray(parsed.questions)) {
    throw new Error("Invalid listening response");
  }
  return parsed as Omit<ListeningItem, "id" | "userId" | "date" | "score">;
}

/**
 * 构建 AI 学习顾问提示词
 * @param target - 用户学习目标
 * @param level - 用户英语水平
 * @param question - 用户提问
 * @param context - 额外上下文（可选）
 * @param errorItem - 相关错题（可选）
 * @param learningContext - 学习画像上下文（可选）
 * @param customPrompt - 自定义提示词模板（可选）
 * @returns AI 学习顾问提示词字符串
 */
export function buildAdvisorPrompt(
  target: Target,
  level: Level,
  question: string,
  context?: string,
  errorItem?: ErrorItem,
  learningContext?: string,
  customPrompt?: string
): string {
  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      target,
      level,
      question,
      context: context || "",
      errorOriginal: errorItem?.original || "",
      errorCorrection: errorItem?.correction || "",
      errorExplanation: errorItem?.explanation || "",
      learningContext: learningContext || "",
    });
  }

  const errorSection = errorItem
    ? `Related error:\n- Original: ${errorItem.original}\n- Correction: ${errorItem.correction}\n- Explanation: ${errorItem.explanation}\n`
    : "";

  return `You are a knowledgeable and patient English learning advisor. The user is preparing for ${target} and is currently at CEFR level ${level}.

User's question: ${question}
${context ? `Additional context:\n${context}\n` : ""}
${errorSection}
${learningContext ? `Learning context:\n${learningContext}\n` : ""}

Provide a clear, helpful answer in JSON with this exact shape:
{
  "reply": "your answer in Chinese, with English examples when helpful",
  "examples": ["example 1", "example 2"],
  "followUpQuestions": ["follow-up question 1", "follow-up question 2"]
}

Rules:
- Keep the tone encouraging and supportive.
- If the question is about a specific error, explain why it is wrong and how to avoid it.
- Include 1-2 concrete examples when explaining grammar, vocabulary, or expressions.
- Suggest 2 follow-up questions the user can ask to deepen understanding.

Return only valid JSON, no markdown.`;
}

