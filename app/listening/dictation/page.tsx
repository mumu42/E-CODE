/**
 * @file app/listening/dictation/page.tsx
 * @description 听写全文练习页面
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { generateListeningItem } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { speak, stopSpeaking, isTTSSupported, calculateSimilarity } from "@/lib/tts";
import type { ListeningItem } from "@/lib/types";
import { Volume2, Square } from "lucide-react";

/**
 * 听写全文练习页面
 * @example
 * ```tsx
 * <DictationPage />
 * ```
 */
export default function DictationPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addDictationRecord = useAppStore((state) => state.addDictationRecord);
  const listeningPrompt = useCustomPrompt("listening");

  const [item, setItem] = useState<Omit<ListeningItem, "id" | "userId" | "date" | "score"> | null>(null);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [similarity, setSimilarity] = useState<number | null>(null);

  const loadItem = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setSubmitted(false);
    setSimilarity(null);
    setUserInput("");
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

  function handleSubmit() {
    if (!item || !profile) return;
    const score = calculateSimilarity(item.transcript, userInput);
    setSimilarity(score);
    setSubmitted(true);

    addDictationRecord({
      id: crypto.randomUUID(),
      userId: profile.id,
      date: new Date().toISOString(),
      sentence: item.transcript,
      userInput,
      similarity: score
    });
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">{t("\u542C\u5199\u5168\u6587")}</CardTitle>
          <Button variant="outline" size="sm" onClick={loadItem} disabled={loading}>
            {loading ? t("\u751F\u6210\u4E2D...") : t("\u6362\u4E00\u6BB5")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {!item ?
          <div className="text-center space-y-4">
              <p className="text-gray-500">{t("\u70B9\u51FB\u5F00\u59CB\uFF0CAI \u4F1A\u4E3A\u4F60\u751F\u6210\u4E00\u6BB5\u542C\u529B\u6750\u6599\u3002")}</p>
              <Button onClick={loadItem} disabled={loading}>
                {loading ? t("\u751F\u6210\u4E2D...") : t("\u5F00\u59CB\u542C\u5199")}
              </Button>
            </div> :

          <>
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <Button onClick={handlePlay} disabled={playing} type="button">
                    {playing ?
                  <Square className="w-4 h-4 mr-2" /> :

                  <Volume2 className="w-4 h-4 mr-2" />
                  }
                    {playing ? t("\u64AD\u653E\u4E2D...") : t("\u64AD\u653E\u97F3\u9891")}
                  </Button>
                  {playing &&
                <Button variant="outline" onClick={handleStop} type="button">{t("\u505C\u6B62")}

                </Button>
                }
                </div>
                {!isTTSSupported() &&
              <p className="text-xs text-orange-600">{t("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 TTS\u3002")}</p>
              }
              </div>

              <div className="space-y-2">
                <Label htmlFor="dictation-input">{t("\u4F60\u542C\u5230\u7684\u5185\u5BB9")}</Label>
                <textarea
                id="dictation-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={submitted}
                placeholder={t("\u8BF7\u5C3D\u91CF\u5199\u51FA\u5B8C\u6574\u539F\u6587...")}
                className="w-full h-40 p-3 border rounded-md text-sm" />
              
              </div>

              {!submitted ?
            <Button
              onClick={handleSubmit}
              disabled={userInput.trim().length < 3}
              className="w-full">{t("\u63D0\u4EA4\u5E76\u8BC4\u5206")}


            </Button> :

            <Button onClick={loadItem} className="w-full">{t("\u518D\u6765\u4E00\u6BB5")}

            </Button>
            }

              {submitted && similarity !== null &&
            <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                  <p className="font-medium">{t("\u76F8\u4F3C\u5EA6\uFF1A")}

                <span
                  className={`text-xl font-bold ${
                  similarity >= 80 ?
                  "text-green-600" :
                  similarity >= 60 ?
                  "text-yellow-600" :
                  "text-red-600"}`
                  }>
                  
                      {similarity}%
                    </span>
                  </p>
                  <div>
                    <p className="text-sm font-medium">{t("\u539F\u6587")}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.transcript}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t("\u4F60\u7684\u542C\u5199")}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{userInput}</p>
                  </div>
                </div>
            }
            </>
          }
        </CardContent>
      </Card>
    </div>);

}