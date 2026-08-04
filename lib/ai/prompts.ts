import type { Level, Target } from "@/lib/types";

export function buildAssessmentPrompt(answers: Record<string, string>, sample: string) {
  return `You are an expert English assessor. Evaluate the user's English level based on their quiz answers and a speaking/writing sample.

Quiz answers:
${Object.entries(answers)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

User sample:
${sample}

Output a JSON object with this exact shape:
{
  "level": "A1|A2|B1|B2|C1|C2",
  "scores": {
    "listening": 0-100,
    "speaking": 0-100,
    "reading": 0-100,
    "writing": 0-100,
    "grammar": 0-100
  },
  "feedback": "brief Chinese feedback about the user's level and what to focus on"
}

Return only valid JSON, no markdown.`;
}

export function buildSpeakPrompt(target: Target, level: Level, topic: string, scenario: string, userInput: string) {
  return `You are a friendly and rigorous English speaking coach. The user's goal is ${target} and their current level is ${level}.

Scenario: ${scenario}
Topic: ${topic}
User's answer: ${userInput}

Provide feedback in JSON with this exact shape:
{
  "grammarIssues": ["issue 1", "issue 2"],
  "betterExpressions": ["better way 1", "better way 2"],
  "pronunciationTips": ["tip 1", "tip 2"],
  "score": 0-100,
  "feedback": "overall Chinese feedback with encouragement and next steps"
}

Return only valid JSON, no markdown.`;
}

export function buildDailyTopicPrompt(target: Target, level: Level) {
  return `Generate a daily English speaking practice topic for a learner preparing for ${target} at level ${level}.

Return a JSON object with this exact shape:
{
  "topic": "a clear English speaking question or prompt",
  "scenario": "context describing the situation (e.g., IELTS Speaking Part 2)",
  "hints": ["hint 1", "hint 2", "hint 3"]
}

Return only valid JSON, no markdown.`;
}
