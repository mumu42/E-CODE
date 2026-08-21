/**
 * @file lib/ai/memory.ts
 * @description 学习画像生成与 AI 记忆上下文工具
 * @author English Agent Team
 * @date 2026-08-17
 */

import { renderPromptTemplate } from "@/lib/settings/promptTemplate";
import type { ErrorItem, PracticeRecord, AssessmentRecord, LearningProfile, GrammarError } from "@/lib/types";

/** 统计指定数量内的高频错误（默认 5 个） */
export function getCommonErrors(
  errors: ErrorItem[],
  limit = 5
): LearningProfile["commonErrors"] {
  const groups = new Map<string, { count: number; examples: string[] }>();
  for (const error of errors) {
    const existing = groups.get(error.errorType) ?? { count: 0, examples: [] };
    existing.count += 1;
    if (existing.examples.length < 3) {
      existing.examples.push(error.original);
    }
    groups.set(error.errorType, existing);
  }
  return Array.from(groups.entries())
    .map(([type, data]) => ({ type: type as GrammarError["type"], ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** 提取最近 N 条练习的话题 */
export function summarizeRecentSessions(sessions: PracticeRecord[], count = 5) {
  return sessions
    .slice(-count)
    .map((s) => s.topic)
    .filter(Boolean);
}

/** 基于测评和练习记录推断强项弱项 */
export function inferStrengthWeakness(
  assessments: AssessmentRecord[]
): LearningProfile["strengthWeakness"] {
  const latest = assessments[assessments.length - 1];
  if (!latest) return [];
  const entries = Object.entries(latest.scores) as [string, number | undefined][];
  return entries
    .filter(([, score]) => typeof score === "number")
    .map(([skill, score]) => {
      const s = score ?? 0;
      let status: "strong" | "weak" | "neutral" = "neutral";
      if (s >= 80) status = "strong";
      else if (s <= 60) status = "weak";
      return { skill, status };
    });
}

/** 根据历史数据生成学习画像 */
export function buildLearningProfile(
  errors: ErrorItem[],
  sessions: PracticeRecord[],
  assessments: AssessmentRecord[]
): LearningProfile {
  return {
    commonErrors: getCommonErrors(errors, 5),
    recentTopics: summarizeRecentSessions(sessions, 5),
    strengthWeakness: inferStrengthWeakness(assessments),
    updatedAt: new Date().toISOString(),
  };
}

/** 把学习画像和近期错题压缩成一段 AI 可用的上下文 */
export function buildMemoryContext(
  errors: ErrorItem[],
  sessions: PracticeRecord[],
  assessments: AssessmentRecord[]
): string {
  const profile = buildLearningProfile(errors, sessions, assessments);
  if (profile.commonErrors.length === 0 && profile.strengthWeakness.length === 0) {
    return "";
  }

  const parts: string[] = [];
  if (profile.strengthWeakness.length > 0) {
    const sw = profile.strengthWeakness
      .map(({ skill, status }) => `${skill}:${status}`)
      .join(", ");
    parts.push(`User skill summary: ${sw}.`);
  }
  if (profile.commonErrors.length > 0) {
    const ce = profile.commonErrors
      .map((e) => `${e.type}(×${e.count}, e.g. "${e.examples.join(", ")}")`)
      .join("; ");
    parts.push(`Frequent errors: ${ce}.`);
  }
  if (profile.recentTopics.length > 0) {
    parts.push(`Recent topics: ${profile.recentTopics.join("; ")}.`);
  }

  return parts.join("\n");
}

/** 生成周期性学习小结 Prompt */
export function buildSummaryPrompt(
  profile: { target: string; level: string } | null,
  sessions: PracticeRecord[],
  errors: ErrorItem[],
  customPrompt?: string
): string {
  const periodSessions = sessions.slice(-20);
  const periodErrors = errors.slice(-20);
  const target = profile ? `${profile.target} at ${profile.level}` : "Unknown";

  if (customPrompt) {
    return renderPromptTemplate(customPrompt, {
      target,
      level: profile?.level ?? "Unknown",
      sessionCount: periodSessions.length,
      errorCount: periodErrors.length,
      recentTopics: periodSessions.map((s) => s.topic).join(", ") || "N/A",
      commonErrors:
        getCommonErrors(periodErrors, 3)
          .map((e) => `${e.type}(×${e.count})`)
          .join(", ") || "N/A",
    });
  }

  return `You are an encouraging English learning coach. Summarize the user's recent learning progress.

User: ${profile ? `${profile.target} at ${profile.level}` : "Unknown"}
Sessions in period: ${periodSessions.length}
Errors in period: ${periodErrors.length}
Recent topics: ${periodSessions.map((s) => s.topic).join(", ") || "N/A"}
Common error types: ${getCommonErrors(periodErrors, 3)
    .map((e) => `${e.type}(×${e.count})`)
    .join(", ") || "N/A"}

Return a JSON object with this exact shape:
{
  "summary": "brief overall progress in Chinese (2-3 sentences)",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "nextSteps": ["actionable suggestion 1", "actionable suggestion 2"]
}

Return only valid JSON, no markdown.`;
}
