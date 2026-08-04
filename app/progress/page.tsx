"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";

export default function ProgressPage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const assessments = useAppStore((state) => state.assessments);

  const stats = useMemo(() => {
    const total = sessions.length;
    const speak = sessions.filter((s) => s.type === "SPEAK").length;
    const write = sessions.filter((s) => s.type === "WRITE").length;
    const avgScore =
      total > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.fluencyScore || s.grammarScore || 0), 0) / total
          )
        : 0;
    return { total, speak, write, avgScore };
  }, [sessions]);

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

      <div className="grid md:grid-cols-4 gap-4 mb-8">
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
                        {s.type === "SPEAK" ? "口语" : "写作"} · {s.topic}
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
