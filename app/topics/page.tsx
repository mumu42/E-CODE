/**
 * @file app/topics/page.tsx
 * @description 历史话题与自定义话题管理页面
 * @author English Agent Team
 * @date 2026-08-17
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, Calendar, Trash2, Plus, Pencil } from "lucide-react";
import type { TopicRecord } from "@/lib/types";

/**
 * 历史话题与自定义话题页面
 * @example
 * ```tsx
 * <TopicsPage />
 * ```
 */
export default function TopicsPage() {
  const profile = useAppStore((state) => state.profile);
  const aiTopics = useAppStore((state) =>
    state.topics
      .filter((t) => (profile ? t.userId === profile.id : true))
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const customTopics = useAppStore((state) =>
    state.customTopics
      .filter((t) => (profile ? t.userId === profile.id : true))
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const updateTopic = useAppStore((state) => state.updateTopic);
  const addCustomTopic = useAppStore((state) => state.addCustomTopic);
  const updateCustomTopic = useAppStore((state) => state.updateCustomTopic);
  const removeCustomTopic = useAppStore((state) => state.removeCustomTopic);

  const [topic, setTopic] = useState("");
  const [scenario, setScenario] = useState("");
  const [hints, setHints] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editScenario, setEditScenario] = useState("");
  const [editHints, setEditHints] = useState("");

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">还没有学习档案</h1>
        <p className="text-gray-600">请先完成目标选择和级别测评。</p>
      </div>
    );
  }

  function handleAdd() {
    if (!topic.trim()) return;
    addCustomTopic({
      id: crypto.randomUUID(),
      userId: profile!.id,
      date: new Date().toISOString(),
      target: profile!.target,
      level: profile!.level,
      topic: topic.trim(),
      scenario: scenario.trim(),
      hints: hints
        .split(/[,，]/)
        .map((h) => h.trim())
        .filter(Boolean),
      source: "custom",
    });
    setTopic("");
    setScenario("");
    setHints("");
  }

  function startEdit(item: TopicRecord) {
    setEditingId(item.id);
    setEditTopic(item.topic);
    setEditScenario(item.scenario);
    setEditHints(item.hints.join(", "));
  }

  function saveEdit(id: string) {
    updateCustomTopic(id, {
      topic: editTopic.trim(),
      scenario: editScenario.trim(),
      hints: editHints
        .split(/[,，]/)
        .map((h) => h.trim())
        .filter(Boolean),
    });
    setEditingId(null);
  }

  function renderTopicCard(item: TopicRecord, isCustom: boolean) {
    const isEditing = isCustom && editingId === item.id;

    return (
      <Card key={item.id}>
        <CardHeader>
          <CardTitle className="text-base flex items-start justify-between gap-2">
            {isEditing ? (
              <input
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
                className="w-full h-9 px-2 rounded border text-sm"
              />
            ) : (
              <span>{item.topic}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateTopic(item.id, { favorite: !item.favorite })
              }
            >
              <Star
                className={`w-5 h-5 ${
                  item.favorite
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400"
                }`}
              />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isEditing ? (
            <>
              <Textarea
                value={editScenario}
                onChange={(e) => setEditScenario(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <input
                value={editHints}
                onChange={(e) => setEditHints(e.target.value)}
                className="w-full h-9 px-2 rounded border text-sm"
                placeholder="提示词，用逗号分隔"
              />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">{item.scenario}</p>
              {item.hints.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {item.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              )}
            </>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(item.date).toLocaleDateString()}</span>
            <span>·</span>
            <span>{item.level}</span>
            {isCustom && <span>· 自定义</span>}
          </div>
          {isCustom && (
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <Button size="sm" onClick={() => saveEdit(item.id)}>
                  保存
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                  <Pencil className="w-3 h-3 mr-1" />
                  编辑
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => removeCustomTopic(item.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                删除
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">历史话题</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建自定义话题
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="话题标题"
            className="w-full h-10 px-3 rounded border text-sm"
          />
          <Textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="场景描述"
            rows={2}
            className="text-sm"
          />
          <input
            value={hints}
            onChange={(e) => setHints(e.target.value)}
            placeholder="提示词，用逗号分隔"
            className="w-full h-10 px-3 rounded border text-sm"
          />
          <Button onClick={handleAdd} disabled={!topic.trim()}>
            添加话题
          </Button>
        </CardContent>
      </Card>

      {customTopics.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">自定义话题</h2>
          <div className="space-y-4 mb-6">
            {customTopics.map((t) => renderTopicCard(t, true))}
          </div>
        </>
      )}

      {aiTopics.length === 0 && customTopics.length === 0 && (
        <p className="text-gray-500">还没有话题，去口语练习页开始练习或添加自定义话题吧。</p>
      )}


      {aiTopics.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">AI 生成话题</h2>
          <div className="space-y-4">
            {aiTopics.map((t) => renderTopicCard(t, false))}
          </div>
        </>
      )}
    </div>
  );
}
