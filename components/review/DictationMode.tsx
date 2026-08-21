/**
 * @file components/review/DictationMode.tsx
 * @description 听写模式：TTS 播放正确句子，用户输入听写内容
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { speak, calculateSimilarity } from "@/lib/tts";
import type { ErrorItem } from "@/lib/types";
import { Volume2, Play, CheckCircle, XCircle } from "lucide-react";

interface DictationModeProps {
  errors: ErrorItem[];
  onGrade: (id: string, grade: "hard" | "good" | "easy") => void;
}

/** 听写模式组件 */
export function DictationMode({ errors, onGrade }: DictationModeProps) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [playing, setPlaying] = useState(false);

  const current = errors[index];

  async function handlePlay() {
    if (!current || playing) return;
    setPlaying(true);
    try {
      await speak(current.correction, 0.9);
    } catch {
      alert("播放失败，当前浏览器可能不支持 TTS。");
    } finally {
      setPlaying(false);
    }
  }

  function handleSubmit() {
    if (!current) return;
    setShowResult(true);
  }

  function handleNext(grade: "hard" | "good" | "easy") {
    if (!current) return;
    onGrade(current.id, grade);
    setInput("");
    setShowResult(false);
    setIndex((i) => Math.min(i + 1, errors.length - 1));
  }

  if (errors.length === 0 || !current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">暂无可用错题</p>
        </CardContent>
      </Card>
    );
  }

  const similarity = showResult
    ? calculateSimilarity(current.correction, input)
    : 0;
  const grade: "hard" | "good" | "easy" =
    similarity >= 90 ? "easy" : similarity >= 60 ? "good" : "hard";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          第 {index + 1} / {errors.length} 题
        </span>
        <span className="capitalize">{current.errorType}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            听写
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handlePlay} disabled={playing} variant="outline">
            <Play className="w-4 h-4 mr-2" />
            {playing ? "播放中..." : "播放句子"}
          </Button>

          <textarea
            className="w-full min-h-[120px] p-3 border rounded-md text-sm"
            placeholder="请输入你听到的句子"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!input.trim()}>
              提交
            </Button>
          ) : (
            <div className="space-y-4">
              <div
                className={`flex items-start gap-2 p-3 rounded-md ${
                  similarity >= 80
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {similarity >= 80 ? (
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    相似度 {similarity}% · {grade === "easy" ? "优秀" : grade === "good" ? "良好" : "再练练"}
                  </p>
                  <p className="text-sm">正确答案：{current.correction}</p>
                  <p className="text-sm mt-1">{current.explanation}</p>
                </div>
              </div>
              <Button onClick={() => handleNext(grade)}>下一题</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
