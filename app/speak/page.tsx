/**
 * @file app/speak/page.tsx
 * @description 口语练习页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useAppStore } from "@/lib/store";
import { generateDailyTopic, getSpeakFeedback } from "@/lib/ai/client";
import { buildMemoryContext } from "@/lib/ai/memory";
import { saveToStatic } from "@/lib/storage/excel";
import { speak, stopSpeaking, isTTSSupported, calculateSimilarity } from "@/lib/tts";
import type { SpeakFeedback } from "@/lib/types";
import { Volume2, Square, Mic, RefreshCw } from "lucide-react";

/**
 * 口语练习页面
 * @example
 * ```tsx
 * <SpeakPage />
 * ```
 */
export default function SpeakPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const topics = useAppStore((state) => state.topics);
  const addTopic = useAppStore((state) => state.addTopic);
  const addSession = useAppStore((state) => state.addSession);
  const addErrors = useAppStore((state) => state.addErrors);
  const updateLearningProfile = useAppStore((state) => state.updateLearningProfile);

  const [topic, setTopic] = useState<{ topic: string; scenario: string; hints: string[] } | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<SpeakFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shadowMode, setShadowMode] = useState(false);
  const [shadowInput, setShadowInput] = useState("");
  const [shadowScore, setShadowScore] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const cached = topics.find(
      (t) => t.userId === profile.id && t.date.startsWith(today) && t.target === profile.target
    );

    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopic({
        topic: cached.topic,
        scenario: cached.scenario,
        hints: cached.hints,
      });
      return;
    }

    generateDailyTopic(profile.target, profile.level)
      .then((generated) => {
        setTopic(generated);
        addTopic({
          id: crypto.randomUUID(),
          userId: profile.id,
          date: new Date().toISOString(),
          target: profile.target,
          level: profile.level,
          topic: generated.topic,
          scenario: generated.scenario,
          hints: generated.hints,
          source: "ai",
        });
      })
      .catch((err) => console.error(err));
  }, [profile, router, topics, addTopic]);

  async function handlePlay(text: string) {
    if (playing) return;
    setPlaying(true);
    try {
      await speak(text, playbackRate);
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

  function handleShadow() {
    if (!topic) return;
    const score = calculateSimilarity(topic.topic, shadowInput);
    setShadowScore(score);
  }

  async function handleSubmit() {
    if (!profile || !topic) return;

    setLoading(true);
    try {
      const { errors: errorItems, sessions, assessments } = useAppStore.getState();
      const learningContext = buildMemoryContext(errorItems, sessions, assessments);
      const result = await getSpeakFeedback(
        profile.target,
        profile.level,
        topic.topic,
        topic.scenario,
        userInput,
        learningContext
      );
      setFeedback(result);

      const session = {
        id: crypto.randomUUID(),
        userId: profile.id,
        type: "SPEAK" as const,
        date: new Date().toISOString(),
        topic: topic.topic,
        scenario: topic.scenario,
        userInput,
        aiFeedback: result.feedback,
        fluencyScore: result.score,
      };

      addSession(session);

      const errors = [
        ...result.grammarIssues.map((issue) => ({
          id: crypto.randomUUID(),
          userId: profile.id,
          sessionId: session.id,
          type: "SPEAK" as const,
          date: session.date,
          original: issue,
          correction: "",
          explanation: issue,
          errorType: "grammar" as const,
        })),
        ...result.betterExpressions.map((expr) => ({
          id: crypto.randomUUID(),
          userId: profile.id,
          sessionId: session.id,
          type: "SPEAK" as const,
          date: session.date,
          original: expr,
          correction: expr,
          explanation: expr,
          errorType: "expression" as const,
        })),
      ];
      addErrors(errors);
      updateLearningProfile();

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("AI 反馈失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">口语练习</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {topic ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">场景：{topic.scenario}</p>
              <p className="text-lg font-semibold text-blue-950">{topic.topic}</p>
              {topic.hints.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
                  {topic.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlay(`${topic.topic} ${topic.hints.join(" ")}`)}
                  disabled={playing}
                >
                  {playing ? <Square className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {playing ? "播放中..." : "播放标准发音"}
                </Button>
                {playing && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleStop}>
                    停止
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShadowMode(!shadowMode)}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {shadowMode ? "关闭跟读" : "跟读模式"}
                </Button>
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="text-sm border rounded px-2"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                </select>
              </div>
              {!isTTSSupported() && (
                <p className="text-xs text-orange-600 mt-2">当前浏览器不支持 TTS。</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">正在生成今日话题...</p>
          )}

          {shadowMode && topic && (
            <div className="space-y-2 border p-4 rounded-lg bg-gray-50">
              <Label>跟读模式</Label>
              <p className="text-sm text-gray-600">请先听标准发音，然后输入你听到的内容：</p>
              <VoiceRecorder value={shadowInput} onChange={setShadowInput} />
              <Button type="button" onClick={handleShadow} disabled={shadowInput.trim().length < 3}>
                <RefreshCw className="w-4 h-4 mr-2" />
                对比评分
              </Button>
              {shadowScore !== null && (
                <p className="text-sm">
                  跟读相似度：<span className="font-bold text-blue-600">{shadowScore}%</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>你的回答</Label>
            <VoiceRecorder value={userInput} onChange={setUserInput} />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || userInput.trim().length < 5}
            className="w-full"
          >
            {loading ? "AI 分析中..." : "提交并获取反馈"}
          </Button>

          {feedback && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">综合评分：</span>
                <span className="text-2xl font-bold text-blue-600">{feedback.score}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">语法/表达问题</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {feedback.grammarIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">更地道的表达</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {feedback.betterExpressions.map((expr, idx) => (
                    <li key={idx}>{expr}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">发音提示</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {feedback.pronunciationTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">整体评价</h4>
                <p className="text-sm text-gray-700">{feedback.feedback}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
