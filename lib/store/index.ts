import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppData,
  UserProfile,
  AssessmentRecord,
  PracticeRecord,
} from "@/lib/types";

export interface AppState extends AppData {
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addAssessment: (assessment: AssessmentRecord) => void;
  addSession: (session: PracticeRecord) => void;
  importData: (data: Partial<AppData>) => void;
  resetData: () => void;
}

const initialState: AppData = {
  profile: null,
  assessments: [],
  sessions: [],
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
      importData: (data) =>
        set((state) => ({
          profile: data.profile ?? state.profile,
          assessments: data.assessments ?? state.assessments,
          sessions: data.sessions ?? state.sessions,
        })),
      resetData: () => set(initialState),
    }),
    {
      name: "english-agent-storage",
    }
  )
);
