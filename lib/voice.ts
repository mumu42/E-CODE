/**
 * @file lib/voice.ts
 * @description 语音对话辅助：发音评估、置信度分析、文本相似度
 * @author English Agent Team
 * @date 2026-08-25
 */

import { calculateSimilarity } from "./tts";

/** 单词级别的发音评估 */
export interface WordPronunciation {
  /** 单词 */
  word: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 是否被标记为低置信度 */
  isLowConfidence: boolean;
}

/** 发音评估结果 */
export interface PronunciationAssessment {
  /** 用户实际说出的文本 */
  transcript: string;
  /** 整体相似度 0-100 */
  similarity: number;
  /** 按单词拆分的发音评估 */
  words: WordPronunciation[];
  /** 低置信度单词数量 */
  lowConfidenceCount: number;
}

/** 低置信度阈值 */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

/**
 * 比较用户发音与期望文本的相似度
 * @param expected - 期望文本
 * @param actual - 用户实际说出的文本
 * @returns 相似度分数 0-100
 */
export function comparePronunciation(expected: string, actual: string): number {
  return calculateSimilarity(expected, actual);
}

/**
 * 将单词置信度列表标记为低置信度
 * @param words - 单词置信度列表
 * @returns 带标记的单词列表
 */
export function markLowConfidenceWords(
  words: { word: string; confidence: number }[]
): WordPronunciation[] {
  return words.map((w) => ({
    word: w.word,
    confidence: w.confidence,
    isLowConfidence: w.confidence < LOW_CONFIDENCE_THRESHOLD,
  }));
}

/**
 * 评估一段语音识别结果的发音情况
 * @param transcript - 识别文本
 * @param wordConfidences - 单词置信度列表
 * @param expectedText - 可选的期望文本，用于计算整体相似度
 */
export function assessPronunciation(
  transcript: string,
  wordConfidences: { word: string; confidence: number }[] = [],
  expectedText?: string
): PronunciationAssessment {
  const words = markLowConfidenceWords(wordConfidences);
  const similarity = expectedText
    ? comparePronunciation(expectedText, transcript)
    : 0;

  return {
    transcript,
    similarity,
    words,
    lowConfidenceCount: words.filter((w) => w.isLowConfidence).length,
  };
}
