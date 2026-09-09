/**
 * @file app/review/page.tsx
 * @description 错题本与薄弱点训练页面（按日期分组）
 * @author English Agent Team
 * @date 2026-09-09
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
import { Loader2, ArrowLeft, Layers, Headphones, PenTool, Zap, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import { FlashcardMode } from "@/components/review/FlashcardMode";
import { DictationMode } from "@/components/review/DictationMode";
import { FillBlankMode } from "@/components/review/FillBlankMode";
import { ChallengeMode } from "@/components/review/ChallengeMode";
import type { DrillQuestion, ErrorItem, PracticeRecord, ChatSession } from "@/lib/types";

type ReviewMode = "flashcard" | "dictation" | "fillblank" | "challenge";

interface ErrorGroup {
  date: string;
  errors: ErrorItem[];
  topic: string;
}

function getGroupTopic(errors: ErrorItem[], sessions: PracticeRecord[], chatSessions: ChatSession[]): string {
  const topics: string[] = [];
  const sessionMap = new Map<string, PracticeRecord | ChatSession>();
  sessions.forEach((s) => sessionMap.set(s.id, s));
  chatSessions.forEach((s) => sessionMap.set(s.id, s));

  errors.forEach((err) => {
    const session = sessionMap.get(err.sessionId);
    if (!session) return;
    if ("topic" in session && session.topic) {
      topics.push(session.topic);
    } else if ("role" in session) {
      topics.push(session.role);
    }
  });

  const counts = new Map<string, number>();
  topics.forEach((topic) => counts.set(topic, (counts.get(topic) ?? 0) + 1));
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return t("综合练习");
  const top = sorted[0];
  if (sorted.length === 1) return top[0];
  return `${top[0]} ${t("等")}`;
}

function getGroupDescription(errors: ErrorItem[]): string {
  const total = errors.length;
  const typeCounts = new Map<string, number>();
  errors.forEach((err) => typeCounts.set(err.errorType, (typeCounts.get(err.errorType) ?? 0) + 1));
  const typeText = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type, count]) => `${type} ${count}${t("处")}`)
    .join("，");
  return t(`共 ${total} 条错题，${typeText}`);
}

function groupErrorsByDate(errors: ErrorItem[]): ErrorGroup[] {
  const map = new Map<string, ErrorItem[]>();
  errors.forEach((err) => {
    const date = err.date.split("T")[0];
    const list = map.get(date) ?? [];
    list.push(err);
    map.set(date, list);
  });
  return Array.from(map.entries())
    .map(([date, items]) => ({ date, errors: items, topic: "" }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

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
  const sessions = useAppStore((state) => state.sessions);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const markErrorReviewed = useAppStore((state) => state.markErrorReviewed);
  const scheduleReview = useAppStore((state) => state.scheduleReview);
  const addVocabulary = useAppStore((state) => state.addVocabulary);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  const dueErrors = useMemo(() => getDueErrors(errors), [errors]);

  const groups = useMemo(() => {
    const base = groupErrorsByDate(errors);
    return base.map((g) => ({ ...g, topic: getGroupTopic(g.errors, sessions, chatSessions) }));
  }, [errors, sessions, chatSessions]);

  const activeGroup = useMemo(() => {
    if (!selectedDate) return null;
    if (selectedDate === "due") return { date: selectedDate, errors: dueErrors, topic: t("今日待复习") };
    return groups.find((g) => g.date === selectedDate) ?? null;
  }, [selectedDate, groups, dueErrors]);

  const weakPoints = useMemo(() => {
    const source = activeGroup ? activeGroup.errors : errors;
    const counts = new Map<string, number>();
    source.forEach((err) => {
      counts.set(err.errorType, (counts.get(err.errorType) || 0) + 1);
    });
    return Array.from(counts.entries()).
    sort((a, b) => b[1] - a[1]).
    slice(0, 5);
  }, [activeGroup, errors]);

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
        <h1 className="text-2xl font-bold mb-4">{t("暂无学习档案")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("开始学习")}</Button>
      </div>);

  }

  if (activeGroup) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("返回")}
          </Button>
          <h1 className="text-2xl font-bold">
            {activeGroup.date === "due" ? t("今日待复习") : formatDate(activeGroup.date)}
          </h1>
        </div>
        <p className="text-gray-500 mb-6">
          {t("主题：")}{activeGroup.topic} · {getGroupDescription(activeGroup.errors)}
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              {t("选择复习模式")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
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
                  className="flex items-center gap-2"
                >
                  {m.label ? <m.icon className="w-4 h-4" /> : null}
                  {t(m.label)}
                </Button>
              )}
            </div>
            {mode === "flashcard" && <FlashcardMode errors={activeGroup.errors} onGrade={scheduleReview} />}
            {mode === "dictation" && <DictationMode errors={activeGroup.errors} onGrade={scheduleReview} />}
            {mode === "fillblank" && <FillBlankMode errors={activeGroup.errors} onGrade={scheduleReview} />}
            {mode === "challenge" && <ChallengeMode errors={activeGroup.errors} onGrade={scheduleReview} />}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />{t("错题详情")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeGroup.errors.length === 0 ?
            <p className="text-gray-500">{t("该组暂无错题记录")}</p> :

            <ul className="space-y-3">
                {activeGroup.errors.slice().reverse().map((err) =>
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
                        {err.errorType} · {formatDate(err.date)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        {!err.reviewed &&
                        <Button size="sm" variant="ghost" onClick={() => markErrorReviewed(err.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />{t("标记已复习")}
                        </Button>
                        }
                        <Button size="sm" variant="ghost" onClick={() => handleAddToVocabulary(err)}>{t("加入词汇本")}</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExplain(err)}
                          disabled={explainingId === err.id}
                        >
                          {explainingId === err.id && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}{t("AI 讲解")}
                        </Button>
                      </div>
                      {explanations[err.id] &&
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-sm rounded-md">
                        <p className="font-medium mb-1">{t("AI 讲解")}</p>
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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />{t("薄弱点分析")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakPoints.length === 0 ?
            <p className="text-gray-500">{t("暂无薄弱点数据，快去练习吧。")}</p> :

            <div className="space-y-2">
                {weakPoints.map(([type, count]) =>
              <div
                key={type}
                className="flex items-center justify-between border-b py-2"
              >
                    <span className="capitalize font-medium">{type}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{count}{t("次")}</span>
                      <Button size="sm" onClick={() => handleGenerateDrill(type)}>{t("专项练习")}</Button>
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
            <CardTitle>{t("专项练习：")}{selectedWeakPoint}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">{t("AI 正在生成练习题...")}</p>}
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
                  className="justify-start"
                >
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
                }
              >
                        <p>{t("正确答案：")}{q.answer}</p>
                        <p>{q.explanation}</p>
                      </div>
              }
                  </div>
            )}
                <Button onClick={() => setShowResult(true)} disabled={showResult}>{t("查看答案")}</Button>
              </div>
          }
          </CardContent>
        </Card>
        }
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t("错题本与薄弱点训练")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedDate("due")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />{t("今日待复习")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dueErrors.length === 0 ?
            <p className="text-gray-500">{t("今天没有需要复习的错题。")}</p> :
            <p className="text-sm">{t("共 ")}{dueErrors.length}{t(" 条错题待复习，点击开始。")}</p>
            }
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">{t("按日期选择错题子模块")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card
            key={group.date}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedDate(group.date)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{formatDate(group.date)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium text-blue-700">
                {t("主题：")}{group.topic}
              </p>
              <p className="text-sm text-gray-600">{getGroupDescription(group.errors)}</p>
              {group.errors[0] && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {group.errors[0].explanation || group.errors[0].original}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
