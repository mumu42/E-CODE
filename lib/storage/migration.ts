/**
 * @file lib/storage/migration.ts
 * @description 旧版数据格式导出工具
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { AppData } from "@/lib/types";

/**
 * 将当前数据导出为旧版格式（profile + 顶层数组），便于迁移
 * @param data - 应用全局数据
 * @returns 旧版格式的 JSON 字符串
 */
export function exportLegacyFormat(data: AppData): string {
  const legacy = {
    profile: data.profile,
    profiles: data.profiles,
    currentProfileId: data.currentProfileId,
    theme: data.theme,
    locale: data.locale,
    settings: data.settings,
    assessments: data.assessments,
    sessions: data.sessions,
    chatSessions: data.chatSessions,
    topics: data.topics,
    errors: data.errors,
    examRecords: data.examRecords,
    learningPlan: data.learningPlan,
    learningProfile: data.learningProfile,
    customQuestions: data.customQuestions,
    customTopics: data.customTopics,
    checkIns: data.checkIns,
    badges: data.badges,
  };
  return JSON.stringify(legacy, null, 2);
}
