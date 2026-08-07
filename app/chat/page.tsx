/**
 * @file app/chat/page.tsx
 * @description AI 对话陪练页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useAppStore } from "@/lib/store";
import { sendChatMessage } from "@/lib/ai/client";
import { saveToStatic } from "@/lib/storage/excel";
import { ChatRole } from "@/lib/types";
import { Mic, Send } from "lucide-react";

const roles: { value: ChatRole; label: string; description: string }[] = [
  { value: "friend", label: "朋友", description: "轻松日常对话" },
  { value: "interviewer", label: "面试官", description: "模拟面试场景" },
  { value: "examiner", label: "考官", description: "雅思/托福口语考官" },
  { value: "teacher", label: "老师", description: "耐心纠错与指导" },
  { value: "colleague", label: "同事", description: "职场话题交流" },
];

/**
 * AI 对话陪练页面
 * @example
 * ```tsx
 * <ChatPage />
 * ```
 */
export default function ChatPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const addChatSession = useAppStore((state) => state.addChatSession);
  const updateChatSession = useAppStore((state) => state.updateChatSession);

  const [selectedRole, setSelectedRole] = useState<ChatRole>("friend");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
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

  async function handleStart(role: ChatRole) {
    if (!profile) return;
    const session = {
      id: crypto.randomUUID(),
      userId: profile.id,
      role,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: getGreeting(role),
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addChatSession(session);
    setActiveSessionId(session.id);
  }

  function getGreeting(role: ChatRole): string {
    switch (role) {
      case "friend":
        return "Hey! How's it going? Let's chat.";
      case "interviewer":
        return "Good morning. Please take a seat. Tell me a little about yourself.";
      case "examiner":
        return "Hello. My name is the examiner. In this part, I'd like to ask you some questions about yourself.";
      case "teacher":
        return "Hello! What would you like to practice today?";
      case "colleague":
        return "Hi, do you have a minute to discuss the project?";
    }
  }

  async function handleSend() {
    if (!profile || !activeSession || !input.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const history = activeSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const updatedMessages = [...activeSession.messages, userMessage];
    updateChatSession(activeSession.id, updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(
        profile.target,
        profile.level,
        activeSession.role,
        history,
        userMessage.content
      );

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: result.reply,
        corrections: result.corrections,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      updateChatSession(activeSession.id, finalMessages);

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("AI 回复失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">AI 对话陪练</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {!activeSession && (
            <div className="space-y-4">
              <p className="text-gray-600">选择一个角色开始练习：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <Button
                    key={role.value}
                    variant={selectedRole === role.value ? "default" : "outline"}
                    onClick={() => setSelectedRole(role.value)}
                    className="h-auto py-4 justify-start text-left"
                  >
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs opacity-80">{role.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
              <Button onClick={() => handleStart(selectedRole)} className="w-full">
                开始对话
              </Button>
            </div>
          )}

          {activeSession && (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-lg bg-gray-50">
                {activeSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <p>{msg.content}</p>
                      {msg.corrections && msg.corrections.length > 0 && (
                        <ul className="mt-2 text-xs opacity-90 list-disc list-inside">
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

              <div className="space-y-2">
                {useVoice ? (
                  <VoiceRecorder value={input} onChange={setInput} />
                ) : (
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入你想说的话..."
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
                    onClick={() => setUseVoice(!useVoice)}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {useVoice ? "键盘输入" : "语音输入"}
                  </Button>
                  <Button onClick={handleSend} disabled={loading || !input.trim()} className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? "AI 思考中..." : "发送"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
