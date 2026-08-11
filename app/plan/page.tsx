/**
 * @file app/plan/page.tsx
 * @description 学习计划页面：生成、展示与完成任务
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Calendar, Target, ArrowLeft } from "lucide-react";
import type { LearningPlan as LearningPlanType } from "@/lib/types";

/** 学习计划页面 */
export default function PlanPage() {
  const profile = useAppStore((state) => state.profile);
  const learningPlan = useAppStore((state) => state.learningPlan);
  const errors = useAppStore((state) => state.errors);
  const setLearningPlan = useAppStore((state) => state.setLearningPlan);
  const completePlanTask = useAppStore((state) => state.completePlanTask);

  const [loading, setLoading] = useState(false);

  const weakPoints = useMemo(() => {
    const map = new Map<string, number>();
    errors.forEach((error) => {
      const key = error.errorType;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }, [errors]);

  async function handleGenerate() {
    if (!profile) return;
    setLoading(true);
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: profile.target,
          level: profile.level,
          availableMinutes: 30,
          weakPoints,
          weeks: 4,
        }),
      });
      const data = (await response.json()) as { plan?: LearningPlanType; error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "生成计划失败");
      }
      if (data.plan) setLearningPlan(data.plan);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "生成计划失败");
    } finally {
      setLoading(false);
    }
  }

  const groupedTasks = useMemo(() => {
    if (!learningPlan) return [];
    const map = new Map<string, typeof learningPlan.tasks>();
    for (const task of learningPlan.tasks) {
      const list = map.get(task.date) ?? [];
      list.push(task);
      map.set(task.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [learningPlan]);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">还没有学习档案</h1>
        <p className="text-gray-600 mb-6">请先完成目标选择和级别测评。</p>
        <Link href="/onboarding">
          <Button>开始学习</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold dark:text-white">学习计划</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-300">
            根据目标、级别和薄弱点生成的个性化学习计划
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          重新生成计划
        </Button>
      </div>

      {!learningPlan ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">还没有学习计划</p>
            <p className="text-sm text-muted-foreground mb-6">
              点击下方按钮生成你的专属学习计划
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              生成学习计划
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                计划概览
              </CardTitle>
              <CardDescription>
                {learningPlan.startDate} 至 {learningPlan.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {learningPlan.description}
              </p>
              <p className="text-sm">
                总任务数：{learningPlan.tasks.length} · 已完成：
                {learningPlan.tasks.filter((t) => t.completed).length}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {groupedTasks.map(([date, tasks]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-base">{date}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => completePlanTask(task.id)}
                        aria-label="完成任务"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          类型：{task.type} · 预计 {task.duration} 分钟
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
