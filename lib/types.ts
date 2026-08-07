export type Target = "SCHOOL" | "STUDY_ABROAD" | "CET" | "IELTS_TOEFL";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type SessionType = "SPEAK" | "WRITE" | "CHAT";

export type ThemeMode = "light" | "dark" | "system";

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  target: Target;
  level: Level;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  date: string;
  target: Target;
  scores: {
    listening?: number;
    speaking?: number;
    reading?: number;
    writing?: number;
    grammar?: number;
  };
  level: Level;
}

export interface GrammarError {
  id: string;
  original: string;
  correction: string;
  explanation: string;
  type: "grammar" | "vocabulary" | "spelling" | "structure" | "pronunciation" | "expression";
}

export interface PracticeRecord {
  id: string;
  userId: string;
  type: SessionType;
  date: string;
  topic: string;
  scenario: string;
  userInput: string;
  aiFeedback: string;
  grammarScore?: number;
  fluencyScore?: number;
  errors?: GrammarError[];
}

export interface AppData {
  profile: UserProfile | null;
  assessments: AssessmentRecord[];
  sessions: PracticeRecord[];
  chatSessions: ChatSession[];
  topics: TopicRecord[];
  errors: ErrorItem[];
  theme?: ThemeMode;
}

export interface AssessmentResult {
  level: Level;
  scores: AssessmentRecord["scores"];
  feedback: string;
}

export interface SpeakFeedback {
  grammarIssues: string[];
  betterExpressions: string[];
  pronunciationTips: string[];
  score: number;
  feedback: string;
}

export interface WritingTopic {
  title: string;
  instructions: string;
  wordLimit: number;
  timeLimit: number;
}

export interface WritingFeedback {
  score: number;
  grammarScore: number;
  vocabularyScore: number;
  structureScore: number;
  errors: GrammarError[];
  suggestions: string[];
  improvedVersion: string;
  feedback: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  corrections?: string[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  role: ChatRole;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ChatRole = "friend" | "interviewer" | "examiner" | "teacher" | "colleague";

export interface ChatRoleConfig {
  value: ChatRole;
  label: string;
  description: string;
}

export interface TopicRecord {
  id: string;
  userId: string;
  date: string;
  target: Target;
  level: Level;
  topic: string;
  scenario: string;
  hints: string[];
  favorite?: boolean;
}

export interface ErrorItem {
  id: string;
  userId: string;
  sessionId: string;
  type: SessionType;
  date: string;
  original: string;
  correction: string;
  explanation: string;
  errorType: GrammarError["type"];
  reviewed?: boolean;
}

export interface WeakPoint {
  errorType: GrammarError["type"];
  count: number;
  examples: string[];
}

export interface DrillQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}
