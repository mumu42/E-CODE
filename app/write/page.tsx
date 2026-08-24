/**
 * @file app/write/page.tsx
 * @description 写作练习页面，生成题目并获取 AI 批改反馈
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
    generateWritingTopic(profile.target, profile.level).
    then(setTopic).
    catch((err) => console.error(err));
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
        errors: result.errors
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
            errorType: err.type
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
          <CardTitle className="text-2xl">{t("\u5199\u4F5C\u7EC3\u4E60")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {topic ?
          <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">{topic.title}</p>
              <p className="text-sm text-blue-800">{topic.instructions}</p>
              <div className="flex gap-4 mt-2 text-xs text-blue-700">
                <span>{t("\u5EFA\u8BAE\u5B57\u6570\uFF1A")}{topic.wordLimit}{t("\u8BCD")}</span>
                <span>{t("\u5EFA\u8BAE\u65F6\u957F\uFF1A")}{topic.timeLimit}{t("\u5206\u949F")}</span>
              </div>
            </div> :

          <p className="text-gray-500">{t("\u6B63\u5728\u751F\u6210\u5199\u4F5C\u9898\u76EE...")}</p>
          }

          <div className="space-y-2">
            <Label htmlFor="writing-input">{t("\u4F60\u7684\u4F5C\u6587")}</Label>
            <Textarea
              id="writing-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t("\u8BF7\u8F93\u5165\u4F60\u7684\u82F1\u6587\u4F5C\u6587...")}
              rows={12}
              className="resize-none" />
            
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t("\u5B57\u6570\uFF1A")}{wordCount}{t("\u8BCD")}</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || userInput.trim().length < 10}
            className="w-full">
            
            {loading ? "AI 批改中..." : "提交并获取批改"}
          </Button>

          {feedback &&
          <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">{t("\u603B\u5206")}</p>
                    <p className="text-2xl font-bold text-blue-600">{feedback.score}</p>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">{t("\u8BED\u6CD5")}</p>
                    <p className="text-2xl font-bold text-green-600">{feedback.grammarScore}</p>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">{t("\u8BCD\u6C47/\u7ED3\u6784")}</p>
                    <p className="text-2xl font-bold text-purple-600">{feedback.vocabularyScore}</p>
                </div>
              </div>

              {feedback.errors.length > 0 &&
            <div className="space-y-2">
                  <h4 className="font-medium">{t("\u539F\u6587\u9AD8\u4EAE")}</h4>
                  <GrammarHighlight text={userInput} errors={feedback.errors} className="text-sm border p-3 rounded-lg bg-gray-50" />
                  <h4 className="font-medium pt-2">{t("\u8BED\u6CD5/\u8868\u8FBE\u7EA0\u9519")}</h4>
                  <ul className="space-y-2">
                    {feedback.errors.map((err, idx) =>
                <li key={idx} className="text-sm border p-3 rounded-lg bg-red-50">
                        <p className="text-red-700">
                          <span className="line-through">{err.original}</span> → {err.correction}
                        </p>
                        <p className="text-gray-600 mt-1">{err.explanation}</p>
                      </li>
                )}
                  </ul>
                </div>
            }

              {feedback.suggestions.length > 0 &&
            <div className="space-y-2">
                  <h4 className="font-medium">{t("\u63D0\u5347\u5EFA\u8BAE")}</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {feedback.suggestions.map((s, idx) =>
                <li key={idx}>{s}</li>
                )}
                  </ul>
                </div>
            }

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t("\u53C2\u8003\u8303\u6587")}</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.improvedVersion}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t("\u6574\u4F53\u8BC4\u4EF7")}</h4>
                <p className="text-sm text-gray-700">{feedback.feedback}</p>
              </div>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}