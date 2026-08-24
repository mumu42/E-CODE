/**
 * @file app/chat/page.tsx
 * @description AI 语音/文本对话陪练页面
 * @author English Agent Team
 * @date 2026-08-24
 */
"use client";
import { t } from "@/lib/i18n/translate";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useAppStore } from "@/lib/store";
import { sendChatMessage } from "@/lib/ai/client";
import { buildMemoryContext } from "@/lib/ai/memory";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { saveToStatic } from "@/lib/storage/excel";
import { ChatRole } from "@/lib/types";
import { Mic, Send, Volume2, Square } from "lucide-react";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";

const roles: {value: ChatRole;label: string;description: string;}[] = [
{ value: "friend", label: "朋友", description: "轻松日常对话" },
{ value: "interviewer", label: "面试官", description: "模拟面试场景" },
{ value: "examiner", label: "考官", description: "雅思/托福口语考官" },
{ value: "teacher", label: "老师", description: "耐心纠错与指导" },
{ value: "colleague", label: "同事", description: "职场话题交流" }];


interface Scenario {
  value: string;
  label: string;
  prompt: string;
}

const roleScenarios: Record<ChatRole, Scenario[]> = {
  friend: [
  { value: "coffee", label: "咖啡店闲聊", prompt: "Chat casually over coffee." },
  { value: "weekend", label: "周末计划", prompt: "Discuss weekend plans." },
  { value: "travel", label: "旅行分享", prompt: "Share travel experiences." }],

  interviewer: [
  { value: "intro", label: "自我介绍", prompt: "Ask the user to introduce themselves." },
  { value: "project", label: "项目经验", prompt: "Discuss past project experience." },
  { value: "career", label: "职业规划", prompt: "Talk about career plans." }],

  examiner: [
  { value: "hometown", label: "家乡", prompt: "Ask about the user's hometown." },
  { value: "hobby", label: "兴趣爱好", prompt: "Ask about hobbies and interests." },
  { value: "education", label: "教育背景", prompt: "Ask about education background." }],

  teacher: [
  { value: "grammar", label: "语法纠错", prompt: "Help the user practice grammar." },
  { value: "vocabulary", label: "词汇扩展", prompt: "Help expand vocabulary." },
  { value: "pronunciation", label: "发音练习", prompt: "Help practice pronunciation." }],

  colleague: [
  { value: "project", label: "项目讨论", prompt: "Discuss a work project." },
  { value: "meeting", label: "会议安排", prompt: "Arrange a meeting." },
  { value: "email", label: "邮件沟通", prompt: "Discuss email communication." }]

};

export default function ChatPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const addChatSession = useAppStore((state) => state.addChatSession);
  const updateChatSession = useAppStore((state) => state.updateChatSession);
  const chatPrompt = useCustomPrompt("chat");

  const [selectedRole, setSelectedRole] = useState<ChatRole>("friend");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pronunciationTips, setPronunciationTips] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeSession = chatSessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionId, chatSessions]);

  function getGreeting(role: ChatRole, scenario?: string): string {
    const scenarioText = scenario ? ` about ${scenario}` : "";
    switch (role) {
      case "friend":
        return `Hey! How's it going? Let's chat${scenarioText}.`;
      case "interviewer":
        return `Good morning. Please take a seat. Let's start${scenarioText}.`;
      case "examiner":
        return `Hello. My name is the examiner. In this part, I'd like to ask you some questions${scenarioText}.`;
      case "teacher":
        return `Hello! What would you like to practice today${scenarioText}?`;
      case "colleague":
        return `Hi, do you have a minute to discuss the project${scenarioText}?`;
    }
  }

  function handleStart(role: ChatRole) {
    if (!profile) return;
    const scenario = roleScenarios[role].find((s) => s.value === selectedScenario);
    const greeting = getGreeting(role, scenario?.label);
    const session = {
      id: crypto.randomUUID(),
      userId: profile.id,
      role,
      scenario: scenario?.prompt,
      voiceMode: useVoice,
      messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: greeting,
        timestamp: new Date().toISOString()
      }],

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addChatSession(session);
    setActiveSessionId(session.id);
    if (useVoice) {
      speak(greeting, 1).catch((err) => console.error(err));
    }
  }

  async function handlePlay(text: string) {
    if (playing || !isTTSSupported()) return;
    setPlaying(true);
    try {
      await speak(text, 1);
    } catch (error) {
      console.error(error);
    } finally {
      setPlaying(false);
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
      timestamp: new Date().toISOString()
    };

    const history = activeSession.messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    const updatedMessages = [...activeSession.messages, userMessage];
    updateChatSession(activeSession.id, updatedMessages);
    setInput("");
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
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      updateChatSession(activeSession.id, finalMessages);
      setPronunciationTips(result.pronunciationTips ?? []);

      if ((activeSession.voiceMode ?? useVoice) && result.reply) {
        handlePlay(result.reply);
      }

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("AI 回复失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    await submitMessage(input);
  }

  function handleFinalTranscript(transcript: string) {
    setInput(transcript);
    submitMessage(transcript);
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">{t("AI \u5BF9\u8BDD\u966A\u7EC3")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {!activeSession &&
          <div className="space-y-4 overflow-y-auto">
              <p className="text-gray-600">{t("\u9009\u62E9\u4E00\u4E2A\u89D2\u8272\u548C\u573A\u666F\u5F00\u59CB\u7EC3\u4E60\uFF1A")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) =>
              <Button
                key={role.value}
                variant={selectedRole === role.value ? "default" : "outline"}
                onClick={() => {
                  setSelectedRole(role.value);
                  setSelectedScenario("");
                }}
                className="h-auto py-4 justify-start text-left">
                
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs opacity-80">{role.description}</p>
                    </div>
                  </Button>
              )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {roleScenarios[selectedRole].map((scenario) =>
              <Button
                key={scenario.value}
                variant={
                selectedScenario === scenario.value ? "default" : "outline"
                }
                onClick={() => setSelectedScenario(scenario.value)}
                className="h-auto py-3 justify-start text-left">
                
                    {scenario.label}
                  </Button>
              )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                  type="checkbox"
                  checked={useVoice}
                  onChange={(e) => setUseVoice(e.target.checked)}
                  className="h-4 w-4" />{t("\u5F00\u542F\u8BED\u97F3\u5BF9\u8BDD\u6A21\u5F0F\uFF08AI \u5C06\u7528\u8BED\u97F3\u56DE\u590D\uFF09")}


              </label>
              </div>

              <Button
              onClick={() => handleStart(selectedRole)}
              disabled={!selectedScenario}
              className="w-full">{t("\u5F00\u59CB\u5BF9\u8BDD")}


            </Button>
            </div>
          }

          {activeSession &&
          <>
              <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-lg bg-gray-50">
                {activeSession.messages.map((msg) =>
              <div
                key={msg.id}
                className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"}`
                }>
                
                    <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === "user" ?
                  "bg-blue-600 text-white" :
                  "bg-white border shadow-sm"}`
                  }>
                  
                      <p>{msg.content}</p>
                      {msg.corrections && msg.corrections.length > 0 &&
                  <ul className="mt-2 text-xs opacity-90 list-disc list-inside">
                          {msg.corrections.map((c, idx) =>
                    <li key={idx}>{c}</li>
                    )}
                        </ul>
                  }
                    </div>
                  </div>
              )}
                <div ref={bottomRef} />
              </div>

              {pronunciationTips.length > 0 &&
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-medium text-yellow-900">{t("\u53D1\u97F3\u63D0\u793A")}</p>
                  <ul className="list-disc list-inside text-yellow-800">
                    {pronunciationTips.map((tip, idx) =>
                <li key={idx}>{tip}</li>
                )}
                  </ul>
                </div>
            }

              <div className="space-y-2">
                {useVoice || activeSession.voiceMode ?
              <VoiceRecorder
                value={input}
                onChange={setInput}
                onFinalTranscript={handleFinalTranscript} /> :


              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("\u8F93\u5165\u4F60\u60F3\u8BF4\u7684\u8BDD...")}
                rows={3}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }} />

              }
                <div className="flex gap-2">
                  <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUseVoice((v) => !v);
                  }}>
                  
                    <Mic className="w-4 h-4 mr-2" />
                    {useVoice || activeSession.voiceMode ? "键盘输入" : "语音输入"}
                  </Button>
                  {!useVoice && !activeSession.voiceMode &&
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex-1">
                  
                      <Send className="w-4 h-4 mr-2" />
                      {loading ? "AI 思考中..." : "发送"}
                    </Button>
                }
                  {(useVoice || activeSession.voiceMode) &&
                <Button
                  type="button"
                  variant="outline"
                  onClick={playing ? handleStop : () => handlePlay(activeSession.messages.at(-1)?.content ?? "")}
                  disabled={!isTTSSupported()}>
                  
                      {playing ?
                  <Square className="w-4 h-4 mr-2" /> :

                  <Volume2 className="w-4 h-4 mr-2" />
                  }
                      {playing ? "停止" : "播放最近回复"}
                    </Button>
                }
                </div>
                {!isTTSSupported() &&
              <p className="text-xs text-orange-600">{t("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 TTS\u3002")}</p>
              }
              </div>
            </>
          }
        </CardContent>
      </Card>
    </div>);

}