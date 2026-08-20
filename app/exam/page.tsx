/**
 * @file app/exam/page.tsx
 * @description 模拟考试入口：选择考试类型并开始模考
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EXAM_CONFIGS, type ExamType } from "@/lib/exam/questions";
import { parseQuestionBank } from "@/lib/exam/import";
import { Clock, BookOpen, Upload } from "lucide-react";

/** 模拟考试入口页面 */
export default function ExamPage() {
  const profile = useAppStore((state) => state.profile);
  const router = useRouter();
  const [selected, setSelected] = useState<ExamType>("GENERAL");

  const config = EXAM_CONFIGS.find((c) => c.type === selected) ?? EXAM_CONFIGS[0];
  const customQuestions = useAppStore((state) => state.customQuestions);
  const importQuestionBank = useAppStore((state) => state.importQuestionBank);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">还没有学习档案</h1>
        <p className="text-gray-600 mb-6">请先完成目标选择和级别测评。</p>
        <Button onClick={() => router.push("/onboarding")}>开始学习</Button>
      </div>
    );
  }

  function startExam() {
    router.push(`/exam/session?type=${selected}`);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { questions, errors } = await parseQuestionBank(file);
      if (questions.length > 0) {
        importQuestionBank(questions);
      }
      setImportResult({ success: questions.length, errors });
    } catch {
      setImportResult({ success: 0, errors: ["导入失败"] });
    } finally {
      setImporting(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const objectiveCount = customQuestions.filter(
    (q) => q.type === "reading" || q.type === "listening"
  ).length;
  const productiveCount = customQuestions.filter(
    (q) => q.type === "writing" || q.type === "speaking"
  ).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">模拟考试</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        选择一种考试类型，进行限时训练。
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {EXAM_CONFIGS.map((item) => (
          <Card
            key={item.type}
            className={`cursor-pointer transition-colors ${
              selected === item.type
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            onClick={() => setSelected(item.type)}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {item.label}
              </CardTitle>
              <CardDescription>
                {item.questionCount} 题 · 建议 {item.duration} 分钟
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              总分 {item.questionCount * item.scorePerQuestion} 分
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>自定义题库</CardTitle>
          <CardDescription>
            已导入 {customQuestions.length} 道题目（客观题 {objectiveCount}，主观题 {productiveCount}）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".json,.xlsx,.xls"
            ref={inputRef}
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? "导入中..." : "导入 JSON / Excel 题库"}
          </Button>
          {importResult && (
            <div className="text-sm space-y-1">
              <p>
                成功导入 {importResult.success} 道题
                {importResult.errors.length > 0 && (
                  <span className="text-red-600 ml-2">
                    失败 {importResult.errors.length} 道
                  </span>
                )}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="text-red-600 list-disc list-inside">
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4" />
              已选择：{config.label}
            </p>
            <p className="text-sm text-muted-foreground">
              限时 {config.duration} 分钟，共 {config.questionCount} 题
            </p>
          </div>
          <Button onClick={startExam} size="lg">
            开始考试
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
