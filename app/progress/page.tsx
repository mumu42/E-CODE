"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";
import { SkillRadarChart } from "@/components/charts/RadarChart";
import { ScoreTrendChart } from "@/components/charts/TrendChart";
import { HeatmapCalendar } from "@/components/charts/HeatmapCalendar";

function formatDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ProgressPage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const assessments = useAppStore((state) => state.assessments);
  const errors = useAppStore((state) => state.errors);

  const stats = useMemo(() => {
    const total = sessions.length;
    const speak = sessions.filter((s) => s.type === "SPEAK").length;
    const write = sessions.filter((s) => s.type === "WRITE").length;
    const chat = sessions.filter((s) => s.type === "CHAT").length;
    const avgScore =
      total > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.fluencyScore || s.grammarScore || 0), 0) / total
          )
        : 0;
    return { total, speak, write, chat, avgScore };
  }, [sessions]);

  const latestAssessment = assessments[assessments.length - 1];

  const radarData = useMemo(() => {
    if (!latestAssessment) return [];
    const scores = latestAssessment.scores;
    return [
      { subject: "听力", value: scores.listening ?? 0, fullMark: 100 },
      { subject: "口语", value: scores.speaking ?? 0, fullMark: 100 },
      { subject: "阅读", value: scores.reading ?? 0, fullMark: 100 },
      { subject: "写作", value: scores.writing ?? 0, fullMark: 100 },
      { subject: "语法", value: scores.grammar ?? 0, fullMark: 100 },
    ];
  }, [latestAssessment]);

  const trendData = useMemo(() => {
    const grouped = new Map<string, number[]>();
    sessions.forEach((s) => {
      const key = new Date(s.date).toISOString().split("T")[0];
      const scores = grouped.get(key) || [];
      scores.push(s.fluencyScore || s.grammarScore || 0);
      grouped.set(key, scores);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, scores]) => ({
        date: formatDate(new Date(date)),
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
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
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [errors]);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">暂无学习档案</h1>
        <p className="text-gray-600">完成 Onboarding 后即可查看进度。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold">学习进度</h1>
        <div className="flex gap-2">
          <FileImporter />
          <FileExporter />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">总练习次数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">口语练习</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.speak}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">写作练习</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.write}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.avgScore}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>能力雷达图</CardTitle>
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <SkillRadarChart data={radarData} />
            ) : (
              <p className="text-gray-500">完成测评后即可查看</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>评分趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ScoreTrendChart data={trendData} />
            ) : (
              <p className="text-gray-500">完成练习后即可查看</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>学习热力图</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatmapCalendar data={heatmapData} />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>薄弱点分析</CardTitle>
        </CardHeader>
        <CardContent>
          {weakPoints.length === 0 ? (
            <p className="text-gray-500">暂无薄弱点数据</p>
          ) : (
            <ul className="space-y-2">
              {weakPoints.map(([type, count]) => (
                <li key={type} className="flex justify-between border-b py-2">
                  <span className="capitalize">{type}</span>
                  <span className="font-medium">{count} 次</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>测评记录</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-gray-500">暂无测评记录</p>
          ) : (
            <ul className="space-y-2">
              {assessments.map((a) => (
                <li key={a.id} className="flex justify-between border-b py-2">
                  <span>{new Date(a.date).toLocaleDateString()}</span>
                  <span className="font-medium">
                    {a.level} · 总分 {Object.values(a.scores).reduce((s, v) => s + (v || 0), 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>练习历史</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500">暂无练习记录</p>
          ) : (
            <ul className="space-y-2">
              {sessions
                .slice()
                .reverse()
                .map((s) => (
                  <li key={s.id} className="border-b py-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {s.type === "SPEAK" ? "口语" : s.type === "WRITE" ? "写作" : "对话"} · {s.topic}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.userInput}</p>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
