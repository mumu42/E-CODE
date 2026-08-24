/**
 * @file app/plan/page.tsx
 * @description 学习计划页面：生成、展示与完成任务
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { Loader2, Calendar, Target, ArrowLeft } from "lucide-react";
import { useCustomPrompt } from "@/hooks/usePrompts";
import type { LearningPlan as LearningPlanType } from "@/lib/types";

/** 学习计划页面 */
export default function PlanPage() {
  const profile = useAppStore((state) => state.profile);
  const learningPlan = useAppStore((state) => state.learningPlan);
  const errors = useAppStore((state) => state.errors);
  const setLearningPlan = useAppStore((state) => state.setLearningPlan);
  const completePlanTask = useAppStore((state) => state.completePlanTask);
  const planPrompt = useCustomPrompt("plan");

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
          customPrompt: planPrompt
        })
      });
      const data = (await response.json()) as {plan?: LearningPlanType;error?: string;};
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
        <h1 className="text-2xl font-bold mb-4">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u6863\u6848")}</h1>
        <p className="text-gray-600 mb-6">{t("\u8BF7\u5148\u5B8C\u6210\u76EE\u6807\u9009\u62E9\u548C\u7EA7\u522B\u6D4B\u8BC4\u3002")}</p>
        <Link href="/onboarding">
          <Button>{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
        </Link>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold dark:text-white">{t("\u5B66\u4E60\u8BA1\u5212")}</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-300">{t("\u6839\u636E\u76EE\u6807\u3001\u7EA7\u522B\u548C\u8584\u5F31\u70B9\u751F\u6210\u7684\u4E2A\u6027\u5316\u5B66\u4E60\u8BA1\u5212")}

          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{t("\u91CD\u65B0\u751F\u6210\u8BA1\u5212")}

        </Button>
      </div>

      {!learningPlan ?
      <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u8BA1\u5212")}</p>
            <p className="text-sm text-muted-foreground mb-6">{t("\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u751F\u6210\u4F60\u7684\u4E13\u5C5E\u5B66\u4E60\u8BA1\u5212")}

          </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{t("\u751F\u6210\u5B66\u4E60\u8BA1\u5212")}

          </Button>
          </CardContent>
        </Card> :

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />{t("\u8BA1\u5212\u6982\u89C8")}

            </CardTitle>
              <CardDescription>
                {learningPlan.startDate}{t("\u81F3")}{learningPlan.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {learningPlan.description}
              </p>
              <p className="text-sm">{t("\u603B\u4EFB\u52A1\u6570\uFF1A")}
              {learningPlan.tasks.length}{t("\xB7 \u5DF2\u5B8C\u6210\uFF1A")}
              {learningPlan.tasks.filter((t) => t.completed).length}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {groupedTasks.map(([date, tasks]) =>
          <Card key={date}>
                <CardHeader>
                  <CardTitle className="text-base">{date}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks.map((task) =>
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                
                      <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => completePlanTask(task.id)}
                  aria-label={t("\u5B8C\u6210\u4EFB\u52A1")}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                
                      <div className="flex-1">
                        <p
                    className={`text-sm font-medium ${
                    task.completed ? "line-through text-muted-foreground" : ""}`
                    }>
                    
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{t("\u7C7B\u578B\uFF1A")}
                    {task.type}{t("\xB7 \u9884\u8BA1")}{task.duration}{t("\u5206\u949F")}
                  </p>
                      </div>
                    </div>
              )}
                </CardContent>
              </Card>
          )}
          </div>
        </div>
      }
    </div>);

}