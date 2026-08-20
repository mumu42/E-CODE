/**
 * @file lib/stats/checkin.ts
 * @description 学习打卡与连续天数统计工具
 * @author English Agent Team
 * @date 2026-08-17
 */

import type { PracticeRecord } from "@/lib/types";

/** 从练习记录中提取去重的打卡日期（YYYY-MM-DD） */
export function getCheckInDates(sessions: PracticeRecord[]): string[] {
  const set = new Set<string>();
  sessions.forEach((s) => {
    try {
      const date = new Date(s.date).toISOString().split("T")[0];
      set.add(date);
    } catch {
      // 忽略无效日期
    }
  });
  return Array.from(set).sort();
}

/** 计算当前连续天数（到今天为止，包含今天） */
export function getCurrentStreak(checkIns: string[]): number {
  const sorted = Array.from(new Set(checkIns)).sort().reverse();
  if (sorted.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // 如果最近打卡不是今天也不是昨天，则当前连续天数为 0
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** 计算历史最长连续天数 */
export function getLongestStreak(checkIns: string[]): number {
  const sorted = Array.from(new Set(checkIns)).sort();
  if (sorted.length === 0) return 0;

  let max = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return max;
}
