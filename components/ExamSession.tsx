/**
 * @file components/ExamSession.tsx
 * @description 模拟考试会话内容组件
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    return allowed.includes(typeParam as (typeof EXAM_CONFIGS)[number]["type"])
      ? (typeParam as (typeof EXAM_CONFIGS)[number]["type"])
      : "GENERAL";
  }, [typeParam]);

  const config = useMemo(
    () => EXAM_CONFIGS.find((c) => c.type === examType) ?? EXAM_CONFIGS[0],
    [examType]
  );

  const questions = useMemo(
    () => (profile ? generateExamQuestions(examType, config.questionCount, customQuestions) : []),
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
      score,
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
        <p>正在加载试卷...</p>
      </div>
    );
  }

  if (finished && record) {
    const percentage = record.totalScore > 0 ? Math.round((record.score / record.totalScore) * 100) : 0;
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>考试成绩</CardTitle>
            <CardDescription>
              {config.label} · {new Date(record.startedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">{percentage}分</div>
            <p className="text-sm text-muted-foreground">
              得分 {record.score.toFixed(1)} / 总分 {record.totalScore.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">
              用时 {Math.ceil((new Date(record.endedAt).getTime() - new Date(record.startedAt).getTime()) / 1000 / 60)} 分钟
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/exam")}>再来一次</Button>
              <Button variant="outline" onClick={() => router.push("/progress")}>
                查看进度
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          }}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            第 {currentIndex + 1} / {questions.length} 题 · {current.type}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.passage && (
            <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
              {current.passage}
            </div>
          )}
          <p className="font-medium dark:text-white">{current.question}</p>
          {isObjective && current.options ? (
            <div className="space-y-2">
              {current.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name={current.id}
                    value={option}
                    checked={answers[current.id] === option}
                    onChange={() => handleSelect(current.id, option)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="w-full min-h-[150px] p-3 border rounded-md text-sm"
              placeholder="请输入你的答案"
              value={answers[current.id] ?? ""}
              onChange={(e) => handleSelect(current.id, e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          上一题
        </Button>
        <div className="text-sm text-muted-foreground">
          已答 {Object.keys(answers).length} / {questions.length}
        </div>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>下一题</Button>
        ) : (
          <Button onClick={handleSubmit}>提交试卷</Button>
        )}
      </div>
    </div>
  );
}
