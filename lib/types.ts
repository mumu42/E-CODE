export type Target = "SCHOOL" | "STUDY_ABROAD" | "CET" | "IELTS_TOEFL";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type SessionType = "SPEAK" | "WRITE";

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
}

export interface AppData {
  profile: UserProfile | null;
  assessments: AssessmentRecord[];
  sessions: PracticeRecord[];
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
