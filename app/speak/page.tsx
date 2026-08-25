/**
 * @file app/speak/page.tsx
 * @description 口语练习页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";
import { t } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { VoiceRecorder, type WordConfidence } from "@/components/VoiceRecorder";
import { useAppStore } from "@/lib/store";
import { generateDailyTopic, getSpeakFeedback } from "@/lib/ai/client";
import { buildMemoryContext } from "@/lib/ai/memory";
import { saveToStatic } from "@/lib/storage/excel";
import { speak, stopSpeaking, isTTSSupported, calculateSimilarity } from "@/lib/tts";
import type { SpeakFeedback } from "@/lib/types";
import { useCustomPrompt } from "@/hooks/usePrompts";
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
  const speakPrompt = useCustomPrompt("speak");

  const [topic, setTopic] = useState<{topic: string;scenario: string;hints: string[];} | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<SpeakFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shadowMode, setShadowMode] = useState(false);
  const [shadowInput, setShadowInput] = useState("");
  const [shadowScore, setShadowScore] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [wordConfidences, setWordConfidences] = useState<WordConfidence[]>([]);

  const LOW_CONFIDENCE_THRESHOLD = 0.7;

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
        hints: cached.hints
      });
      return;
    }

    generateDailyTopic(profile.target, profile.level).
    then((generated) => {
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
        source: "ai"
      });
    }).
    catch((err) => console.error(err));
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
        learningContext,
        speakPrompt
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
        fluencyScore: result.score
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
        errorType: "grammar" as const
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
        errorType: "expression" as const
      }))];

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
          <CardTitle className="text-2xl">{t("\u53E3\u8BED\u7EC3\u4E60")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {topic ?
          <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">{t("\u573A\u666F\uFF1A")}{topic.scenario}</p>
              <p className="text-lg font-semibold text-blue-950">{topic.topic}</p>
              {topic.hints.length > 0 &&
            <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
                  {topic.hints.map((hint, idx) =>
              <li key={idx}>{hint}</li>
              )}
                </ul>
            }
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePlay(`${topic.topic} ${topic.hints.join(" ")}`)}
                disabled={playing}>
                
                  {playing ? <Square className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {playing ? t("\u64AD\u653E\u4E2D...") : t("\u64AD\u653E\u6807\u51C6\u53D1\u97F3")}
                </Button>
                {playing &&
              <Button type="button" variant="ghost" size="sm" onClick={handleStop}>{t("\u505C\u6B62")}

              </Button>
              }
                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShadowMode(!shadowMode)}>
                
                  <Mic className="w-4 h-4 mr-2" />
                  {shadowMode ? t("\u5173\u95ED\u8DDF\u8BFB") : t("\u8DDF\u8BFB\u6A21\u5F0F")}
                </Button>
                <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="text-sm border rounded px-2">
                
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                </select>
              </div>
              {!isTTSSupported() &&
            <p className="text-xs text-orange-600 mt-2">{t("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 TTS\u3002")}</p>
            }
            </div> :

          <p className="text-gray-500">{t("\u6B63\u5728\u751F\u6210\u4ECA\u65E5\u8BDD\u9898...")}</p>
          }

          {shadowMode && topic &&
          <div className="space-y-2 border p-4 rounded-lg bg-gray-50">
              <Label>{t("\u8DDF\u8BFB\u6A21\u5F0F")}</Label>
              <p className="text-sm text-gray-600">{t("\u8BF7\u5148\u542C\u6807\u51C6\u53D1\u97F3\uFF0C\u7136\u540E\u8F93\u5165\u4F60\u542C\u5230\u7684\u5185\u5BB9\uFF1A")}</p>
              <VoiceRecorder value={shadowInput} onChange={setShadowInput} />
              <Button type="button" onClick={handleShadow} disabled={shadowInput.trim().length < 3}>
                <RefreshCw className="w-4 h-4 mr-2" />{t("\u5BF9\u6BD4\u8BC4\u5206")}

            </Button>
              {shadowScore !== null &&
            <p className="text-sm">{t("\u8DDF\u8BFB\u76F8\u4F3C\u5EA6\uFF1A")}
              <span className="font-bold text-blue-600">{shadowScore}%</span>
                </p>
            }
            </div>
          }

          <div className="space-y-2">
            <Label>{t("\u4F60\u7684\u56DE\u7B54")}</Label>
            <VoiceRecorder value={userInput} onChange={setUserInput} onConfidenceChange={setWordConfidences} />
            {wordConfidences.length > 0 &&
            <div className="text-sm p-3 rounded-lg bg-gray-50">
                <p className="font-medium mb-2">{t("\u8BC6\u522B\u7F6E\u4FE1\u5EA6\uFF1A")}</p>
                <div className="flex flex-wrap gap-2">
                  {wordConfidences.map((w, idx) =>
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                  w.confidence < LOW_CONFIDENCE_THRESHOLD ?
                  "bg-red-100 text-red-700" :
                  "bg-green-100 text-green-700"}`
                  }>
                  
                      {w.word}
                      {w.confidence < LOW_CONFIDENCE_THRESHOLD &&
                  <button
                    type="button"
                    onClick={() => speak(w.word, 1)}
                    className="text-xs underline"
                    title={t("\u64AD\u653E\u6807\u51C6\u53D1\u97F3")}>
                    
                          🔊
                        </button>
                  }
                    </span>
                )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("\u7EA2\u8272\u4E3A\u4F4E\u7F6E\u4FE1\u5EA6\u8BCD\u6C47\uFF0C\u53EF\u70B9\u51FB \uD83D\uDD0A \u542C\u53D6\u6807\u51C6\u53D1\u97F3\u3002")}

              </p>
              </div>
            }
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || userInput.trim().length < 5}
            className="w-full">
            
            {loading ? t("AI \u5206\u6790\u4E2D...") : t("\u63D0\u4EA4\u5E76\u83B7\u53D6\u53CD\u9988")}
          </Button>

          {feedback &&
          <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{t("\u7EFC\u5408\u8BC4\u5206\uFF1A")}</span>
                <span className="text-2xl font-bold text-blue-600">{feedback.score}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t("\u8BED\u6CD5/\u8868\u8FBE\u95EE\u9898")}</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {feedback.grammarIssues.map((issue, idx) =>
                <li key={idx}>{issue}</li>
                )}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t("\u66F4\u5730\u9053\u7684\u8868\u8FBE")}</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {feedback.betterExpressions.map((expr, idx) =>
                <li key={idx}>{expr}</li>
                )}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t("\u53D1\u97F3\u63D0\u793A")}</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {feedback.pronunciationTips.map((tip, idx) =>
                <li key={idx}>{tip}</li>
                )}
                </ul>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t("\u6574\u4F53\u8BC4\u4EF7")}</h4>
                <p className="text-sm text-gray-700">{feedback.feedback}</p>
              </div>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}