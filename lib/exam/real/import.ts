/**
 * @file lib/exam/real/import.ts
 * @description 真题题库导入工具
 * @author English Agent Team
 * @date 2026-08-24
 */

import { parseQuestionBank } from "@/lib/exam/import";
import type { ExamQuestion, ExamQuestionType } from "@/lib/types";

/** 解析真题题库文件 */
export async function parseRealQuestionBank(file: File): Promise<{
  questions: ExamQuestion[];
  errors: string[];
}> {
  const { questions, errors } = await parseQuestionBank(file);
  const normalized = questions.map((q) => ({
    ...q,
    section: (q.section ?? q.type) as ExamQuestionType,
  }));
  return { questions: normalized, errors };
}
