import {
  buildAssessmentPrompt,
  buildSpeakPrompt,
  buildDailyTopicPrompt,
  buildWritePrompt,
  buildWritingTopicPrompt,
  buildChatPrompt,
  buildWeakPointDrillPrompt,
} from "./prompts";
import type {
  AssessmentResult,
  Level,
  Target,
  SpeakFeedback,
  WritingTopic,
  WritingFeedback,
  ChatRole,
  DrillQuestion,
} from "@/lib/types";

function safeParseJson<T>(text: string): T | null {
  try {
    // Sometimes the AI wraps JSON in markdown code fences
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export async function assessLevel(
  answers: Record<string, string>,
  sample: string
): Promise<AssessmentResult> {
  const res = await fetch("/api/ai/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildAssessmentPrompt(answers, sample) }),
  });

  if (!res.ok) {
    throw new Error("Assessment failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<AssessmentResult>(result);
  if (!parsed) {
    throw new Error("Failed to parse assessment result");
  }
  return parsed;
}

export async function getSpeakFeedback(
  target: Target,
  level: Level,
  topic: string,
  scenario: string,
  userInput: string
): Promise<SpeakFeedback> {
  const res = await fetch("/api/ai/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildSpeakPrompt(target, level, topic, scenario, userInput),
    }),
  });

  if (!res.ok) {
    throw new Error("Feedback failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<SpeakFeedback>(result);
  if (!parsed) {
    throw new Error("Failed to parse feedback result");
  }
  return parsed;
}

export async function generateDailyTopic(
  target: Target,
  level: Level
): Promise<{ topic: string; scenario: string; hints: string[] }> {
  const res = await fetch("/api/ai/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildDailyTopicPrompt(target, level),
    }),
  });

  if (!res.ok) {
    throw new Error("Topic generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<{ topic: string; scenario: string; hints: string[] }>(result);
  if (!parsed) {
    throw new Error("Failed to parse topic result");
  }
  return parsed;
}

export async function generateWritingTopic(target: Target, level: Level): Promise<WritingTopic> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildWritingTopicPrompt(target, level),
    }),
  });

  if (!res.ok) {
    throw new Error("Writing topic generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<WritingTopic>(result);
  if (!parsed) {
    throw new Error("Failed to parse writing topic");
  }
  return parsed;
}

export async function getWritingFeedback(
  target: Target,
  level: Level,
  topic: string,
  instructions: string,
  userInput: string
): Promise<WritingFeedback> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildWritePrompt(target, level, topic, instructions, userInput),
    }),
  });

  if (!res.ok) {
    throw new Error("Writing feedback failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<WritingFeedback>(result);
  if (!parsed) {
    throw new Error("Failed to parse writing feedback");
  }
  return parsed;
}

export async function sendChatMessage(
  target: Target,
  level: Level,
  role: ChatRole,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<{ reply: string; corrections: string[] }> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildChatPrompt(target, level, role, history, userMessage),
    }),
  });

  if (!res.ok) {
    throw new Error("Chat failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<{ reply: string; corrections: string[] }>(result);
  if (!parsed) {
    throw new Error("Failed to parse chat result");
  }
  return parsed;
}

export async function generateWeakPointDrill(
  weakPoint: string,
  count: number
): Promise<DrillQuestion[]> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildWeakPointDrillPrompt(weakPoint, count),
    }),
  });

  if (!res.ok) {
    throw new Error("Drill generation failed");
  }

  const { result } = (await res.json()) as { result: string };
  const parsed = safeParseJson<DrillQuestion[]>(result);
  if (!parsed) {
    throw new Error("Failed to parse drill result");
  }
  return parsed;
}
