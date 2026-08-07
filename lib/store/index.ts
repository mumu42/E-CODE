import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppData,
  UserProfile,
  AssessmentRecord,
  PracticeRecord,
  ChatSession,
  TopicRecord,
  ErrorItem,
  ThemeMode,
} from "@/lib/types";

export interface AppState extends AppData {
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addAssessment: (assessment: AssessmentRecord) => void;
  addSession: (session: PracticeRecord) => void;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (id: string, messages: ChatSession["messages"]) => void;
  setTopics: (topics: TopicRecord[]) => void;
  addTopic: (topic: TopicRecord) => void;
  updateTopic: (id: string, partial: Partial<TopicRecord>) => void;
  addErrors: (errors: ErrorItem[]) => void;
  markErrorReviewed: (id: string) => void;
  setTheme: (theme: ThemeMode) => void;
  importData: (data: Partial<AppData>) => void;
  resetData: () => void;
}

const initialState: AppData = {
  profile: null,
  assessments: [],
  sessions: [],
  chatSessions: [],
  topics: [],
  errors: [],
  theme: "system",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setProfile: (profile) =>
        set({
          profile: {
            ...profile,
            updatedAt: new Date().toISOString(),
          },
        }),
      updateProfile: (partial) => {
        const current = get().profile;
        if (!current) return;
        set({
          profile: {
            ...current,
            ...partial,
            updatedAt: new Date().toISOString(),
          },
        });
      },
      addAssessment: (assessment) =>
        set((state) => ({
          assessments: [...state.assessments, assessment],
        })),
      addSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
        })),
      addChatSession: (session) =>
        set((state) => ({
          chatSessions: [...state.chatSessions, session],
        })),
      updateChatSession: (id, messages) =>
        set((state) => ({
          chatSessions: state.chatSessions.map((s) =>
            s.id === id ? { ...s, messages, updatedAt: new Date().toISOString() } : s
          ),
        })),
      setTopics: (topics) => set({ topics }),
      addTopic: (topic) =>
        set((state) => ({
          topics: [...state.topics, topic],
        })),
      updateTopic: (id, partial) =>
        set((state) => ({
          topics: state.topics.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        })),
      addErrors: (errors) =>
        set((state) => ({
          errors: [...state.errors, ...errors],
        })),
      markErrorReviewed: (id) =>
        set((state) => ({
          errors: state.errors.map((e) => (e.id === id ? { ...e, reviewed: true } : e)),
        })),
      setTheme: (theme) => set({ theme }),
      importData: (data) =>
        set((state) => ({
          profile: data.profile ?? state.profile,
          assessments: data.assessments ?? state.assessments,
          sessions: data.sessions ?? state.sessions,
          chatSessions: data.chatSessions ?? state.chatSessions,
          topics: data.topics ?? state.topics,
          errors: data.errors ?? state.errors,
          theme: data.theme ?? state.theme,
        })),
      resetData: () => set(initialState),
    }),
    {
      name: "english-agent-storage",
    }
  )
);
