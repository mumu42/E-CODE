/**
 * @file lib/exam/prediction.ts
 * @description 基于历史练习/模考数据预测目标考试分数
 * @author English Agent Team
 * @date 2026-08-24
 */

import type { ExamRecord, ReadingRecord, ListeningItem, PracticeRecord } from "@/lib/types";

/** 预测结果 */
export interface PredictedScore {
  /** 预测总分（0-100） */
  score: number;
  /** 各分项预测得分 */
  sectionScores: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
  };
  /** 预测依据说明 */
  basis: string;
}

/** 计算数组平均值 */
function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * 基于历史数据预测目标考试分数
 * @param examRecords - 模考记录
 * @param readingRecords - 阅读练习记录
 * @param listeningRecords - 听力练习记录
 * @param sessions - 口语/写作练习记录
 * @returns 预测分数
 */
export function predictExamScore(
  examRecords: ExamRecord[],
  readingRecords: ReadingRecord[],
  listeningRecords: ListeningItem[],
  sessions: PracticeRecord[]
): PredictedScore {
  const speakingSessions = sessions.filter((s) => s.type === "SPEAK");
  const writingSessions = sessions.filter((s) => s.type === "WRITE");

  // 优先使用模考记录中的分项得分
  const readingScores: number[] = [];
  const listeningScores: number[] = [];
  const writingScores: number[] = [];
  const speakingScores: number[] = [];

  for (const record of examRecords) {
    if (record.sectionScores) {
      if (record.sectionScores.reading !== undefined) readingScores.push(record.sectionScores.reading);
      if (record.sectionScores.listening !== undefined) listeningScores.push(record.sectionScores.listening);
      if (record.sectionScores.writing !== undefined) writingScores.push(record.sectionScores.writing);
      if (record.sectionScores.speaking !== undefined) speakingScores.push(record.sectionScores.speaking);
    }
  }

  // 没有模考分项得分时，用练习记录补充
  if (readingScores.length === 0) {
    readingScores.push(...readingRecords.map((r) => r.score));
  }
  if (listeningScores.length === 0) {
    listeningScores.push(...listeningRecords.map((l) => l.score));
  }
  if (writingScores.length === 0) {
    writingScores.push(...writingSessions.map((s) => s.fluencyScore ?? 0));
  }
  if (speakingScores.length === 0) {
    speakingScores.push(...speakingSessions.map((s) => s.fluencyScore ?? 0));
  }

  const sectionScores = {
    reading: average(readingScores),
    listening: average(listeningScores),
    writing: average(writingScores),
    speaking: average(speakingScores),
  };

  const total = Object.values(sectionScores).reduce((a, b) => a + b, 0);
  const count = Object.values(sectionScores).filter((s) => s > 0).length || 1;
  const score = Math.round(total / count);

  const basis = `基于 ${examRecords.length} 次模考、${readingRecords.length} 次阅读、${listeningRecords.length} 次听力、${writingSessions.length} 次写作、${speakingSessions.length} 次口语记录预测`;

  return { score, sectionScores, basis };
}
