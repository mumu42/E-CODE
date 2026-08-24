/**
 * @file app/advisor/page.tsx
 * @description AI 学习顾问页面
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
import { useAppStore } from "@/lib/store";
import { askAdvisor } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { buildMemoryContext } from "@/lib/ai/memory";
import { Send, User, Bot, Lightbulb } from "lucide-react";

interface AdvisorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  examples?: string[];
  followUpQuestions?: string[];
}

const QUICK_QUESTIONS = [
"如何区分 present perfect 和 past simple？",
"请推荐一些适合我当前水平的口语话题",
"我的薄弱点是语法，应该怎么提升？",
"这个句子为什么不对？"];


export default function AdvisorPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const advisorPrompt = useCustomPrompt("advisor");

  const [messages, setMessages] = useState<AdvisorMessage[]>([
  {
    id: "welcome",
    role: "assistant",
    content:
    "你好！我是你的 AI 学习顾问。有任何英语问题、错题不理解，或者想要学习建议，都可以问我。"
  }]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(question?: string) {
    const text = question ?? input.trim();
    if (!text || !profile) return;

    const userMessage: AdvisorMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { errors, sessions, assessments } = useAppStore.getState();
      const learningContext = buildMemoryContext(errors, sessions, assessments);
      const result = await askAdvisor(
        profile.target,
        profile.level,
        text,
        undefined,
        undefined,
        learningContext,
        advisorPrompt
      );

      setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.reply,
        examples: result.examples,
        followUpQuestions: result.followUpQuestions
      }]
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "抱歉，顾问暂时无法回答，请稍后重试。"
      }]
      );
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl h-[calc(100vh-4rem)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />{t("AI \u5B66\u4E60\u987E\u95EE")}

          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            {messages.map((msg) =>
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              
                <div
                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === "user" ?
                "bg-blue-600 text-white" :
                "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`
                }>
                
                  <div className="flex items-center gap-2 mb-1 opacity-80">
                    {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    <span className="text-xs">{msg.role === "user" ? "你" : "顾问"}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.examples && msg.examples.length > 0 &&
                <div className="mt-2 space-y-1">
                      <p className="text-xs opacity-80">{t("\u793A\u4F8B\uFF1A")}</p>
                      <ul className="list-disc list-inside text-xs opacity-90">
                        {msg.examples.map((ex, idx) =>
                    <li key={idx}>{ex}</li>
                    )}
                      </ul>
                    </div>
                }
                  {msg.followUpQuestions && msg.followUpQuestions.length > 0 &&
                <div className="mt-2 space-y-1">
                      <p className="text-xs opacity-80">{t("\u4F60\u53EF\u4EE5\u7EE7\u7EED\u95EE\uFF1A")}</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.followUpQuestions.map((q, idx) =>
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-xs text-left underline opacity-90 hover:opacity-100">
                      
                            {q}
                          </button>
                    )}
                      </div>
                    </div>
                }
                </div>
              </div>
            )}
            {loading &&
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Bot className="w-4 h-4 animate-pulse" />{t("\u987E\u95EE\u601D\u8003\u4E2D...")}

            </div>
            }
            <div ref={bottomRef} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) =>
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-md transition-colors"
                type="button">
                
                  {q}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("\u8F93\u5165\u4F60\u7684\u82F1\u8BED\u95EE\u9898...")}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }} />
              
              <Button onClick={() => handleSend()} disabled={loading || !input.trim()} className="self-end">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

}