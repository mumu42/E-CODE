/**
 * @file app/progress/page.tsx
 * @description 学习进度页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";
import { formatDate as formatLocaleDate } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";
import { getCurrentStreak, getLongestStreak } from "@/lib/stats/checkin";
import { SkillRadarChart } from "@/components/charts/RadarChart";
import { predictExamScore } from "@/lib/exam/prediction";
import { ScoreTrendChart } from "@/components/charts/TrendChart";
import { HeatmapCalendar } from "@/components/charts/HeatmapCalendar";
import { generateLearningSummary } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { useRouter } from "next/navigation";
import { Loader2, Trophy, Award } from "lucide-react";
import { estimateTimeToTarget, calculateGoalGap } from "@/lib/stats/predictions";
import Link from "next/link";

function formatDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 学习进度页面
 * @example
 * ```tsx
 * <ProgressPage />
 * ```
 */
export default function ProgressPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const assessments = useAppStore((state) => state.assessments);
  const errors = useAppStore((state) => state.errors);
  const examRecords = useAppStore((state) => state.examRecords);
  const readingRecords = useAppStore((state) => state.readingRecords);
  const listeningRecords = useAppStore((state) => state.listeningRecords);
  const checkIns = useAppStore((state) => state.checkIns);
  const badges = useAppStore((state) => state.badges);
  const summaryPrompt = useCustomPrompt("summary");

  const stats = useMemo(() => {
    const total = sessions.length;
    const speak = sessions.filter((s) => s.type === "SPEAK").length;
    const write = sessions.filter((s) => s.type === "WRITE").length;
    const chat = sessions.filter((s) => s.type === "CHAT").length;
    const avgScore =
    total > 0 ?
    Math.round(
      sessions.reduce((sum, s) => sum + (s.fluencyScore || s.grammarScore || 0), 0) / total
    ) :
    0;
    return { total, speak, write, chat, avgScore };
  }, [sessions]);

  const currentStreak = useMemo(() => getCurrentStreak(checkIns), [checkIns]);
  const longestStreak = useMemo(() => getLongestStreak(checkIns), [checkIns]);

  const latestAssessment = assessments[assessments.length - 1];

  const radarData = useMemo(() => {
    if (!latestAssessment) return [];
    const scores = latestAssessment.scores;
    return [
    { subject: t("听力"), value: scores.listening ?? 0, fullMark: 100 },
    { subject: t("口语"), value: scores.speaking ?? 0, fullMark: 100 },
    { subject: t("阅读"), value: scores.reading ?? 0, fullMark: 100 },
    { subject: t("写作"), value: scores.writing ?? 0, fullMark: 100 },
    { subject: t("语法"), value: scores.grammar ?? 0, fullMark: 100 }];

  }, [latestAssessment]);

  const [summary, setSummary] = useState<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    nextSteps: string[];
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  async function handleGenerateSummary() {
    if (!profile) return;
    setSummaryLoading(true);
    try {
      const result = await generateLearningSummary(
        { target: profile.target, level: profile.level },
        sessions,
        errors,
        summaryPrompt
      );
      setSummary(result);
    } catch (error) {
      console.error(error);
      alert(t("生成学习摘要失败，请稍后重试。"));
    } finally {
      setSummaryLoading(false);
    }
  }

  const trendData = useMemo(() => {
    const grouped = new Map<string, number[]>();
    sessions.forEach((s) => {
      const key = new Date(s.date).toISOString().split("T")[0];
      const scores = grouped.get(key) || [];
      scores.push(s.fluencyScore || s.grammarScore || 0);
      grouped.set(key, scores);
    });

    return Array.from(grouped.entries()).
    sort(([a], [b]) => a.localeCompare(b)).
    slice(-14).
    map(([date, scores]) => ({
      date: formatDate(new Date(date)),
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }));
  }, [sessions]);

  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = new Date(s.date).toISOString().split("T")[0];
      data[key] = (data[key] || 0) + 1;
    });
    return data;
  }, [sessions]);

  const weakPoints = useMemo(() => {
    const counts = new Map<string, number>();
    errors.forEach((err) => {
      counts.set(err.errorType, (counts.get(err.errorType) || 0) + 1);
    });
    return Array.from(counts.entries()).
    sort((a, b) => b[1] - a[1]).
    slice(0, 5);
  }, [errors]);

  const predicted = useMemo(() => {
    return predictExamScore(examRecords, readingRecords, listeningRecords, sessions);
  }, [examRecords, readingRecords, listeningRecords, sessions]);

  const { estimate, gap } = useMemo(() => {
    const estimate = profile ?
    estimateTimeToTarget(profile, sessions, errors) :
    null;
    const gap = profile ?
    calculateGoalGap(profile, latestAssessment) :
    null;
    return { estimate, gap };
  }, [profile, sessions, errors, latestAssessment]);

  const examTrendData = useMemo(() => {
    return examRecords.
    slice().
    sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()).
    map((record) => ({
      date: formatDate(new Date(record.startedAt)),
      score:
      record.totalScore > 0 ?
      Math.round(record.score / record.totalScore * 100) :
      record.score
    }));
  }, [examRecords]);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("\u6682\u65E0\u5B66\u4E60\u6863\u6848")}</h1>
        <p className="text-gray-600">{t("\u5B8C\u6210 Onboarding \u540E\u5373\u53EF\u67E5\u770B\u8FDB\u5EA6\u3002")}</p>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold">{t("\u5B66\u4E60\u8FDB\u5EA6")}</h1>
        <div className="flex gap-2">
          <FileImporter />
          <FileExporter />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("\u603B\u7EC3\u4E60\u6B21\u6570")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("\u53E3\u8BED\u7EC3\u4E60")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.speak}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("\u5199\u4F5C\u7EC3\u4E60")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.write}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("\u5E73\u5747\u8BC4\u5206")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.avgScore}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("\u9884\u6D4B\u8003\u8BD5\u5206\u6570")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-primary">{predicted.score}</span>
              <span className="text-muted-foreground">/ 100</span>
            </div>
            <p className="text-sm text-muted-foreground">{predicted.basis}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>{t("\u9605\u8BFB")}</span>
                <span className="font-medium">{predicted.sectionScores.reading}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>{t("\u542C\u529B")}</span>
                <span className="font-medium">{predicted.sectionScores.listening}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>{t("\u5199\u4F5C")}</span>
                <span className="font-medium">{predicted.sectionScores.writing}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>{t("\u53E3\u8BED")}</span>
                <span className="font-medium">{predicted.sectionScores.speaking}</span>
              </div>
            </div>
            <Button onClick={() => router.push("/exam/full")} className="w-full">{t("\u5F00\u59CB\u5168\u771F\u6A21\u8003")}

            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("\u6A21\u8003\u6210\u7EE9\u8D8B\u52BF")}</CardTitle>
          </CardHeader>
          <CardContent>
            {examTrendData.length > 0 ?
            <ScoreTrendChart data={examTrendData} /> :

            <p className="text-gray-500">{t("\u5B8C\u6210\u6A21\u8003\u540E\u5373\u53EF\u67E5\u770B")}</p>
            }
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("\u76EE\u6807\u8FBE\u6210\u9884\u6D4B")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {estimate && gap ?
            <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{estimate.weeks}</span>
                  <span className="text-muted-foreground">{t("\u5468")}</span>
                  <span className="text-sm text-muted-foreground ml-2">{t("\uFF08\u7EA6")}{estimate.days}{t("\u5929\uFF09")}</span>
                </div>
                <p className="text-sm text-muted-foreground">{estimate.basis}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("\u603B\u4F53\u8FDB\u5EA6")}</span>
                    <span className="font-medium">{gap.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${gap.overallProgress}%` }} />
                  
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{t("\u5EFA\u8BAE\u6BCF\u5468\u7EC3\u4E60")}
                <strong>{estimate.recommendedWeeklySessions}</strong>{t("\u6B21\uFF0C\u4FDD\u6301\u5F53\u524D\u8282\u594F\u3002")}
              </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(gap.currentScores).map(([skill, score]) =>
                <div key={skill} className="flex justify-between bg-muted p-2 rounded">
                      <span className="capitalize">
                        {skill === "listening" && t("\u542C\u529B")}
                        {skill === "speaking" && t("\u53E3\u8BED")}
                        {skill === "reading" && t("\u9605\u8BFB")}
                        {skill === "writing" && t("\u5199\u4F5C")}
                        {skill === "grammar" && t("\u8BED\u6CD5")}
                      </span>
                      <span className="font-medium">
                        {score} / {gap.targetScores[skill as keyof typeof gap.targetScores]}
                      </span>
                    </div>
                )}
                </div>
              </> :

            <p className="text-gray-500">{t("\u5B8C\u5584\u6863\u6848\u548C\u7EC3\u4E60\u8BB0\u5F55\u540E\u5373\u53EF\u67E5\u770B\u9884\u6D4B")}</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("\u5B66\u4E60\u62A5\u544A")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("\u751F\u6210\u5468\u62A5/\u6708\u62A5\uFF0C\u67E5\u770B\u66F4\u8BE6\u7EC6\u7684\u7EC3\u4E60\u7EDF\u8BA1\uFF0C\u5E76\u5BFC\u51FA Word \u6216 PDF\u3002")}

            </p>
            <Link href="/report">
              <Button className="w-full sm:w-auto">{t("\u67E5\u770B\u5B66\u4E60\u62A5\u544A")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />{t("\u5F53\u524D\u8FDE\u7EED")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currentStreak}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />{t("\u6700\u957F\u8FDE\u7EED")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{longestStreak}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" />{t("\u6210\u5C31\u5FBD\u7AE0")}

            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length > 0 ?
            <div className="flex flex-wrap gap-2">
                {badges.map((badge) =>
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                
                    {badge.title}
                  </span>
              )}
              </div> :

            <p className="text-sm text-gray-500">{t("\u6682\u65E0\u5FBD\u7AE0\uFF0C\u5FEB\u53BB\u7EC3\u4E60\u5427")}</p>
            }
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("\u80FD\u529B\u96F7\u8FBE\u56FE")}</CardTitle>
          </CardHeader>
          <CardContent>
            {latestAssessment ?
            <SkillRadarChart data={radarData} /> :

            <p className="text-gray-500">{t("\u5B8C\u6210\u6D4B\u8BC4\u540E\u5373\u53EF\u67E5\u770B")}</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("\u8BC4\u5206\u8D8B\u52BF")}</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ?
            <ScoreTrendChart data={trendData} /> :

            <p className="text-gray-500">{t("\u5B8C\u6210\u7EC3\u4E60\u540E\u5373\u53EF\u67E5\u770B")}</p>
            }
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u5B66\u4E60\u70ED\u529B\u56FE")}</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatmapCalendar data={heatmapData} />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u8584\u5F31\u70B9\u5206\u6790")}</CardTitle>
        </CardHeader>
        <CardContent>
          {weakPoints.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u8584\u5F31\u70B9\u6570\u636E")}</p> :

          <ul className="space-y-2">
              {weakPoints.map(([type, count]) =>
            <li key={type} className="flex justify-between border-b py-2">
                  <span className="capitalize">{type}</span>
                  <span className="font-medium">{count}{t("\u6B21")}</span>
                </li>
            )}
            </ul>
          }
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("AI \u5B66\u4E60\u6458\u8981")}</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ?
          <div className="space-y-4">
              <p className="text-sm text-gray-700">{summary.summary}</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-1">{t("\u4F18\u52BF")}</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {summary.strengths.map((s, idx) =>
                  <li key={idx}>{s}</li>
                  )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-1">{t("\u5F85\u52A0\u5F3A")}</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {summary.weaknesses.map((w, idx) =>
                  <li key={idx}>{w}</li>
                  )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">{t("\u4E0B\u4E00\u6B65")}</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {summary.nextSteps.map((step, idx) =>
                  <li key={idx}>{step}</li>
                  )}
                  </ul>
                </div>
              </div>
            </div> :

          <p className="text-sm text-gray-500">{t("\u70B9\u51FB\u6309\u94AE\u751F\u6210\u8FD1\u671F\u5B66\u4E60\u6458\u8981\u3002")}</p>
          }
          <Button
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
            className="mt-4">
            
            {summaryLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{t("\u751F\u6210\u5B66\u4E60\u6458\u8981")}

          </Button>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u6D4B\u8BC4\u8BB0\u5F55")}</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u6D4B\u8BC4\u8BB0\u5F55")}</p> :

          <ul className="space-y-2">
              {assessments.map((a) =>
            <li key={a.id} className="flex justify-between border-b py-2">
                  <span>{formatLocaleDate(a.date)}</span>
                  <span className="font-medium">
                    {a.level}{t("\xB7 \u603B\u5206")}{Object.values(a.scores).reduce((s, v) => s + (v || 0), 0)}
                  </span>
                </li>
            )}
            </ul>
          }
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("\u6A21\u8003\u8BB0\u5F55")}</CardTitle>
        </CardHeader>
        <CardContent>
          {examRecords.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u6A21\u8003\u8BB0\u5F55")}</p> :

          <ul className="space-y-2">
              {examRecords.slice().reverse().map((record) => {
              const percentage = record.totalScore > 0 ?
              Math.round(record.score / record.totalScore * 100) :
              0;
              return (
                <li key={record.id} className="flex justify-between border-b py-2">
                    <span>{record.type}</span>
                    <span className="font-medium">
                      {percentage}{t("\u5206 \xB7")}{formatLocaleDate(record.startedAt)}
                    </span>
                  </li>);

            })}
            </ul>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("\u7EC3\u4E60\u5386\u53F2")}</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u7EC3\u4E60\u8BB0\u5F55")}</p> :

          <ul className="space-y-2">
              {sessions.
            slice().
            reverse().
            map((s) =>
            <li key={s.id} className="border-b py-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {s.type === "SPEAK" ? t("\u53E3\u8BED") : s.type === "WRITE" ? t("\u5199\u4F5C") : t("\u5BF9\u8BDD")} · {s.topic}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatLocaleDate(s.date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.userInput}</p>
                  </li>
            )}
            </ul>
          }
        </CardContent>
      </Card>
    </div>);

}