"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";
import { Mic, FileText } from "lucide-react";

export default function DashboardPage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);

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

  const targetMap: Record<string, string> = {
    SCHOOL: "升学考试",
    STUDY_ABROAD: "出国留学",
    CET: "四六级",
    IELTS_TOEFL: "雅思托福",
  };

  const todaySessions = sessions.filter((s) =>
    s.date.startsWith(new Date().toISOString().split("T")[0])
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">今日任务</h1>
          <p className="text-gray-600">
            目标：{targetMap[profile.target]} · 当前级别：{profile.level}
          </p>
        </div>
        <div className="flex gap-2">
          <FileImporter />
          <FileExporter />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <Link href="/speak">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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

        <Card className="opacity-60 h-full">
          <CardHeader>
            <FileText className="w-8 h-8 mb-2 text-green-600" />
            <CardTitle>写作练习</CardTitle>
          </CardHeader>
          <CardContent>
            开发中，将在二期上线
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
