/**
 * @file lib/badges/index.ts
 * @description 成就徽章规则与计算
 * @author English Agent Team
 * @date 2026-08-17
 */

import type { Badge } from "@/lib/types";
import { getCurrentStreak } from "@/lib/stats/checkin";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/** 内置徽章定义 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-step",
    title: "初次迈步",
    description: "完成第一次练习",
    icon: "Footprints",
  },
  {
    id: "speak-beginner",
    title: "开口说",
    description: "完成 5 次口语练习",
    icon: "Mic",
  },
  {
    id: "write-beginner",
    title: "动笔写",
    description: "完成 5 次写作练习",
    icon: "FileText",
  },
  {
    id: "practice-10",
    title: "练习达人",
    description: "累计完成 10 次练习",
    icon: "Dumbbell",
  },
  {
    id: "practice-50",
    title: "持之以恒",
    description: "累计完成 50 次练习",
    icon: "Trophy",
  },
  {
    id: "streak-7",
    title: "一周连胜",
    description: "连续学习 7 天",
    icon: "Flame",
  },
  {
    id: "streak-30",
    title: "月度坚持",
    description: "连续学习 30 天",
    icon: "CalendarCheck",
  },
  {
    id: "exam-expert",
    title: "模考高手",
    description: "模拟考试得分率达到 80%",
    icon: "Target",
  },
  {
    id: "error-clear",
    title: "错题清零",
    description: "所有错题都已复习",
    icon: "CheckCircle",
  },
];

/** 根据用户数据计算可解锁的徽章 */
export function calculateBadges(data: {
  sessions: { type: string }[];
  checkIns: string[];
  examRecords: { totalScore: number; score: number }[];
  errors: { reviewed?: boolean }[];
}): Badge[] {
  const unlocked: Badge[] = [];
  const now = new Date().toISOString();

  const speakCount = data.sessions.filter((s) => s.type === "SPEAK").length;
  const writeCount = data.sessions.filter((s) => s.type === "WRITE").length;
  const totalCount = data.sessions.length;
  const streak = getCurrentStreak(data.checkIns);
  const examPassed = data.examRecords.some(
    (r) => r.totalScore > 0 && r.score / r.totalScore >= 0.8
  );
  const allErrorsReviewed = data.errors.length > 0 && data.errors.every((e) => e.reviewed);

  if (totalCount >= 1) {
    unlocked.push(createBadge("first-step"));
  }
  if (speakCount >= 5) {
    unlocked.push(createBadge("speak-beginner"));
  }
  if (writeCount >= 5) {
    unlocked.push(createBadge("write-beginner"));
  }
  if (totalCount >= 10) {
    unlocked.push(createBadge("practice-10"));
  }
  if (totalCount >= 50) {
    unlocked.push(createBadge("practice-50"));
  }
  if (streak >= 7) {
    unlocked.push(createBadge("streak-7"));
  }
  if (streak >= 30) {
    unlocked.push(createBadge("streak-30"));
  }
  if (examPassed) {
    unlocked.push(createBadge("exam-expert"));
  }
  if (allErrorsReviewed) {
    unlocked.push(createBadge("error-clear"));
  }

  return unlocked.map((b) => ({ ...b, unlockedAt: now }));
}

/** 计算新增徽章 */
export function getNewBadges(
  existing: Badge[],
  data: {
    sessions: { type: string }[];
    checkIns: string[];
    examRecords: { totalScore: number; score: number }[];
    errors: { reviewed?: boolean }[];
  }
): Badge[] {
  const calculated = calculateBadges(data);
  const existingIds = new Set(existing.map((b) => b.id));
  return calculated.filter((b) => !existingIds.has(b.id));
}

function createBadge(id: string): Badge {
  const def = BADGE_DEFINITIONS.find((b) => b.id === id);
  if (!def) {
    throw new Error(`Unknown badge id: ${id}`);
  }
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    unlockedAt: new Date().toISOString(),
  };
}
