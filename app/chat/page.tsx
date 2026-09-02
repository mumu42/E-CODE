/**
 * @file app/chat/page.tsx
 * @description AI 语音/文本对话陪练页面
 * @author English Agent Team
 * @date 2026-08-25
 */
"use client";
import { t } from "@/lib/i18n/translate";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder, type WordConfidence } from "@/components/VoiceRecorder";
import type { VoiceRecorderHandle } from "@/components/VoiceRecorder";
import { useAppStore } from "@/lib/store";
import { sendChatMessage } from "@/lib/ai/client";
import { buildMemoryContext } from "@/lib/ai/memory";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { saveToStatic } from "@/lib/storage/excel";
import { assessPronunciation, type WordPronunciation } from "@/lib/voice";
import { CHAT_ROLES, CHAT_SCENARIOS } from "@/lib/chat/roles";
import { buildChatReviewErrors, dedupeChatReviewErrors } from "@/lib/chat/review";
import { Mic, Send, Volume2, Square, Pause, Play, BookOpen, Sparkles } from "lucide-react";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";
import { generateChatScenario } from "@/lib/ai/client";

export interface Scenario {
  label: string;
  prompt: string;
  sampleOpening: string;
}

export default function ChatPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const addChatSession = useAppStore((state) => state.addChatSession);
  const updateChatSession = useAppStore((state) => state.updateChatSession);
  const addErrors = useAppStore((state) => state.addErrors);
  const chatPrompt = useCustomPrompt("chat");

  const [selectedRole, setSelectedRole] = useState(CHAT_ROLES[0].value);
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pronunciationTips, setPronunciationTips] = useState<string[]>([]);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<{
    transcript: string;
    words: WordPronunciation[];
    tips: string[];
  } | null>(null);
  const [wordConfidences, setWordConfidences] = useState<WordConfidence[]>([]);
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [generatingScenario, setGeneratingScenario] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorderHandle>(null);

  const activeSession = chatSessions.find((s) => s.id === activeSessionId);
  const isVoiceActive = (activeSession?.voiceMode ?? useVoice) && !voicePaused;

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionId, chatSessions]);

  function getGreeting(role: (typeof CHAT_ROLES)[number]["value"]): string {
    if (customScenario) return customScenario.sampleOpening;
    const scenarioData = selectedScenario
      ? CHAT_SCENARIOS[role].find((s) => s.value === selectedScenario)
      : undefined;
    return scenarioData?.sampleOpening ?? "Hello! Let's start our conversation.";
  }

  function getScenarioPrompt(role: (typeof CHAT_ROLES)[number]["value"]): string | undefined {
    if (customScenario) return customScenario.prompt;
    const scenarioData = selectedScenario
      ? CHAT_SCENARIOS[role].find((s) => s.value === selectedScenario)
      : undefined;
    return scenarioData?.prompt;
  }

  async function handleGenerateTopic() {
    if (!profile) return;
    setGeneratingScenario(true);
    try {
      const scenario = await generateChatScenario(selectedRole, profile.target, profile.level);
      setCustomScenario(scenario);
      setSelectedScenario("");
    } catch (error) {
      console.error(error);
      alert(t("热门话题生成失败，请稍后重试。"));
    } finally {
      setGeneratingScenario(false);
    }
  }

  function handleCustomTopic() {
    const topic = customTopicInput.trim();
    if (!topic) return;
    setCustomScenario({
      label: topic,
      prompt: `Discuss the topic: ${topic}`,
      sampleOpening: `Let's talk about ${topic}.`,
    });
    setSelectedScenario("");
  }

  function handleSelectFixedScenario(value: string) {
    setSelectedScenario(value);
    setCustomScenario(null);
  }

  function handleStart(role: (typeof CHAT_ROLES)[number]["value"]) {
    if (!profile) return;
    const greeting = getGreeting(role);
    const session = {
      id: crypto.randomUUID(),
      userId: profile.id,
      role,
      scenario: getScenarioPrompt(role),
      voiceMode: useVoice,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: greeting,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addChatSession(session);
    setActiveSessionId(session.id);
    setVoicePaused(false);
    if (useVoice) {
      handlePlay(greeting).catch((err) => console.error(err));
    }
  }

  async function handlePlay(text: string) {
    if (!isTTSSupported() || !text) return;
    setPlaying(true);
    try {
      await speak(text, 1);
    } catch (error) {
      console.error(error);
    } finally {
      setPlaying(false);
      // 语音模式下 TTS 播完后自动继续监听
      if (isVoiceActive && voiceRecorderRef.current) {
        voiceRecorderRef.current.start();
      }
    }
  }

  function handleStop() {
    stopSpeaking();
    setPlaying(false);
  }

  async function submitMessage(content: string) {
    if (!profile || !activeSession || !content.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    const history = activeSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const updatedMessages = [...activeSession.messages, userMessage];
    updateChatSession(activeSession.id, updatedMessages);
    setInput("");
    setWordConfidences([]);
    setLoading(true);

    try {
      const { errors, sessions, assessments } = useAppStore.getState();
      const learningContext = buildMemoryContext(errors, sessions, assessments);
      const result = await sendChatMessage(
        profile.target,
        profile.level,
        activeSession.role,
        history,
        userMessage.content,
        learningContext,
        activeSession.scenario,
        activeSession.voiceMode ?? useVoice,
        chatPrompt
      );

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: result.reply,
        corrections: result.corrections,
        pronunciationTips: result.pronunciationTips,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      updateChatSession(activeSession.id, finalMessages);
      setPronunciationTips(result.pronunciationTips ?? []);

      if ((activeSession.voiceMode ?? useVoice) && result.reply) {
        await handlePlay(result.reply);
      }

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert(t("AI 回复失败，请稍后重试。"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    await submitMessage(input);
  }

  function handleFinalTranscript(transcript: string) {
    if (!transcript.trim()) return;
    // 记录本次发音反馈
    const assessment = assessPronunciation(transcript, wordConfidences);
    setPronunciationFeedback((prev) => ({
      transcript: assessment.transcript,
      words: assessment.words,
      tips: prev?.tips ?? [],
    }));
    submitMessage(transcript);
  }

  function handleWordClick(word: string) {
    speak(word, 1).catch((err) => console.error(err));
  }

  function handleGenerateReview() {
    if (!profile || !activeSession) return;
    if (activeSession.reviewGenerated) return;

    const errors = dedupeChatReviewErrors(buildChatReviewErrors(profile, activeSession));
    if (errors.length === 0) {
      alert(t("当前对话暂无纠错记录，多聊几句再来复盘吧。"));
      return;
    }

    addErrors(errors);
    // 标记已生成复习
    useAppStore.setState((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.id === activeSession.id ? { ...s, reviewGenerated: true } : s
      ),
    }));
    alert(t(`已生成 ${errors.length} 条错题，可以在错题本中复习。`));
    router.push("/review");
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">{t("AI 对话陪练")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {!activeSession && (
            <div className="space-y-4 overflow-y-auto">
              <p className="text-gray-600">{t("选择一个角色和场景开始练习：")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CHAT_ROLES.map((role) => (
                  <Button
                    key={role.value}
                    variant={selectedRole === role.value ? "default" : "outline"}
                    onClick={() => {
                      setSelectedRole(role.value);
                      setSelectedScenario("");
                    }}
                    className="h-auto py-4 justify-start text-left"
                  >
                    <div>
                      <p className="font-medium">{t(role.label)}</p>
                      <p className="text-xs opacity-80">{t(role.description)}</p>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CHAT_SCENARIOS[selectedRole].map((scenario) => (
                  <Button
                    key={scenario.value}
                    variant={selectedScenario === scenario.value ? "default" : "outline"}
                    onClick={() => handleSelectFixedScenario(scenario.value)}
                    className="h-auto py-3 justify-start text-left"
                  >
                    {t(scenario.label)}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("自定义话题")}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    placeholder={t("输入你想聊的话题，例如：最近的电影、旅行计划...")}
                    className="flex-1 min-w-0 px-3 py-2 border rounded-md text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomTopic();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleCustomTopic} disabled={!customTopicInput.trim()}>
                    {t("使用")}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateTopic}
                  disabled={generatingScenario}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingScenario ? t("正在生成热门话题...") : t("随机热门话题")}
                </Button>
                {customScenario && (
                  <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    {t("当前话题：")}{customScenario.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useVoice}
                    onChange={(e) => {
                      setUseVoice(e.target.checked);
                      if (!e.target.checked) setVoicePaused(false);
                    }}
                    className="h-4 w-4"
                  />
                  {t("开启语音对话模式（AI 将用语音回复）")}
                </label>
              </div>

              <Button onClick={() => handleStart(selectedRole)} disabled={!selectedScenario && !customScenario} className="w-full">
                {t("开始对话")}
              </Button>
            </div>
          )}

          {activeSession && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-500">
                  {t("当前角色：")}{t(CHAT_ROLES.find((r) => r.value === activeSession.role)?.label ?? activeSession.role)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateReview}
                  disabled={activeSession.reviewGenerated}
                  className="flex items-center gap-1"
                >
                  <BookOpen className="w-4 h-4" />
                  {activeSession.reviewGenerated ? t("已生成错题复习") : t("结束并生成错题复习")}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-lg bg-gray-50">
                {activeSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <p className="text-gray-900">{msg.content}</p>
                      {msg.corrections && msg.corrections.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-900 opacity-90 list-disc list-inside">
                          {msg.corrections.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {pronunciationFeedback && pronunciationFeedback.words.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm">
                  <p className="font-medium mb-2">{t("发音评估")}</p>
                  <div className="flex flex-wrap gap-2">
                    {pronunciationFeedback.words.map((w, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                          w.isLowConfidence
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {w.word}
                        {w.isLowConfidence && (
                          <button
                            type="button"
                            onClick={() => handleWordClick(w.word)}
                            className="text-xs underline"
                            title={t("播放标准发音")}
                          >
                            🔊
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pronunciationTips.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-medium text-yellow-900">{t("发音提示")}</p>
                  <ul className="list-disc list-inside text-yellow-800">
                    {pronunciationTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                {isVoiceActive ? (
                  <div className="space-y-2">
                    <VoiceRecorder
                      ref={voiceRecorderRef}
                      value={input}
                      onChange={setInput}
                      onConfidenceChange={setWordConfidences}
                      onFinalTranscript={handleFinalTranscript}
                      autoStopOnSilence
                      autoSubmit
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setVoicePaused((p) => !p);
                          voiceRecorderRef.current?.stop();
                        }}
                      >
                        {voicePaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                        {voicePaused ? t("继续语音") : t("暂停语音")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={playing ? handleStop : () => handlePlay(activeSession.messages.at(-1)?.content ?? "")}
                        disabled={!isTTSSupported()}
                      >
                        {playing ? <Square className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                        {playing ? t("停止") : t("播放最近回复")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("输入你想说的话...")}
                    rows={3}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (activeSession) {
                        updateChatSession(activeSession.id, activeSession.messages);
                      }
                      setVoicePaused(false);
                      setUseVoice((v) => !v);
                    }}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {isVoiceActive ? t("键盘输入") : t("语音输入")}
                  </Button>

                  {!isVoiceActive && (
                    <Button onClick={handleSend} disabled={loading || !input.trim()} className="flex-1">
                      <Send className="w-4 h-4 mr-2" />
                      {loading ? t("AI 思考中...") : t("发送")}
                    </Button>
                  )}
                </div>

                {!isTTSSupported() && (
                  <p className="text-xs text-orange-600">{t("当前浏览器不支持 TTS。")}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
