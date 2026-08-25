/**
 * @file app/vocabulary/review/page.tsx
 * @description 词汇本闪卡复习页面（基于 SM-2）
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { Brain, RotateCw } from "lucide-react";

/**
 * 词汇本闪卡复习页面
 * @example
 * ```tsx
 * <FlashcardReviewPage />
 * ```
 */
export default function FlashcardReviewPage() {
  const profile = useAppStore((state) => state.profile);
  const vocabulary = useAppStore((state) => state.vocabulary);
  const scheduleVocabularyReview = useAppStore((state) => state.scheduleVocabularyReview);

  const today = new Date().toISOString().split("T")[0];
  const dueItems = useMemo(
    () =>
    vocabulary.filter((v) => !v.nextReviewDate || v.nextReviewDate <= today),
    [vocabulary, today]
  );

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = dueItems[index];

  function handleGrade(grade: "hard" | "good" | "easy") {
    if (!current) return;
    scheduleVocabularyReview(current.id, grade);
    setFlipped(false);
    setIndex((prev) => prev + 1);
  }

  function handleReset() {
    setIndex(0);
    setFlipped(false);
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <p className="text-gray-500">{t("\u8BF7\u5148\u521B\u5EFA\u5B66\u4E60\u6863\u6848\u3002")}</p>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />{t("\u95EA\u5361\u590D\u4E60")}

          </CardTitle>
          <span className="text-sm text-gray-500">
            {Math.min(index, dueItems.length)} / {dueItems.length}
          </span>
        </CardHeader>
        <CardContent className="space-y-6">
          {dueItems.length === 0 ?
          <div className="text-center py-12 space-y-4">
              <p className="text-gray-500">{t("\u4ECA\u5929\u6CA1\u6709\u9700\u8981\u590D\u4E60\u7684\u8BCD\u6C47 \uD83C\uDF89")}</p>
              <Button variant="outline" onClick={handleReset}>
                <RotateCw className="w-4 h-4 mr-2" />{t("\u91CD\u65B0\u5F00\u59CB")}

            </Button>
            </div> :
          index >= dueItems.length ?
          <div className="text-center py-12 space-y-4">
              <p className="text-gray-500">{t("\u672C\u6B21\u590D\u4E60\u5DF2\u5B8C\u6210 \uD83C\uDF89")}</p>
              <Button variant="outline" onClick={handleReset}>
                <RotateCw className="w-4 h-4 mr-2" />{t("\u91CD\u65B0\u5F00\u59CB")}

            </Button>
            </div> :

          <>
              <div
              className="min-h-[200px] flex flex-col items-center justify-center border rounded-xl p-8 cursor-pointer transition-colors hover:bg-gray-50"
              onClick={() => setFlipped(!flipped)}>
              
                <p className="text-2xl font-bold mb-4 text-center">{current.word}</p>
                {flipped &&
              <div className="text-center space-y-2">
                    <p className="text-lg text-gray-800">{current.meaning}</p>
                    {current.example &&
                <p className="text-sm text-gray-500 italic">{current.example}</p>
                }
                  </div>
              }
                {!flipped &&
              <p className="text-xs text-gray-400">{t("\u70B9\u51FB\u5361\u7247\u67E5\u770B\u91CA\u4E49")}</p>
              }
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setFlipped(!flipped)}>
                  {flipped ? t("\u9690\u85CF\u91CA\u4E49") : t("\u663E\u793A\u91CA\u4E49")}
                </Button>
              </div>

              {flipped &&
            <div className="grid grid-cols-3 gap-3">
                  <Button variant="destructive" onClick={() => handleGrade("hard")}>{t("\u96BE")}

              </Button>
                  <Button onClick={() => handleGrade("good")}>{t("\u4F1A")}</Button>
                  <Button variant="secondary" onClick={() => handleGrade("easy")}>{t("\u6613")}

              </Button>
                </div>
            }
            </>
          }
        </CardContent>
      </Card>
    </div>);

}