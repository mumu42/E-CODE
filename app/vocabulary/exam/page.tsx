/**
 * @file app/vocabulary/exam/page.tsx
 * @description 词汇考试页面（读写测试 + 通过删除）
 * @author English Agent Team
 * @date 2026-09-28
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { speak, isTTSSupported } from "@/lib/tts";
import { ArrowLeft, Volume2, CheckCircle2, XCircle } from "lucide-react";

type ExamMode = "reading" | "writing";

/**
 * 判断写作答案是否匹配（忽略大小写、前后空格）
 */
function isWritingCorrect(answer: string, expected: string): boolean {
  return answer.trim().toLowerCase() === expected.trim().toLowerCase();
}

/**
 * 判断阅读答案是否匹配（中文释义 — 宽松匹配）
 * 用户输入包含期望释义中的关键词即算正确
 */
function isReadingCorrect(answer: string, expected: string): boolean {
  const a = answer.trim();
  const e = expected.trim();
  if (!a || !e) return false;
  // 完全匹配
  if (a === e) return true;
  // 按中文标点分隔，检查用户答案是否包含任一关键部分
  const parts = e.split(/[；;，,、。.]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  // 用户答案包含 60% 以上的关键部分
  const matched = parts.filter((p) => a.includes(p)).length;
  return matched / parts.length >= 0.6;
}

/**
 * 词汇考试页面
 * @example
 * ```tsx
 * <VocabularyExamPage />
 * ```
 */
export default function VocabularyExamPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const vocabulary = useAppStore((state) => state.vocabulary);
  const removeVocabulary = useAppStore((state) => state.removeVocabulary);

  const [mode, setMode] = useState<ExamMode>("reading");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 随机打乱词汇顺序
  const shuffled = useMemo(
    () => [...vocabulary].sort(() => Math.random() - 0.5),
    [vocabulary]
  );

  const current = shuffled[index];
  const total = shuffled.length;

  function handleSubmit() {
    if (!current || !input.trim()) return;
    setAnswers((prev) => ({ ...prev, [current.id]: input.trim() }));
    setInput("");

    if (index + 1 >= total) {
      setFinished(true);
    } else {
      setIndex((prev) => prev + 1);
    }
  }

  function handleSkip() {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: "" }));
    setInput("");

    if (index + 1 >= total) {
      setFinished(true);
    } else {
      setIndex((prev) => prev + 1);
    }
  }

  function handleSpeakWord(text: string) {
    if (!isTTSSupported()) return;
    speak(text).catch(() => {});
  }

  // 计算结果
  const results = useMemo(() => {
    if (!finished) return null;
    let correct = 0;
    const details: { id: string; word: string; meaning: string; userAnswer: string; correct: boolean }[] = [];
    for (const item of shuffled) {
      const userAnswer = answers[item.id] ?? "";
      const isCorrect = mode === "reading"
        ? isReadingCorrect(userAnswer, item.meaning)
        : isWritingCorrect(userAnswer, item.word);
      if (isCorrect) correct++;
      details.push({
        id: item.id,
        word: item.word,
        meaning: item.meaning,
        userAnswer,
        correct: isCorrect,
      });
    }
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage, details };
  }, [finished, shuffled, answers, mode]);

  const passed = results ? results.percentage >= 80 : false;

  async function handleDeletePassed() {
    if (!results) return;
    setDeleting(true);
    for (const d of results.details) {
      if (d.correct) {
        removeVocabulary(d.id);
      }
    }
    setDeleting(false);
    setFinished(false);
    setIndex(0);
    setAnswers({});
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <p className="text-gray-500">{t("请先创建学习档案。")}</p>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-gray-500">{t("词汇本为空，请先添加词汇。")}</p>
            <Button variant="outline" onClick={() => router.push("/vocabulary")}>
              {t("返回词汇本")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/vocabulary")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl">{t("词汇考试")}</CardTitle>
          </div>
          {!finished &&
        <div className="flex gap-2">
              <Button
            size="sm"
            variant={mode === "reading" ? "default" : "outline"}
            onClick={() => { setMode("reading"); setIndex(0); setAnswers({}); setInput(""); }}
          >
            {t("阅读测试")}
          </Button>
              <Button
            size="sm"
            variant={mode === "writing" ? "default" : "outline"}
            onClick={() => { setMode("writing"); setIndex(0); setAnswers({}); setInput(""); }}
          >
            {t("拼写测试")}
          </Button>
            </div>
        }
        </CardHeader>
        <CardContent className="space-y-6">
          {finished && results ? (
            <>
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold">
                  {results.correct} / {results.total}
                </p>
                <p className={`text-lg font-medium ${
                  passed ? "text-green-600" : "text-red-600"
                }`}>
                  {results.percentage}%
                </p>
                <p className="text-sm text-gray-500">
                  {passed
                    ? t("恭喜通过！80% 以上正确，你可以删除已掌握的词汇。")
                    : t("未通过，需要达到 80% 正确率。继续练习吧！")
                  }
                </p>
              </div>

              {/* 详细结果列表 */}
              <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3">
                {results.details.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-start gap-3 p-2 rounded ${
                      d.correct ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    {d.correct
                      ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{d.word}</span>
                        {isTTSSupported() &&
                    <button
                      type="button"
                      onClick={() => handleSpeakWord(d.word)}
                      className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                      aria-label={t("朗读")}
                    >
                            <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                    }
                      </div>
                      <p className="text-sm text-gray-600">{d.meaning}</p>
                      {!d.correct && d.userAnswer &&
                    <p className="text-xs text-red-600 mt-0.5">
                          {t("你的答案")}: {d.userAnswer}
                        </p>
                    }
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                {passed &&
              <Button
                onClick={handleDeletePassed}
                disabled={deleting}
                variant="destructive"
                className="flex-1"
              >
                    {deleting ? t("删除中...") : `删除已掌握词汇（${results.correct}个）`}
                  </Button>
              }
                <Button
                  variant="outline"
                  onClick={() => {
                    setFinished(false);
                    setIndex(0);
                    setAnswers({});
                    setInput("");
                  }}
                  className={passed ? "flex-1" : "w-full"}
                >
                  {t("重新考试")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {current && (
                <>
                  {/* 进度 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {t("进度")}: {index + 1} / {total}
                    </span>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${((index) / total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 题目 */}
                  <div className="min-h-[200px] flex flex-col items-center justify-center border rounded-xl p-8 text-center">
                    {mode === "reading" ? (
                      <>
                        <p className="text-xs text-gray-400 mb-2">{t("请写出以下单词的中文释义")}</p>
                        <div className="flex items-center gap-3 mb-6">
                          <p className="text-3xl font-bold">{current.word}</p>
                          {isTTSSupported() &&
                        <button
                          type="button"
                          onClick={() => handleSpeakWord(current.word)}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          aria-label={t("朗读")}
                        >
                              <Volume2 className="w-5 h-5 text-gray-400" />
                            </button>
                        }
                        </div>
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                          placeholder={t("输入中文释义...")}
                          className="w-full max-w-md border rounded-md px-3 py-2 text-sm text-center"
                          autoFocus
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mb-2">{t("请根据中文释义写出对应的英文单词")}</p>
                        <p className="text-xl font-medium mb-6">{current.meaning}</p>
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                          placeholder={t("输入英文单词...")}
                          className="w-full max-w-md border rounded-md px-3 py-2 text-sm text-center"
                          autoFocus
                        />
                      </>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="flex-1"
                    >
                      {t("跳过")}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      className="flex-1"
                    >
                      {index + 1 >= total ? t("完成") : t("下一题")}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
