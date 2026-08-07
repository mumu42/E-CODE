/**
 * @file app/onboarding/page.tsx
 * @description 新用户引导与英语水平测评页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { assessLevel } from "@/lib/ai/client";
import { saveToStatic } from "@/lib/storage/excel";
import type { Level, Target } from "@/lib/types";

const targets = [
  { value: "SCHOOL", label: "升学考试" },
  { value: "STUDY_ABROAD", label: "出国留学" },
  { value: "CET", label: "四六级" },
  { value: "IELTS_TOEFL", label: "雅思托福" },
] as const;

const questions = [
  { id: "q1", text: "She ______ to school every day.", options: ["go", "goes", "going", "went"], answer: "goes" },
  { id: "q2", text: "If I ______ rich, I would travel around the world.", options: ["am", "were", "be", "was"], answer: "were" },
  { id: "q3", text: "Choose the synonym of 'happy'.", options: ["sad", "joyful", "angry", "tired"], answer: "joyful" },
];

/**
 * 新用户引导与英语水平测评页面
 * @example
 * ```tsx
 * <OnboardingPage />
 * ```
 */
export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useAppStore((state) => state.setProfile);
  const addAssessment = useAppStore((state) => state.addAssessment);

  const [step, setStep] = useState<"target" | "quiz" | "sample" | "result">("target");
  const [target, setTarget] = useState<Target | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sample, setSample] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTargetSelect(value: Target) {
    setTarget(value);
    setStep("quiz");
  }

  function handleAnswer(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  async function handleSubmitSample() {
    if (!target) return;
    setLoading(true);
    try {
      const result = await assessLevel(answers, sample);
      setLevel(result.level);

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      setProfile({
        id: userId,
        target,
        level: result.level,
        createdAt: now,
        updatedAt: now,
      });

      addAssessment({
        id: crypto.randomUUID(),
        userId,
        date: now,
        target,
        scores: result.scores,
        level: result.level,
      });

      const current = useAppStore.getState();
      await saveToStatic(current, `english-agent-data-${now.split("T")[0]}.xlsx`);

      setStep("result");
    } catch (error) {
      console.error(error);
      alert("测评失败，请检查 API Key 配置。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">开始使用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "target" && (
            <div className="space-y-4">
              <Label>你的学习目标是什么？</Label>
              <div className="grid grid-cols-2 gap-4">
                {targets.map((t) => (
                  <Button
                    key={t.value}
                    variant="outline"
                    onClick={() => handleTargetSelect(t.value as Target)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === "quiz" && (
            <div className="space-y-6">
              <h3 className="font-medium">快速测评（{questions.length} 题）</h3>
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((option) => (
                      <Button
                        key={option}
                        variant={answers[q.id] === option ? "default" : "outline"}
                        onClick={() => handleAnswer(q.id, option)}
                        className="text-left justify-start"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={() => setStep("sample")} className="w-full">
                下一步：提交口语/写作样本
              </Button>
            </div>
          )}

          {step === "sample" && (
            <div className="space-y-4">
              <Label htmlFor="sample">用英语自我介绍或描述你的一天（至少 30 词）</Label>
              <Textarea
                id="sample"
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                rows={6}
                placeholder="例如：My name is Tom. I am a student..."
              />
              <Button
                onClick={handleSubmitSample}
                disabled={loading || sample.length < 10}
                className="w-full"
              >
                {loading ? "测评中..." : "完成测评"}
              </Button>
            </div>
          )}

          {step === "result" && level && (
            <div className="text-center space-y-4">
              <p className="text-lg">
                你的英语水平约为：<span className="font-bold text-blue-600 text-2xl">{level}</span>
              </p>
              <p className="text-gray-600">
                系统已根据你的目标“{targets.find((t) => t.value === target)?.label}”和当前级别生成练习计划。
              </p>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                进入 Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
