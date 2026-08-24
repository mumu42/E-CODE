/**
 * @file app/dashboard/page.tsx
 * @description 今日任务 Dashboard，展示学习概览与功能入口
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";
import { t } from "@/lib/i18n/translate";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { askAdvisor } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2 } from
"lucide-react";

/** 目标中文映射 */
const targetMap: Record<string, string> = {
  SCHOOL: "升学考试",
  STUDY_ABROAD: "出国留学",
  CET: "四六级",
  IELTS_TOEFL: "雅思托福"
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

  const [adviceQuestion, setAdviceQuestion] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const advisorPrompt = useCustomPrompt("advisor");

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

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.date.startsWith(today));
  const todayTopic = topics.find(
    (t) => t.userId === profile.id && t.date.startsWith(today)
  );
  const isCheckedIn = checkIns.includes(today);
  const currentStreak = getCurrentStreak(checkIns);
  const longestStreak = getLongestStreak(checkIns);
  const recentBadges = badges.
  slice().
  sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()).
  slice(0, 3);
  const recommendedTopic = (() => {
    const all = [
    ...customTopics.map((t) => ({ ...t, source: "custom" as const })),
    ...topics.map((t) => ({ ...t, source: "ai" as const }))];

    const favorite = all.find((t) => t.userId === profile.id && t.favorite);
    if (favorite) return favorite;
    const custom = all.find((t) => t.userId === profile.id && t.source === "custom");
    if (custom) return custom;
    return all.find((t) => t.userId === profile.id) ?? null;
  })();
  const unreviewedErrors = errors.filter((e) => !e.reviewed).length;
  const todayTasks = learningPlan ?
  learningPlan.tasks.filter((t) => t.date === today) :
  [];

  async function handleGetAdvice() {
    if (!profile) return;
    setAdviceLoading(true);
    try {
      const result = await askAdvisor(
        profile.target,
        profile.level,
        adviceQuestion || "请根据我的学习情况，给我一些学习建议。",
        undefined,
        undefined,
        undefined,
        advisorPrompt
      );
      setAdvice(result.reply);
    } catch (error) {
      console.error(error);
      setAdvice("获取学习建议失败，请稍后重试。");
    } finally {
      setAdviceLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t("\u4ECA\u65E5\u4EFB\u52A1")}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t("\u76EE\u6807\uFF1A")}
            {targetMap[profile.target]}{t("\xB7 \u5F53\u524D\u7EA7\u522B\uFF1A")}{profile.level}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FileImporter />
          <FileExporter />
        </div>
      </div>

      {todayTopic &&
      <Card className="mb-6 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />{t("\u4ECA\u65E5\u8BDD\u9898")}

          </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium dark:text-blue-100">{todayTopic.topic}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{todayTopic.scenario}</p>
            <Link href="/speak">
              <Button size="sm" className="mt-3">{t("\u53BB\u7EC3\u4E60")}

            </Button>
            </Link>
          </CardContent>
        </Card>
      }

      {recommendedTopic &&
      <Card className="mb-6 bg-linear-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />{t("\u63A8\u8350\u8BDD\u9898")}

          </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium dark:text-purple-100">{recommendedTopic.topic}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{recommendedTopic.scenario}</p>
            <Link href="/speak">
              <Button size="sm" className="mt-3">{t("\u53BB\u7EC3\u4E60")}

            </Button>
            </Link>
          </CardContent>
        </Card>
      }

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-linear-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isCheckedIn ?
              <CheckCircle2 className="w-4 h-4 text-orange-600" /> :

              <Flame className="w-4 h-4 text-orange-600" />
              }{t("\u4ECA\u65E5\u6253\u5361")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium dark:text-orange-100">
              {isCheckedIn ? "今日已打卡" : "今日还未打卡"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t("\u8FDE\u7EED")}
              {currentStreak}{t("\u5929")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />{t("\u8FDE\u7EED\u5B66\u4E60")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-red-100">{currentStreak}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t("\u6700\u957F")}
              {longestStreak}{t("\u5929")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-600" />{t("\u6210\u5C31\u5FBD\u7AE0")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-yellow-100">{badges.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {recentBadges.length > 0 ?
              `最近：${recentBadges[0].title}` :
              "快去练习解锁徽章吧"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <Link href="/speak" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <Mic className="w-8 h-8 mb-2 text-blue-600" />
              <CardTitle>{t("\u53E3\u8BED\u7EC3\u4E60")}</CardTitle>
            </CardHeader>
            <CardContent>{t("\u4ECA\u65E5\u5DF2\u7EC3\u4E60")}
              {todaySessions.filter((s) => s.type === "SPEAK").length}{t("\u6B21")}
              <p className="text-sm text-gray-500 mt-2">{t("\u70B9\u51FB\u5F00\u59CB\u4ECA\u65E5\u53E3\u8BED\u4EFB\u52A1")}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/write" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <FileText className="w-8 h-8 mb-2 text-green-600" />
              <CardTitle>{t("\u5199\u4F5C\u7EC3\u4E60")}</CardTitle>
            </CardHeader>
            <CardContent>{t("\u4ECA\u65E5\u5DF2\u7EC3\u4E60")}
              {todaySessions.filter((s) => s.type === "WRITE").length}{t("\u6B21")}
              <p className="text-sm text-gray-500 mt-2">{t("\u70B9\u51FB\u5F00\u59CB\u4ECA\u65E5\u5199\u4F5C\u4EFB\u52A1")}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/chat" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <MessageCircle className="w-8 h-8 mb-2 text-purple-600" />
              <CardTitle>{t("AI \u5BF9\u8BDD")}</CardTitle>
            </CardHeader>
            <CardContent>{t("\u4E0E AI \u8FDB\u884C\u591A\u8F6E\u5BF9\u8BDD\u7EC3\u4E60")}

              <p className="text-sm text-gray-500 mt-2">{t("\u9009\u62E9\u89D2\u8272\u5F00\u59CB\u804A\u5929")}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/review" className="block h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:text-white">
            <CardHeader>
              <BookOpen className="w-8 h-8 mb-2 text-orange-600" />
              <CardTitle>{t("\u9519\u9898\u590D\u4E60")}</CardTitle>
            </CardHeader>
            <CardContent>
              {unreviewedErrors > 0 ?
              <p className="text-sm">{t("\u4F60\u6709")}{unreviewedErrors}{t("\u6761\u5F85\u590D\u4E60\u9519\u8BEF")}</p> :

              <p className="text-sm">{t("\u6682\u65E0\u5F85\u590D\u4E60\u9519\u8BEF")}</p>
              }
              <p className="text-sm text-gray-500 mt-2">{t("\u67E5\u770B\u9519\u9898\u672C\u4E0E\u8584\u5F31\u70B9\u8BAD\u7EC3")}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />{t("\u5B66\u4E60\u8BA1\u5212")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            {learningPlan ?
            <div className="space-y-2">
                <p className="text-sm font-medium">
                  {learningPlan.startDate}{t("\u81F3")}{learningPlan.endDate}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {learningPlan.description}
                </p>
                <p className="text-sm">{t("\u4ECA\u65E5\u4EFB\u52A1\uFF1A")}
                {todayTasks.length}{t("\u9879 \xB7 \u5DF2\u5B8C\u6210")}{todayTasks.filter((t) => t.completed).length}{t("\u9879")}
              </p>
                <Link href="/plan">
                  <Button size="sm" className="mt-2">{t("\u67E5\u770B\u8BA1\u5212")}

                </Button>
                </Link>
              </div> :

            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u8BA1\u5212\uFF0C\u751F\u6210\u4E00\u4EFD\u5427\u3002")}</p>
                <Link href="/plan">
                  <Button size="sm">{t("\u53BB\u751F\u6210")}</Button>
                </Link>
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />{t("AI \u5B66\u4E60\u5EFA\u8BAE")}

            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={adviceQuestion}
              onChange={(e) => setAdviceQuestion(e.target.value)}
              placeholder={t("\u63CF\u8FF0\u4F60\u9047\u5230\u7684\u56F0\u96BE\uFF0C\u6216\u76F4\u63A5\u70B9\u51FB\u6309\u94AE\u83B7\u53D6\u5EFA\u8BAE...")}
              rows={3}
              className="resize-none" />
            
            <Button onClick={handleGetAdvice} disabled={adviceLoading} className="w-full sm:w-auto">
              {adviceLoading ? "AI 思考中..." : "获取学习建议"}
            </Button>
            {advice &&
            <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {advice}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("\u5B66\u4E60\u7EDF\u8BA1")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t("\u603B\u7EC3\u4E60\u6B21\u6570\uFF1A")}{sessions.length}</p>
            <p>{t("\u4ECA\u65E5\u7EC3\u4E60\u6B21\u6570\uFF1A")}{todaySessions.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>);

}