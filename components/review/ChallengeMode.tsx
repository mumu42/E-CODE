/**
 * @file components/review/ChallengeMode.tsx
 * @description 错题挑战模式：混合闪卡/听写/填空并计时计分
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { speak, calculateSimilarity } from "@/lib/tts";
import { generateFillBlank } from "@/lib/review/utils";
import type { ErrorItem } from "@/lib/types";
import { Timer, Trophy } from "lucide-react";

type ChallengeType = "flashcard" | "dictation" | "fillblank";

interface ChallengeItem {
  error: ErrorItem;
  type: ChallengeType;
}

interface ChallengeModeProps {
  errors: ErrorItem[];
  onGrade: (id: string, grade: "hard" | "good" | "easy") => void;
}

const TOTAL_SECONDS = 300;
const types: ChallengeType[] = ["flashcard", "dictation", "fillblank"];

function buildChallengeItems(errors: ErrorItem[]): ChallengeItem[] {
  return errors.slice(0, 10).map((err, i) => ({
    error: err,
    type: types[i % types.length],
  }));
}

/** 错题挑战模式组件 */
export function ChallengeMode({ errors, onGrade }: ChallengeModeProps) {
  const items = buildChallengeItems(errors);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [dictationInput, setDictationInput] = useState("");
  const [fillInput, setFillInput] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const current = items[index];
  const blank = current && current.type === "fillblank" ? generateFillBlank(current.error.original, current.error.correction) : null;

  function handleAnswer(isRight: boolean) {
    if (isRight) setCorrectCount((c) => c + 1);
    setShowResult(true);
  }

  function next(grade: "hard" | "good" | "easy") {
    if (!current) return;
    onGrade(current.error.id, grade);
    setShowResult(false);
    setDictationInput("");
    setFillInput("");
    setFlipped(false);
    if (index >= items.length - 1) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function submitDictation() {
    if (!current) return;
    const similarity = calculateSimilarity(current.error.correction, dictationInput);
    handleAnswer(similarity >= 80);
  }

  function submitFillBlank() {
    if (!current || !blank) return;
    handleAnswer(fillInput.trim().toLowerCase() === blank.answer.toLowerCase());
  }

  function submitFlashcard(grade: "hard" | "good" | "easy") {
    if (!current) return;
    handleAnswer(grade === "good" || grade === "easy");
    // Defer next to show result briefly
    setTimeout(() => next(grade), 300);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = items.length > 0 ? Math.round(((index + (showResult || finished ? 1 : 0)) / items.length) * 100) : 0;

  if (items.length === 0 || !current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">暂无可用错题</p>
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    const score = Math.round((correctCount / items.length) * 100);
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold">挑战结束</h2>
          <p className="text-lg">
            得分：{correctCount}/{items.length}（{score}%）
          </p>
          <Button onClick={() => window.location.reload()}>再来一次</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-gray-600">
          <Timer className="w-4 h-4" />
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span className="text-gray-600">
          {index + 1} / {items.length}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {current.type === "flashcard" && "闪卡"}
            {current.type === "dictation" && "听写"}
            {current.type === "fillblank" && "填空"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.type === "flashcard" && (
            <>
              <div
                className="p-6 border rounded-md text-center cursor-pointer min-h-[160px] flex flex-col items-center justify-center"
                onClick={() => setFlipped(!flipped)}
              >
                {!flipped ? (
                  <>
                    <p className="text-lg line-through text-red-600">{current.error.original}</p>
                    <p className="text-xs text-gray-400 mt-2">点击查看修正</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-green-700">{current.error.correction}</p>
                    <p className="text-sm text-gray-600 mt-2">{current.error.explanation}</p>
                  </>
                )}
              </div>
              {!showResult ? (
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => submitFlashcard("hard")}>难</Button>
                  <Button onClick={() => submitFlashcard("good")}>会</Button>
                  <Button variant="outline" onClick={() => submitFlashcard("easy")}>易</Button>
                </div>
              ) : (
                <Button onClick={() => next("good")}>下一题</Button>
              )}
            </>
          )}

          {current.type === "dictation" && (
            <>
              <Button
                onClick={() => speak(current.error.correction, 0.9)}
                variant="outline"
              >
                播放句子
              </Button>
              {!showResult ? (
                <>
                  <textarea
                    value={dictationInput}
                    onChange={(e) => setDictationInput(e.target.value)}
                    placeholder="请输入听到的句子"
                    className="w-full min-h-[120px] p-3 border rounded-md text-sm"
                  />
                  <Button onClick={submitDictation} disabled={!dictationInput.trim()}>
                    提交
                  </Button>
                </>
              ) : (
                <Button onClick={() => next("good")}>下一题</Button>
              )}
            </>
          )}

          {current.type === "fillblank" && blank && (
            <>
              <p className="text-lg">{blank.sentence}</p>
              {!showResult ? (
                <>
                  <input
                    type="text"
                    value={fillInput}
                    onChange={(e) => setFillInput(e.target.value)}
                    placeholder="请输入缺失部分"
                    className="w-full h-10 px-3 rounded border text-sm"
                  />
                  <Button onClick={submitFillBlank} disabled={!fillInput.trim()}>
                    提交
                  </Button>
                </>
              ) : (
                <Button onClick={() => next("good")}>下一题</Button>
              )}
            </>
          )}

          {showResult && (
            <p className="text-center text-sm text-gray-600">
              正确答案：{current.error.correction}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
