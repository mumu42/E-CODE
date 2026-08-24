/**
 * @file lib/stats/predictions.ts
 * @description 学习目标达成预测与能力差距计算
 * @author English Agent Team
 * @date 2026-08-24
 */

import type { UserProfile, PracticeRecord, AssessmentRecord, ErrorItem, Level, Target } from "@/lib/types";

/** 目标等级映射：将学习目标映射到建议达到的能力等级 */
const TARGET_LEVELS: Record<Target, Level> = {
  SCHOOL: "B1",
  STUDY_ABROAD: "C1",
  CET: "B2",
  IELTS_TOEFL: "C1",
};

/** CEFR 等级数值映射 */
const LEVEL_VALUES: Record<Level, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

/** 目标差距结果 */
export interface GoalGap {
  /** 当前等级数值 */
  currentValue: number;
  /** 目标等级数值 */
  targetValue: number;
  /** 总体进度百分比（0-100） */
  overallProgress: number;
  /** 各项能力当前得分 */
  currentScores: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
    grammar: number;
  };
  /** 目标得分（满分为 100） */
  targetScores: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
    grammar: number;
  };
}

/** 预测结果 */
export interface TimeToTargetEstimate {
  /** 预计还需要多少天 */
  days: number;
  /** 预计还需要多少周 */
  weeks: number;
  /** 每周建议练习次数 */
  recommendedWeeklySessions: number;
  /** 预测依据说明 */
  basis: string;
}

/**
 * 计算能力差距
 * @param profile - 用户档案
 * @param latestAssessment - 最新测评记录
 * @returns 目标达成差距
 */
export function calculateGoalGap(
  profile: UserProfile,
  latestAssessment?: AssessmentRecord | null
): GoalGap {
  const currentValue = LEVEL_VALUES[profile.level];
  const targetValue = LEVEL_VALUES[TARGET_LEVELS[profile.target]];

  const currentScores = latestAssessment?.scores ?? {
    listening: currentValue * 15,
    speaking: currentValue * 15,
    reading: currentValue * 15,
    writing: currentValue * 15,
    grammar: currentValue * 15,
  };

  const targetScores = {
    listening: targetValue * 15,
    speaking: targetValue * 15,
    reading: targetValue * 15,
    writing: targetValue * 15,
    grammar: targetValue * 15,
  };

  const currentTotal = Object.values(currentScores).reduce((a, b) => a + (b || 0), 0);
  const targetTotal = Object.values(targetScores).reduce((a, b) => a + b, 0);
  const progress = targetTotal > 0 ? Math.min(100, Math.max(0, (currentTotal / targetTotal) * 100)) : 0;

  return {
    currentValue,
    targetValue,
    overallProgress: Math.round(progress),
    currentScores: {
      listening: currentScores.listening ?? 0,
      speaking: currentScores.speaking ?? 0,
      reading: currentScores.reading ?? 0,
      writing: currentScores.writing ?? 0,
      grammar: currentScores.grammar ?? 0,
    },
    targetScores,
  };
}

/**
 * 估算达到目标所需时间
 * @param profile - 用户档案
 * @param sessions - 练习记录
 * @param errors - 错题记录
 * @returns 时间估算
 */
export function estimateTimeToTarget(
  profile: UserProfile,
  sessions: PracticeRecord[],
  errors: ErrorItem[]
): TimeToTargetEstimate {
  const currentValue = LEVEL_VALUES[profile.level];
  const targetValue = LEVEL_VALUES[TARGET_LEVELS[profile.target]];
  const gap = Math.max(0, targetValue - currentValue);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter((s) => new Date(s.date).getTime() > thirtyDaysAgo);

  const totalScore = recentSessions.reduce(
    (sum, s) => sum + (s.fluencyScore || s.grammarScore || 0),
    0
  );
  const avgScore = recentSessions.length > 0 ? totalScore / recentSessions.length : 0;

  const recentErrorCount = errors.filter(
    (e) => new Date(e.date).getTime() > thirtyDaysAgo
  ).length;

  // 练习频率：最近 30 天内每周平均练习次数
  // const sessionsPerWeek = recentSessions.length / 4;

  // 学习效率分：得分越高、错误越少，效率越高
  const efficiency = Math.max(0.3, Math.min(1.5, (avgScore / 100 + 0.5) * (1 - recentErrorCount / Math.max(1, recentSessions.length))));

  // 每提升 1 个 CEFR 等级约需要 4 周有效学习（可调整）
  const baseWeeksPerLevel = 4;
  const estimatedWeeks = gap > 0 ? Math.ceil((gap * baseWeeksPerLevel) / efficiency) : 0;
  const estimatedDays = estimatedWeeks * 7;

  const recommendedWeeklySessions = Math.max(3, Math.round(5 / Math.max(0.5, efficiency)));

  const basis = `基于最近 30 天 ${recentSessions.length} 次练习、平均得分 ${Math.round(avgScore)}、${recentErrorCount} 个新错题估算。`;

  return {
    days: estimatedDays,
    weeks: estimatedWeeks,
    recommendedWeeklySessions,
    basis,
  };
}
