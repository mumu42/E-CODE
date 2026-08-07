/**
 * @file app/review/page.tsx
 * @description 错题本与薄弱点训练页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { generateWeakPointDrill } from "@/lib/ai/client";
import type { DrillQuestion } from "@/lib/types";
import { BookOpen, CheckCircle, AlertCircle } from "lucide-react";

/**
 * 错题本与薄弱点训练页面
 * @example
 * ```tsx
 * <ReviewPage />
 * ```
 */
export default function ReviewPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const errors = useAppStore((state) => state.errors);
  const markErrorReviewed = useAppStore((state) => state.markErrorReviewed);

  const [selectedWeakPoint, setSelectedWeakPoint] = useState<string | null>(null);
  const [drill, setDrill] = useState<DrillQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const weakPoints = useMemo(() => {
    const counts = new Map<string, number>();
    errors.forEach((err) => {
      counts.set(err.errorType, (counts.get(err.errorType) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [errors]);

  async function handleGenerateDrill(type: string) {
    setSelectedWeakPoint(type);
    setLoading(true);
    setDrill([]);
    setAnswers({});
    setShowResult(false);
    try {
      const questions = await generateWeakPointDrill(type, 5);
      setDrill(questions);
    } catch (error) {
      console.error(error);
      alert("生成专项练习失败");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">暂无学习档案</h1>
        <Button onClick={() => router.push("/onboarding")}>开始学习</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">错题本与薄弱点训练</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            薄弱点分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weakPoints.length === 0 ? (
            <p className="text-gray-500">暂无薄弱点数据，快去练习吧。</p>
          ) : (
            <div className="space-y-2">
              {weakPoints.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between border-b py-2"
                >
                  <span className="capitalize font-medium">{type}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{count} 次</span>
                    <Button size="sm" onClick={() => handleGenerateDrill(type)}>
                      专项练习
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedWeakPoint && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>专项练习：{selectedWeakPoint}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">AI 正在生成练习题...</p>}
            {drill.length > 0 && (
              <div className="space-y-6">
                {drill.map((q, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="font-medium">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((option) => (
                        <Button
                          key={option}
                          variant={answers[idx] === option ? "default" : "outline"}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [idx]: option }))
                          }
                          className="justify-start"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    {showResult && (
                      <div
                        className={`text-sm p-2 rounded ${
                          answers[idx] === q.answer
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <p>正确答案：{q.answer}</p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
                <Button onClick={() => setShowResult(true)} disabled={showResult}>
                  查看答案
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            错题本
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <p className="text-gray-500">暂无错题记录</p>
          ) : (
            <ul className="space-y-3">
              {errors
                .slice()
                .reverse()
                .map((err) => (
                  <li
                    key={err.id}
                    className="border-b py-2 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm">
                        <span className="line-through text-red-600">{err.original}</span> →{" "}
                        <span className="text-green-600">{err.correction || err.explanation}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {err.errorType} · {new Date(err.date).toLocaleDateString()}
                      </p>
                    </div>
                    {!err.reviewed && (
                      <Button size="sm" variant="ghost" onClick={() => markErrorReviewed(err.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        标记已复习
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
