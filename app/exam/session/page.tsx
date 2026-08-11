/**
 * @file app/exam/session/page.tsx
 * @description 模拟考试会话入口（Suspense 包装）
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { Suspense } from "react";
import { ExamSession } from "@/components/ExamSession";

/** 模拟考试会话入口 */
export default function ExamSessionPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">正在加载试卷...</div>}>
      <ExamSession />
    </Suspense>
  );
}
