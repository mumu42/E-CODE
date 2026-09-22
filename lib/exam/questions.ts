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

const PASSAGE_2 = `Climate change is one of the most pressing issues of our time. Rising global temperatures have led to more frequent extreme weather events, melting polar ice caps, and rising sea levels. Scientists warn that without immediate action, the consequences could be catastrophic.`;

const PASSAGE_3 = `The internet has revolutionized the way we communicate, work, and access information. Social media platforms connect people across the globe, while e-commerce has transformed shopping habits. However, concerns about privacy and misinformation continue to grow.`;

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
    {
      id: "ielts-4",
      type: "reading",
      question: "What is the author's main concern about climate change according to the passage?",
      options: ["It is too late to take action.", "Immediate action is needed to avoid catastrophe.", "Only governments can solve the problem.", "The effects are only temporary."],
      answer: "Immediate action is needed to avoid catastrophe.",
      explanation: "The passage warns that without immediate action, consequences could be catastrophic.",
      score: 5,
      passage: PASSAGE_2,
    },
    {
      id: "ielts-5",
      type: "listening",
      question: "What does the speaker imply about social media?",
      options: ["It has only positive effects.", "It has both benefits and drawbacks.", "It should be banned.", "It is losing popularity."],
      answer: "It has both benefits and drawbacks.",
      explanation: "The passage mentions both the connecting power of social media and concerns about privacy and misinformation.",
      score: 5,
      passage: PASSAGE_3,
    },
    {
      id: "ielts-6",
      type: "reading",
      question: "According to the passage, what has the internet changed?",
      options: ["Only shopping habits", "Communication, work, and access to information", "Only social interactions", "Only entertainment"],
      answer: "Communication, work, and access to information",
      explanation: "The passage states the internet revolutionized how we communicate, work, and access information.",
      score: 5,
      passage: PASSAGE_3,
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
    {
      id: "toefl-3",
      type: "reading",
      question: "What is one negative aspect of the internet mentioned in the passage?",
      options: ["It is too expensive.", "Concerns about privacy and misinformation.", "It is difficult to use.", "It reduces productivity."],
      answer: "Concerns about privacy and misinformation.",
      explanation: "The passage mentions growing concerns about privacy and misinformation.",
      score: 5,
      passage: PASSAGE_3,
    },
    {
      id: "toefl-4",
      type: "listening",
      question: "Which word is closest in meaning to 'catastrophic' as used in the passage?",
      options: ["Minor", "Disastrous", "Beneficial", "Gradual"],
      answer: "Disastrous",
      explanation: "The passage warns of catastrophic consequences, meaning disastrous or extremely harmful.",
      score: 5,
      passage: PASSAGE_2,
    },
    {
      id: "toefl-5",
      type: "reading",
      question: "What does the passage say about rising global temperatures?",
      options: ["They have no significant impact.", "They have led to more extreme weather events.", "They are decreasing.", "They only affect polar regions."],
      answer: "They have led to more extreme weather events.",
      explanation: "The passage states rising global temperatures have led to more frequent extreme weather events.",
      score: 5,
      passage: PASSAGE_2,
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
    {
      id: "cet4-3",
      type: "reading",
      question: "根据文章，互联网主要改变了什么？",
      options: ["购物方式", "沟通、工作和获取信息的方式", "娱乐方式", "交通方式"],
      answer: "沟通、工作和获取信息的方式",
      explanation: "文章指出互联网革命性地改变了通信、工作和信息获取方式。",
      score: 6.6,
      passage: PASSAGE_3,
    },
    {
      id: "cet4-4",
      type: "listening",
      question: "What does 'ubiquitous' most likely mean?",
      options: ["罕见的", "无处不在的", "昂贵的", "复杂的"],
      answer: "无处不在的",
      explanation: "'Ubiquitous' 意为普遍存在的、无处不在的。",
      score: 6.6,
    },
    {
      id: "cet4-5",
      type: "reading",
      question: "作者对气候变化的建议是什么？",
      options: ["等待技术解决", "立即采取行动", "忽略问题", "仅减少碳排放"],
      answer: "立即采取行动",
      explanation: "文章表明没有立即行动可能导致灾难性后果。",
      score: 6.6,
      passage: PASSAGE_2,
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
    {
      id: "cet6-2",
      type: "listening",
      question: "What does the speaker suggest about the impact of the internet?",
      options: ["It has only positive effects on society.", "It comes with both opportunities and risks.", "It is primarily used for entertainment.", "It has replaced traditional education."],
      answer: "It comes with both opportunities and risks.",
      explanation: "The speaker mentions both the transformative power of the internet and concerns about privacy.",
      score: 6.6,
      passage: PASSAGE_3,
    },
    {
      id: "cet6-3",
      type: "reading",
      question: "Which of the following is mentioned as a consequence of climate change?",
      options: ["Decreased rainfall", "Melting polar ice caps", "Lower temperatures", "Reduced biodiversity only"],
      answer: "Melting polar ice caps",
      explanation: "The passage mentions melting polar ice caps as one consequence of rising global temperatures.",
      score: 6.6,
      passage: PASSAGE_2,
    },
    {
      id: "cet6-4",
      type: "reading",
      question: "The word 'revolutionized' in the passage is closest in meaning to:",
      options: ["slightly improved", "completely transformed", "slowly changed", "negatively affected"],
      answer: "completely transformed",
      explanation: "'Revolutionized' means to completely and fundamentally change something.",
      score: 6.6,
      passage: PASSAGE_3,
    },
    {
      id: "cet6-5",
      type: "listening",
      question: "What can be inferred about Old English from the passage?",
      options: ["It was exclusively spoken by Vikings.", "It was influenced by Latin and Old Norse.", "It was identical to Modern English.", "It disappeared in the 5th century."],
      answer: "It was influenced by Latin and Old Norse.",
      explanation: "The passage says Old English absorbed vocabulary from Latin and Old Norse.",
      score: 6.6,
      passage: PASSAGE_1,
    },
    {
      id: "cet6-6",
      type: "reading",
      question: "What is the author's tone toward the subject of climate change?",
      options: ["Optimistic", "Urgent", "Indifferent", "Skeptical"],
      answer: "Urgent",
      explanation: "The author emphasizes the need for immediate action, indicating an urgent tone.",
      score: 6.6,
      passage: PASSAGE_2,
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
    {
      id: "general-2",
      type: "reading",
      question: "Select the correct word: She _____ to the store every Sunday.",
      options: ["go", "goes", "going", "gone"],
      answer: "goes",
      explanation: "Third person singular present simple requires 'goes'.",
      score: 10,
    },
    {
      id: "general-3",
      type: "listening",
      question: "Choose the best response: 'Thank you for your help.'",
      options: ["No problem.", "Yes, please.", "I don't know.", "That's right."],
      answer: "No problem.",
      explanation: "'No problem' is a polite response to thanks.",
      score: 10,
    },
    {
      id: "general-4",
      type: "reading",
      question: "Which word is a synonym for 'happy'?",
      options: ["sad", "angry", "joyful", "tired"],
      answer: "joyful",
      explanation: "'Joyful' is a synonym for 'happy', meaning feeling joy or pleasure.",
      score: 10,
    },
    {
      id: "general-5",
      type: "listening",
      question: "What does 'break the ice' mean?",
      options: ["To freeze water", "To start a conversation", "To break something", "To feel cold"],
      answer: "To start a conversation",
      explanation: "'Break the ice' is an idiom meaning to initiate conversation in a social setting.",
      score: 10,
    },
    {
      id: "general-6",
      type: "reading",
      question: "Choose the correct preposition: She is interested _____ learning Spanish.",
      options: ["in", "on", "at", "for"],
      answer: "in",
      explanation: "The correct collocation is 'interested in'.",
      score: 10,
    },
    {
      id: "general-7",
      type: "reading",
      question: "Which sentence uses the present perfect correctly?",
      options: ["I have went to Paris.", "I have been to Paris.", "I have go to Paris.", "I have going to Paris."],
      answer: "I have been to Paris.",
      explanation: "'Have been' is the correct present perfect form of 'go' for experience.",
      score: 10,
    },
    {
      id: "general-8",
      type: "listening",
      question: "If someone says 'I'm under the weather', how do they feel?",
      options: ["Very happy", "A bit ill", "Extremely busy", "Quite angry"],
      answer: "A bit ill",
      explanation: "'Under the weather' is an idiom meaning feeling slightly ill.",
      score: 10,
    },
    {
      id: "general-9",
      type: "reading",
      question: "Choose the correct form: If it _____ tomorrow, we will stay home.",
      options: ["rains", "rained", "will rain", "is raining"],
      answer: "rains",
      explanation: "In first conditional sentences, use present simple in the if-clause.",
      score: 10,
    },
    {
      id: "general-10",
      type: "reading",
      question: "What does the passage say about social media?",
      options: ["It only has negative effects.", "It connects people globally.", "It is rarely used.", "It is the same as e-commerce."],
      answer: "It connects people globally.",
      explanation: "The passage states social media platforms connect people across the globe.",
      score: 10,
      passage: PASSAGE_3,
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
 * @returns 题目列表（保证唯一题干）
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

  const builtIn = QUESTION_BANK[type] ?? [];

  // 优先使用自定义题目，不足时从内置题库随机抽取（同一题不重复出现）
  const objective: ExamQuestion[] = [];
  const usedKeys = new Set<string>();

  function getKey(q: ExamQuestion): string {
    return `${q.type}:${q.question.trim().toLowerCase()}`;
  }

  // 从数组中随机取一个该轮未用过的题目，用完返回 null
  function pickUnique(source: ExamQuestion[]): ExamQuestion | null {
    // 只检查不登记，防止 filter 副作用
    const remaining = source.filter((q) => !usedKeys.has(getKey(q)));
    if (remaining.length === 0) return null;
    const picked = remaining[Math.floor(Math.random() * remaining.length)];
    // 只登记真正选中的题目
    usedKeys.add(getKey(picked));
    return picked;
  }

  // 第 1 轮：优先从自定义题库取唯一题，不足时从内置题库取
  for (let i = 0; i < count; i++) {
    // 优先用自定义
    if (objectiveCustom.length > 0) {
      const picked = pickUnique(objectiveCustom);
      if (picked) {
        objective.push(picked);
        continue;
      }
    }
    // 从内置题库随机取一个未用过的
    const picked = pickUnique(builtIn);
    if (picked) {
      objective.push(picked);
    }
  }

  // 第 2 轮：如果唯一题不够 count，从内置题库随机补足（可重复，但确保类型分布均匀）
  while (objective.length < count && builtIn.length > 0) {
    const fallback = builtIn[Math.floor(Math.random() * builtIn.length)];
    objective.push({ ...fallback, id: `${fallback.id}-r${objective.length}` });
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
