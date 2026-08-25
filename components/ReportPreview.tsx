import { formatDate } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate"; /**
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
    const sessions = data.sessions.
    slice().
    sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalScore =
    sessions.length > 0 ?
    Math.round(
      sessions.reduce(
        (sum, s) => sum + (s.fluencyScore || s.grammarScore || 0),
        0
      ) / sessions.length
    ) :
    0;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 w-[210mm] min-h-[297mm]"
        style={{ fontFamily: "sans-serif" }}>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("\u82F1\u8BED\u5B66\u4E60\u62A5\u544A")}</h1>
          <p className="text-sm text-gray-600">{t("\u751F\u6210\u65F6\u95F4\uFF1A")}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">{t("\u7528\u6237\u76EE\u6807")}</p>
            <p className="text-lg font-semibold">{data.profile?.target || "-"}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">{t("\u5F53\u524D\u7EA7\u522B")}</p>
            <p className="text-lg font-semibold">{data.profile?.level || "-"}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">{t("\u603B\u7EC3\u4E60\u6B21\u6570")}</p>
            <p className="text-lg font-semibold">{sessions.length}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">{t("\u5E73\u5747\u8BC4\u5206")}</p>
            <p className="text-lg font-semibold">{totalScore}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">{t("\u7EC3\u4E60\u8BB0\u5F55")}</h2>
        <div className="space-y-4">
          {sessions.slice(0, 20).map((session) =>
          <div key={session.id} className="border-b pb-4">
              <p className="font-semibold text-sm">
                {formatDate(session.date)} -{" "}
                {session.type === "SPEAK" ? t("\u53E3\u8BED") :

              session.type === "WRITE" ? t("\u5199\u4F5C") : t("\u5BF9\u8BDD")

              }{" "}
                · {session.topic}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">{t("\u7528\u6237\u8F93\u5165\uFF1A")}</span>
                {session.userInput}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">{t("AI \u53CD\u9988\uFF1A")}</span>
                {session.aiFeedback}
              </p>
            </div>
          )}
          {sessions.length === 0 &&
          <p className="text-sm text-gray-500">{t("\u6682\u65E0\u7EC3\u4E60\u8BB0\u5F55")}</p>
          }
        </div>
      </div>);

  }
);

ReportPreview.displayName = "ReportPreview";