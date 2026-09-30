import type { ChatSession, ErrorItem, UserProfile } from "@/lib/types";

interface AggregatedReview {
  original: string;
  fullCorrection: string;
  corrections: string[];
  pronunciationTips: string[];
  date: string;
}

/**
 * 通过对比 original 和 fullCorrection 推断主要错误类型
 */
function inferErrorTypeFromDiff(original: string, fullCorrection: string): ErrorItem["errorType"] {
  if (!fullCorrection) return "grammar";

  const origWords = original.toLowerCase().split(/\s+/);
  const corrWords = fullCorrection.toLowerCase().split(/\s+/);

  // 统计词汇替换（不同且不是常见的语法虚词变化）
  let wordChanges = 0;
  let grammarChanges = 0;

  const minLen = Math.min(origWords.length, corrWords.length);
  for (let i = 0; i < minLen; i++) {
    if (origWords[i] !== corrWords[i]) {
      // 判断是否为词汇错误（实词替换）还是语法错误（虚词/词形变化）
      const isGrammarOnly =
        /^(the|a|an|is|am|are|was|were|have|has|had|do|does|did|will|would|can|could|may|might|shall|should|to|of|in|on|at|for|with|by|i|you|he|she|it|we|they)$/i.test(origWords[i]) ||
        /^(the|a|an|is|am|are|was|were|have|has|had|do|does|did|will|would|can|could|may|might|shall|should|to|of|in|on|at|for|with|by|i|you|he|she|it|we|they)$/i.test(corrWords[i]) ||
        origWords[i].endsWith("ed") || origWords[i].endsWith("ing") || origWords[i].endsWith("s") ||
        corrWords[i].endsWith("ed") || corrWords[i].endsWith("ing") || corrWords[i].endsWith("s");

      if (isGrammarOnly) grammarChanges++;
      else wordChanges++;
    }
  }

  if (wordChanges > grammarChanges) return "vocabulary";
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

    if (!original) return;

    const existing = map.get(original) ?? {
      original,
      fullCorrection: "",
      corrections: [],
      pronunciationTips: [],
      date: session.updatedAt ?? session.createdAt,
    };

    // 优先使用 AI 返回的完整修正句，后面的消息覆盖前面的
    if (msg.fullCorrection) {
      existing.fullCorrection = msg.fullCorrection;
    }

    msg.corrections?.forEach((c) => existing.corrections.push(c));
    msg.pronunciationTips?.forEach((t) => existing.pronunciationTips.push(t));

    map.set(original, existing);
  });

  const errors: ErrorItem[] = [];

  map.forEach((item) => {
    const parts: string[] = [];
    item.corrections.forEach((c) => parts.push(`• ${c}`));
    item.pronunciationTips.forEach((t) => parts.push(`• ${t}`));

    if (parts.length === 0 && !item.fullCorrection) return;

    const explanation = parts.join("\n");
    const errorType = item.fullCorrection
      ? inferErrorTypeFromDiff(item.original, item.fullCorrection)
      : "grammar";

    errors.push({
      id: crypto.randomUUID(),
      userId: profile.id,
      sessionId: session.id,
      type: "CHAT",
      date: item.date,
      original: item.original,
      correction: item.fullCorrection || item.corrections[0] || "",
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
