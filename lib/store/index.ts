/**
 * @file lib/store/index.ts
 * @description 基于 Zustand 的全局状态管理 store
 * @author English Agent Team
 * @date 2026-08-07
 */

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

/** AppStore 对外暴露的状态与操作方法 */
export interface AppState extends AppData {
  /** 设置当前用户档案 */
  setProfile: (profile: UserProfile) => void;
  /** 更新当前用户档案 */
  updateProfile: (partial: Partial<UserProfile>) => void;
  /** 添加一条测评记录 */
  addAssessment: (assessment: AssessmentRecord) => void;
  /** 添加一条练习记录 */
  addSession: (session: PracticeRecord) => void;
  /** 添加一个对话会话 */
  addChatSession: (session: ChatSession) => void;
  /** 更新指定对话会话的消息 */
  updateChatSession: (id: string, messages: ChatSession["messages"]) => void;
  /** 设置话题列表 */
  setTopics: (topics: TopicRecord[]) => void;
  /** 添加话题记录 */
  addTopic: (topic: TopicRecord) => void;
  /** 更新话题记录 */
  updateTopic: (id: string, partial: Partial<TopicRecord>) => void;
  /** 批量添加错题 */
  addErrors: (errors: ErrorItem[]) => void;
  /** 将错题标记为已复习 */
  markErrorReviewed: (id: string) => void;
  /** 设置主题模式 */
  setTheme: (theme: ThemeMode) => void;
  /** 导入外部数据 */
  importData: (data: Partial<AppData>) => void;
  /** 重置所有数据 */
  resetData: () => void;
}

/** 初始状态 */
const initialState: AppData = {
  profile: null,
  assessments: [],
  sessions: [],
  chatSessions: [],
  topics: [],
  errors: [],
  theme: "system",
};

/**
 * 全局应用状态 hook
 * @example
 * ```tsx
 * const profile = useAppStore((state) => state.profile);
 * ```
 */
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
