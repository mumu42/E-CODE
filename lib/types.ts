/**
 * @file lib/types.ts
 * @description 全站通用 TypeScript 类型定义
 * @author English Agent Team
 * @date 2026-08-07
 */

/** 学习目标 */
export type Target = "SCHOOL" | "STUDY_ABROAD" | "CET" | "IELTS_TOEFL";

/** 英语水平等级（CEFR） */
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** 练习类型 */
export type SessionType = "SPEAK" | "WRITE" | "CHAT";

/** 主题模式 */
export type ThemeMode = "light" | "dark" | "system";

/** 可自定义 Prompt 类型 */
export type PromptType = "speak" | "write" | "chat" | "plan" | "assessment" | "drill" | "summary" | "reading" | "listening" | "advisor" | "translation";

/** 自定义 Prompt 模板 */
export interface PromptSettings {
  /** 口语练习反馈 Prompt */
  speak: string;
  /** 写作批改反馈 PROMPT */
  write: string;
  /** AI 对话 Prompt */
  chat: string;
  /** 学习计划生成 Prompt */
  plan: string;
  /** 水平测评 Prompt */
  assessment: string;
  /** 薄弱点专项练习 Prompt */
  drill: string;
  /** 学习摘要 Prompt */
  summary: string;
  /** 阅读理解生成 Prompt */
  reading: string;
  /** 听力理解生成 Prompt */
  listening: string;
  /** AI 学习顾问 Prompt */
  advisor: string;
  /** 翻译与解析 Prompt */
  translation: string;
}

/** 学习提醒设置 */
export interface ReminderSettings {
  /** 是否开启每日提醒 */
  enabled: boolean;
  /** 提醒时间 HH:mm */
  time: string;
}

/** 键盘快捷键设置 */
export interface ShortcutSettings {
  /** 是否启用快捷键 */
  enabled: boolean;
}

/** 浏览器能力检测结果 */
export interface BrowserCapabilitiesSettings {
  /** 是否支持语音识别（SpeechRecognition） */
  speechRecognition: boolean;
  /** 是否支持语音合成（TTS） */
  tts: boolean;
  /** 是否支持麦克风输入 */
  microphone: boolean;
  /** 检测时间戳 */
  detectedAt?: number;
}

/** 应用设置 */
export interface AppSettings {
  /** 自定义 Prompt 模板 */
  prompts: PromptSettings;
  /** 学习提醒 */
  reminders: ReminderSettings;
  /** 键盘快捷键 */
  shortcuts: ShortcutSettings;
  /** 浏览器能力检测结果 */
  browserCapabilities?: BrowserCapabilitiesSettings;
}

/** 成就徽章 */
export interface Badge {
  /** 徽章 ID */
  id: string;
  /** 徽章标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 图标名称（Lucide icon name） */
  icon: string;
  /** 解锁时间 */
  unlockedAt: string;
}

/** 用户学习档案 */
export interface UserProfile {
  /** 用户唯一标识 */
  id: string;
  /** 邮箱（可选） */
  email?: string;
  /** 昵称（可选） */
  name?: string;
  /** 学习目标 */
  target: Target;
  /** 当前等级 */
  level: Level;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 水平测评记录 */
export interface AssessmentRecord {
  /** 记录 ID */
  id: string;
  /** 关联用户 ID */
  userId: string;
  /** 测评时间 */
  date: string;
  /** 测评时选择的目标 */
  target: Target;
  /** 各项能力得分 */
  scores: {
    /** 听力 */
    listening?: number;
    /** 口语 */
    speaking?: number;
    /** 阅读 */
    reading?: number;
    /** 写作 */
    writing?: number;
    /** 语法 */
    grammar?: number;
  };
  /** 测评结果等级 */
  level: Level;
}

/** 语法/表达错误项 */
export interface GrammarError {
  /** 错误 ID */
  id: string;
  /** 原始表达 */
  original: string;
  /** 修正后的表达 */
  correction: string;
  /** 错误说明 */
  explanation: string;
  /** 错误类型 */
  type: "grammar" | "vocabulary" | "spelling" | "structure" | "pronunciation" | "expression" | "translation";
}

/** 练习记录 */
export interface PracticeRecord {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 练习类型 */
  type: SessionType;
  /** 练习时间 */
  date: string;
  /** 练习话题 */
  topic: string;
  /** 场景描述 */
  scenario: string;
  /** 用户输入内容 */
  userInput: string;
  /** AI 反馈文本 */
  aiFeedback: string;
  /** 语法得分（可选） */
  grammarScore?: number;
  /** 流利度/综合得分（可选） */
  fluencyScore?: number;
  /** 错误列表（可选） */
  errors?: GrammarError[];
}

/** 应用全局数据 */
export interface AppData {
  /** 当前用户档案 */
  profile: UserProfile | null;
  /** 所有档案列表 */
  profiles: UserProfile[];
  /** 当前选中的档案 ID */
  currentProfileId: string | null;
  /** 每个档案的独立学习数据（非当前档案的快照） */
  profileData: Record<string, ProfileData>;
  /** 当前档案的学习数据（保持向后兼容） */
  assessments: AssessmentRecord[];
  sessions: PracticeRecord[];
  chatSessions: ChatSession[];
  topics: TopicRecord[];
  errors: ErrorItem[];
  examRecords: ExamRecord[];
  /** 模拟考试客观题错题列表 */
  examWrongQuestions: ExamWrongQuestion[];
  readingRecords: ReadingRecord[];
  listeningRecords: ListeningItem[];
  dictationRecords: DictationRecord[];
  /** AI 生成的学习计划 */
  learningPlan: LearningPlan | null;
  /** AI 学习画像 */
  learningProfile: LearningProfile | null;
  /** 自定义题库（按档案隔离） */
  customQuestions: ExamQuestion[];
  /** 自定义话题（按档案隔离） */
  customTopics: TopicRecord[];
  /** 学习打卡日期列表（按档案隔离） */
  checkIns: string[];
  /** 已解锁徽章（按档案隔离） */
  badges: Badge[];
  /** 词汇本（按档案隔离） */
  vocabulary: VocabularyItem[];
  /** 翻译练习记录（按档案隔离） */
  translationRecords: TranslationRecord[];
  /** 界面语言 */
  locale: "zh-CN" | "en-US";
  /** 主题偏好 */
  theme?: ThemeMode;
  /** 应用设置 */
  settings: AppSettings;
}

/** 单个档案下的学习数据 */
export interface ProfileData {
  /** 测评记录列表 */
  assessments: AssessmentRecord[];
  /** 练习记录列表 */
  sessions: PracticeRecord[];
  /** 对话会话列表 */
  chatSessions: ChatSession[];
  /** 话题记录列表 */
  topics: TopicRecord[];
  /** 错题记录列表 */
  errors: ErrorItem[];
  /** 模拟考试记录列表 */
  examRecords: ExamRecord[];
  /** 模拟考试客观题错题列表 */
  examWrongQuestions: ExamWrongQuestion[];
  /** 阅读理解练习记录列表 */
  readingRecords: ReadingRecord[];
  /** 听力理解练习记录列表 */
  listeningRecords: ListeningItem[];
  /** 听写练习记录列表 */
  dictationRecords: DictationRecord[];
  /** 学习计划 */
  learningPlan: LearningPlan | null;
  /** AI 学习画像 */
  learningProfile: LearningProfile | null;
  /** 自定义题库 */
  customQuestions: ExamQuestion[];
  /** 自定义话题 */
  customTopics: TopicRecord[];
  /** 学习打卡日期列表 */
  checkIns: string[];
  /** 已解锁徽章 */
  badges: Badge[];
  /** 词汇本 */
  vocabulary: VocabularyItem[];
  /** 翻译练习记录 */
  translationRecords: TranslationRecord[];
  /** 应用设置 */
  settings: AppSettings;
}

/** 词汇本条目 */
export interface VocabularyItem {
  /** 条目 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 单词或短语 */
  word: string;
  /** 释义 */
  meaning: string;
  /** 例句（可选） */
  example?: string;
  /** 来源 */
  source: "manual" | "error" | "import";
  /** 创建时间 */
  createdAt: string;
  /** 下次复习日期（SM-2） */
  nextReviewDate?: string;
  /** 复习间隔（天，SM-2） */
  interval?: number;
  /** 连续复习次数（SM-2） */
  repetitionCount?: number;
  /** 容易度因子（SM-2） */
  easeFactor?: number;
}

/** 单词查询结果（右键查词 AI 返回结构） */
export interface WordLookupResult {
  /** 查询的单词或短语 */
  word: string;
  /** 中文释义 */
  meaning: string;
  /** 词性（如 adj./v./n.） */
  partOfSpeech: string;
  /** 音标（可选） */
  phonetic?: string;
  /** 其他词性与释义（可选） */
  otherMeanings?: { partOfSpeech: string; meaning: string }[];
  /** 例句 */
  example: {
    /** 英文例句 */
    english: string;
    /** 中文翻译 */
    chinese: string;
  };
}

/** 翻译方向 */
export type TranslationDirection = "en2zh" | "zh2en";

/** 翻译模式 */
export type TranslationMode = "word" | "sentence";

/** 翻译练习模块分类 */
export type TranslationExerciseModule = "tense" | "daily" | "business" | "academic";

/** 翻译练习模块显示配置 */
export const TRANSLATION_MODULES: Record<TranslationExerciseModule, { label: string; description: string }> = {
  tense: { label: "时态", description: "一般现在时、过去时、将来时、完成时等时态练习" },
  daily: { label: "日常", description: "购物、问路、点餐、旅行等日常场景" },
  business: { label: "商务", description: "邮件、会议、谈判、简历等商务场景" },
  academic: { label: "学术", description: "论文、报告、演讲等学术场景" },
};

/** 单项翻译练习题目 */
export interface TranslationExerciseItem {
  /** 题目 ID */
  id: string;
  /** 中文原文（用户需翻译的内容） */
  sourceText: string;
  /** AI 参考英文译文 */
  referenceTranslation?: string;
  /** 用户英文翻译 */
  userTranslation?: string;
  /** AI 评分（0-100） */
  score?: number;
  /** 维度分 */
  dimensionScores?: { accuracy: number; fluency: number; completeness: number };
  /** 错误点列表 */
  errors?: TranslationErrorPoint[];
  /** AI 解析 */
  analysis?: TranslationAnalysis;
}

/** AI 解析结构（翻译模块返回） */
export interface TranslationAnalysis {
  /** 语法结构分析：句子成分、时态、语态、从句类型、核心句型拆解 */
  grammar: {
    /** 主干结构简述，如 "S + V + O + O" */
    structure: string;
    /** 时态/语态 */
    tense?: string;
    /** 从句/非谓语等关键语法点 */
    keyPoints?: string[];
  };
  /** 重点词组搭配：句中重点单词/短语的搭配、近义辨析、用法说明 */
  collocations: {
    /** 词/短语 */
    phrase: string;
    /** 搭配/用法说明 */
    usage: string;
    /** 近义辨析（可选） */
    synonyms?: string[];
  }[];
  /** 翻译技巧点拨：直译 vs 意译建议、中英表达差异、翻译难点 */
  tips: string[];
  /** 文化/语境注释：习语、文化背景、语体正式度 */
  cultureNotes: string[];
}

/** 翻译错误点（AI 自评纠错产生的单项错误） */
export interface TranslationErrorPoint {
  /** 原始片段 */
  original: string;
  /** 修正/参考译文片段 */
  correction: string;
  /** 错误说明 */
  explanation: string;
  /** 错误类型（统一为 translation） */
  errorType: "translation";
}

/** 翻译记录 */
export interface TranslationRecord {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 模式 */
  mode: TranslationMode;
  /** 方向 */
  direction: TranslationDirection;
  /** 练习日期 */
  date: string;
  /** 原文（练习模式下为首题原文，兼容旧单条模式） */
  sourceText?: string;
  /** 用户自译（兼容旧单条模式） */
  userTranslation?: string;
  /** AI 参考译文（兼容旧单条模式） */
  aiTranslation?: string;
  /** 评分（兼容旧单条模式） */
  score?: number;
  /** 维度分（兼容旧单条模式） */
  dimensionScores?: { accuracy: number; fluency: number; completeness: number };
  /** AI 解析（兼容旧单条模式） */
  analysis?: TranslationAnalysis;
  /** AI 发现翻译错误点列表（兼容旧单条模式） */
  errors?: TranslationErrorPoint[];
  /** 翻译练习模块（练习模式） */
  module?: TranslationExerciseModule;
  /** 批量练习题目列表（练习模式） */
  items?: TranslationExerciseItem[];
  /** 是否已沉淀为错题 */
  addedToReview: boolean;
}

/** 学习画像 */
export interface LearningProfile {
  /** 高频错误类型及示例 */
  commonErrors: { type: GrammarError["type"]; count: number; examples: string[] }[];
  /** 最近练习话题摘要 */
  recentTopics: string[];
  /** 强项与弱项 */
  strengthWeakness: { skill: string; status: "strong" | "weak" | "neutral" }[];
  /** 画像生成时间 */
  updatedAt: string;
}

/** 水平测评结果 */
export interface AssessmentResult {
  /** 推荐等级 */
  level: Level;
  /** 各项得分 */
  scores: AssessmentRecord["scores"];
  /** 评价文字 */
  feedback: string;
}

/** 口语练习反馈 */
export interface SpeakFeedback {
  /** 语法问题列表 */
  grammarIssues: string[];
  /** 更地道表达列表 */
  betterExpressions: string[];
  /** 发音提示列表 */
  pronunciationTips: string[];
  /** 综合评分 */
  score: number;
  /** AI 反馈 */
  feedback: string;
}

/** 写作题目 */
export interface WritingTopic {
  /** 标题 */
  title: string;
  /** 写作要求 */
  instructions: string;
  /** 建议词数 */
  wordLimit: number;
  /** 建议时长（分钟） */
  timeLimit: number;
}

/** 写作批改反馈 */
export interface WritingFeedback {
  /** 总分 */
  score: number;
  /** 语法得分 */
  grammarScore: number;
  /** 词汇/结构得分 */
  vocabularyScore: number;
  /** 结构得分 */
  structureScore: number;
  /** 语法错误列表 */
  errors: GrammarError[];
  /** 提升建议 */
  suggestions: string[];
  /** 改进版本 */
  improvedVersion: string;
  /** 整体评价 */
  feedback: string;
}

/** 聊天消息 */
export interface ChatMessage {
  /** 消息 ID */
  id: string;
  /** 消息角色 */
  role: "user" | "assistant";
  /** 消息内容 */
  content: string;
  /** AI 纠正点（可选） */
  corrections?: string[];
  /** AI 发音提示（可选） */
  pronunciationTips?: string[];
  /** AI 对用户上一条消息的完整修正句子（可选） */
  fullCorrection?: string;
  /** 消息时间戳 */
  timestamp: string;
}

/** 对话会话 */
export interface ChatSession {
  /** 会话 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 角色类型 */
  role: ChatRole;
  /** 场景描述（可选） */
  scenario?: string;
  /** 是否为语音对话模式（可选） */
  voiceMode?: boolean;
  /** 是否已生成过错题复习（可选） */
  reviewGenerated?: boolean;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 对话角色 */
export type ChatRole = "friend" | "interviewer" | "examiner" | "teacher" | "colleague";

/** 对话角色配置 */
export interface ChatRoleConfig {
  /** 角色值 */
  value: ChatRole;
  /** 显示名称 */
  label: string;
  /** 场景描述 */
  description: string;
}

/** 每日/历史话题记录 */
export interface TopicRecord {
  /** 话题 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 创建日期 */
  date: string;
  /** 学习目标 */
  target: Target;
  /** 当前等级 */
  level: Level;
  /** 话题文本 */
  topic: string;
  /** 场景描述 */
  scenario: string;
  /** 提示词列表 */
  hints: string[];
  /** 是否收藏 */
  favorite?: boolean;
  /** 来源：ai 为 AI 生成，custom 为用户自建 */
  source?: "ai" | "custom";
}

/** 错题记录 */
export interface ErrorItem {
  /** 错题 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 所属练习记录 ID */
  sessionId: string;
  /** 练习类型 */
  type: SessionType;
  /** 发生时间 */
  date: string;
  /** 原始表达 */
  original: string;
  /** 修正表达 */
  correction: string;
  /** 错误说明 */
  explanation: string;
  /** 错误类型 */
  errorType: GrammarError["type"];
  /** 是否已复习 */
  reviewed?: boolean;
  /** 下次复习日期（SM-2） */
  nextReviewDate?: string;
  /** 复习间隔（天，SM-2） */
  interval?: number;
  /** 连续复习次数（SM-2） */
  repetitionCount?: number;
  /** 容易度因子（SM-2） */
  easeFactor?: number;
  /** 原文上下文（阅读文章/听力原文等） */
  context?: string;
}

/** 薄弱点统计 */
export interface WeakPoint {
  /** 错误类型 */
  errorType: GrammarError["type"];
  /** 出现次数 */
  count: number;
  /** 示例列表 */
  examples: string[];
}

/** 专项练习题 */
export interface DrillQuestion {
  /** 题目 */
  question: string;
  /** 选项列表 */
  options: string[];
  /** 正确答案 */
  answer: string;
  /** 解析 */
  explanation: string;
}

/** 学习计划任务 */
export interface PlanTask {
  /** 任务 ID */
  id: string;
  /** 任务标题 */
  title: string;
  /** 任务类型 */
  type: "speak" | "write" | "chat" | "review" | "exam";
  /** 预计时长（分钟） */
  duration: number;
  /** 是否已完成 */
  completed: boolean;
  /** 建议日期 */
  date: string;
}

/** 学习计划 */
export interface LearningPlan {
  /** 计划 ID */
  id: string;
  /** 计划周期起始日期 */
  startDate: string;
  /** 计划周期结束日期 */
  endDate: string;
  /** 每日学习任务列表 */
  tasks: PlanTask[];
  /** 计划说明 */
  description: string;
}

/** 考试题型 */
export type ExamQuestionType = "listening" | "reading" | "writing" | "speaking";

/** 模拟考试题目 */
export interface ExamQuestion {
  /** 题目 ID */
  id: string;
  /** 题型 */
  type: ExamQuestionType;
  /** 题干 */
  question: string;
  /** 选项（客观题） */
  options?: string[];
  /** 正确答案（客观题） */
  answer?: string;
  /** 用户答案 */
  userAnswer?: string;
  /** 解析 */
  explanation?: string;
  /** 分值 */
  score: number;
  /** 建议时长（分钟） */
  timeLimit?: number;
  /** 音频/阅读材料（可选） */
  passage?: string;
  /** 适用学习目标（可选，用于过滤） */
  target?: Target;
  /** 标签（可选，用于分类） */
  tags?: string[];
  /** 真题来源（可选） */
  source?: "official" | "custom";
  /** 真题考试类型（如 CET4 / CET6 / IELTS / TOEFL） */
  examType?: string;
  /** 真题年份 */
  year?: string;
  /** 真题所属部分（听力/阅读/写作/口语） */
  section?: ExamQuestionType;
  /** 难度（可选） */
  difficulty?: "easy" | "medium" | "hard";
}

/** 模拟考试记录 */
export interface ExamRecord {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 考试类型标签 */
  type: string;
  /** 开始时间 */
  startedAt: string;
  /** 结束时间 */
  endedAt: string;
  /** 题目与作答 */
  questions: ExamQuestion[];
  /** 总分 */
  totalScore: number;
  /** 得分 */
  score: number;
  /** 分项得分 */
  sectionScores?: Record<ExamQuestionType, number>;
}

/** 模拟考试客观题错题记录 */
export interface ExamWrongQuestion {
  /** 错题 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 所属考试记录 ID */
  examRecordId: string;
  /** 发生时间 */
  date: string;
  /** 题型 */
  type: ExamQuestionType;
  /** 真题所属部分（听力/阅读/写作/口语） */
  section?: ExamQuestionType;
  /** 真题考试类型（如 CET4 / CET6 / IELTS / TOEFL） */
  examType?: string;
  /** 真题年份 */
  year?: string;
  /** 题干 */
  question: string;
  /** 音频/阅读材料（可选） */
  passage?: string;
  /** 选项（客观题） */
  options?: string[];
  /** 正确答案 */
  answer?: string;
  /** 用户答案 */
  userAnswer?: string;
  /** 解析 */
  explanation?: string;
  /** 难度（可选） */
  difficulty?: "easy" | "medium" | "hard";
  /** 是否已复习 */
  reviewed?: boolean;
  /** 下次复习日期（SM-2） */
  nextReviewDate?: string;
  /** 复习间隔（天，SM-2） */
  interval?: number;
  /** 连续复习次数（SM-2） */
  repetitionCount?: number;
  /** 容易度因子（SM-2） */
  easeFactor?: number;
}

/** 阅读理解选择题 */
export interface ReadingQuestion {
  /** 题目 */
  question: string;
  /** 选项 */
  options: string[];
  /** 正确答案索引 */
  answerIndex: number;
  /** 解析 */
  explanation: string;
}

/** 阅读理解文章与题目 */
export interface ReadingPassage {
  /** 文章标题 */
  title: string;
  /** 文章正文 */
  passage: string;
  /** 题目列表 */
  questions: ReadingQuestion[];
}

/** 阅读理解练习记录 */
export interface ReadingRecord {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 练习日期 */
  date: string;
  /** 学习目标 */
  target: Target;
  /** 当前等级 */
  level: Level;
  /** 文章标题 */
  title: string;
  /** 文章正文 */
  passage: string;
  /** 题目与作答 */
  questions: ReadingQuestion[];
  /** 得分 */
  score: number;
}

/** 听力理解题目 */
export interface ListeningQuestion {
  /** 题目 */
  question: string;
  /** 选项 */
  options: string[];
  /** 正确答案索引 */
  answerIndex: number;
  /** 解析 */
  explanation: string;
}

/** 听力理解练习项 */
export interface ListeningItem {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 练习日期 */
  date: string;
  /** 学习目标 */
  target: Target;
  /** 当前等级 */
  level: Level;
  /** 音频对应的文本 */
  transcript: string;
  /** 题目列表 */
  questions: ListeningQuestion[];
  /** 得分 */
  score: number;
}

/** 听写记录 */
export interface DictationRecord {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 练习日期 */
  date: string;
  /** 原句 */
  sentence: string;
  /** 用户输入 */
  userInput: string;
  /** 相似度得分 */
  similarity: number;
}
