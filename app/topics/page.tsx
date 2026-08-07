/**
 * @file app/topics/page.tsx
 * @description 历史话题列表页面
 * @author English Agent Team
 * @date 2026-08-07
 */
"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";

/**
 * 历史话题列表页面
 * @example
 * ```tsx
 * <TopicsPage />
 * ```
 */
export default function TopicsPage() {
  const profile = useAppStore((state) => state.profile);
  const topics = useAppStore((state) =>
    state.topics
      .filter((t) => (profile ? t.userId === profile.id : true))
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const updateTopic = useAppStore((state) => state.updateTopic);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">历史话题</h1>

      {topics.length === 0 && (
        <p className="text-gray-500">还没有历史话题，去口语练习页开始练习吧。</p>
      )}

      <div className="space-y-4">
        {topics.map((topic) => (
          <Card key={topic.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-start justify-between gap-2">
                <span>{topic.topic}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateTopic(topic.id, { favorite: !topic.favorite })}
                >
                  <Star
                    className={`w-5 h-5 ${
                      topic.favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                    }`}
                  />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">{topic.scenario}</p>
              {topic.hints.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {topic.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(topic.date).toLocaleDateString()}</span>
                <span>·</span>
                <span>{topic.level}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
