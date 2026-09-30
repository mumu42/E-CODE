/**
 * @file app/translate/page.tsx
 * @description 翻译页面：单词/句子双模式、英↔中双向、AI 自评纠错与解析
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
import { translateText } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { buildTranslationReviewErrors, dedupeTranslationErrors } from "@/lib/review/utils";
import type { TranslationRecord, TranslationDirection, TranslationMode } from "@/lib/types";
import {
  Loader2,
  ArrowLeft,
  Languages,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const WORD_MAX = 60;
const SENTENCE_MAX = 500;

const DIRECTION_LABELS: Record<TranslationDirection, string> = {
  en2zh: "英 → 中",
  zh2en: "中 → 英",
};

/**
 * 简单 diff 高亮：将用户原文与参考译文逐字对比，标记不同部分
 * 返回一个带 <mark> 标签的 JSX 片段
 */
function DiffHighlight({ userText, refText }: { userText: string; refText: string }) {
  const uWords = userText.split(/(\s+)/);
  const rWords = refText.split(/(\s+)/);
  const parts: { text: string; diff: boolean }[] = [];

  const maxLen = Math.max(uWords.length, rWords.length);
  for (let i = 0; i < maxLen; i++) {
    const u = uWords[i] ?? "";
    const r = rWords[i] ?? "";
    if (u === r) {
      parts.push({ text: r, diff: false });
    } else {
      if (r) parts.push({ text: r, diff: true });
    }
  }

  return (
    <span>
      {parts.map((p, i) =>
        p.diff ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-700/40 text-inherit rounded px-0.5"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

/**
 * 翻译页面
 */
export default function TranslatePage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addTranslationRecord = useAppStore((state) => state.addTranslationRecord);
  const addErrors = useAppStore((state) => state.addErrors);
  const translationPrompt = useCustomPrompt("translation");

  const [mode, setMode] = useState<TranslationMode>("word");
  const [direction, setDirection] = useState<TranslationDirection>("en2zh");
  const [sourceText, setSourceText] = useState("");
  const [userTranslation, setUserTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 结果状态
  const [result, setResult] = useState<{
    aiTranslation: string;
    score?: number;
    dimensionScores?: { accuracy: number; fluency: number; completeness: number };
    errors?: { original: string; correction: string; explanation: string }[];
    analysis: TranslationRecord["analysis"];
  } | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    grammar: true,
    collocations: false,
    tips: false,
    culture: false,
  });

  const [addedToReview, setAddedToReview] = useState(false);

  const maxLength = mode === "word" ? WORD_MAX : SENTENCE_MAX;
  const isValidInput = sourceText.trim().length > 0 && sourceText.length <= maxLength;
  const isSentenceMode = mode === "sentence";
  const canSubmit = isValidInput;

  const handleModeChange = useCallback((newMode: TranslationMode) => {
    setMode(newMode);
    setResult(null);
    setError(null);
    setAddedToReview(false);
    if (newMode === "word") setUserTranslation("");
  }, []);

  const handleDirectionChange = useCallback((newDir: TranslationDirection) => {
    setDirection(newDir);
    setResult(null);
    setError(null);
    setAddedToReview(false);
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleSubmit() {
    if (!profile || !canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAddedToReview(false);

    try {
      const data = await translateText(
        mode,
        direction,
        sourceText.trim(),
        isSentenceMode ? userTranslation.trim() || undefined : undefined,
        translationPrompt
      );

      setResult(data);

      // 写入翻译记录
      const translationErrors = isSentenceMode && data.errors
        ? data.errors.map((e) => ({ ...e, errorType: "translation" as const }))
        : undefined;

      const record: TranslationRecord = {
        id: crypto.randomUUID(),
        userId: profile.id,
        mode,
        direction,
        date: new Date().toISOString(),
        sourceText: sourceText.trim(),
        userTranslation: isSentenceMode ? userTranslation.trim() || undefined : undefined,
        aiTranslation: data.aiTranslation,
        score: data.score,
        dimensionScores: data.dimensionScores,
        analysis: data.analysis,
        errors: translationErrors,
        addedToReview: false,
      };

      addTranslationRecord(record);

      // 句子模式 + 有自译 + 有错误点 → 沉淀错题
      if (translationErrors && translationErrors.length > 0) {
        const errorItems = buildTranslationReviewErrors(record, profile.id);
        if (errorItems.length > 0) {
          const deduped = dedupeTranslationErrors(errorItems);
          addErrors(deduped);
          setAddedToReview(true);
        }
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError("解析失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("暂无学习档案")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("开始学习")}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("返回")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Languages className="w-6 h-6 text-blue-500" />
          {t("翻译")}
        </h1>
      </div>

      {/* 模式与方向切换 */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          {/* 模式切换 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-500 self-center mr-2">{t("模式")}</span>
            <Button
              variant={mode === "word" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("word")}
            >
              {t("单词")}
            </Button>
            <Button
              variant={mode === "sentence" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("sentence")}
            >
              {t("句子")}
            </Button>
          </div>

          {/* 方向切换 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-500 self-center mr-2">{t("方向")}</span>
            <Button
              variant={direction === "en2zh" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDirectionChange("en2zh")}
            >
              {t(DIRECTION_LABELS.en2zh)}
            </Button>
            <Button
              variant={direction === "zh2en" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDirectionChange("zh2en")}
            >
              {t(DIRECTION_LABELS.zh2en)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 输入区 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("原文")}</CardTitle>
          <CardDescription>
            {t(mode === "word" ? "输入要翻译的单词或短语" : "输入要翻译的句子")}
            {isSentenceMode && (
              <span className="ml-2 text-blue-500">
                {t("翻译后将由 AI 评分")}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <textarea
              value={sourceText}
              onChange={(e) => {
                setSourceText(e.target.value);
                setResult(null);
                setAddedToReview(false);
              }}
              placeholder={direction === "en2zh" ? t("请输入英文...") : t("请输入中文...")}
              className="w-full min-h-[100px] p-3 border rounded-md text-sm resize-y"
              maxLength={maxLength}
              rows={mode === "word" ? 2 : 4}
            />
            <span className="absolute bottom-2 right-2 text-xs text-gray-400">
              {sourceText.length}/{maxLength}
            </span>
          </div>

          {/* 自译区（句子模式） */}
          {isSentenceMode && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t("你的翻译（可选）")}
                <span className="text-xs text-gray-400 ml-2">
                  {t("填写后 AI 将对照评分并纠正错误")}
                </span>
              </label>
              <textarea
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                placeholder={direction === "en2zh" ? t("请输入你的中文翻译...") : t("请输入你的英文翻译...")}
                className="w-full min-h-[80px] p-3 border rounded-md text-sm resize-y"
                maxLength={maxLength * 2}
                rows={3}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("翻译中...")}
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4" />
                  {t("翻译")}
                </>
              )}
            </Button>
            {!isValidInput && sourceText.length > 0 && (
              <span className="text-xs text-red-500">
                {sourceText.length > maxLength
                  ? t("超出长度限制")
                  : t("请输入内容")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 加载态：骨架屏 */}
      {loading && (
        <Card className="mb-6">
          <CardContent className="py-8 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
          </CardContent>
        </Card>
      )}

      {/* 错误态 */}
      {error && !loading && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardContent className="py-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p className="text-red-600 dark:text-red-400">{t(error)}</p>
            <Button variant="outline" size="sm" onClick={handleSubmit}>
              <RefreshCw className="w-4 h-4 mr-1" />
              {t("重试")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 结果区 */}
      {result && !loading && (
        <div className="space-y-6">
          {/* 参考译文 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-500" />
                {t("参考译文")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 句子模式+有自译：diff 高亮 */}
              {isSentenceMode && userTranslation.trim() ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">{t("你的翻译")}</p>
                    <p className="text-sm line-through text-red-600">{userTranslation.trim()}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">{t("参考译文（高亮为与你的差异）")}</p>
                    <p className="text-sm leading-relaxed">
                      <DiffHighlight
                        userText={userTranslation.trim()}
                        refText={result.aiTranslation}
                      />
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-lg leading-relaxed">{result.aiTranslation}</p>
              )}
            </CardContent>
          </Card>

          {/* 评分卡片（句子模式且有自译时展示） */}
          {result.score !== undefined && result.score !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("评分")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 总分 */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {result.score}
                  </span>
                  <span className="text-gray-500 text-sm">{t("/ 100")}</span>
                </div>

                {/* 维度分 */}
                {result.dimensionScores && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-gray-500">{t("准确度")}</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {result.dimensionScores.accuracy}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-gray-500">{t("流畅度")}</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {result.dimensionScores.fluency}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-xs text-gray-500">{t("完整度")}</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {result.dimensionScores.completeness}
                      </p>
                    </div>
                  </div>
                )}

                {/* 错误列表 */}
                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("改进点")}
                    </p>
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm space-y-1"
                      >
                        <p>
                          <span className="text-red-600 line-through">{err.original}</span>
                          <span className="mx-2">→</span>
                          <span className="text-green-600">{err.correction}</span>
                        </p>
                        <p className="text-xs text-gray-500">{err.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 已加入错题本提示 */}
          {addedToReview && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              {t("翻译错误已加入错题本，快去复习吧")}
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

          {/* AI 解析四区块（可折叠） */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("AI 解析")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 语法结构 */}
              <AnalysisSection
                title={t("语法结构")}
                isOpen={expandedSections.grammar}
                onToggle={() => toggleSection("grammar")}
              >
                <div className="space-y-2">
                  <p>
                    <span className="font-medium text-gray-600">{t("结构")}：</span>
                    {result.analysis.grammar.structure}
                  </p>
                  {result.analysis.grammar.tense && (
                    <p>
                      <span className="font-medium text-gray-600">{t("时态")}：</span>
                      {result.analysis.grammar.tense}
                    </p>
                  )}
                  {result.analysis.grammar.keyPoints && result.analysis.grammar.keyPoints.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                      {result.analysis.grammar.keyPoints.map((kp, i) => (
                        <li key={i} className="text-sm">{kp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </AnalysisSection>

              {/* 重点词组搭配 */}
              <AnalysisSection
                title={t("重点词组搭配")}
                isOpen={expandedSections.collocations}
                onToggle={() => toggleSection("collocations")}
              >
                {result.analysis.collocations.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("暂无")}</p>
                ) : (
                  <div className="space-y-3">
                    {result.analysis.collocations.map((c, i) => (
                      <div key={i} className="border-b pb-2 last:border-0">
                        <p className="font-medium text-sm">{c.phrase}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{c.usage}</p>
                        {c.synonyms && c.synonyms.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {t("近义")}：{c.synonyms.join("、")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AnalysisSection>

              {/* 翻译技巧 */}
              <AnalysisSection
                title={t("翻译技巧点拨")}
                isOpen={expandedSections.tips}
                onToggle={() => toggleSection("tips")}
              >
                {result.analysis.tips.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("暂无")}</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {result.analysis.tips.map((tip, i) => (
                      <li key={i} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                )}
              </AnalysisSection>

              {/* 文化语境 */}
              <AnalysisSection
                title={t("文化/语境注释")}
                isOpen={expandedSections.culture}
                onToggle={() => toggleSection("culture")}
              >
                {result.analysis.cultureNotes.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("暂无")}</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {result.analysis.cultureNotes.map((note, i) => (
                      <li key={i} className="text-sm">{note}</li>
                    ))}
                  </ul>
                )}
              </AnalysisSection>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/** 可折叠分析区块 */
function AnalysisSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-sm font-medium bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && <div className="p-3 text-sm">{children}</div>}
    </div>
  );
}
