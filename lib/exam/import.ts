/**
 * @file lib/exam/import.ts
 * @description 本地题库导入与校验工具
 * @author English Agent Team
 * @date 2026-08-17
 */

import * as XLSX from "xlsx";
import type { ExamQuestion, ExamQuestionType } from "@/lib/types";

const EXAM_QUESTION_TYPES: ExamQuestionType[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];

/** 校验单个题目是否合法，返回错误信息或 null */
function validateQuestion(item: unknown, index: number): string | null {
  if (!item || typeof item !== "object") {
    return `第 ${index + 1} 题不是对象`;
  }
  const q = item as Record<string, unknown>;
  if (typeof q.id !== "string" || !q.id.trim()) {
    return `第 ${index + 1} 题缺少有效 id`;
  }
  if (typeof q.question !== "string" || !q.question.trim()) {
    return `第 ${index + 1} 题缺少有效 question`;
  }
  if (!EXAM_QUESTION_TYPES.includes(q.type as ExamQuestionType)) {
    return `第 ${index + 1} 题 type 不合法：${q.type}`;
  }
  if (typeof q.score !== "number" || q.score <= 0) {
    return `第 ${index + 1} 题 score 必须是正数`;
  }
  return null;
}

/** 清洗题目数据，补全可选字段 */
function normalizeQuestion(item: ExamQuestion): ExamQuestion {
  return {
    id: String(item.id),
    type: item.type,
    question: String(item.question),
    options: Array.isArray(item.options) ? item.options.map(String) : undefined,
    answer: item.answer !== undefined ? String(item.answer) : undefined,
    explanation:
      item.explanation !== undefined ? String(item.explanation) : undefined,
    score: Number(item.score),
    timeLimit:
      item.timeLimit !== undefined ? Number(item.timeLimit) : undefined,
    passage: item.passage !== undefined ? String(item.passage) : undefined,
    target: item.target,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : undefined,
    source: item.source,
    examType: item.examType !== undefined ? String(item.examType) : undefined,
    year: item.year !== undefined ? String(item.year) : undefined,
    section: item.section,
    difficulty: item.difficulty,
  };
}

/** 解析 JSON 格式题库 */
export function parseQuestionBankJson(text: string): {
  questions: ExamQuestion[];
  errors: string[];
} {
  const questions: ExamQuestion[] = [];
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (!Array.isArray(list)) {
      return { questions: [], errors: ["JSON 格式错误：顶层应为数组或包含 questions 数组"] };
    }

    list.forEach((item, index) => {
      const error = validateQuestion(item, index);
      if (error) {
        errors.push(error);
      } else {
        questions.push(normalizeQuestion(item as ExamQuestion));
      }
    });
  } catch {
    errors.push("JSON 解析失败");
  }

  return { questions, errors };
}

/** 解析 Excel 格式题库 */
export async function parseQuestionBankExcel(file: File): Promise<{
  questions: ExamQuestion[];
  errors: string[];
}> {
  const questions: ExamQuestion[] = [];
  const errors: string[] = [];

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames.includes("questions")
          ? "questions"
          : workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          resolve({ questions: [], errors: ["Excel 中没有可读取的 sheet"] });
          return;
        }
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        rows.forEach((row, index) => {
          const item: Record<string, unknown> = {
            id: row.id ?? row.ID ?? row.题目ID ?? crypto.randomUUID(),
            type: row.type ?? row.题型 ?? "reading",
            question: row.question ?? row.题干 ?? row.questionText ?? "",
            options: row.options
              ? String(row.options).split(/[,，;；]/)
              : undefined,
            answer: row.answer ?? row.答案 ?? undefined,
            explanation: row.explanation ?? row.解析 ?? undefined,
            score: Number(row.score ?? row.分值 ?? 1),
            timeLimit: row.timeLimit ?? row.限时 ?? undefined,
            passage: row.passage ?? row.材料 ?? undefined,
            target: row.target ?? row.目标 ?? undefined,
            tags: row.tags
              ? String(row.tags).split(/[,，;；]/)
              : undefined,
          };
          const error = validateQuestion(item, index);
          if (error) {
            errors.push(error);
          } else {
            questions.push(normalizeQuestion(item as unknown as ExamQuestion));
          }
        });
        resolve({ questions, errors });
      } catch {
        resolve({ questions: [], errors: ["Excel 解析失败"] });
      }
    };
    reader.onerror = () => {
      resolve({ questions: [], errors: ["读取 Excel 文件失败"] });
    };
    reader.readAsArrayBuffer(file);
  });
}

/** 根据文件类型解析题库 */
export async function parseQuestionBank(file: File): Promise<{
  questions: ExamQuestion[];
  errors: string[];
}> {
  if (file.name.endsWith(".json")) {
    const text = await file.text();
    return parseQuestionBankJson(text);
  }
  return parseQuestionBankExcel(file);
}
