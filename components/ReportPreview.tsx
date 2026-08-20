/**
 * @file components/ReportPreview.tsx
 * @description 学习报告 PDF 预览组件
 * @author English Agent Team
 * @date 2026-08-17
 */

import { forwardRef } from "react";
import type { AppData } from "@/lib/types";

interface ReportPreviewProps {
  data: AppData;
}

/**
 * 学习报告 PDF 预览组件
 * @example
 * ```tsx
 * <ReportPreview ref={ref} data={appData} />
 * ```
 */
export const ReportPreview = forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ data }, ref) => {
    const sessions = data.sessions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalScore =
      sessions.length > 0
        ? Math.round(
            sessions.reduce(
              (sum, s) => sum + (s.fluencyScore || s.grammarScore || 0),
              0
            ) / sessions.length
          )
        : 0;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 w-[210mm] min-h-[297mm]"
        style={{ fontFamily: "sans-serif" }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">英语学习报告</h1>
          <p className="text-sm text-gray-600">
            生成时间：{new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">用户目标</p>
            <p className="text-lg font-semibold">{data.profile?.target || "-"}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">当前级别</p>
            <p className="text-lg font-semibold">{data.profile?.level || "-"}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">总练习次数</p>
            <p className="text-lg font-semibold">{sessions.length}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">平均评分</p>
            <p className="text-lg font-semibold">{totalScore}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">练习记录</h2>
        <div className="space-y-4">
          {sessions.slice(0, 20).map((session) => (
            <div key={session.id} className="border-b pb-4">
              <p className="font-semibold text-sm">
                {new Date(session.date).toLocaleDateString()} -{" "}
                {session.type === "SPEAK"
                  ? "口语"
                  : session.type === "WRITE"
                    ? "写作"
                    : "对话"}{" "}
                · {session.topic}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">用户输入：</span>
                {session.userInput}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">AI 反馈：</span>
                {session.aiFeedback}
              </p>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-gray-500">暂无练习记录</p>
          )}
        </div>
      </div>
    );
  }
);

ReportPreview.displayName = "ReportPreview";
