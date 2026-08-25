/**
 * @file lib/exam/real/seed.ts
 * @description 自动生成的真题样例题库补充（用于演示与测试）
 * @author English Agent Team
 * @date 2026-08-25
 */

import type { ExamQuestion } from "@/lib/types";
import type { RealExamType } from "./bank";

const years = ["2023", "2024"];

const readingPassages = [
  {
    passage:
      "The rapid growth of online shopping has transformed consumer behavior. While it offers convenience and lower prices, it also raises concerns about product quality and environmental impact from packaging.",
    question: "What is a concern associated with online shopping?",
    options: [
      "It is too expensive.",
      "It harms the environment due to packaging.",
      "It is inconvenient.",
      "It always provides high-quality products.",
    ],
    answer: "It harms the environment due to packaging.",
    explanation:
      "The passage mentions environmental impact from packaging as a concern.",
  },
  {
    passage:
      "Regular physical exercise is widely recognized as essential for maintaining good health. It not only strengthens the body but also improves mental well-being by reducing stress and anxiety.",
    question: "According to the passage, what is one benefit of exercise?",
    options: [
      "It increases stress.",
      "It weakens the body.",
      "It improves mental well-being.",
      "It has no effect on health.",
    ],
    answer: "It improves mental well-being.",
    explanation:
      "The passage states that exercise improves mental well-being by reducing stress and anxiety.",
  },
  {
    passage:
      "Many cities are investing in public transportation to reduce traffic congestion and air pollution. Buses and trains are generally more energy-efficient per passenger than private cars.",
    question: "Why are cities investing in public transportation?",
    options: [
      "To increase traffic jams.",
      "To reduce congestion and pollution.",
      "To encourage car ownership.",
      "To make travel more expensive.",
    ],
    answer: "To reduce congestion and pollution.",
    explanation:
      "The passage explains that public transportation helps reduce traffic congestion and air pollution.",
  },
];

const listeningItems = [
  {
    question: "Listen to the conversation. Why is the woman late?",
    options: [
      "She missed the bus.",
      "Her car broke down.",
      "She overslept.",
      "She got lost.",
    ],
    answer: "Her car broke down.",
    explanation: "The woman explains that her car stopped working on the way.",
  },
  {
    question: "Listen to the dialogue. What does the man suggest?",
    options: [
      "Going to a restaurant.",
      "Watching a movie.",
      "Studying together.",
      "Taking a walk.",
    ],
    answer: "Studying together.",
    explanation: "The man suggests they prepare for the exam together.",
  },
  {
    question: "Listen to the talk. What is the main topic?",
    options: [
      "A famous scientist.",
      "A new technology.",
      "A historical event.",
      "A travel destination.",
    ],
    answer: "A new technology.",
    explanation: "The talk focuses on a recently developed technology.",
  },
];

const writingPrompts = [
  "Some people think that social media has more benefits than drawbacks. Do you agree or disagree? Give reasons and examples.",
  "Write an essay discussing whether students should have homework every day. Include your opinion and supporting arguments.",
];

const speakingPrompts = [
  "Describe your favorite hobby. You should say: what it is, when you started it, and why you enjoy it.",
  "Talk about an important decision you made. Explain what the decision was and how it affected your life.",
];

const examSettings: Record<
  RealExamType,
  { readingScore: number; listeningScore: number; writingScore: number; speakingScore: number; writingTime: number; speakingTime: number }
> = {
  CET4: { readingScore: 7.5, listeningScore: 7.5, writingScore: 20, speakingScore: 10, writingTime: 30, speakingTime: 5 },
  CET6: { readingScore: 7.5, listeningScore: 7.5, writingScore: 20, speakingScore: 10, writingTime: 30, speakingTime: 5 },
  IELTS: { readingScore: 5, listeningScore: 5, writingScore: 20, speakingScore: 15, writingTime: 40, speakingTime: 10 },
  TOEFL: { readingScore: 5, listeningScore: 5, writingScore: 20, speakingScore: 15, writingTime: 30, speakingTime: 10 },
};

function createId(type: RealExamType, year: string, section: string, index: number) {
  return `${type.toLowerCase()}-${year}-${section}-${index + 1}`;
}

export function seedRealExamQuestions(type: RealExamType): ExamQuestion[] {
  const settings = examSettings[type];
  const questions: ExamQuestion[] = [];

  readingPassages.forEach((item, index) => {
    years.forEach((year) => {
      questions.push({
        id: createId(type, year, "reading", index),
        type: "reading",
        section: "reading",
        examType: type,
        year,
        source: "official",
        difficulty: ["easy", "medium", "hard"][index % 3] as "easy" | "medium" | "hard",
        passage: item.passage,
        question: item.question,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        score: settings.readingScore,
      });
    });
  });

  listeningItems.forEach((item, index) => {
    years.forEach((year) => {
      questions.push({
        id: createId(type, year, "listening", index),
        type: "listening",
        section: "listening",
        examType: type,
        year,
        source: "official",
        difficulty: ["easy", "medium", "hard"][index % 3] as "easy" | "medium" | "hard",
        question: item.question,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        score: settings.listeningScore,
      });
    });
  });

  writingPrompts.forEach((prompt, index) => {
    years.forEach((year) => {
      questions.push({
        id: createId(type, year, "writing", index),
        type: "writing",
        section: "writing",
        examType: type,
        year,
        source: "official",
        difficulty: "medium",
        question: prompt,
        score: settings.writingScore,
        timeLimit: settings.writingTime,
      });
    });
  });

  speakingPrompts.forEach((prompt, index) => {
    years.forEach((year) => {
      questions.push({
        id: createId(type, year, "speaking", index),
        type: "speaking",
        section: "speaking",
        examType: type,
        year,
        source: "official",
        difficulty: "medium",
        question: prompt,
        score: settings.speakingScore,
        timeLimit: settings.speakingTime,
      });
    });
  });

  return questions;
}
