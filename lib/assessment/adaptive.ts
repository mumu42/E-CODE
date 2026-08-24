/**
 * @file lib/assessment/adaptive.ts
 * @description 自适应测评引擎
 * @author English Agent Team
 * @date 2026-08-24
 */

import type { Level } from "@/lib/types";
import { QUESTION_BANK, type AdaptiveQuestion } from "./questionBank";

const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface AdaptiveSession {
  /** 当前要回答的题目 */
  question: AdaptiveQuestion;
  /** 已答题数 */
  answeredCount: number;
  /** 总题数 */
  totalCount: number;
  /** 当前难度索引 */
  levelIndex: number;
  /** 是否结束 */
  finished: boolean;
}

/**
 * 从题库中为指定难度随机抽取一道未使用过的题目
 * @param level - 难度
 * @param usedIds - 已使用的题目 ID
 * @returns 题目或未找到
 */
function pickQuestion(level: Level, usedIds: Set<string>): AdaptiveQuestion | null {
  const pool = QUESTION_BANK[level].filter((q) => !usedIds.has(q.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 初始化自适应测评
 * @param totalCount - 总题数，默认 12
 * @returns 第一题会话状态
 */
export function startAdaptiveAssessment(totalCount = 12): AdaptiveSession & { question: AdaptiveQuestion } {
  const levelIndex = 0;
  const question = pickQuestion(LEVELS[levelIndex], new Set())!;
  return {
    question,
    answeredCount: 0,
    totalCount,
    levelIndex,
    finished: false,
  };
}

/**
 * 提交一题答案并返回下一题或结束状态
 * @param session - 当前会话
 * @param userAnswer - 用户答案
 * @param usedIds - 已使用题目 ID
 * @returns 下一题会话状态
 */
export function submitAnswer(
  session: AdaptiveSession,
  userAnswer: string,
  usedIds: Set<string>
): AdaptiveSession {
  const current = session.question;
  const isCorrect = userAnswer.trim().toLowerCase() === current.answer.trim().toLowerCase();

  let nextLevelIndex = session.levelIndex;

  // 答对提升难度，答错降低难度
  if (isCorrect) {
    nextLevelIndex = Math.min(LEVELS.length - 1, session.levelIndex + 1);
  } else {
    nextLevelIndex = Math.max(0, session.levelIndex - 1);
  }

  const nextAnsweredCount = session.answeredCount + 1;
  const finished = nextAnsweredCount >= session.totalCount;

  if (finished) {
    return {
      ...session,
      question: current,
      answeredCount: nextAnsweredCount,
      finished: true,
    };
  }

  const nextQuestion = pickQuestion(LEVELS[nextLevelIndex], usedIds);
  // 如果当前难度没有题了，降级找题
  if (!nextQuestion) {
    for (let i = nextLevelIndex - 1; i >= 0; i--) {
      const fallback = pickQuestion(LEVELS[i], usedIds);
      if (fallback) {
        return {
          ...session,
          question: fallback,
          answeredCount: nextAnsweredCount,
          levelIndex: i,
          finished: false,
        };
      }
    }
  }

  return {
    ...session,
    question: nextQuestion!,
    answeredCount: nextAnsweredCount,
    levelIndex: nextLevelIndex,
    finished: false,
  };
}

/**
 * 评估自适应测评结果
 * @param history - 答题历史 { question, userAnswer, isCorrect }
 * @param sample - 用户口语/写作样本
 * @param aiLevel - AI 根据样本判定的等级（可选）
 * @returns 建议等级
 */
export function evaluateAdaptiveAssessment(
  history: { question: AdaptiveQuestion; userAnswer: string; isCorrect: boolean }[],
  sample: string,
  aiLevel?: Level
): {
  level: Level;
  scores: { listening: number; speaking: number; reading: number; writing: number; grammar: number };
  feedback: string;
} {
  const total = history.length;
  const correct = history.filter((h) => h.isCorrect).length;
  const accuracy = total > 0 ? correct / total : 0;

  // 基于答题准确率计算等级
  const levelIndex = Math.min(5, Math.max(0, Math.round(accuracy * 5)));
  const quizLevel = LEVELS[levelIndex];

  // 如果有 AI 样本等级，取加权平均
  let finalLevel = quizLevel;
  if (aiLevel) {
    const aiIndex = LEVELS.indexOf(aiLevel);
    const blendedIndex = Math.round((levelIndex + aiIndex) / 2);
    finalLevel = LEVELS[blendedIndex];
  }

  // 计算各维度得分：基于正确率 + 随机扰动模拟
  const base = Math.round(accuracy * 100);
  const scores = {
    listening: Math.min(100, base + Math.round(Math.random() * 10 - 5)),
    speaking: Math.min(100, base + Math.round(Math.random() * 10 - 5)),
    reading: Math.min(100, base + Math.round(Math.random() * 10 - 5)),
    writing: Math.min(100, base + Math.round(Math.random() * 10 - 5)),
    grammar: Math.min(100, base + Math.round(Math.random() * 10 - 5)),
  };

  const feedback = sample.trim().length > 0
    ? `自适应测评共 ${total} 题，答对 ${correct} 题；结合你的口语/写作样本，当前等级约为 ${finalLevel}。`
    : `自适应测评共 ${total} 题，答对 ${correct} 题，当前等级约为 ${finalLevel}。`;

  return { level: finalLevel, scores, feedback };
}
