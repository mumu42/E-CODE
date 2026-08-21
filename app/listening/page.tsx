/**
 * @file app/listening/page.tsx
 * @description 听力理解练习页面
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { generateListeningItem } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";
import type { ListeningItem } from "@/lib/types";
import { Volume2, Square } from "lucide-react";

/**
 * 听力理解练习页面
 * @example
 * ```tsx
 * <ListeningPage />
 * ```
 */
export default function ListeningPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addListeningRecord = useAppStore((state) => state.addListeningRecord);
  const listeningPrompt = useCustomPrompt("listening");

  const [item, setItem] = useState<Omit<ListeningItem, "id" | "userId" | "date" | "score"> | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const loadItem = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setSubmitted(false);
    setScore(null);
    setAnswers({});
    try {
      const generated = await generateListeningItem(profile.target, profile.level, listeningPrompt);
      setItem(generated);
    } catch (error) {
      console.error(error);
      alert("生成听力材料失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }, [profile, listeningPrompt]);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  async function handlePlay() {
    if (!item || playing) return;
    setPlaying(true);
    try {
      await speak(item.transcript, 1);
    } catch (error) {
      console.error(error);
      alert("播放失败，当前浏览器可能不支持 TTS。");
    } finally {
      setPlaying(false);
    }
  }

  function handleStop() {
    stopSpeaking();
    setPlaying(false);
  }

  function handleSelect(questionIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  function handleSubmit() {
    if (!item || !profile) return;
    let correct = 0;
    item.questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) correct += 1;
    });
    const percentage = Math.round((correct / item.questions.length) * 100);
    setScore(percentage);
    setSubmitted(true);

    addListeningRecord({
      id: crypto.randomUUID(),
      userId: profile.id,
      date: new Date().toISOString(),
      target: profile.target,
      level: profile.level,
      transcript: item.transcript,
      questions: item.questions,
      score: percentage,
    });
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">听力理解</CardTitle>
          <Button variant="outline" size="sm" onClick={loadItem} disabled={loading}>
            {loading ? "生成中..." : "换一段"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {!item ? (
            <div className="text-center space-y-4">
              <p className="text-gray-500">点击开始，AI 会为你生成一段听力理解材料。</p>
              <Button onClick={loadItem} disabled={loading}>
                {loading ? "生成中..." : "开始听力"}
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <Button onClick={handlePlay} disabled={playing} type="button">
                    {playing ? (
                      <Square className="w-4 h-4 mr-2" />
                    ) : (
                      <Volume2 className="w-4 h-4 mr-2" />
                    )}
                    {playing ? "播放中..." : "播放音频"}
                  </Button>
                  {playing && (
                    <Button variant="outline" onClick={handleStop} type="button">
                      停止
                    </Button>
                  )}
                </div>
                {!isTTSSupported() && (
                  <p className="text-xs text-orange-600">当前浏览器不支持 TTS。</p>
                )}
                {submitted && (
                  <div className="bg-white border rounded-md p-3">
                    <h4 className="font-medium mb-1">原文</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.transcript}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {item.questions.map((q, qIdx) => (
                  <div key={qIdx} className="border rounded-lg p-4 space-y-3">
                    <p className="font-medium">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const selected = answers[qIdx] === oIdx;
                        const showCorrect = submitted && oIdx === q.answerIndex;
                        const showWrong = submitted && selected && oIdx !== q.answerIndex;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelect(qIdx, oIdx)}
                            disabled={submitted}
                            className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                              showCorrect
                                ? "bg-green-50 border-green-500 text-green-900"
                                : showWrong
                                ? "bg-red-50 border-red-500 text-red-900"
                                : selected
                                ? "bg-blue-50 border-blue-500"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && (
                      <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                        解析：{q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {submitted && score !== null && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="font-medium">
                    得分：
                    <span
                      className={`text-xl font-bold ${
                        score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {score}
                    </span>
                    / 100
                  </p>
                </div>
              )}

              {!submitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length !== item.questions.length}
                  className="w-full"
                >
                  提交答案
                </Button>
              ) : (
                <Button onClick={loadItem} className="w-full">
                  再来一段
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
