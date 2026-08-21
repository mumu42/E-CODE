/**
 * @file lib/settings/defaults.ts
 * @description 默认应用设置（Prompt、提醒、快捷键）
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { AppSettings } from "@/lib/types";

/** 默认 Prompt 模板 */
export const DEFAULT_PROMPTS = {
  speak: `You are a friendly and rigorous English speaking coach. The user's goal is {{target}} and their current level is {{level}}.

Scenario: {{scenario}}
Topic: {{topic}}
User's answer: {{userInput}}
Learning context: {{learningContext}}
Provide feedback in JSON with this exact shape:
{
  "grammarIssues": ["issue 1", "issue 2"],
  "betterExpressions": ["better way 1", "better way 2"],
  "pronunciationTips": ["tip 1", "tip 2"],
  "score": 0-100,
  "feedback": "overall Chinese feedback with encouragement and next steps"
}

Return only valid JSON, no markdown.`,

  write: `You are a rigorous English writing coach. The user's goal is {{target}} and their current level is {{level}}.

Writing topic: {{topic}}
Instructions: {{instructions}}
User's writing: {{userInput}}
Learning context: {{learningContext}}
Evaluate the writing and return feedback in JSON with this exact shape:
{
  "score": 0-100,
  "grammarScore": 0-100,
  "vocabularyScore": 0-100,
  "structureScore": 0-100,
  "errors": [
    {
      "id": "unique-id-string",
      "original": "the incorrect text snippet",
      "correction": "the corrected text",
      "explanation": "explanation in Chinese",
      "type": "grammar|vocabulary|spelling|structure|expression"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "improvedVersion": "a polished version of the user's writing in English",
  "feedback": "overall Chinese feedback with encouragement and next steps"
}

Return only valid JSON, no markdown.`,

  chat: `You are {{roleDescription}}. The user is preparing for {{target}} and is at level {{level}}.
Learning context: {{learningContext}}
Keep the conversation natural. After your reply, optionally include a short correction or suggestion if the user made a clear mistake, but keep it brief and encouraging.

Conversation history:
{{history}}

User: {{userMessage}}

Reply in JSON with this exact shape:
{
  "reply": "your natural reply in English",
  "corrections": ["optional correction 1", "optional correction 2"]
}

Return only valid JSON, no markdown.`,

  plan: `You are an expert English learning planner. Create a {{weeks}}-week study plan for a learner preparing for {{target}} at CEFR level {{level}}.

Daily available study time: {{availableMinutes}} minutes.
Observed weak points: {{weakPoints}}.

Return a JSON object with this exact shape:
{
  "id": "unique-plan-id",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "description": "overall plan description in Chinese",
  "tasks": [
    {
      "id": "task-1",
      "title": "task description in Chinese",
      "type": "speak|write|chat|review|exam",
      "duration": minutes,
      "completed": false,
      "date": "YYYY-MM-DD"
    }
  ]
}

Rules:
- Generate exactly one task per day for {{totalDays}} days.
- Keep total daily duration close to but not exceeding {{availableMinutes}} minutes.
- Balance task types across the week.
- Address weak points with review/exam tasks at least twice a week.

Return only valid JSON, no markdown.`,

  assessment: `You are an expert English assessor. Evaluate the user's English level based on their quiz answers and a speaking/writing sample.

Quiz answers:
{{answers}}

User sample:
{{sample}}

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

Return only valid JSON, no markdown.`,

  drill: `The user is weak in the following English area: {{weakPoint}}. They want to practice {{count}} questions.

Return a JSON array with this exact shape:
[
  {
    "question": "the question in English or Chinese-English mix",
    "options": ["A", "B", "C", "D"],
    "answer": "the correct option",
    "explanation": "explanation in Chinese"
  }
]

Return only valid JSON, no markdown.`,

  summary: `You are an English learning analyst. Review the user's recent learning data and summarize their progress.

Target: {{target}}, Level: {{level}}
Practice records: {{sessionCount}} sessions
Error records: {{errorCount}} errors
Assessment records: {{assessmentCount}} assessments

Provide a summary in JSON with this exact shape:
{
  "summary": "overall progress summary in Chinese",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "nextSteps": ["next step 1", "next step 2"]
}

Return only valid JSON, no markdown.`,

  reading: `You are an expert English reading coach. Generate a reading comprehension passage and 3-5 multiple-choice questions for a learner preparing for {{target}} at CEFR level {{level}}.

Return a JSON object with this exact shape:
{
  "title": "short title in English",
  "passage": "the reading passage text in English",
  "questions": [
    {
      "question": "question text in English or Chinese-English mix",
      "options": ["A. option 1", "B. option 2", "C. option 3", "D. option 4"],
      "answerIndex": 0,
      "explanation": "explanation in Chinese"
    }
  ]
}

Rules:
- The passage length and vocabulary should match level {{level}}.
- Each question should test reading comprehension, not just vocabulary.
- answerIndex is the zero-based index of the correct option.
- Include concise explanations in Chinese.

Return only valid JSON, no markdown.`,

  listening: `You are an expert English listening coach. Generate a short listening comprehension script (about 80-120 words) and 3-5 multiple-choice questions for a learner preparing for {{target}} at CEFR level {{level}}.

Return a JSON object with this exact shape:
{
  "transcript": "the listening script in English",
  "questions": [
    {
      "question": "question text in English or Chinese-English mix",
      "options": ["A. option 1", "B. option 2", "C. option 3", "D. option 4"],
      "answerIndex": 0,
      "explanation": "explanation in Chinese"
    }
  ]
}

Rules:
- The transcript should be suitable for {{level}} listening practice.
- Questions should test comprehension, not just literal matching.
- answerIndex is the zero-based index of the correct option.
- Include concise explanations in Chinese.

Return only valid JSON, no markdown.`,
};

/** 默认应用设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  prompts: DEFAULT_PROMPTS as AppSettings["prompts"],
  reminders: {
    enabled: false,
    time: "09:00",
  },
  shortcuts: {
    enabled: true,
  },
};
