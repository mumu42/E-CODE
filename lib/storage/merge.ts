/**
 * @file lib/storage/merge.ts
 * @description 合并多个历史数据快照，按 ID 去重并保留最新数据
 * @author English Agent Team
 * @date 2026-08-21
 */

import type {
  AppData,
  ProfileData,
  UserProfile,
  AssessmentRecord,
  PracticeRecord,
  ChatSession,
  TopicRecord,
  ErrorItem,
  ExamRecord,
  ExamQuestion,
  Badge,
  ReadingRecord,
  ListeningItem,
  VocabularyItem,
} from "@/lib/types";

/** 带唯一标识的数据项 */
interface WithId {
  id: string;
}

/** 按 id 合并两个数组，后面的覆盖前面的同名项 */
function mergeById<T extends WithId>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) map.set(item.id, item);
  return Array.from(map.values());
}

/** 合并两个打卡日期列表 */
function mergeCheckIns(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b])).sort();
}

/** 合并徽章列表 */
function mergeBadges(a: Badge[], b: Badge[]): Badge[] {
  return mergeById(a, b);
}

/** 合并两个档案数据 */
export function mergeProfileData(target: ProfileData, source: Partial<ProfileData>): ProfileData {
  return {
    assessments: mergeById(target.assessments, source.assessments ?? []),
    sessions: mergeById(target.sessions, source.sessions ?? []),
    chatSessions: mergeById(target.chatSessions, source.chatSessions ?? []),
    topics: mergeById(target.topics, source.topics ?? []),
    errors: mergeById(target.errors, source.errors ?? []),
    examRecords: mergeById(target.examRecords, source.examRecords ?? []),
    readingRecords: mergeById(target.readingRecords, source.readingRecords ?? []),
    listeningRecords: mergeById(target.listeningRecords, source.listeningRecords ?? []),
    vocabulary: mergeById(target.vocabulary, source.vocabulary ?? []),
    learningPlan: source.learningPlan ?? target.learningPlan,
    learningProfile: source.learningProfile ?? target.learningProfile,
    customQuestions: mergeById(target.customQuestions, source.customQuestions ?? []),
    customTopics: mergeById(target.customTopics, source.customTopics ?? []),
    checkIns: mergeCheckIns(target.checkIns, source.checkIns ?? []),
    badges: mergeBadges(target.badges, source.badges ?? []),
    settings: source.settings ?? target.settings,
  };
}

/** 合并多个 AppData 快照 */
export function mergeAppData(snapshots: Partial<AppData>[]): Partial<AppData> {
  const result: Partial<AppData> = {};

  const profiles: UserProfile[] = [];
  const profileData: Record<string, ProfileData> = {};

  for (const snapshot of snapshots) {
    if (snapshot.profiles) {
      for (const profile of snapshot.profiles) {
        if (!profiles.some((p) => p.id === profile.id)) {
          profiles.push(profile);
        }
      }
    }

    if (snapshot.profileData) {
      for (const [id, data] of Object.entries(snapshot.profileData)) {
        if (!profileData[id]) {
          profileData[id] = data;
        } else {
          profileData[id] = mergeProfileData(profileData[id], data);
        }
      }
    }
  }

  if (profiles.length > 0) result.profiles = profiles;
  if (Object.keys(profileData).length > 0) result.profileData = profileData;

  // 合并顶层数组（用于兼容旧格式导入）
  const assessments: AssessmentRecord[] = [];
  const sessions: PracticeRecord[] = [];
  const chatSessions: ChatSession[] = [];
  const topics: TopicRecord[] = [];
  const errors: ErrorItem[] = [];
  const examRecords: ExamRecord[] = [];
  const readingRecords: ReadingRecord[] = [];
  const listeningRecords: ListeningItem[] = [];
  const vocabulary: VocabularyItem[] = [];
  const customQuestions: ExamQuestion[] = [];
  const customTopics: TopicRecord[] = [];
  const checkIns: string[] = [];
  const badges: Badge[] = [];

  for (const snapshot of snapshots) {
    assessments.push(...(snapshot.assessments ?? []));
    sessions.push(...(snapshot.sessions ?? []));
    chatSessions.push(...(snapshot.chatSessions ?? []));
    topics.push(...(snapshot.topics ?? []));
    errors.push(...(snapshot.errors ?? []));
    examRecords.push(...(snapshot.examRecords ?? []));
    readingRecords.push(...(snapshot.readingRecords ?? []));
    listeningRecords.push(...(snapshot.listeningRecords ?? []));
    vocabulary.push(...(snapshot.vocabulary ?? []));
    customQuestions.push(...(snapshot.customQuestions ?? []));
    customTopics.push(...(snapshot.customTopics ?? []));
    checkIns.push(...(snapshot.checkIns ?? []));
    badges.push(...(snapshot.badges ?? []));
  }

  result.assessments = mergeById(assessments, []);
  result.sessions = mergeById(sessions, []);
  result.chatSessions = mergeById(chatSessions, []);
  result.topics = mergeById(topics, []);
  result.errors = mergeById(errors, []);
  result.examRecords = mergeById(examRecords, []);
  result.readingRecords = mergeById(readingRecords, []);
  result.listeningRecords = mergeById(listeningRecords, []);
  result.vocabulary = mergeById(vocabulary, []);
  result.customQuestions = mergeById(customQuestions, []);
  result.customTopics = mergeById(customTopics, []);
  result.checkIns = Array.from(new Set(checkIns)).sort();
  result.badges = mergeById(badges, []);

  // 主题/语言采用最后一个非空值
  for (let i = snapshots.length - 1; i >= 0; i--) {
    const snapshot = snapshots[i];
    if (!result.theme && snapshot.theme) result.theme = snapshot.theme;
    if (!result.locale && snapshot.locale) result.locale = snapshot.locale;
    if (!result.profile && snapshot.profile) result.profile = snapshot.profile;
    if (!result.currentProfileId && snapshot.currentProfileId) {
      result.currentProfileId = snapshot.currentProfileId;
    }
  }

  return result;
}

/** 将 source 合并到 target 上 */
export function mergeIntoAppData(target: Partial<AppData>, source: Partial<AppData>): Partial<AppData> {
  return mergeAppData([target, source]);
}
