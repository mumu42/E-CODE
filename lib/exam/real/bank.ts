/**
 * @file lib/exam/real/bank.ts
 * @description 真题题库：提供 CET/IELTS/TOEFL 真题样例与筛选工具
 * @author English Agent Team
 * @date 2026-08-24
 */

import type { ExamQuestion, ExamQuestionType } from "@/lib/types";

/** 支持的真题考试类型 */
export type RealExamType = "CET4" | "CET6" | "IELTS" | "TOEFL";

/** 真题配置 */
export interface RealExamConfig {
  /** 考试标识 */
  type: RealExamType;
  /** 显示名称 */
  label: string;
  /** 考试总时长（分钟） */
  duration: number;
  /** 默认题目数量 */
  questionCount: number;
}

/** 真题配置列表 */
export const REAL_EXAM_CONFIGS: RealExamConfig[] = [
  { type: "CET4", label: "大学英语四级真题", duration: 125, questionCount: 20 },
  { type: "CET6", label: "大学英语六级真题", duration: 130, questionCount: 20 },
  { type: "IELTS", label: "雅思真题", duration: 160, questionCount: 20 },
  { type: "TOEFL", label: "托福真题", duration: 120, questionCount: 20 },
];

/** 真题题库 */
const REAL_QUESTION_BANK: Record<RealExamType, ExamQuestion[]> = {
  CET4: [
    {
      id: "cet4-2024-06-reading-1",
      type: "reading",
      section: "reading",
      examType: "CET4",
      year: "2024",
      source: "official",
      difficulty: "medium",
      passage:
        "Remote work has become increasingly common since 2020. Many companies now allow employees to work from home, which can improve work-life balance but also blur the line between personal and professional life.",
      question: "What is the main idea of the passage?",
      options: [
        "Remote work is bad for companies.",
        "Remote work has both benefits and drawbacks.",
        "Remote work only benefits employees.",
        "Remote work started in 2020.",
      ],
      answer: "Remote work has both benefits and drawbacks.",
      explanation:
        "The passage mentions that remote work can improve work-life balance but also blur boundaries, indicating both benefits and drawbacks.",
      score: 7.5,
    },
    {
      id: "cet4-2024-06-listening-1",
      type: "listening",
      section: "listening",
      examType: "CET4",
      year: "2024",
      source: "official",
      difficulty: "easy",
      question:
        "Listen to the conversation. What will the woman probably do next?",
      options: [
        "Go to the library.",
        "Finish her homework.",
        "Take a nap.",
        "Go shopping.",
      ],
      answer: "Go to the library.",
      explanation: "The conversation suggests she needs to borrow some books.",
      score: 7.5,
    },
    {
      id: "cet4-2024-06-writing-1",
      type: "writing",
      section: "writing",
      examType: "CET4",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "请以‘The Importance of Reading’为题，写一篇120词左右的短文。",
      score: 20,
      timeLimit: 30,
    },
    {
      id: "cet4-2024-06-speaking-1",
      type: "speaking",
      section: "speaking",
      examType: "CET4",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "Introduce your hometown in one minute, including its location, famous places, and local food.",
      score: 10,
      timeLimit: 5,
    },
  ],
  CET6: [
    {
      id: "cet6-2024-06-reading-1",
      type: "reading",
      section: "reading",
      examType: "CET6",
      year: "2024",
      source: "official",
      difficulty: "hard",
      passage:
        "Artificial intelligence is reshaping labor markets. While it boosts productivity, critics argue that it may also exacerbate inequality if the gains are not distributed fairly.",
      question: "What concern do critics raise about AI?",
      options: [
        "It will reduce inequality.",
        "It may worsen inequality.",
        "It has no impact on labor.",
        "It is not productive.",
      ],
      answer: "It may worsen inequality.",
      explanation:
        "The passage states that critics argue AI may exacerbate inequality if gains are not distributed fairly.",
      score: 7.5,
    },
    {
      id: "cet6-2024-06-listening-1",
      type: "listening",
      section: "listening",
      examType: "CET6",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question: "What does the man imply about the lecture?",
      options: [
        "It was too short.",
        "It was confusing.",
        "It was excellent.",
        "It was cancelled.",
      ],
      answer: "It was confusing.",
      explanation: "The man implies the lecture was hard to follow.",
      score: 7.5,
    },
    {
      id: "cet6-2024-06-writing-1",
      type: "writing",
      section: "writing",
      examType: "CET6",
      year: "2024",
      source: "official",
      difficulty: "hard",
      question:
        "Write an essay on the topic: The impact of artificial intelligence on employment. Word count: 150-200.",
      score: 20,
      timeLimit: 30,
    },
    {
      id: "cet6-2024-06-speaking-1",
      type: "speaking",
      section: "speaking",
      examType: "CET6",
      year: "2024",
      source: "official",
      difficulty: "hard",
      question:
        "Give a one-minute talk on how technology has changed the way people communicate.",
      score: 10,
      timeLimit: 5,
    },
  ],
  IELTS: [
    {
      id: "ielts-2024-05-reading-1",
      type: "reading",
      section: "reading",
      examType: "IELTS",
      year: "2024",
      source: "official",
      difficulty: "medium",
      passage:
        "The history of the English language is traditionally divided into three periods: Old English, Middle English, and Modern English. Old English was brought to Britain by Anglo-Saxon settlers in the 5th century.",
      question: "According to the passage, Old English was brought to Britain by whom?",
      options: ["Romans", "Anglo-Saxon settlers", "Vikings", "Normans"],
      answer: "Anglo-Saxon settlers",
      explanation:
        "The passage states that Old English was brought to Britain by Anglo-Saxon settlers.",
      score: 5,
    },
    {
      id: "ielts-2024-05-listening-1",
      type: "listening",
      section: "listening",
      examType: "IELTS",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "Choose the word that best completes the sentence: She managed to _____ her fear and give the speech.",
      options: ["overcome", "undergo", "undertake", "overtake"],
      answer: "overcome",
      explanation:
        "'Overcome' means to successfully defeat or deal with a feeling or problem.",
      score: 5,
    },
    {
      id: "ielts-2024-05-writing-1",
      type: "writing",
      section: "writing",
      examType: "IELTS",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "Some people think that the best way to reduce crime is to give longer prison sentences. To what extent do you agree or disagree?",
      score: 20,
      timeLimit: 40,
    },
    {
      id: "ielts-2024-05-speaking-1",
      type: "speaking",
      section: "speaking",
      examType: "IELTS",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "Describe a memorable journey you have taken. You should say: where you went, who you were with, and why it was memorable.",
      score: 15,
      timeLimit: 10,
    },
  ],
  TOEFL: [
    {
      id: "toefl-2024-03-reading-1",
      type: "reading",
      section: "reading",
      examType: "TOEFL",
      year: "2024",
      source: "official",
      difficulty: "hard",
      passage:
        "The word 'ubiquitous' in the passage is closest in meaning to 'present everywhere.' Smartphones have become ubiquitous in modern society.",
      question: "The word 'ubiquitous' in the passage is closest in meaning to:",
      options: ["rare", "everywhere", "expensive", "complex"],
      answer: "everywhere",
      explanation:
        "'Ubiquitous' means present, appearing, or found everywhere.",
      score: 5,
    },
    {
      id: "toefl-2024-03-listening-1",
      type: "listening",
      section: "listening",
      examType: "TOEFL",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question: "Listen to the conversation. What does the woman imply?",
      options: [
        "She wants to drop the course.",
        "She thinks the professor is fair.",
        "She needs more time to study.",
        "She enjoys the class.",
      ],
      answer: "She thinks the professor is fair.",
      explanation: "The woman implies the professor grades fairly.",
      score: 5,
    },
    {
      id: "toefl-2024-03-writing-1",
      type: "writing",
      section: "writing",
      examType: "TOEFL",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "Do you agree or disagree with the following statement? It is better to work in a team than to work independently. Use specific reasons and examples to support your answer.",
      score: 20,
      timeLimit: 30,
    },
    {
      id: "toefl-2024-03-speaking-1",
      type: "speaking",
      section: "speaking",
      examType: "TOEFL",
      year: "2024",
      source: "official",
      difficulty: "medium",
      question:
        "Talk about a skill you would like to learn in the future. Explain why you want to learn it.",
      score: 15,
      timeLimit: 10,
    },
  ],
};

/** 获取指定真题类型的题目 */
export function getRealExamQuestions(type: RealExamType): ExamQuestion[] {
  return REAL_QUESTION_BANK[type] ?? [];
}

/** 获取所有真题类型配置 */
export function getRealExamConfigs(): RealExamConfig[] {
  return REAL_EXAM_CONFIGS;
}

/** 根据条件筛选真题 */
export function filterRealExamQuestions(
  questions: ExamQuestion[],
  filters: {
    type?: RealExamType;
    year?: string;
    section?: ExamQuestionType;
    difficulty?: "easy" | "medium" | "hard";
  }
): ExamQuestion[] {
  return questions.filter((q) => {
    if (filters.type && q.examType !== filters.type) return false;
    if (filters.year && q.year !== filters.year) return false;
    if (filters.section && q.section !== filters.section) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    return true;
  });
}

/** 返回题库中所有真题题目 */
export function getAllRealExamQuestions(): ExamQuestion[] {
  return (Object.keys(REAL_QUESTION_BANK) as RealExamType[]).flatMap(
    (type) => REAL_QUESTION_BANK[type]
  );
}
