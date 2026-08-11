/**
 * @file app/exam/page.tsx
 * @description 模拟考试入口：选择考试类型并开始模考
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EXAM_CONFIGS, type ExamType } from "@/lib/exam/questions";
import { Clock, BookOpen } from "lucide-react";

/** 模拟考试入口页面 */
export default function ExamPage() {
  const profile = useAppStore((state) => state.profile);
  const router = useRouter();
  const [selected, setSelected] = useState<ExamType>("GENERAL");

  const config = EXAM_CONFIGS.find((c) => c.type === selected) ?? EXAM_CONFIGS[0];

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">还没有学习档案</h1>
        <p className="text-gray-600 mb-6">请先完成目标选择和级别测评。</p>
        <Button onClick={() => router.push("/onboarding")}>开始学习</Button>
      </div>
    );
  }

  function startExam() {
    router.push(`/exam/session?type=${selected}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">模拟考试</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        选择一种考试类型，进行限时训练。
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {EXAM_CONFIGS.map((item) => (
          <Card
            key={item.type}
            className={`cursor-pointer transition-colors ${
              selected === item.type
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            onClick={() => setSelected(item.type)}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {item.label}
              </CardTitle>
              <CardDescription>
                {item.questionCount} 题 · 建议 {item.duration} 分钟
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              总分 {item.questionCount * item.scorePerQuestion} 分
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4" />
              已选择：{config.label}
            </p>
            <p className="text-sm text-muted-foreground">
              限时 {config.duration} 分钟，共 {config.questionCount} 题
            </p>
          </div>
          <Button onClick={startExam} size="lg">
            开始考试
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
