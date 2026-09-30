/**
 * @file lib/review/utils.ts
 * @description 错题复习游戏化工具函数
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { ErrorItem, TranslationRecord } from "@/lib/types";

/** 过滤今日待复习或未复习的错题 */
export function getDueErrors(errors: ErrorItem[]): ErrorItem[] {
  const today = new Date().toISOString().split("T")[0];
  return errors.filter((e) => !e.reviewed || (e.nextReviewDate && e.nextReviewDate <= today));
}

/** 生成填空题：把 correction 中与 original 不同的部分挖空 */
export function generateFillBlank(
  original: string,
  correction: string
): { sentence: string; answer: string } | null {
  const a = original.trim();
  const b = correction.trim();
  if (!a || !b) return null;

  const diff = findDiff(a, b);
  if (!diff) {
    // 如果差异无法识别，默认挖空 correction 的第一个实词
    const words = b.split(/\s+/).filter((w) => /^[a-zA-Z]+$/.test(w));
    if (words.length === 0) return null;
    const answer = words[0];
    const sentence = b.replace(answer, "_____");
    return { sentence, answer };
  }

  const { removed, added } = diff;
  const answer = added;
  // 在 original 中把 removed 部分替换为下划线
  const sentence = a.replace(removed, "_____");
  return { sentence, answer };
}

interface DiffResult {
  removed: string;
  added: string;
}

/** 找到两个句子中差异最大的连续片段 */
function findDiff(a: string, b: string): DiffResult | null {
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);

  // 寻找第一个不同的位置
  let start = 0;
  while (start < aWords.length && start < bWords.length && aWords[start] === bWords[start]) {
    start++;
  }

  // 寻找从末尾开始相同的边界
  let aEnd = aWords.length;
  let bEnd = bWords.length;
  while (aEnd > start && bEnd > start && aWords[aEnd - 1] === bWords[bEnd - 1]) {
    aEnd--;
    bEnd--;
  }

  if (start >= aEnd && start >= bEnd) return null;

  return {
    removed: aWords.slice(start, aEnd).join(" "),
    added: bWords.slice(start, bEnd).join(" "),
  };
}

/** 计算挑战得分（0-100） */
export function scoreChallenge(
  total: number,
  correct: number
): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * 从翻译记录中生成错题列表
 * 按 AI 返回的 errors 逐条生成 ErrorItem
 * @param record - 翻译记录（句子模式+用户自译）
 * @param userId - 用户 ID
 * @returns 错题列表（逐条 AI 错误点）
 */
export function buildTranslationReviewErrors(
  record: TranslationRecord,
  userId: string
): ErrorItem[] {
  // 未提供自译则不出错题
  if (!record.userTranslation || record.mode !== "sentence") return [];
  // 无 AI 返回的错误点
  if (!record.errors || record.errors.length === 0) return [];

  return record.errors.map((err) => ({
    id: crypto.randomUUID(),
    userId,
    sessionId: record.id,
    type: "CHAT" as const,
    date: record.date,
    original: err.original,
    correction: err.correction,
    explanation: err.explanation,
    errorType: "translation" as const,
    reviewed: false,
    nextReviewDate: new Date().toISOString().split("T")[0],
    interval: 1,
    repetitionCount: 0,
    easeFactor: 2.5,
  }));
}

/**
 * 对翻译错题按 errorType + original 去重，保留最新一条
 * 复用 chat review 的去重策略
 * @param errors - 翻译错题列表
 * @returns 去重后的错题列表
 */
export function dedupeTranslationErrors(errors: ErrorItem[]): ErrorItem[] {
  const seen = new Map<string, ErrorItem>();
  errors.forEach((err) => {
    const key = `${err.errorType}:${err.original}`;
    seen.set(key, err);
  });
  return Array.from(seen.values());
}
