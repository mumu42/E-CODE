/**
 * @file lib/store/index.ts
 * @description 基于 Zustand 的全局状态管理 store（支持多档案隔离）
 * @author English Agent Team
 * @date 2026-08-11
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppData,
  UserProfile,
  ProfileData,
  AssessmentRecord,
  PracticeRecord,
  ChatSession,
  TopicRecord,
  ErrorItem,
  ThemeMode,
  LearningPlan,
  ExamRecord,
  ExamQuestion,
  Badge,
} from "@/lib/types";
import { createIndexedDBStorage } from "@/lib/storage/indexeddb";
import { buildLearningProfile } from "@/lib/ai/memory";
import { calculateBadges, getNewBadges } from "@/lib/badges";

/** 数据持久化版本号，用于迁移 */
const STORAGE_VERSION = 2;

/** 空档案数据 */
const emptyProfileData = (): ProfileData => ({
  assessments: [],
  sessions: [],
  chatSessions: [],
  topics: [],
  errors: [],
  examRecords: [],
  learningPlan: null,
  learningProfile: null,
  customQuestions: [],
  customTopics: [],
  checkIns: [],
  badges: [],
});

/** AppStore 对外暴露的状态与操作方法 */
export interface AppState extends AppData {
  /** 设置当前用户档案 */
  setProfile: (profile: UserProfile) => void;
  /** 更新当前用户档案 */
  updateProfile: (partial: Partial<UserProfile>) => void;
  /** 创建新档案 */
  createProfile: (profile: UserProfile) => void;
  /** 切换到指定档案 */
  switchProfile: (id: string) => void;
  /** 删除指定档案 */
  deleteProfile: (id: string) => void;
  /** 重命名当前档案 */
  renameProfile: (name: string) => void;
  /** 添加一条测评记录 */
  addAssessment: (assessment: AssessmentRecord) => void;
  /** 添加一条练习记录 */
  addSession: (session: PracticeRecord) => void;
  /** 手动添加打卡 */
  addCheckIn: (date?: string) => void;
  /** 解锁徽章 */
  unlockBadge: (badge: Badge) => void;
  /** 重新计算徽章 */
  recalculateBadges: () => void;
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
  /** 设置学习计划 */
  setLearningPlan: (plan: LearningPlan | null) => void;
  /** 标记计划任务完成 */
  completePlanTask: (taskId: string) => void;
  /** 将错题标记为已复习并应用 SM-2 算法调度下次复习 */
  scheduleReview: (errorId: string, grade: "hard" | "good" | "easy") => void;
  /** 添加一条模拟考试记录 */
  addExamRecord: (record: ExamRecord) => void;
  /** 更新 AI 学习画像 */
  updateLearningProfile: () => void;
  /** 设置主题模式 */
  setTheme: (theme: ThemeMode) => void;
  /** 设置界面语言 */
  setLocale: (locale: AppData["locale"]) => void;
  /** 导入外部数据 */
  importData: (data: Partial<AppData>) => void;
  /** 添加自定义话题 */
  addCustomTopic: (topic: TopicRecord) => void;
  /** 更新自定义话题 */
  updateCustomTopic: (id: string, partial: Partial<TopicRecord>) => void;
  /** 删除自定义话题 */
  removeCustomTopic: (id: string) => void;
  /** 导入题库 */
  importQuestionBank: (questions: ExamQuestion[]) => void;
  /** 删除自定义题目 */
  removeCustomQuestion: (id: string) => void;
  /** 重置所有数据 */
  resetData: () => void;
}

/** 初始状态 */
const initialState: AppData = {
  profile: null,
  profiles: [],
  currentProfileId: null,
  profileData: {},
  assessments: [],
  sessions: [],
  chatSessions: [],
  topics: [],
  errors: [],
  examRecords: [],
  learningPlan: null,
  learningProfile: null,
  customQuestions: [],
  customTopics: [],
  checkIns: [],
  badges: [],
  locale: "zh-CN",
  theme: "system",
};

/** 迁移旧版 localStorage 数据到新版结构 */
function migrateFromLocalStorage(): AppData | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("english-agent-storage");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as AppData & {
      assessments?: AssessmentRecord[];
      sessions?: PracticeRecord[];
      chatSessions?: ChatSession[];
      topics?: TopicRecord[];
      errors?: ErrorItem[];
    };
    // 如果已经是新结构，直接返回
    if (parsed.profileData) return parsed;
    // 旧结构迁移
    const profile = parsed.profile;
    if (!profile) return parsed as AppData;
    const data: ProfileData = {
      assessments: parsed.assessments ?? [],
      sessions: parsed.sessions ?? [],
      chatSessions: parsed.chatSessions ?? [],
      topics: parsed.topics ?? [],
      errors: parsed.errors ?? [],
      examRecords: parsed.examRecords ?? [],
      learningPlan: null,
      learningProfile: null,
      customQuestions: parsed.customQuestions ?? [],
      customTopics: parsed.customTopics ?? [],
      checkIns: parsed.checkIns ?? [],
      badges: parsed.badges ?? [],
    };
    return {
      ...initialState,
      profile,
      profiles: [profile],
      currentProfileId: profile.id,
      profileData: { [profile.id]: data },
      ...data,
      theme: parsed.theme ?? "system",
    };
  } catch (error) {
    console.error("Failed to migrate old localStorage data:", error);
    return undefined;
  }
}

/**
 * 全局应用状态 hook
 * @example
 * ```tsx
 * const profile = useAppStore((state) => state.profile);
 * ```
 */
export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set) => ({
      ...initialState,
      setProfile: (profile) =>
        set((state) => {
          const exists = state.profiles.some((p) => p.id === profile.id);
          const profiles = exists
            ? state.profiles.map((p) => (p.id === profile.id ? profile : p))
            : [...state.profiles, profile];
          const data = state.profileData[profile.id] ?? emptyProfileData();
          return {
            ...state,
            profile,
            profiles,
            currentProfileId: profile.id,
            profileData: { ...state.profileData, [profile.id]: data },
            ...data,
          };
        }),
      updateProfile: (partial) =>
        set((state) => {
          if (!state.profile) return state;
          const profile = {
            ...state.profile,
            ...partial,
            updatedAt: new Date().toISOString(),
          };
          const profiles = state.profiles.map((p) =>
            p.id === profile.id ? profile : p
          );
          return { ...state, profile, profiles };
        }),
      createProfile: (profile) =>
        set((state) => ({
          ...state,
          profile,
          profiles: [...state.profiles, profile],
          currentProfileId: profile.id,
          profileData: {
            ...state.profileData,
            [profile.id]: emptyProfileData(),
        },
        assessments: [],
        sessions: [],
        chatSessions: [],
        topics: [],
        errors: [],
        examRecords: [],
        learningPlan: null,
        learningProfile: null,
        customQuestions: [],
        customTopics: [],
        checkIns: [],
        badges: [],
      })),
      switchProfile: (id) =>
        set((state) => {
          const currentId = state.currentProfileId;
          const nextData = state.profileData[id] ?? emptyProfileData();
          const profile = state.profiles.find((p) => p.id === id) ?? null;
          // 仅保存当前档案的核心学习数据，避免循环引用
          const savedData: ProfileData = currentId
            ? {
                assessments: state.assessments,
                sessions: state.sessions,
                chatSessions: state.chatSessions,
                topics: state.topics,
                errors: state.errors,
                examRecords: state.examRecords,
                learningPlan: state.learningPlan,
                learningProfile: state.learningProfile,
                customQuestions: state.customQuestions,
                customTopics: state.customTopics,
                checkIns: state.checkIns,
                badges: state.badges,
              }
            : emptyProfileData();
          return {
            ...state,
            profile,
            currentProfileId: id,
            profileData: currentId
              ? { ...state.profileData, [currentId]: savedData }
              : state.profileData,
            ...nextData,
          };
        }),
      deleteProfile: (id) =>
        set((state) => {
          const profileData = { ...state.profileData };
          delete profileData[id];
          const profiles = state.profiles.filter((p) => p.id !== id);
          if (state.currentProfileId === id) {
            const nextProfile = profiles[0] ?? null;
            const nextData = nextProfile
              ? profileData[nextProfile.id] ?? emptyProfileData()
              : emptyProfileData();
            return {
              ...state,
              profiles,
              profileData,
              profile: nextProfile,
              currentProfileId: nextProfile?.id ?? null,
              ...nextData,
            };
          }
          return { ...state, profiles, profileData };
        }),
      renameProfile: (name) =>
        set((state) => {
          if (!state.profile) return state;
          const profile = { ...state.profile, name };
          return {
            ...state,
            profile,
            profiles: state.profiles.map((p) =>
              p.id === state.profile!.id ? { ...p, name } : p
            ),
          };
        }),
      addAssessment: (assessment) =>
        set((state) => ({
          ...state,
          assessments: [...state.assessments, assessment],
        })),
      addSession: (session) =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          const alreadyCheckedIn = state.checkIns.includes(today);
          const updatedCheckIns = alreadyCheckedIn
            ? state.checkIns
            : [...state.checkIns, today];
          const updatedSessions = [...state.sessions, session];
          const newBadges = getNewBadges(state.badges, {
            sessions: updatedSessions,
            checkIns: updatedCheckIns,
            examRecords: state.examRecords,
            errors: state.errors,
          });
          return {
            ...state,
            sessions: updatedSessions,
            checkIns: updatedCheckIns,
            badges: newBadges.length > 0 ? [...state.badges, ...newBadges] : state.badges,
          };
        }),
      addCheckIn: (date) =>
        set((state) => {
          const target = date ?? new Date().toISOString().split("T")[0];
          if (state.checkIns.includes(target)) return state;
          return { ...state, checkIns: [...state.checkIns, target] };
        }),
      unlockBadge: (badge) =>
        set((state) => {
          if (state.badges.some((b) => b.id === badge.id)) return state;
          return {
            ...state,
            badges: [...state.badges, { ...badge, unlockedAt: new Date().toISOString() }],
          };
        }),
      recalculateBadges: () =>
        set((state) => {
          const newly = calculateBadges({
            sessions: state.sessions,
            checkIns: state.checkIns,
            examRecords: state.examRecords,
            errors: state.errors,
          });
          const existingIds = new Set(state.badges.map((b) => b.id));
          const unlocked = newly.filter((b) => !existingIds.has(b.id));
          return unlocked.length > 0
            ? { ...state, badges: [...state.badges, ...unlocked] }
            : state;
        }),
      addChatSession: (session) =>
        set((state) => ({
          ...state,
          chatSessions: [...state.chatSessions, session],
        })),
      updateChatSession: (id, messages) =>
        set((state) => ({
          ...state,
          chatSessions: state.chatSessions.map((s) =>
            s.id === id
              ? { ...s, messages, updatedAt: new Date().toISOString() }
              : s
          ),
        })),
      setTopics: (topics) => set({ topics }),
      addTopic: (topic) =>
        set((state) => ({
          ...state,
          topics: [...state.topics, topic],
        })),
      updateTopic: (id, partial) =>
        set((state) => ({
          ...state,
          topics: state.topics.map((t) =>
            t.id === id ? { ...t, ...partial } : t
          ),
        })),
      addErrors: (errors) =>
        set((state) => ({
          ...state,
          errors: [...state.errors, ...errors],
        })),
      markErrorReviewed: (id) =>
        set((state) => {
          const updatedErrors = state.errors.map((e) =>
            e.id === id ? { ...e, reviewed: true } : e
          );
          const newBadges = getNewBadges(state.badges, {
            sessions: state.sessions,
            checkIns: state.checkIns,
            examRecords: state.examRecords,
            errors: updatedErrors,
          });
          return {
            ...state,
            errors: updatedErrors,
            badges: newBadges.length > 0 ? [...state.badges, ...newBadges] : state.badges,
          };
        }),
      scheduleReview: (errorId, grade) =>
        set((state) => {
          const newErrors = state.errors.map((e) => {
            if (e.id !== errorId) return e;
            const repetition = (e.repetitionCount ?? 0) + 1;
            const oldEase = e.easeFactor ?? 2.5;
            let ease = oldEase;
            if (grade === "hard") ease = Math.max(1.3, oldEase - 0.2);
            if (grade === "good") ease = oldEase;
            if (grade === "easy") ease = oldEase + 0.15;
            let interval = 1;
            if (grade === "hard") interval = 1;
            else if (repetition === 1) interval = 1;
            else if (repetition === 2) interval = 6;
            else interval = Math.round((e.interval ?? 1) * ease);
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + interval);
            return {
              ...e,
              reviewed: true,
              repetitionCount: repetition,
              easeFactor: ease,
              interval,
              nextReviewDate: nextDate.toISOString().split("T")[0],
            };
          });
          return { ...state, errors: newErrors };
        }),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setLearningPlan: (plan) => set({ learningPlan: plan }),
      completePlanTask: (taskId) =>
        set((state) => {
          const plan = state.learningPlan;
          if (!plan) return state;
          return {
            ...state,
            learningPlan: {
              ...plan,
              tasks: plan.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: true } : t
              ),
            },
          };
        }),
      addExamRecord: (record) =>
        set((state) => {
          const updatedExamRecords = [...state.examRecords, record];
          const newBadges = getNewBadges(state.badges, {
            sessions: state.sessions,
            checkIns: state.checkIns,
            examRecords: updatedExamRecords,
            errors: state.errors,
          });
          return {
            ...state,
            examRecords: updatedExamRecords,
            badges: newBadges.length > 0 ? [...state.badges, ...newBadges] : state.badges,
          };
        }),
      updateLearningProfile: () =>
        set((state) => {
          if (!state.profile) return state;
          const profile = buildLearningProfile(
            state.errors,
            state.sessions,
            state.assessments
          );
          return { ...state, learningProfile: profile };
        }),
      importData: (data) =>
        set((state) => {
          const migrated = data as AppData & {
            assessments?: AssessmentRecord[];
            sessions?: PracticeRecord[];
            chatSessions?: ChatSession[];
            topics?: TopicRecord[];
            errors?: ErrorItem[];
          };
          if (
            migrated.profile &&
            !migrated.profileData &&
            (migrated.assessments || migrated.sessions)
          ) {
            // 旧格式迁移：把数组归集到 profileData
            const profileId = migrated.profile.id;
            const profileData: Record<string, ProfileData> = {
              ...((migrated.profileData as Record<string, ProfileData>) ?? {}),
              [profileId]: {
                assessments: migrated.assessments ?? [],
                sessions: migrated.sessions ?? [],
                chatSessions: migrated.chatSessions ?? [],
                topics: migrated.topics ?? [],
                errors: migrated.errors ?? [],
                examRecords: migrated.examRecords ?? [],
                learningPlan: null,
                learningProfile: null,
                customQuestions: migrated.customQuestions ?? [],
                customTopics: migrated.customTopics ?? [],
                checkIns: migrated.checkIns ?? [],
                badges: migrated.badges ?? [],
              },
            };
            return {
              ...state,
              profile: migrated.profile,
              profiles: migrated.profiles ?? [migrated.profile],
              currentProfileId: migrated.currentProfileId ?? profileId,
              profileData,
              theme: migrated.theme ?? state.theme,
              ...profileData[profileId],
            };
          }
          return {
            ...state,
            profile: data.profile ?? state.profile,
            profiles: data.profiles ?? state.profiles,
            currentProfileId: data.currentProfileId ?? state.currentProfileId,
            profileData: data.profileData ?? state.profileData,
            theme: data.theme ?? state.theme,
            ...(data.currentProfileId && data.profileData
              ? data.profileData[data.currentProfileId]
              : {}),
            learningPlan:
              data.learningPlan ??
              (data.currentProfileId && data.profileData
                ? data.profileData[data.currentProfileId].learningPlan
                : state.learningPlan),
            examRecords:
              data.examRecords ??
              (data.currentProfileId && data.profileData
                ? data.profileData[data.currentProfileId].examRecords
                : state.examRecords),
            learningProfile:
              data.learningProfile ??
              (data.currentProfileId && data.profileData
                ? data.profileData[data.currentProfileId].learningProfile
                : state.learningProfile),
            customQuestions:
              data.customQuestions ??
              (data.currentProfileId && data.profileData
                ? data.profileData[data.currentProfileId].customQuestions
                : state.customQuestions),
            customTopics:
              data.customTopics ??
              (data.currentProfileId && data.profileData
                ? data.profileData[data.currentProfileId].customTopics
                : state.customTopics),
          };
        }),
      addCustomTopic: (topic) =>
        set((state) => ({
          ...state,
          customTopics: [...state.customTopics, topic],
        })),
      updateCustomTopic: (id, partial) =>
        set((state) => ({
          ...state,
          customTopics: state.customTopics.map((t) =>
            t.id === id ? { ...t, ...partial } : t
          ),
        })),
      removeCustomTopic: (id) =>
        set((state) => ({
          ...state,
          customTopics: state.customTopics.filter((t) => t.id !== id),
        })),
      importQuestionBank: (questions) =>
        set((state) => {
          const existing = new Set(state.customQuestions.map((q) => q.id));
          const merged = [
            ...state.customQuestions,
            ...questions.filter((q) => !existing.has(q.id)),
          ];
          return { ...state, customQuestions: merged };
        }),
      removeCustomQuestion: (id) =>
        set((state) => ({
          ...state,
          customQuestions: state.customQuestions.filter((q) => q.id !== id),
        })),
      resetData: () => set(initialState),
    }),
    {
      name: "english-agent-storage",
      version: STORAGE_VERSION,
      storage: createIndexedDBStorage<AppState>(),
      migrate: (persistedState) => {
        if (!persistedState) {
          const migrated = migrateFromLocalStorage();
          return (migrated ?? initialState) as AppState;
        }
        return { ...initialState, ...persistedState } as AppState;
      },
    }
  )
);

/** 自动备份到 static/ */
let backupTimer: ReturnType<typeof setTimeout> | null = null;
useAppStore.subscribe((state) => {
  if (typeof window === "undefined") return;
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    // 把当前激活数组同步到当前档案，保证备份完整
    const currentId = state.currentProfileId;
    const payload = { ...state } as AppData;
    if (currentId) {
      payload.profileData = {
        ...state.profileData,
        [currentId]: {
          assessments: state.assessments,
          sessions: state.sessions,
          chatSessions: state.chatSessions,
          topics: state.topics,
          errors: state.errors,
          examRecords: state.examRecords,
          learningPlan: state.learningPlan,
          learningProfile: state.learningProfile,
          customQuestions: state.customQuestions,
          customTopics: state.customTopics,
          checkIns: state.checkIns,
          badges: state.badges,
        },
      };
    }
    fetch("/api/files/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.error("Auto backup failed:", error);
    });
  }, 2000);
});
