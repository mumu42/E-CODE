/**
 * @file app/review/page.tsx
 * @description 错题本与薄弱点训练页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";
import { formatDate } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { generateWeakPointDrill } from "@/lib/ai/client";
import { getDueErrors } from "@/lib/review/utils";
import { askAdvisor } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { Loader2 } from "lucide-react";
import { FlashcardMode } from "@/components/review/FlashcardMode";
import { DictationMode } from "@/components/review/DictationMode";
import { FillBlankMode } from "@/components/review/FillBlankMode";
import { ChallengeMode } from "@/components/review/ChallengeMode";
import type { DrillQuestion, ErrorItem } from "@/lib/types";
import { BookOpen, CheckCircle, AlertCircle, Layers, Headphones, PenTool, Zap } from "lucide-react";

type ReviewMode = "flashcard" | "dictation" | "fillblank" | "challenge";

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
  const scheduleReview = useAppStore((state) => state.scheduleReview);
  const addVocabulary = useAppStore((state) => state.addVocabulary);

  const [mode, setMode] = useState<ReviewMode>("flashcard");
  const [selectedWeakPoint, setSelectedWeakPoint] = useState<string | null>(null);
  const [drill, setDrill] = useState<DrillQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const drillPrompt = useCustomPrompt("drill");
  const advisorPrompt = useCustomPrompt("advisor");

  const weakPoints = useMemo(() => {
    const counts = new Map<string, number>();
    errors.forEach((err) => {
      counts.set(err.errorType, (counts.get(err.errorType) || 0) + 1);
    });
    return Array.from(counts.entries()).
    sort((a, b) => b[1] - a[1]).
    slice(0, 5);
  }, [errors]);

  const dueErrors = useMemo(() => getDueErrors(errors), [errors]);

  function handleAddToVocabulary(err: ErrorItem) {
    if (!profile) return;
    const word = err.correction || err.original;
    addVocabulary({
      id: crypto.randomUUID(),
      userId: profile.id,
      word,
      meaning: err.explanation || "",
      example: err.original,
      source: "error",
      createdAt: new Date().toISOString()
    });
  }

  async function handleGenerateDrill(type: string) {
    setSelectedWeakPoint(type);
    setLoading(true);
    setDrill([]);
    setAnswers({});
    setShowResult(false);
    try {
      const questions = await generateWeakPointDrill(type, 5, drillPrompt);
      setDrill(questions);
    } catch (error) {
      console.error(error);
      alert("生成专项练习失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleExplain(err: ErrorItem) {
    if (!profile) return;
    setExplainingId(err.id);
    try {
      const result = await askAdvisor(
        profile.target,
        profile.level,
        "请详细讲解这道错题，说明为什么错、正确用法是什么，并给出类似例句。",
        undefined,
        err,
        undefined,
        advisorPrompt
      );
      setExplanations((prev) => ({ ...prev, [err.id]: result.reply }));
    } catch (error) {
      console.error(error);
      setExplanations((prev) => ({ ...prev, [err.id]: "讲解失败，请稍后重试。" }));
    } finally {
      setExplainingId(null);
    }
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("\u6682\u65E0\u5B66\u4E60\u6863\u6848")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t("\u9519\u9898\u672C\u4E0E\u8584\u5F31\u70B9\u8BAD\u7EC3")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
        {[
        { key: "flashcard", label: "闪卡", icon: Layers },
        { key: "dictation", label: "听写", icon: Headphones },
        { key: "fillblank", label: "填空", icon: PenTool },
        { key: "challenge", label: "挑战", icon: Zap }].
        map((m) =>
        <Button
          key={m.key}
          variant={mode === m.key ? "default" : "outline"}
          onClick={() => setMode(m.key as ReviewMode)}
          className="flex items-center gap-2">
          
            {m.label ? <m.icon className="w-4 h-4" /> : null}
            {t(m.label)}
          </Button>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />{t("\u4ECA\u65E5\u5F85\u590D\u4E60")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          {dueErrors.length === 0 ?
          <p className="text-gray-500">{t("\u4ECA\u65E5\u6CA1\u6709\u9700\u8981\u590D\u4E60\u7684\u9519\u9898\u3002")}</p> :

          <ul className="space-y-3">
              {dueErrors.map((err) =>
            <li key={err.id} className="border-b py-2">
                  <p className="text-sm line-through text-red-600">{err.original}</p>
                  <p className="text-sm text-green-600">{err.correction}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => scheduleReview(err.id, "hard")}>{t("\u96BE")}

                </Button>
                    <Button size="sm" variant="outline" onClick={() => scheduleReview(err.id, "good")}>{t("\u4F1A")}

                </Button>
                    <Button size="sm" variant="outline" onClick={() => scheduleReview(err.id, "easy")}>{t("\u6613")}

                </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddToVocabulary(err)}>{t("\u52A0\u5165\u8BCD\u6C47\u672C")}

                </Button>
                    <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExplain(err)}
                  disabled={explainingId === err.id}>
                  
                      {explainingId === err.id && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}{t("AI \u8BB2\u89E3")}

                </Button>
                  </div>
                  {explanations[err.id] &&
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-sm rounded-md">
                      <p className="font-medium mb-1">{t("AI \u8BB2\u89E3")}</p>
                      <p className="whitespace-pre-wrap">{explanations[err.id]}</p>
                    </div>
              }
                </li>
            )}
            </ul>
          }
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === "flashcard" && <Layers className="w-5 h-5 text-blue-500" />}
            {mode === "dictation" && <Headphones className="w-5 h-5 text-green-500" />}
            {mode === "fillblank" && <PenTool className="w-5 h-5 text-purple-500" />}
            {mode === "challenge" && <Zap className="w-5 h-5 text-orange-500" />}
            {mode === "flashcard" && t("闪卡复习")}
            {mode === "dictation" && t("听写复习")}
            {mode === "fillblank" && t("填空复习")}
            {mode === "challenge" && t("每日挑战")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "flashcard" && <FlashcardMode errors={dueErrors} onGrade={scheduleReview} />}
          {mode === "dictation" && <DictationMode errors={dueErrors} onGrade={scheduleReview} />}
          {mode === "fillblank" && <FillBlankMode errors={dueErrors} onGrade={scheduleReview} />}
          {mode === "challenge" && <ChallengeMode errors={dueErrors} onGrade={scheduleReview} />}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />{t("\u8584\u5F31\u70B9\u5206\u6790")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          {weakPoints.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u8584\u5F31\u70B9\u6570\u636E\uFF0C\u5FEB\u53BB\u7EC3\u4E60\u5427\u3002")}</p> :

          <div className="space-y-2">
              {weakPoints.map(([type, count]) =>
            <div
              key={type}
              className="flex items-center justify-between border-b py-2">
              
                  <span className="capitalize font-medium">{type}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{count}{t("\u6B21")}</span>
                    <Button size="sm" onClick={() => handleGenerateDrill(type)}>{t("\u4E13\u9879\u7EC3\u4E60")}

                </Button>
                  </div>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>

      {selectedWeakPoint &&
      <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("\u4E13\u9879\u7EC3\u4E60\uFF1A")}{selectedWeakPoint}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">{t("AI \u6B63\u5728\u751F\u6210\u7EC3\u4E60\u9898...")}</p>}
            {drill.length > 0 &&
          <div className="space-y-6">
                {drill.map((q, idx) =>
            <div key={idx} className="space-y-2">
                    <p className="font-medium">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((option) =>
                <Button
                  key={option}
                  variant={answers[idx] === option ? "default" : "outline"}
                  onClick={() =>
                  setAnswers((prev) => ({ ...prev, [idx]: option }))
                  }
                  className="justify-start">
                  
                          {option}
                        </Button>
                )}
                    </div>
                    {showResult &&
              <div
                className={`text-sm p-2 rounded ${
                answers[idx] === q.answer ?
                "bg-green-50 text-green-700" :
                "bg-red-50 text-red-700"}`
                }>
                
                        <p>{t("\u6B63\u786E\u7B54\u6848\uFF1A")}{q.answer}</p>
                        <p>{q.explanation}</p>
                      </div>
              }
                  </div>
            )}
                <Button onClick={() => setShowResult(true)} disabled={showResult}>{t("\u67E5\u770B\u7B54\u6848")}

            </Button>
              </div>
          }
          </CardContent>
        </Card>
      }

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />{t("\u9519\u9898\u672C")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u9519\u9898\u8BB0\u5F55")}</p> :

          <ul className="space-y-3">
              {errors.
            slice().
            reverse().
            map((err) =>
            <li
              key={err.id}
              className="border-b py-2 flex items-start justify-between gap-4">
              
                    <div>
                      <p className="text-sm">
                        <span className="line-through text-red-600">{err.original}</span> →{" "}
                        <span className="text-green-600">{err.correction || err.explanation}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {err.errorType} · {formatDate(err.date)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        {!err.reviewed &&
                  <Button size="sm" variant="ghost" onClick={() => markErrorReviewed(err.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />{t("\u6807\u8BB0\u5DF2\u590D\u4E60")}

                  </Button>
                  }
                        <Button size="sm" variant="ghost" onClick={() => handleAddToVocabulary(err)}>{t("\u52A0\u5165\u8BCD\u6C47\u672C")}

                  </Button>
                        <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExplain(err)}
                    disabled={explainingId === err.id}>
                    
                          {explainingId === err.id && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}{t("AI \u8BB2\u89E3")}

                  </Button>
                      </div>
                      {explanations[err.id] &&
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-sm rounded-md">
                          <p className="font-medium mb-1">{t("AI \u8BB2\u89E3")}</p>
                          <p className="whitespace-pre-wrap">{explanations[err.id]}</p>
                        </div>
                }
                    </div>
                  </li>
            )}
            </ul>
          }
        </CardContent>
      </Card>
    </div>);

}