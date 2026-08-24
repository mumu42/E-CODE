/**
 * @file components/ExamSession.tsx
 * @description 模拟考试会话内容组件
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";
import { formatDate, formatScore } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { ExamTimer } from "@/components/ExamTimer";
import { generateExamQuestions, EXAM_CONFIGS } from "@/lib/exam/questions";
import type { ExamRecord } from "@/lib/types";

/** 模拟考试会话内容 */
export function ExamSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") ?? "GENERAL";
  const profile = useAppStore((state) => state.profile);
  const addExamRecord = useAppStore((state) => state.addExamRecord);
  const customQuestions = useAppStore((state) => state.customQuestions);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());

  const examType = useMemo(() => {
    const allowed = EXAM_CONFIGS.map((c) => c.type);
    return allowed.includes(typeParam as (typeof EXAM_CONFIGS)[number]["type"]) ?
    typeParam as (typeof EXAM_CONFIGS)[number]["type"] :
    "GENERAL";
  }, [typeParam]);

  const config = useMemo(
    () => EXAM_CONFIGS.find((c) => c.type === examType) ?? EXAM_CONFIGS[0],
    [examType]
  );

  const questions = useMemo(
    () => profile ? generateExamQuestions(examType, config.questionCount, customQuestions) : [],
    [profile, examType, config.questionCount, customQuestions]
  );

  function handleSelect(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit() {
    if (!profile) return;
    const startedAt = startedAtRef.current;
    const endedAt = new Date().toISOString();
    let score = 0;
    let totalScore = 0;
    const answeredQuestions = questions.map((q) => {
      const userAnswer = answers[q.id] ?? "";
      const isCorrect = q.answer ? userAnswer === q.answer : false;
      if (q.answer) {
        totalScore += q.score;
        if (isCorrect) score += q.score;
      }
      return { ...q, userAnswer };
    });

    const newRecord: ExamRecord = {
      id: crypto.randomUUID(),
      userId: profile.id,
      type: examType,
      startedAt,
      endedAt,
      questions: answeredQuestions,
      totalScore,
      score
    };

    addExamRecord(newRecord);
    setRecord(newRecord);
    setFinished(true);
  }

  if (!profile) {
    router.replace("/onboarding");
    return null;
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>{t("\u6B63\u5728\u52A0\u8F7D\u8BD5\u5377...")}</p>
      </div>);

  }

  if (finished && record) {
    const percentage = record.totalScore > 0 ? Math.round(record.score / record.totalScore * 100) : 0;
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("\u8003\u8BD5\u6210\u7EE9")}</CardTitle>
            <CardDescription>
              {config.label} · {formatDate(record.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">{percentage}{t("\u5206")}</div>
            <p className="text-sm text-muted-foreground">{t("\u5F97\u5206")}
              {formatScore(record.score)}{t("/ \u603B\u5206")}{formatScore(record.totalScore)}
            </p>
            <p className="text-sm text-muted-foreground">{t("\u7528\u65F6")}
              {Math.ceil((new Date(record.endedAt).getTime() - new Date(record.startedAt).getTime()) / 1000 / 60)}{t("\u5206\u949F")}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/exam")}>{t("\u518D\u6765\u4E00\u6B21")}</Button>
              <Button variant="outline" onClick={() => router.push("/progress")}>{t("\u67E5\u770B\u8FDB\u5EA6")}

              </Button>
            </div>
          </CardContent>
        </Card>
      </div>);

  }

  const current = questions[currentIndex];
  const isObjective = current.type === "reading" || current.type === "listening";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold dark:text-white">{config.label}</h1>
        <ExamTimer
          seconds={config.duration * 60}
          onFinish={() => {
            alert("考试时间到，自动提交");
            handleSubmit();
          }} />
        
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("\u7B2C")}
            {currentIndex + 1} / {questions.length}{t("\u9898 \xB7")}{current.type}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.passage &&
          <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
              {current.passage}
            </div>
          }
          <p className="font-medium dark:text-white">{current.question}</p>
          {isObjective && current.options ?
          <div className="space-y-2">
              {current.options.map((option) =>
            <label
              key={option}
              className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-accent">
              
                  <input
                type="radio"
                name={current.id}
                value={option}
                checked={answers[current.id] === option}
                onChange={() => handleSelect(current.id, option)}
                className="h-4 w-4" />
              
                  <span className="text-sm">{option}</span>
                </label>
            )}
            </div> :

          <textarea
            className="w-full min-h-[150px] p-3 border rounded-md text-sm"
            placeholder={t("\u8BF7\u8F93\u5165\u4F60\u7684\u7B54\u6848")}
            value={answers[current.id] ?? ""}
            onChange={(e) => handleSelect(current.id, e.target.value)} />

          }
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}>{t("\u4E0A\u4E00\u9898")}


        </Button>
        <div className="text-sm text-muted-foreground">{t("\u5DF2\u7B54")}
          {Object.keys(answers).length} / {questions.length}
        </div>
        {currentIndex < questions.length - 1 ?
        <Button onClick={() => setCurrentIndex((i) => i + 1)}>{t("\u4E0B\u4E00\u9898")}</Button> :

        <Button onClick={handleSubmit}>{t("\u63D0\u4EA4\u8BD5\u5377")}</Button>
        }
      </div>
    </div>);

}