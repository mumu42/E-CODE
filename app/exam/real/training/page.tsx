/**
 * @file app/exam/real/training/page.tsx
 * @description 专项真题训练：按考试类型/年份/题型/难度筛选真题
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { useAppStore } from "@/lib/store";
import {
  getAllRealExamQuestions,
  getRealExamConfigs,
  type RealExamType } from
"@/lib/exam/real/bank";
import { parseRealQuestionBank } from "@/lib/exam/real/import";
import { Upload } from "lucide-react";
import type { ExamQuestion, ExamQuestionType } from "@/lib/types";

const sections: {value: ExamQuestionType;label: string;}[] = [
{ value: "listening", label: "听力" },
{ value: "reading", label: "阅读" },
{ value: "writing", label: "写作" },
{ value: "speaking", label: "口语" }];


const difficulties = ["easy", "medium", "hard"] as const;

export default function RealExamTrainingPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const customQuestions = useAppStore((state) => state.customQuestions);
  const importQuestionBank = useAppStore((state) => state.importQuestionBank);

  const [type, setType] = useState<RealExamType | "">("");
  const [year, setYear] = useState<string>("");
  const [section, setSection] = useState<ExamQuestionType | "">("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">(
    ""
  );
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allBuiltIn = useMemo(() => getAllRealExamQuestions(), []);
  const allQuestions = useMemo(() => {
    const customReal = customQuestions.filter((q) => q.source === "official");
    return [...allBuiltIn, ...customReal];
  }, [allBuiltIn, customQuestions]);

  const filtered = useMemo(() => {
    return allQuestions.filter((q) => {
      if (type && q.examType !== type) return false;
      if (year && q.year !== year) return false;
      if (section && q.section !== section) return false;
      if (difficulty && q.difficulty !== difficulty) return false;
      return true;
    });
  }, [allQuestions, type, year, section, difficulty]);

  const years = useMemo(
    () => Array.from(new Set(allQuestions.map((q) => q.year).filter(Boolean))).sort().reverse(),
    [allQuestions]
  );

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u6863\u6848")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
      </div>);

  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { questions, errors } = await parseRealQuestionBank(file);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">{t("\u4E13\u9879\u771F\u9898\u8BAD\u7EC3")}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">{t("\u6309\u8003\u8BD5\u7C7B\u578B\u3001\u5E74\u4EFD\u3001\u9898\u578B\u3001\u96BE\u5EA6\u7B5B\u9009\u771F\u9898\u8FDB\u884C\u9488\u5BF9\u6027\u7EC3\u4E60\u3002")}

      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u7B5B\u9009\u6761\u4EF6")}</CardTitle>
          <CardDescription>{t("\u9009\u62E9\u6761\u4EF6\u540E\uFF0C\u4E0B\u65B9\u4F1A\u5C55\u793A\u5339\u914D\u7684\u771F\u9898\u3002")}

          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("\u8003\u8BD5\u7C7B\u578B")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RealExamType | "")}
                className="w-full border rounded-md px-3 py-2 text-sm">
                
                <option value="">{t("\u5168\u90E8")}</option>
                {getRealExamConfigs().map((c) =>
                <option key={c.type} value={c.type}>
                    {c.label}
                  </option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("\u5E74\u4EFD")}</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm">
                
                <option value="">{t("\u5168\u90E8")}</option>
                {years.map((y) =>
                <option key={y} value={y}>
                    {y}
                  </option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("\u9898\u578B")}</label>
              <select
                value={section}
                onChange={(e) =>
                setSection(e.target.value as ExamQuestionType | "")
                }
                className="w-full border rounded-md px-3 py-2 text-sm">
                
                <option value="">{t("\u5168\u90E8")}</option>
                {sections.map((s) =>
                <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("\u96BE\u5EA6")}</label>
              <select
                value={difficulty}
                onChange={(e) =>
                setDifficulty(
                  e.target.value as "easy" | "medium" | "hard" | "" || ""
                )
                }
                className="w-full border rounded-md px-3 py-2 text-sm">
                
                <option value="">{t("\u5168\u90E8")}</option>
                {difficulties.map((d) =>
                <option key={d} value={d}>
                    {d === "easy" ? "简单" : d === "medium" ? "中等" : "困难"}
                  </option>
                )}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u5BFC\u5165\u771F\u9898")}</CardTitle>
          <CardDescription>{t("\u652F\u6301 JSON / Excel \u6279\u91CF\u5BFC\u5165\u771F\u9898\u3002")}</CardDescription>
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
            {importing ? "导入中..." : "导入真题"}
          </Button>
          {importResult &&
          <div className="text-sm space-y-1">
              <p>{t("\u6210\u529F\u5BFC\u5165")}
              {importResult.success}{t("\u9053\u771F\u9898")}
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold dark:text-white">{t("\u5171")}
          {filtered.length}{t("\u9053\u771F\u9898")}
        </h2>
        {filtered.map((q, idx) =>
        <TrainingQuestionCard key={q.id} index={idx + 1} question={q} />
        )}
        {filtered.length === 0 &&
        <p className="text-gray-500">{t("\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u771F\u9898\u3002")}</p>
        }
      </div>
    </div>);

}

/** 单个训练题目卡片 */
function TrainingQuestionCard({
  index,
  question



}: {index: number;question: ExamQuestion;}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const objective =
  question.type === "reading" || question.type === "listening";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("\u7B2C")}
          {index}{t("\u9898 \xB7")}{question.type}
          {question.examType && ` · ${question.examType}`}
          {question.year && ` · ${question.year}`}
          {question.difficulty &&
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {question.difficulty === "easy" ?
            "简单" :
            question.difficulty === "medium" ?
            "中等" :
            "困难"}
            </span>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.passage &&
        <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
            {question.passage}
          </div>
        }
        <p className="font-medium dark:text-white">{question.question}</p>
        {objective && question.options ?
        <div className="space-y-2">
            {question.options.map((option) =>
          <div
            key={option}
            className={`p-3 rounded-md border text-sm ${
            showAnswer && option === question.answer ?
            "bg-green-50 border-green-300" :
            ""}`
            }>
            
                {option}
              </div>
          )}
          </div> :

        <p className="text-sm text-muted-foreground">
            {question.type === "writing" ?
          "写作题：请根据题目要求作答。" :
          "口语题：请根据题目要求作答。"}
          </p>
        }
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnswer((s) => !s)}>
          
          {showAnswer ? "隐藏答案" : "查看答案"}
        </Button>
        {showAnswer &&
        <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">{t("\u7B54\u6848\uFF1A")}</span>
              {question.answer || "主观题，无固定答案"}
            </p>
            {question.explanation &&
          <p className="text-muted-foreground">{question.explanation}</p>
          }
          </div>
        }
      </CardContent>
    </Card>);

}