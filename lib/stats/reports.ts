/**
 * @file lib/stats/reports.ts
 * @description 学习周报/月报生成工具
 * @author English Agent Team
 * @date 2026-08-24
 */

import type { PracticeRecord, ErrorItem, ExamRecord, VocabularyItem } from "@/lib/types";

/** 报告类型 */
export type ReportPeriod = "week" | "month";

/** 学习报告数据 */
export interface LearningReport {
  /** 报告类型 */
  type: ReportPeriod;
  /** 报告起始日期 */
  startDate: string;
  /** 报告结束日期 */
  endDate: string;
  /** 练习次数 */
  sessionCount: number;
  /** 平均得分 */
  averageScore: number;
  /** 新增错题数 */
  newErrors: number;
  /** 新增词汇数 */
  newVocabulary: number;
  /** 打卡天数 */
  checkInDays: number;
  /** 模考次数 */
  examCount: number;
  /** 平均模考得分 */
  averageExamScore: number;
  /** 按类型统计练习次数 */
  sessionsByType: Record<string, number>;
}

/**
 * 获取报告周期
 * @param type - 报告类型
 * @param referenceDate - 参考日期，默认今天
 * @returns 起止日期字符串
 */
export function getReportPeriod(
  type: ReportPeriod,
  referenceDate: Date = new Date()
): { startDate: string; endDate: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const date = referenceDate.getDate();
  const day = referenceDate.getDay();

  let start: Date;
  let end: Date;

  if (type === "week") {
    const diffToMonday = (day + 6) % 7;
    start = new Date(year, month, date - diffToMonday);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    start = new Date(year, month, 1);
    end = new Date(year, month + 1, 0);
  }

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function withinPeriod(dateStr: string, startDate: string, endDate: string): boolean {
  const d = dateStr.split("T")[0];
  return d >= startDate && d <= endDate;
}

function calculateAverageSessionScore(sessions: PracticeRecord[]): number {
  if (sessions.length === 0) return 0;
  const total = sessions.reduce(
    (sum, s) => sum + (s.fluencyScore || s.grammarScore || 0),
    0
  );
  return Math.round(total / sessions.length);
}

function calculateAverageExamScore(exams: ExamRecord[]): number {
  if (exams.length === 0) return 0;
  const total = exams.reduce((sum, e) => sum + (e.score / Math.max(1, e.totalScore)) * 100, 0);
  return Math.round(total / exams.length);
}

/**
 * 构建学习周报
 * @param sessions - 练习记录
 * @param errors - 错题记录
 * @param examRecords - 模考记录
 * @param vocabulary - 词汇本
 * @param checkIns - 打卡日期
 * @param referenceDate - 参考日期
 * @returns 周报数据
 */
export function buildWeeklyReport(
  sessions: PracticeRecord[],
  errors: ErrorItem[],
  examRecords: ExamRecord[],
  vocabulary: VocabularyItem[],
  checkIns: string[],
  referenceDate: Date = new Date()
): LearningReport {
  const { startDate, endDate } = getReportPeriod("week", referenceDate);

  const periodSessions = sessions.filter((s) => withinPeriod(s.date, startDate, endDate));
  const periodErrors = errors.filter((e) => withinPeriod(e.date, startDate, endDate));
  const periodExams = examRecords.filter((e) => withinPeriod(e.startedAt, startDate, endDate));
  const periodVocabulary = vocabulary.filter((v) => withinPeriod(v.createdAt, startDate, endDate));

  const sessionsByType: Record<string, number> = {};
  periodSessions.forEach((s) => {
    sessionsByType[s.type] = (sessionsByType[s.type] || 0) + 1;
  });

  const checkInDays = checkIns.filter((d) => withinPeriod(d, startDate, endDate)).length;

  return {
    type: "week",
    startDate,
    endDate,
    sessionCount: periodSessions.length,
    averageScore: calculateAverageSessionScore(periodSessions),
    newErrors: periodErrors.length,
    newVocabulary: periodVocabulary.length,
    checkInDays,
    examCount: periodExams.length,
    averageExamScore: calculateAverageExamScore(periodExams),
    sessionsByType,
  };
}

/**
 * 构建学习月报
 * @param sessions - 练习记录
 * @param errors - 错题记录
 * @param examRecords - 模考记录
 * @param vocabulary - 词汇本
 * @param checkIns - 打卡日期
 * @param referenceDate - 参考日期
 * @returns 月报数据
 */
export function buildMonthlyReport(
  sessions: PracticeRecord[],
  errors: ErrorItem[],
  examRecords: ExamRecord[],
  vocabulary: VocabularyItem[],
  checkIns: string[],
  referenceDate: Date = new Date()
): LearningReport {
  const { startDate, endDate } = getReportPeriod("month", referenceDate);

  const periodSessions = sessions.filter((s) => withinPeriod(s.date, startDate, endDate));
  const periodErrors = errors.filter((e) => withinPeriod(e.date, startDate, endDate));
  const periodExams = examRecords.filter((e) => withinPeriod(e.startedAt, startDate, endDate));
  const periodVocabulary = vocabulary.filter((v) => withinPeriod(v.createdAt, startDate, endDate));

  const sessionsByType: Record<string, number> = {};
  periodSessions.forEach((s) => {
    sessionsByType[s.type] = (sessionsByType[s.type] || 0) + 1;
  });

  const checkInDays = checkIns.filter((d) => withinPeriod(d, startDate, endDate)).length;

  return {
    type: "month",
    startDate,
    endDate,
    sessionCount: periodSessions.length,
    averageScore: calculateAverageSessionScore(periodSessions),
    newErrors: periodErrors.length,
    newVocabulary: periodVocabulary.length,
    checkInDays,
    examCount: periodExams.length,
    averageExamScore: calculateAverageExamScore(periodExams),
    sessionsByType,
  };
}
