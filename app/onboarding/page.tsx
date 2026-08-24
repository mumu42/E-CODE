/**
 * @file app/onboarding/page.tsx
 * @description 新用户引导与英语水平自适应测评页面
 * @author English Agent Team
 * @date 2026-08-24
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { assessLevel } from "@/lib/ai/client";
import { saveToStatic } from "@/lib/storage/excel";
import { useCustomPrompt } from "@/hooks/usePrompts";
import type { Level, Target } from "@/lib/types";
import {
  startAdaptiveAssessment,
  submitAnswer,
  evaluateAdaptiveAssessment,
} from "@/lib/assessment/adaptive";
import type { AdaptiveQuestion } from "@/lib/assessment/questionBank";

const targets = [
  { value: "SCHOOL", label: "升学考试" },
  { value: "STUDY_ABROAD", label: "出国留学" },
  { value: "CET", label: "四六级" },
  { value: "IELTS_TOEFL", label: "雅思托福" },
] as const;

interface AnswerHistory {
  question: AdaptiveQuestion;
  userAnswer: string;
  isCorrect: boolean;
}

/**
 * 新用户引导与英语水平测评页面
 * @example
 * ```tsx
 * <OnboardingPage />
 * ```
 */
export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useAppStore((state) => state.setProfile);
  const addAssessment = useAppStore((state) => state.addAssessment);
  const assessmentPrompt = useCustomPrompt("assessment");

  const [step, setStep] = useState<"target" | "quiz" | "sample" | "result">("target");
  const [target, setTarget] = useState<Target | null>(null);
  const [session, setSession] = useState<ReturnType<typeof startAdaptiveAssessment> | null>(null);
  const [history, setHistory] = useState<AnswerHistory[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [sample, setSample] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [fillAnswer, setFillAnswer] = useState("");

  function handleTargetSelect(value: Target) {
    setTarget(value);
    const initial = startAdaptiveAssessment(12);
    setSession(initial);
    setHistory([]);
    setUsedIds(new Set([initial.question.id]));
    setStep("quiz");
  }

  function handleAnswer(option: string) {
    if (!session) return;

    const isCorrect =
      option.trim().toLowerCase() === session.question.answer.trim().toLowerCase();
    const record: AnswerHistory = {
      question: session.question,
      userAnswer: option,
      isCorrect,
    };
    const nextHistory = [...history, record];
    const nextUsed = new Set(usedIds);
    nextUsed.add(session.question.id);

    if (nextHistory.length >= session.totalCount) {
      setHistory(nextHistory);
      setStep("sample");
      return;
    }

    const nextSession = submitAnswer(session, option, nextUsed);
    nextUsed.add(nextSession.question.id);

    setHistory(nextHistory);
    setSession(nextSession);
    setUsedIds(nextUsed);
    setFillAnswer("");
  }

  function handleFillAnswer(option: string) {
    if (!session) return;
    if (!option.trim()) return;

    const isCorrect =
      option.trim().toLowerCase() === session.question.answer.trim().toLowerCase();
    const record: AnswerHistory = {
      question: session.question,
      userAnswer: option,
      isCorrect,
    };
    const nextHistory = [...history, record];
    const nextUsed = new Set(usedIds);
    nextUsed.add(session.question.id);

    if (nextHistory.length >= session.totalCount) {
      setHistory(nextHistory);
      setStep("sample");
      setFillAnswer("");
      return;
    }

    const nextSession = submitAnswer(session, option, nextUsed);
    nextUsed.add(nextSession.question.id);

    setHistory(nextHistory);
    setSession(nextSession);
    setUsedIds(nextUsed);
    setFillAnswer("");
  }

  async function handleSubmitSample() {
    if (!target) return;
    setLoading(true);
    try {
      const result = await assessLevel(
        history.reduce((acc, h) => ({ ...acc, [h.question.id]: h.userAnswer }), {}),
        sample,
        assessmentPrompt
      );

      const adaptive = evaluateAdaptiveAssessment(history, sample, result.level);
      setLevel(adaptive.level);
      setFeedback(adaptive.feedback);

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      setProfile({
        id: userId,
        target,
        level: adaptive.level,
        createdAt: now,
        updatedAt: now,
      });

      addAssessment({
        id: crypto.randomUUID(),
        userId,
        date: now,
        target,
        scores: result.scores,
        level: result.level,
      });

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${now.split("T")[0]}.xlsx`);

      setStep("result");
    } catch (error) {
      console.error(error);
      alert("测评失败，请检查 API Key 配置。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">开始使用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "target" && (
            <div className="space-y-4">
              <Label>你的学习目标是什么？</Label>
              <div className="grid grid-cols-2 gap-4">
                {targets.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => handleTargetSelect(t.value as Target)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "quiz" && session && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">自适应测评</h3>
                <span className="text-sm text-muted-foreground">
                  {history.length + 1} / {session.totalCount}
                </span>
              </div>

              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${((history.length + 1) / session.totalCount) * 100}%` }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  难度：{session.question.level} · 知识点：{session.question.tag}
                </p>
                <p className="text-lg font-medium">{session.question.text}</p>
              </div>

              {session.question.type === "choice" && session.question.options && (
                <div className="grid grid-cols-2 gap-2">
                  {session.question.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      onClick={() => handleAnswer(option)}
                      className="text-left justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {session.question.type === "fillBlank" && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="请输入你的答案"
                    rows={2}
                    value={fillAnswer}
                    onChange={(e) => setFillAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFillAnswer(fillAnswer);
                      }
                    }}
                  />
                  <Button onClick={() => handleFillAnswer(fillAnswer)} disabled={!fillAnswer.trim()}>
                    提交答案
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "sample" && (
            <div className="space-y-4">
              <Label htmlFor="sample">用英语自我介绍或描述你的一天（至少 30 词）</Label>
              <Textarea
                id="sample"
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                rows={6}
                placeholder="例如：My name is Tom. I am a student..."
              />
              <Button
                onClick={handleSubmitSample}
                disabled={loading || sample.length < 10}
                className="w-full"
              >
                {loading ? "测评中..." : "完成测评"}
              </Button>
            </div>
          )}

          {step === "result" && level && (
            <div className="text-center space-y-4">
              <p className="text-lg">
                你的英语水平约为：<span className="font-bold text-blue-600 text-2xl">{level}</span>
              </p>
              <p className="text-gray-600">{feedback}</p>
              <p className="text-gray-600">
                系统已根据你的目标“{targets.find((t) => t.value === target)?.label}”和当前级别生成练习计划。
              </p>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                进入 Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
