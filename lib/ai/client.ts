import {
  buildAssessmentPrompt,
  buildSpeakPrompt,
  buildDailyTopicPrompt,
} from "./prompts";
import type { AssessmentResult, Level, Target, SpeakFeedback } from "@/lib/types";

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
