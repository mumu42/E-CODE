/**
 * @file app/report/page.tsx
 * @description 学习周报/月报页面
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildWeeklyReport, buildMonthlyReport, type LearningReport } from "@/lib/stats/reports";
import { exportReportToWord } from "@/lib/storage/report";
import { exportReportToPdf } from "@/lib/storage/pdf";
import { ReportPreview } from "@/components/ReportPreview";
import { ArrowLeft, FileText, FileDown, Calendar } from "lucide-react";

/** 学习报告页面 */
export default function ReportPage() {
  const sessions = useAppStore((state) => state.sessions);
  const errors = useAppStore((state) => state.errors);
  const examRecords = useAppStore((state) => state.examRecords);
  const vocabulary = useAppStore((state) => state.vocabulary);
  const checkIns = useAppStore((state) => state.checkIns);

  const [period, setPeriod] = useState<"week" | "month">("week");
  const reportRef = useRef<HTMLDivElement>(null);

  const report: LearningReport = useMemo(() => {
    if (period === "week") {
      return buildWeeklyReport(sessions, errors, examRecords, vocabulary, checkIns);
    }
    return buildMonthlyReport(sessions, errors, examRecords, vocabulary, checkIns);
  }, [period, sessions, errors, examRecords, vocabulary, checkIns]);

  const appData = useAppStore((state) => state) as unknown as Parameters<
    typeof exportReportToWord
  >[0];

  async function handleDownloadWord() {
    try {
      const blob = await exportReportToWord(appData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `english-agent-report-${period}-${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("导出 Word 报告失败");
    }
  }

  async function handleDownloadPdf() {
    if (!reportRef.current) return;
    try {
      await exportReportToPdf(reportRef.current, `english-agent-report-${period}`);
    } catch (error) {
      console.error(error);
      alert("导出 PDF 报告失败");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/progress">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回进度
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">学习报告</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant={period === "week" ? "default" : "outline"}
 onClick={() => setPeriod("week")}>
          周报
        </Button>
        <Button variant={period === "month" ? "default" : "outline"} onClick={() => setPeriod("month")}>
          月报
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            {period === "week" ? "本周报告" : "本月报告"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            统计周期：{report.startDate} 至 {report.endDate}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">练习次数</p>
              <p className="text-2xl font-bold">{report.sessionCount}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">平均得分</p>
              <p className="text-2xl font-bold">{report.averageScore}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">新增错题</p>
              <p className="text-2xl font-bold">{report.newErrors}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">新增词汇</p>
              <p className="text-2xl font-bold">{report.newVocabulary}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">打卡天数</p>
              <p className="text-2xl font-bold">{report.checkInDays}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">模考次数</p>
              <p className="text-2xl font-bold">{report.examCount}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">平均模考分</p>
              <p className="text-2xl font-bold">{report.averageExamScore}</p>
            </div>
          </div>
          {Object.keys(report.sessionsByType).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">练习类型分布</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(report.sessionsByType).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs"
                  >
                    {type === "SPEAK" ? "口语" : type === "WRITE" ? "写作" : type === "CHAT" ? "对话" : type} {count} 次
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 mb-8">
        <Button onClick={handleDownloadWord}>
          <FileText className="w-4 h-4 mr-2" />
          导出 Word
        </Button>
        <Button onClick={handleDownloadPdf} variant="outline">
          <FileDown className="w-4 h-4 mr-2" />
          导出 PDF
        </Button>
      </div>

      <div className="fixed left-[-9999px] top-0">
        <ReportPreview ref={reportRef} data={appData} />
      </div>
    </div>
  );
}
