/**
 * @file lib/review/utils.ts
 * @description 错题复习游戏化工具函数
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { ErrorItem } from "@/lib/types";

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
