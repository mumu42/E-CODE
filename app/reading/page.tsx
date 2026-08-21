/**
 * @file app/reading/page.tsx
 * @description 阅读理解练习页面
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { generateReadingPassage } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import type { ReadingPassage } from "@/lib/types";

/**
 * 阅读理解练习页面
 * @example
 * ```tsx
 * <ReadingPage />
 * ```
 */
export default function ReadingPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addReadingRecord = useAppStore((state) => state.addReadingRecord);
  const readingPrompt = useCustomPrompt("reading");

  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const loadPassage = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setSubmitted(false);
    setScore(null);
    setAnswers({});
    try {
      const generated = await generateReadingPassage(profile.target, profile.level, readingPrompt);
      setPassage(generated);
    } catch (error) {
      console.error(error);
      alert("生成阅读材料失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }, [profile, readingPrompt]);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  function handleSelect(questionIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  function handleSubmit() {
    if (!passage || !profile) return;
    let correct = 0;
    passage.questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) correct += 1;
    });
    const percentage = Math.round((correct / passage.questions.length) * 100);
    setScore(percentage);
    setSubmitted(true);

    addReadingRecord({
      id: crypto.randomUUID(),
      userId: profile.id,
      date: new Date().toISOString(),
      target: profile.target,
      level: profile.level,
      title: passage.title,
      passage: passage.passage,
      questions: passage.questions,
      score: percentage,
    });
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">阅读理解</CardTitle>
          <Button variant="outline" size="sm" onClick={loadPassage} disabled={loading}>
            {loading ? "生成中..." : "换一篇"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {!passage ? (
            <div className="text-center space-y-4">
              <p className="text-gray-500">点击开始，AI 会为你生成一篇阅读理解材料。</p>
              <Button onClick={loadPassage} disabled={loading}>
                {loading ? "生成中..." : "开始阅读"}
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">{passage.title}</h3>
                <p className="text-sm leading-relaxed text-blue-950 whitespace-pre-wrap">
                  {passage.passage}
                </p>
              </div>

              <div className="space-y-6">
                {passage.questions.map((q, qIdx) => (
                  <div key={qIdx} className="border rounded-lg p-4 space-y-3">
                    <p className="font-medium">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const selected = answers[qIdx] === oIdx;
                        const showCorrect = submitted && oIdx === q.answerIndex;
                        const showWrong = submitted && selected && oIdx !== q.answerIndex;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelect(qIdx, oIdx)}
                            disabled={submitted}
                            className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                              showCorrect
                                ? "bg-green-50 border-green-500 text-green-900"
                                : showWrong
                                ? "bg-red-50 border-red-500 text-red-900"
                                : selected
                                ? "bg-blue-50 border-blue-500"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && (
                      <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                        解析：{q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {submitted && score !== null && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="font-medium">
                    得分：
                    <span
                      className={`text-xl font-bold ${
                        score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {score}
                    </span>
                    / 100
                  </p>
                </div>
              )}

              {!submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length !== passage.questions.length}
                  className="w-full"
                >
                  提交答案
                </Button>
              ) : (
                <Button onClick={loadPassage} className="w-full">
                  再来一篇
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
