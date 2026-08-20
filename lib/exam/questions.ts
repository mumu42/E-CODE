/**
 * @file lib/exam/questions.ts
 * @description 模拟考试题库（按考试类型分类）
 * @author English Agent Team
 * @date 2026-08-11
 */

import type { ExamQuestion } from "@/lib/types";

/** 支持的考试类型 */
export type ExamType = "IELTS" | "TOEFL" | "CET4" | "CET6" | "GENERAL";

const EXAM_TYPE_TO_TARGET: Record<ExamType, string> = {
  IELTS: "IELTS_TOEFL",
  TOEFL: "IELTS_TOEFL",
  CET4: "CET",
  CET6: "CET",
  GENERAL: "GENERAL",
};

/** 考试类型配置 */
export interface ExamConfig {
  /** 考试标识 */
  type: ExamType;
  /** 显示名称 */
  label: string;
  /** 建议总时长（分钟） */
  duration: number;
  /** 题目数量上限 */
  questionCount: number;
  /** 分值权重（用于计算总分） */
  scorePerQuestion: number;
}

/** 考试类型列表 */
export const EXAM_CONFIGS: ExamConfig[] = [
  { type: "IELTS", label: "雅思模拟", duration: 60, questionCount: 20, scorePerQuestion: 5 },
  { type: "TOEFL", label: "托福模拟", duration: 60, questionCount: 20, scorePerQuestion: 5 },
  { type: "CET4", label: "大学英语四级", duration: 45, questionCount: 15, scorePerQuestion: 6.6 },
  { type: "CET6", label: "大学英语六级", duration: 45, questionCount: 15, scorePerQuestion: 6.6 },
  { type: "GENERAL", label: "综合练习", duration: 30, questionCount: 10, scorePerQuestion: 10 },
];

/** 共享的阅读/听力素材（示例） */
const PASSAGE_1 = `The history of the English language is traditionally divided into three periods: Old English, Middle English, and Modern English. Old English was brought to Britain by Anglo-Saxon settlers in the 5th century and was spoken until around 1150. During this period, English absorbed vocabulary from Latin and Old Norse.`;

/** 题库 */
const QUESTION_BANK: Record<ExamType, ExamQuestion[]> = {
  IELTS: [
    {
      id: "ielts-1",
      type: "reading",
      question: `According to the passage, Old English was brought to Britain by whom?`,
      options: ["Romans", "Anglo-Saxon settlers", "Vikings", "Normans"],
      answer: "Anglo-Saxon settlers",
      explanation: "The passage states that Old English was brought to Britain by Anglo-Saxon settlers.",
      score: 5,
      passage: PASSAGE_1,
    },
    {
      id: "ielts-2",
      type: "listening",
      question: "Choose the word that best completes the sentence: She managed to _____ her fear and give the speech.",
      options: ["overcome", "undergo", "undertake", "overtake"],
      answer: "overcome",
      explanation: "'Overcome' means to successfully defeat or deal with a feeling or problem.",
      score: 5,
    },
    {
      id: "ielts-3",
      type: "reading",
      question: "Which of the following is NOT mentioned as influencing Old English vocabulary?",
      options: ["Latin", "Old Norse", "French", "Germanic languages"],
      answer: "French",
      explanation: "The passage mentions Latin and Old Norse, not French.",
      score: 5,
      passage: PASSAGE_1,
    },
  ],
  TOEFL: [
    {
      id: "toefl-1",
      type: "listening",
      question: "Listen to the conversation. What does the woman imply about the lecture?",
      options: ["It was too short.", "It was confusing.", "It was excellent.", "It was cancelled."],
      answer: "It was confusing.",
      explanation: "The woman implies the lecture was hard to follow.",
      score: 5,
    },
    {
      id: "toefl-2",
      type: "reading",
      question: "The word 'ubiquitous' in the passage is closest in meaning to:",
      options: ["rare", "everywhere", "expensive", "complex"],
      answer: "everywhere",
      explanation: "'Ubiquitous' means present, appearing, or found everywhere.",
      score: 5,
      passage: "Smartphones have become ubiquitous in modern society.",
    },
  ],
  CET4: [
    {
      id: "cet4-1",
      type: "reading",
      question: "The word 'abandon' in the sentence means:",
      options: ["放弃", "坚持", "珍惜", "寻找"],
      answer: "放弃",
      explanation: "'Abandon' 表示放弃、遗弃。",
      score: 6.6,
    },
    {
      id: "cet4-2",
      type: "listening",
      question: "What will the man probably do next?",
      options: ["Go to the library.", "Finish his homework.", "Take a nap.", "Go shopping."],
      answer: "Go to the library.",
      explanation: "The conversation suggests he needs to borrow some books.",
      score: 6.6,
    },
  ],
  CET6: [
    {
      id: "cet6-1",
      type: "reading",
      question: "The professor's argument is based on the assumption that:",
      options: ["students prefer online classes", "data is reliable", "funding will increase", "technology is neutral"],
      answer: "data is reliable",
      explanation: "The argument depends on the reliability of the data.",
      score: 6.6,
      passage: "Recent studies suggest that blended learning improves retention rates.",
    },
  ],
  GENERAL: [
    {
      id: "general-1",
      type: "reading",
      question: "Choose the correct form: By the time we arrived, the movie _____.",
      options: ["starts", "started", "had started", "has started"],
      answer: "had started",
      explanation: "Use the past perfect for an action completed before another past action.",
      score: 10,
    },
  ],
};

/** 写作/口语题模板（每种考试一个示例） */
const PRODUCTIVE_TEMPLATES: Record<ExamType, { writing: ExamQuestion; speaking: ExamQuestion }> = {
  IELTS: {
    writing: {
      id: "ielts-writing",
      type: "writing",
      question: "Some people think that the best way to reduce crime is to give longer prison sentences. To what extent do you agree or disagree?",
      score: 20,
      timeLimit: 20,
    },
    speaking: {
      id: "ielts-speaking",
      type: "speaking",
      question: "Describe a memorable journey you have taken. You should say: where you went, who you were with, and why it was memorable.",
      score: 20,
      timeLimit: 5,
    },
  },
  TOEFL: {
    writing: {
      id: "toefl-writing",
      type: "writing",
      question: "Do you agree or disagree with the following statement? It is better to work in a team than to work independently. Use specific reasons and examples to support your answer.",
      score: 20,
      timeLimit: 20,
    },
    speaking: {
      id: "toefl-speaking",
      type: "speaking",
      question: "Talk about a skill you would like to learn in the future. Explain why you want to learn it.",
      score: 20,
      timeLimit: 5,
    },
  },
  CET4: {
    writing: {
      id: "cet4-writing",
      type: "writing",
      question: "请以‘The Importance of Reading’为题，写一篇120词左右的短文。",
      score: 20,
      timeLimit: 20,
    },
    speaking: {
      id: "cet4-speaking",
      type: "speaking",
      question: "Introduce your hometown in one minute.",
      score: 10,
      timeLimit: 3,
    },
  },
  CET6: {
    writing: {
      id: "cet6-writing",
      type: "writing",
      question: "Write an essay on the topic: The impact of artificial intelligence on employment. Word count: 150-200.",
      score: 20,
      timeLimit: 20,
    },
    speaking: {
      id: "cet6-speaking",
      type: "speaking",
      question: "Give a one-minute talk on how technology has changed the way people communicate.",
      score: 10,
      timeLimit: 3,
    },
  },
  GENERAL: {
    writing: {
      id: "general-writing",
      type: "writing",
      question: "Write a short paragraph about your weekend plans. (50-80 words)",
      score: 20,
      timeLimit: 10,
    },
    speaking: {
      id: "general-speaking",
      type: "speaking",
      question: "Describe your favorite hobby and why you enjoy it.",
      score: 10,
      timeLimit: 3,
    },
  },
};

/**
 * 根据考试类型生成指定数量的题目
 * @param type - 考试类型
 * @param count - 题目数量
 * @param customQuestions - 用户导入的自定义题库（可选）
 * @returns 题目列表
 */
export function generateExamQuestions(
  type: ExamType,
  count: number,
  customQuestions: ExamQuestion[] = []
): ExamQuestion[] {
  // 筛选与当前考试类型匹配的自定义题目
  const targetKeyword = EXAM_TYPE_TO_TARGET[type];
  const matchedCustom = customQuestions.filter(
    (q) =>
      !q.target ||
      q.target === targetKeyword ||
      (type === "GENERAL" && !q.target)
  );

  const objectiveCustom = matchedCustom.filter(
    (q) => q.type === "reading" || q.type === "listening"
  );
  const productiveCustom = matchedCustom.filter(
    (q) => q.type === "writing" || q.type === "speaking"
  );

  const objectiveBuiltIn = [...(QUESTION_BANK[type] ?? [])];
  while (objectiveBuiltIn.length < count) {
    objectiveBuiltIn.push(...objectiveBuiltIn);
  }

  // 优先使用自定义题目，不足时从内置题库补足
  const objective: ExamQuestion[] = [];
  for (let i = 0; i < count; i++) {
    if (objectiveCustom.length > 0) {
      const [q] = objectiveCustom.splice(
        Math.floor(Math.random() * objectiveCustom.length),
        1
      );
      objective.push(q);
    } else {
      objective.push(objectiveBuiltIn[i % objectiveBuiltIn.length]);
    }
  }

  const { writing, speaking } =
    PRODUCTIVE_TEMPLATES[type] ?? PRODUCTIVE_TEMPLATES.GENERAL;

  // 如果有自定义写作/口语题，替换默认模板
  const writingQuestion =
    productiveCustom.find((q) => q.type === "writing") ?? writing;
  const speakingQuestion =
    productiveCustom.find((q) => q.type === "speaking") ?? speaking;

  return [...objective, writingQuestion, speakingQuestion];
}
