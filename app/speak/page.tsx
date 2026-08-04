"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useAppStore } from "@/lib/store";
import { generateDailyTopic, getSpeakFeedback } from "@/lib/ai/client";
import { saveToStatic } from "@/lib/storage/excel";
import type { SpeakFeedback } from "@/lib/types";

export default function SpeakPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addSession = useAppStore((state) => state.addSession);

  const [topic, setTopic] = useState<{ topic: string; scenario: string; hints: string[] } | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<SpeakFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
      return;
    }
    generateDailyTopic(profile.target, profile.level)
      .then(setTopic)
      .catch((err) => console.error(err));
  }, [profile, router]);

  async function handleSubmit() {
    if (!profile || !topic) return;

    setLoading(true);
    try {
      const result = await getSpeakFeedback(
        profile.target,
        profile.level,
        topic.topic,
        topic.scenario,
        userInput
      );
      setFeedback(result);

      addSession({
        id: crypto.randomUUID(),
        userId: profile.id,
        type: "SPEAK",
        date: new Date().toISOString(),
        topic: topic.topic,
        scenario: topic.scenario,
        userInput,
        aiFeedback: result.feedback,
        fluencyScore: result.score,
      });

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
            </div>
          ) : (
            <p className="text-gray-500">正在生成今日话题...</p>
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
