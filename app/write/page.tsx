/**
 * @file app/write/page.tsx
 * @description 写作练习页面，生成题目并获取 AI 批改反馈
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { generateWritingTopic, getWritingFeedback } from "@/lib/ai/client";
import { buildMemoryContext } from "@/lib/ai/memory";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { saveToStatic } from "@/lib/storage/excel";
import type { WritingTopic, WritingFeedback, GrammarError } from "@/lib/types";
import { GrammarHighlight } from "@/components/GrammarHighlight";

/**
 * 写作练习页面
 * @example
 * ```tsx
 * <WritePage />
 * ```
 */
export default function WritePage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addSession = useAppStore((state) => state.addSession);
  const addErrors = useAppStore((state) => state.addErrors);
  const updateLearningProfile = useAppStore((state) => state.updateLearningProfile);
  const writePrompt = useCustomPrompt("write");

  const [topic, setTopic] = useState<WritingTopic | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
      return;
    }
    generateWritingTopic(profile.target, profile.level)
      .then(setTopic)
      .catch((err) => console.error(err));
  }, [profile, router]);

  const wordCount = userInput.trim().split(/\s+/).filter(Boolean).length;

  /** 提交作文并获取 AI 批改 */
  async function handleSubmit() {
    if (!profile || !topic) return;

    setLoading(true);
    try {
      const { errors, sessions, assessments } = useAppStore.getState();
      const learningContext = buildMemoryContext(errors, sessions, assessments);
      const result = await getWritingFeedback(
        profile.target,
        profile.level,
        topic.title,
        topic.instructions,
        userInput,
        learningContext,
        writePrompt
      );
      setFeedback(result);

      const session = {
        id: crypto.randomUUID(),
        userId: profile.id,
        type: "WRITE" as const,
        date: new Date().toISOString(),
        topic: topic.title,
        scenario: topic.instructions,
        userInput,
        aiFeedback: result.feedback,
        grammarScore: result.grammarScore,
        fluencyScore: result.score,
        errors: result.errors,
      };

      addSession(session);

      if (result.errors && result.errors.length > 0) {
        addErrors(
          result.errors.map((err: GrammarError) => ({
            id: err.id || crypto.randomUUID(),
            userId: profile.id,
            sessionId: session.id,
            type: "WRITE",
            date: session.date,
            original: err.original,
            correction: err.correction,
            explanation: err.explanation,
            errorType: err.type,
          }))
        );
      }

      updateLearningProfile();

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("AI 批改失败，请稍后重试。");
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
          <CardTitle className="text-2xl">写作练习</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {topic ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">{topic.title}</p>
              <p className="text-sm text-blue-800">{topic.instructions}</p>
              <div className="flex gap-4 mt-2 text-xs text-blue-700">
                <span>建议字数：{topic.wordLimit} 词</span>
                <span>建议时长：{topic.timeLimit} 分钟</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">正在生成写作题目...</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="writing-input">你的作文</Label>
            <Textarea
              id="writing-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="请输入你的英文作文..."
              rows={12}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>字数：{wordCount} 词</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || userInput.trim().length < 10}
            className="w-full"
          >
            {loading ? "AI 批改中..." : "提交并获取批改"}
          </Button>

          {feedback && (
            <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">总分</p>
                    <p className="text-2xl font-bold text-blue-600">{feedback.score}</p>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">语法</p>
                    <p className="text-2xl font-bold text-green-600">{feedback.grammarScore}</p>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">词汇/结构</p>
                    <p className="text-2xl font-bold text-purple-600">{feedback.vocabularyScore}</p>
                </div>
              </div>

              {feedback.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">原文高亮</h4>
                  <GrammarHighlight text={userInput} errors={feedback.errors} className="text-sm border p-3 rounded-lg bg-gray-50" />
                  <h4 className="font-medium pt-2">语法/表达纠错</h4>
                  <ul className="space-y-2">
                    {feedback.errors.map((err, idx) => (
                      <li key={idx} className="text-sm border p-3 rounded-lg bg-red-50">
                        <p className="text-red-700">
                          <span className="line-through">{err.original}</span> → {err.correction}
                        </p>
                        <p className="text-gray-600 mt-1">{err.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">提升建议</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {feedback.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">参考范文</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.improvedVersion}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
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
