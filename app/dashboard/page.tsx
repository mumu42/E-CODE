/**
 * @file app/dashboard/page.tsx
 * @description 今日任务 Dashboard，展示学习概览与功能入口
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";
import { getCurrentStreak, getLongestStreak } from "@/lib/stats/checkin";
import {
  Mic,
  FileText,
  MessageCircle,
  BookOpen,
  Star,
  Calendar,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
} from "lucide-react";

/** 目标中文映射 */
const targetMap: Record<string, string> = {
  SCHOOL: "升学考试",
  STUDY_ABROAD: "出国留学",
  CET: "四六级",
  IELTS_TOEFL: "雅思托福",
};

/**
 * 今日任务页面
 * @example
 * ```tsx
 * <DashboardPage />
 * ```
 */
export default function DashboardPage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const topics = useAppStore((state) => state.topics);
  const customTopics = useAppStore((state) => state.customTopics);
  const errors = useAppStore((state) => state.errors);
  const learningPlan = useAppStore((state) => state.learningPlan);
  const checkIns = useAppStore((state) => state.checkIns);
  const badges = useAppStore((state) => state.badges);

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

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const todayTopic = topics.find(
    (t) => t.userId === profile.id && t.date.startsWith(today)
  );
  const isCheckedIn = checkIns.includes(today);
  const currentStreak = getCurrentStreak(checkIns);
  const longestStreak = getLongestStreak(checkIns);
  const recentBadges = badges
    .slice()
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);
  const recommendedTopic = (() => {
    const all = [
      ...customTopics.map((t) => ({ ...t, source: "custom" as const })),
      ...topics.map((t) => ({ ...t, source: "ai" as const })),
    ];
    const favorite = all.find((t) => t.userId === profile.id && t.favorite);
    if (favorite) return favorite;
    const custom = all.find((t) => t.userId === profile.id && t.source === "custom");
    if (custom) return custom;
    return all.find((t) => t.userId === profile.id) ?? null;
  })();
  const unreviewedErrors = errors.filter((e) => !e.reviewed).length;
  const todayTasks = learningPlan
    ? learningPlan.tasks.filter((t) => t.date === today)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">今日任务</h1>
          <p className="text-gray-600 dark:text-gray-300">
            目标：{targetMap[profile.target]} · 当前级别：{profile.level}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FileImporter />
          <FileExporter />
        </div>
      </div>

      {todayTopic && (
        <Card className="mb-6 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              今日话题
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium dark:text-blue-100">{todayTopic.topic}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{todayTopic.scenario}</p>
            <Link href="/speak">
              <Button size="sm" className="mt-3">
                去练习
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {recommendedTopic && (
        <Card className="mb-6 bg-linear-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              推荐话题
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium dark:text-purple-100">{recommendedTopic.topic}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{recommendedTopic.scenario}</p>
            <Link href="/speak">
              <Button size="sm" className="mt-3">
                去练习
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-linear-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isCheckedIn ? (
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
              ) : (
                <Flame className="w-4 h-4 text-orange-600" />
              )}
              今日打卡
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium dark:text-orange-100">
              {isCheckedIn ? "今日已打卡" : "今日还未打卡"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              连续 {currentStreak} 天
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              连续学习
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-red-100">{currentStreak}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              最长 {longestStreak} 天
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-600" />
              成就徽章
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-yellow-100">{badges.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {recentBadges.length > 0
                ? `最近：${recentBadges[0].title}`
                : "快去练习解锁徽章吧"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <Link href="/speak" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <Mic className="w-8 h-8 mb-2 text-blue-600" />
              <CardTitle>口语练习</CardTitle>
            </CardHeader>
            <CardContent>
              今日已练习 {todaySessions.filter((s) => s.type === "SPEAK").length} 次
              <p className="text-sm text-gray-500 mt-2">点击开始今日口语任务</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/write" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <FileText className="w-8 h-8 mb-2 text-green-600" />
              <CardTitle>写作练习</CardTitle>
            </CardHeader>
            <CardContent>
              今日已练习 {todaySessions.filter((s) => s.type === "WRITE").length} 次
              <p className="text-sm text-gray-500 mt-2">点击开始今日写作任务</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/chat" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <MessageCircle className="w-8 h-8 mb-2 text-purple-600" />
              <CardTitle>AI 对话</CardTitle>
            </CardHeader>
            <CardContent>
              与 AI 进行多轮对话练习
              <p className="text-sm text-gray-500 mt-2">选择角色开始聊天</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/review" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <BookOpen className="w-8 h-8 mb-2 text-orange-600" />
              <CardTitle>错题复习</CardTitle>
            </CardHeader>
            <CardContent>
              {unreviewedErrors > 0 ? (
                <p className="text-sm">你有 {unreviewedErrors} 条待复习错误</p>
              ) : (
                <p className="text-sm">暂无待复习错误</p>
              )}
              <p className="text-sm text-gray-500 mt-2">查看错题本与薄弱点训练</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              学习计划
            </CardTitle>
          </CardHeader>
          <CardContent>
            {learningPlan ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {learningPlan.startDate} 至 {learningPlan.endDate}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {learningPlan.description}
                </p>
                <p className="text-sm">
                  今日任务：{todayTasks.length} 项 · 已完成 {todayTasks.filter((t) => t.completed).length} 项
                </p>
                <Link href="/plan">
                  <Button size="sm" className="mt-2">
                    查看计划
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">还没有学习计划，生成一份吧。</p>
                <Link href="/plan">
                  <Button size="sm">去生成</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>学习统计</CardTitle>
          </CardHeader>
          <CardContent>
            <p>总练习次数：{sessions.length}</p>
            <p>今日练习次数：{todaySessions.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
