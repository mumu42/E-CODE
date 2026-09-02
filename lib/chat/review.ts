import type { ChatSession, ErrorItem, UserProfile } from "@/lib/types";

interface AggregatedReview {
  original: string;
  corrections: string[];
  pronunciationTips: string[];
  date: string;
}

function inferErrorType(text: string): ErrorItem["errorType"] {
  if (/pronunciation|发音/.test(text)) return "pronunciation";
  if (/vocabulary|word|spelling|单词|拼写/.test(text)) return "vocabulary";
  if (/expression|表达|用法/.test(text)) return "expression";
  return "grammar";
}

/**
 * 将 AI 对话中的纠错和发音提示按句子聚合为错题记录
 * @param profile - 当前用户档案
 * @param session - 对话会话
 * @returns 错题记录列表（每个用户句子只生成一条）
 */
export function buildChatReviewErrors(
  profile: UserProfile,
  session: ChatSession
): ErrorItem[] {
  const map = new Map<string, AggregatedReview>();

  session.messages.forEach((msg) => {
    if (msg.role !== "assistant") return;

    const msgIndex = session.messages.indexOf(msg);
    const previousUser = session.messages
      .slice(0, msgIndex)
      .reverse()
      .find((m) => m.role === "user");
    const original = previousUser?.content?.trim() ?? "";

    if (!original && !msg.corrections?.length && !msg.pronunciationTips?.length) return;

    const existing = map.get(original) ?? {
      original,
      corrections: [],
      pronunciationTips: [],
      date: session.updatedAt ?? session.createdAt,
    };

    msg.corrections?.forEach((c) => existing.corrections.push(c));
    msg.pronunciationTips?.forEach((t) => existing.pronunciationTips.push(t));

    map.set(original, existing);
  });

  const errors: ErrorItem[] = [];

  map.forEach((item) => {
    const parts: string[] = [];
    item.corrections.forEach((c) => parts.push(`• ${c}`));
    item.pronunciationTips.forEach((t) => parts.push(`• ${t}`));

    if (parts.length === 0) return;

    const explanation = parts.join("\n");
    const types: ErrorItem["errorType"][] = [
      ...item.corrections.map((c) => inferErrorType(c)),
      ...item.pronunciationTips.map(() => "pronunciation" as const),
    ];
    const typeCounts = new Map<ErrorItem["errorType"], number>();
    types.forEach((t) => typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1));
    const errorType =
      Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "grammar";

    errors.push({
      id: crypto.randomUUID(),
      userId: profile.id,
      sessionId: session.id,
      type: "CHAT",
      date: item.date,
      original: item.original,
      correction: "",
      explanation,
      errorType,
    });
  });

  return errors;
}

/**
 * 对错题按原始句子去重，保留最新的一条
 * @param errors - 错题列表
 * @returns 去重后的错题列表
 */
export function dedupeChatReviewErrors(errors: ErrorItem[]): ErrorItem[] {
  const seen = new Map<string, ErrorItem>();
  errors.forEach((err) => {
    const key = `${err.errorType}:${err.original}`;
    seen.set(key, err);
  });
  return Array.from(seen.values());
}
