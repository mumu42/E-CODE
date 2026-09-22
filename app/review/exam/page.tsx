/**
 * @file app/review/exam/page.tsx
 * @description 考试错题本：展示模拟考试中答错的客观题，支持 AI 讲解与标记复习
 * @author English Agent Team
 * @date 2026-09-22
 */
"use client";
import { formatDate } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { askAdvisor } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  CheckCircle,
  Volume2,
} from "lucide-react";
import type { ExamWrongQuestion } from "@/lib/types";

/**
 * 考试错题本页面
 * @example
 * ```tsx
 * <ExamWrongQuestionPage />
 * ```
 */
export default function ExamWrongQuestionPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const examWrongQuestions = useAppStore((state) => state.examWrongQuestions);
  const markExamWrongReviewed = useAppStore(
    (state) => state.markExamWrongReviewed
  );
  const advisorPrompt = useCustomPrompt("advisor");

  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  // 按日期倒序分组
  const groups = useMemo(() => {
    const map = new Map<string, ExamWrongQuestion[]>();
    for (const item of examWrongQuestions) {
      const date = item.date.split("T")[0];
      const list = map.get(date) ?? [];
      list.push(item);
      map.set(date, list);
    }
    return Array.from(map.entries())
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [examWrongQuestions]);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("暂无学习档案")}</h1>
        <Button onClick={() => router.push("/onboarding")}>
          {t("开始学习")}
        </Button>
      </div>
    );
  }

  /**
   * 调用 AI 讲解一道考试错题
   * @param item - 考试错题
   */
  async function handleExplain(item: ExamWrongQuestion) {
    if (!profile) return;
    setExplainingId(item.id);
    const context = [
      `题型：${item.section ?? item.type}`,
      item.examType ? `考试类型：${item.examType}` : "",
      `题干：${item.question}`,
      item.passage ? `材料：${item.passage}` : "",
      item.options ? `选项：${item.options.join(" / ")}` : "",
      item.answer ? `正确答案：${item.answer}` : "",
      item.userAnswer ? `我的答案：${item.userAnswer}` : "",
      item.explanation ? `参考解析：${item.explanation}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await askAdvisor(
        profile.target,
        profile.level,
        "请讲解这道考试错题，说明为什么正确答案对、我的答案错、解题思路与考点，并给出类似例句或类似题。",
        context,
        undefined,
        undefined,
        advisorPrompt
      );
      setExplanations((prev) => ({ ...prev, [item.id]: result.reply }));
    } catch (error) {
      console.error(error);
      setExplanations((prev) => ({
        ...prev,
        [item.id]: "讲解失败，请稍后重试。",
      }));
    } finally {
      setExplainingId(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/review")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("返回")}
        </Button>
        <h1 className="text-2xl font-bold">{t("考试错题")}</h1>
      </div>

      {examWrongQuestions.length === 0 ? (
        <p className="text-gray-500">{t("暂无考试错题，去模拟考试练一练吧。")}</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.date}>
              <h2 className="text-lg font-semibold mb-3 dark:text-white">
                {formatDate(group.date)}
                <span className="ml-2 text-sm text-gray-500">
                  {group.items.length}
                  {t("条")}
                </span>
              </h2>
              <div className="space-y-4">
                {group.items.map((item, idx) => (
                  <ExamWrongQuestionCard
                    key={item.id}
                    index={idx + 1}
                    item={item}
                    explaining={explainingId === item.id}
                    explanation={explanations[item.id]}
                    onExplain={() => handleExplain(item)}
                    onMarkReviewed={() => markExamWrongReviewed(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 单个考试错题卡片 */
function ExamWrongQuestionCard({
  index,
  item,
  explaining,
  explanation,
  onExplain,
  onMarkReviewed,
}: {
  index: number;
  item: ExamWrongQuestion;
  explaining: boolean;
  explanation?: string;
  onExplain: () => void;
  onMarkReviewed: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          {t("第")}
          {index}
          {t("题 ·")}
          {item.section ?? item.type}
          {item.examType && ` · ${item.examType}`}
          {item.difficulty && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {item.difficulty === "easy"
                ? t("简单")
                : item.difficulty === "medium"
                ? t("中等")
                : t("困难")}
            </span>
          )}
          {item.reviewed && (
            <span className="ml-2 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t("已复习")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.passage && (
          <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
            {item.passage}
          </div>
        )}
        <p className="font-medium dark:text-white">{item.question}</p>
        {item.options && item.options.length > 0 ? (
          <div className="space-y-2">
            {item.options.map((option) => {
              const isCorrect = item.answer && option === item.answer;
              const isUserWrong = item.userAnswer && option === item.userAnswer && option !== item.answer;
              return (
                <div
                  key={option}
                  className={`p-3 rounded-md border text-sm ${
                    isCorrect
                      ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : isUserWrong
                      ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                      : ""
                  }`}
                >
                  {option}
                  {isCorrect && ` ✓`}
                  {isUserWrong && ` ✗`}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("正确答案：")}
            {item.answer ?? t("无")}
          </p>
        )}
        <div className="text-sm space-y-1">
          {item.userAnswer && (
            <p className="text-red-600">
              {t("我的答案：")}
              {item.userAnswer}
            </p>
          )}
          {item.answer && (
            <p className="text-green-600">
              {t("正确答案：")}
              {item.answer}
            </p>
          )}
          {item.explanation && (
            <p className="text-muted-foreground">{item.explanation}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!item.reviewed && (
            <Button size="sm" variant="ghost" onClick={onMarkReviewed}>
              <CheckCircle className="w-4 h-4 mr-1" />
              {t("标记已复习")}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onExplain}
            disabled={explaining}
          >
            {explaining && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            <Volume2 className="w-4 h-4 mr-1" />
            {t("AI 讲解")}
          </Button>
        </div>
        {explanation && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-sm rounded-md">
            <p className="font-medium mb-1">{t("AI 讲解")}</p>
            <p className="whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
