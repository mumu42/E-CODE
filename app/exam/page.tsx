/**
 * @file app/exam/page.tsx
 * @description 模拟考试入口：选择考试类型并开始模考
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { EXAM_CONFIGS, type ExamType } from "@/lib/exam/questions";
import { parseQuestionBank } from "@/lib/exam/import";
import { Clock, BookOpen, Upload, Target, FileText } from "lucide-react";
import Link from "next/link";

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
        <h1 className="text-2xl font-bold mb-4">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u6863\u6848")}</h1>
        <p className="text-gray-600 mb-6">{t("\u8BF7\u5148\u5B8C\u6210\u76EE\u6807\u9009\u62E9\u548C\u7EA7\u522B\u6D4B\u8BC4\u3002")}</p>
        <Button onClick={() => router.push("/onboarding")}>{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
      </div>);

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
      setImportResult({ success: 0, errors: [t("导入失败")] });
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
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{t("\u6A21\u62DF\u8003\u8BD5")}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">{t("\u9009\u62E9\u4E00\u79CD\u8003\u8BD5\u7C7B\u578B\uFF0C\u8FDB\u884C\u9650\u65F6\u8BAD\u7EC3\u3002")}

      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {EXAM_CONFIGS.map((item) =>
        <Card
          key={item.type}
          className={`cursor-pointer transition-colors ${
          selected === item.type ?
          "border-primary ring-1 ring-primary bg-primary/5" :
          "hover:bg-gray-50 dark:hover:bg-gray-800"}`
          }
          onClick={() => setSelected(item.type)}>
          
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {item.label}
              </CardTitle>
              <CardDescription>
                {item.questionCount}{t("\u9898 \xB7 \u5EFA\u8BAE")}{item.duration}{t("\u5206\u949F")}
            </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("\u603B\u5206")}
            {item.questionCount * item.scorePerQuestion}{t("\u5206")}
          </CardContent>
          </Card>
        )}
      </div>

      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4" />{t("\u5168\u771F\u9650\u65F6\u6A21\u8003")}

            </p>
            <p className="text-sm text-muted-foreground">{t("45 \u5206\u949F \xB7 \u9605\u8BFB/\u542C\u529B/\u5199\u4F5C/\u53E3\u8BED \xB7 AI \u81EA\u52A8\u8BC4\u5206")}

            </p>
          </div>
          <Link href="/exam/full">
            <Button size="lg">{t("\u8FDB\u5165\u5168\u771F\u6A21\u8003")}</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4" />{t("\u771F\u9898\u6A21\u8003")}

            </p>
            <p className="text-sm text-muted-foreground">{t("CET / IELTS / TOEFL \u771F\u9898 \xB7 \u771F\u5B9E\u8003\u8BD5\u65F6\u95F4 \xB7 \u81EA\u52A8\u4EA4\u5377")}

            </p>
          </div>
          <Link href="/exam/real">
            <Button size="lg">{t("\u8FDB\u5165\u771F\u9898\u6A21\u8003")}</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />{t("\u4E13\u9879\u771F\u9898\u8BAD\u7EC3")}

            </p>
            <p className="text-sm text-muted-foreground">{t("\u6309\u8003\u8BD5\u7C7B\u578B/\u5E74\u4EFD/\u9898\u578B/\u96BE\u5EA6\u7B5B\u9009\u771F\u9898\u7EC3\u4E60")}

            </p>
          </div>
          <Link href="/exam/real/training">
            <Button variant="outline" size="lg">{t("\u5F00\u59CB\u4E13\u9879\u8BAD\u7EC3")}

            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u81EA\u5B9A\u4E49\u9898\u5E93")}</CardTitle>
          <CardDescription>{t("\u5DF2\u5BFC\u5165")}
            {customQuestions.length}{t("\u9053\u9898\u76EE\uFF08\u5BA2\u89C2\u9898")}{objectiveCount}{t("\uFF0C\u4E3B\u89C2\u9898")}{productiveCount}）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".json,.xlsx,.xls"
            ref={inputRef}
            className="hidden"
            onChange={handleImport} />
          
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={importing}>
            
            <Upload className="w-4 h-4 mr-2" />
            {importing ? t("\u5BFC\u5165\u4E2D...") : t("\u5BFC\u5165 JSON / Excel \u9898\u5E93")}
          </Button>
          {importResult &&
          <div className="text-sm space-y-1">
              <p>{t("\u6210\u529F\u5BFC\u5165")}
              {importResult.success}{t("\u9053\u9898")}
              {importResult.errors.length > 0 &&
              <span className="text-red-600 ml-2">{t("\u5931\u8D25")}
                {importResult.errors.length}{t("\u9053")}
              </span>
              }
              </p>
              {importResult.errors.length > 0 &&
            <ul className="text-red-600 list-disc list-inside">
                  {importResult.errors.slice(0, 5).map((err, idx) =>
              <li key={idx}>{err}</li>
              )}
                </ul>
            }
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4" />{t("\u5DF2\u9009\u62E9\uFF1A")}
              {config.label}
            </p>
            <p className="text-sm text-muted-foreground">{t("\u9650\u65F6")}
              {config.duration}{t("\u5206\u949F\uFF0C\u5171")}{config.questionCount}{t("\u9898")}
            </p>
          </div>
          <Button onClick={startExam} size="lg">{t("\u5F00\u59CB\u8003\u8BD5")}

          </Button>
        </CardContent>
      </Card>
    </div>);

}