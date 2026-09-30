/**
 * @file app/translate/page.tsx
 * @description 翻译练习页：分模块 AI 出题 → 用户中译英 → 批量批改纠错
 * @author English Agent Team
 * @date 2026-09-30
 */
"use client";
import { t } from "@/lib/i18n/translate";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { generateTranslationExercise, evaluateBatchTranslations } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { buildTranslationReviewErrors, dedupeTranslationErrors } from "@/lib/review/utils";
import type { TranslationRecord, TranslationExerciseModule, TranslationExerciseItem, TranslationMode } from "@/lib/types";
import { TRANSLATION_MODULES } from "@/lib/types";
import {
  Loader2,
  Languages,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Send,
} from "lucide-react";

const EXERCISE_COUNT = 5;

/**
 * 翻译练习页面
 */
export default function TranslatePage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addTranslationRecord = useAppStore((state) => state.addTranslationRecord);
  const addErrors = useAppStore((state) => state.addErrors);
  const translationPrompt = useCustomPrompt("translation");

  // 配置状态
  const [module, setModule] = useState<TranslationExerciseModule>("tense");
  const [mode, setMode] = useState<TranslationMode>("sentence");

  // 练习状态
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 题目列表
  const [items, setItems] = useState<TranslationExerciseItem[]>([]);
  // 用户作答（id → userTranslation）
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  // 已提交批改
  const [evaluated, setEvaluated] = useState(false);
  // 批改结果
  const [evaluationResults, setEvaluationResults] = useState<Record<string, {
    score: number;
    dimensionScores?: { accuracy: number; fluency: number; completeness: number };
    errors: { original: string; correction: string; explanation: string }[];
    correction: string;
    analysis: {
      grammar: { structure: string; tense?: string; keyPoints?: string[] };
      collocations: { phrase: string; usage: string; synonyms?: string[] }[];
      tips: string[];
      cultureNotes: string[];
    };
  }>>({});

  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [addedToReview, setAddedToReview] = useState(false);

  const modules = Object.entries(TRANSLATION_MODULES) as [TranslationExerciseModule, { label: string; description: string }][];

  const handleModuleChange = useCallback((m: TranslationExerciseModule) => {
    setModule(m);
    setItems([]);
    setUserAnswers({});
    setEvaluated(false);
    setEvaluationResults({});
    setError(null);
    setAddedToReview(false);
  }, []);

  const handleModeChange = useCallback((m: TranslationMode) => {
    setMode(m);
    setItems([]);
    setUserAnswers({});
    setEvaluated(false);
    setEvaluationResults({});
    setError(null);
    setAddedToReview(false);
  }, []);

  const toggleResult = (id: string) => {
    setExpandedResults((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  async function handleGenerate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setItems([]);
    setUserAnswers({});
    setEvaluated(false);
    setEvaluationResults({});
    setAddedToReview(false);

    try {
      const exerciseItems = await generateTranslationExercise(
        module,
        profile.target,
        profile.level,
        mode,
        EXERCISE_COUNT,
      );

      const mapped: TranslationExerciseItem[] = exerciseItems.map((ei) => ({
        id: ei.id,
        sourceText: ei.sourceText,
        referenceTranslation: ei.referenceTranslation,
      }));

      setItems(mapped);
    } catch (err) {
      console.error("Generate exercise error:", err);
      setError("生成练习失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(id: string, value: string) {
    setUserAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleEvaluate() {
    if (!profile) return;
    setEvaluating(true);
    setError(null);

    try {
      const answersToEvaluate = items
        .map((item) => ({
          id: item.id,
          sourceText: item.sourceText,
          userTranslation: userAnswers[item.id] || "",
        }))
        .filter((a) => a.userTranslation.trim().length > 0);

      if (answersToEvaluate.length === 0) {
        setError("请至少翻译一题后再提交");
        setEvaluating(false);
        return;
      }

      const results = await evaluateBatchTranslations(answersToEvaluate);

      const resultMap: Record<string, typeof results[0]> = {};
      let totalErrors = 0;
      results.forEach((r) => {
        resultMap[r.id] = r;
        if (r.errors) totalErrors += r.errors.length;
      });

      setEvaluationResults(resultMap);
      setEvaluated(true);

      // 展开有错误的题目
      const expanded: Record<string, boolean> = {};
      results.forEach((r) => {
        if (r.errors && r.errors.length > 0) expanded[r.id] = true;
      });
      setExpandedResults(expanded);

      // 写入翻译记录
      const updatedItems: TranslationExerciseItem[] = items.map((item) => ({
        ...item,
        userTranslation: userAnswers[item.id] || "",
        ...(resultMap[item.id] ? {
          score: resultMap[item.id].score,
          dimensionScores: resultMap[item.id].dimensionScores,
          errors: resultMap[item.id].errors?.map((e) => ({
            ...e,
            errorType: "translation" as const,
          })),
          analysis: resultMap[item.id].analysis,
        } : {}),
      }));

      const record: TranslationRecord = {
        id: crypto.randomUUID(),
        userId: profile.id,
        mode,
        direction: "zh2en",
        date: new Date().toISOString(),
        module,
        items: updatedItems,
        addedToReview: false,
      };

      addTranslationRecord(record);

      // 沉淀错题
      if (totalErrors > 0) {
        const allErrorItems = updatedItems.flatMap((item) =>
          buildTranslationReviewErrors(
            {
              ...record,
              userTranslation: item.userTranslation,
              mode: "sentence",
              errors: item.errors,
            },
            profile.id,
          )
        );

        if (allErrorItems.length > 0) {
          const deduped = dedupeTranslationErrors(allErrorItems);
          addErrors(deduped);
          setAddedToReview(true);
        }
      }
    } catch (err) {
      console.error("Evaluate error:", err);
      setError("批改失败，请重试");
    } finally {
      setEvaluating(false);
    }
  }

  const allAnswered = items.length > 0 && items.every((item) => (userAnswers[item.id] || "").trim().length > 0);
  const anyAnswered = items.length > 0 && items.some((item) => (userAnswers[item.id] || "").trim().length > 0);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("暂无学习档案")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("开始学习")}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-6">
        <Languages className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold">{t("翻译练习")}</h1>
      </div>

      {/* 模块选择 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("选择练习模块")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modules.map(([key, config]) => (
              <Button
                key={key}
                variant={module === key ? "default" : "outline"}
                className="flex flex-col items-start gap-1 h-auto py-3 px-4"
                onClick={() => handleModuleChange(key)}
              >
                <span className="text-sm font-medium">{t(config.label)}</span>
                <span className="text-xs opacity-70 font-normal">{t(config.description)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 模式 + 生成按钮 */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-500">{t("出题模式")}</span>
            <Button
              variant={mode === "word" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("word")}
            >
              {t("单词/短语")}
            </Button>
            <Button
              variant={mode === "sentence" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("sentence")}
            >
              {t("句子")}
            </Button>
            <div className="ml-auto">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? t("AI 出题中...") : t("生成练习")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 加载态 */}
      {loading && (
        <Card className="mb-6">
          <CardContent className="py-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 错误态 */}
      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardContent className="py-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p className="text-red-600 dark:text-red-400">{t(error)}</p>
            <Button variant="outline" size="sm" onClick={error.includes("生成") ? handleGenerate : handleEvaluate}>
              <RefreshCw className="w-4 h-4 mr-1" />
              {t("重试")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 题目列表 */}
      {items.length > 0 && !loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                {t("翻译以下内容为英文")}
              </CardTitle>
              <CardDescription>
                {t(module === "tense" ? "时态" : module === "daily" ? "日常" : module === "business" ? "商务" : "学术")}
                · {t(mode === "word" ? "单词/短语" : "句子")}
                · {t("共")} {items.length} {t("题")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => {
                const result = evaluationResults[item.id];
                const isExpanded = expandedResults[item.id];

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${
                      evaluated && result
                        ? result.errors && result.errors.length > 0
                          ? "border-red-200 dark:border-red-800"
                          : "border-green-200 dark:border-green-800"
                        : ""
                    }`}
                  >
                    {/* 题号 + 中文原文 */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-base font-medium">{item.sourceText}</p>
                      </div>
                      {/* 评分（已批改） */}
                      {evaluated && result && (
                        <span className={`text-lg font-bold shrink-0 ${
                          result.score >= 80 ? "text-green-600" : result.score >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {result.score}
                        </span>
                      )}
                    </div>

                    {/* 输入框 */}
                    {!evaluated ? (
                      <textarea
                        value={userAnswers[item.id] || ""}
                        onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                        placeholder={t("请输入你的英文翻译...")}
                        className="w-full min-h-[70px] p-3 border rounded-md text-sm resize-y"
                        rows={2}
                      />
                    ) : (
                      /* 批改结果 */
                      <div className="space-y-3">
                        {/* 用户译文 */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="text-xs text-gray-500 mb-1">{t("你的翻译")}</p>
                          <p className="text-sm">{userAnswers[item.id] || t("（未作答）")}</p>
                        </div>

                        {/* 参考译文 */}
                        {result && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                            <p className="text-xs text-gray-500 mb-1">{t("参考译文")}</p>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                              {result.correction || item.referenceTranslation}
                            </p>
                          </div>
                        )}

                        {/* 错误点 */}
                        {result && result.errors && result.errors.length > 0 && (
                          <div className="space-y-2">
                            {result.errors.map((err, ei) => (
                              <div key={ei} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                <p>
                                  <span className="text-red-600 line-through">{err.original}</span>
                                  <span className="mx-2">→</span>
                                  <span className="text-green-600">{err.correction}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{err.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 详细分析（可折叠） */}
                        {result && result.analysis && (
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleResult(item.id)}
                              className="flex items-center gap-1 text-xs"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? t("收起解析") : t("展开解析")}
                            </Button>

                            {isExpanded && (
                              <div className="mt-2 space-y-2 text-sm">
                                {result.analysis.grammar?.structure && (
                                  <p><span className="font-medium text-gray-600">{t("结构")}:</span> {result.analysis.grammar.structure}</p>
                                )}
                                {result.analysis.grammar?.tense && (
                                  <p><span className="font-medium text-gray-600">{t("时态")}:</span> {result.analysis.grammar.tense}</p>
                                )}
                                {result.analysis.tips && result.analysis.tips.length > 0 && (
                                  <ul className="list-disc list-inside text-gray-600">
                                    {result.analysis.tips.map((tip, ti) => (
                                      <li key={ti}>{tip}</li>
                                    ))}
                                  </ul>
                                )}
                                {result.analysis.cultureNotes && result.analysis.cultureNotes.length > 0 && (
                                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                    <p className="font-medium text-xs mb-1">{t("文化注释")}</p>
                                    {result.analysis.cultureNotes.map((note, ni) => (
                                      <p key={ni} className="text-xs">{note}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 提交批改按钮 */}
          {!evaluated && (
            <div className="flex justify-center">
              <Button
                onClick={handleEvaluate}
                disabled={evaluating || !anyAnswered}
                size="lg"
                className="flex items-center gap-2 px-8"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("AI 批改中...")}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("提交批改")}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 已加入错题本提示 */}
          {evaluated && addedToReview && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{t("翻译错误已加入错题本")}</span>
              <Button
                variant="link"
                size="sm"
                className="ml-auto"
                onClick={() => router.push("/review")}
              >
                {t("去复习")}
              </Button>
            </div>
          )}

          {/* 再来一组 */}
          {evaluated && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={handleGenerate} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t("再来一组")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
