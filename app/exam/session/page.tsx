/**
 * @file app/exam/session/page.tsx
 * @description 模拟考试会话入口（Suspense 包装）
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { Suspense } from "react";
import { ExamSession } from "@/components/ExamSession";

/** 模拟考试会话入口 */
export default function ExamSessionPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">{t("\u6B63\u5728\u52A0\u8F7D\u8BD5\u5377...")}</div>}>
      <ExamSession />
    </Suspense>);

}