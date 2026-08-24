/**
 * @file app/topics/page.tsx
 * @description 历史话题与自定义话题管理页面
 * @author English Agent Team
 * @date 2026-08-17
 */
"use client";
import { formatDate } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

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
  state.topics.
  filter((t) => profile ? t.userId === profile.id : true).
  slice().
  sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const customTopics = useAppStore((state) =>
  state.customTopics.
  filter((t) => profile ? t.userId === profile.id : true).
  slice().
  sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
        <h1 className="text-2xl font-bold mb-4">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u6863\u6848")}</h1>
        <p className="text-gray-600">{t("\u8BF7\u5148\u5B8C\u6210\u76EE\u6807\u9009\u62E9\u548C\u7EA7\u522B\u6D4B\u8BC4\u3002")}</p>
      </div>);

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
      hints: hints.
      split(/[,，]/).
      map((h) => h.trim()).
      filter(Boolean),
      source: "custom"
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
      hints: editHints.
      split(/[,，]/).
      map((h) => h.trim()).
      filter(Boolean)
    });
    setEditingId(null);
  }

  function renderTopicCard(item: TopicRecord, isCustom: boolean) {
    const isEditing = isCustom && editingId === item.id;

    return (
      <Card key={item.id}>
        <CardHeader>
          <CardTitle className="text-base flex items-start justify-between gap-2">
            {isEditing ?
            <input
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              className="w-full h-9 px-2 rounded border text-sm" /> :


            <span>{item.topic}</span>
            }
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
              updateTopic(item.id, { favorite: !item.favorite })
              }>
              
              <Star
                className={`w-5 h-5 ${
                item.favorite ?
                "fill-yellow-400 text-yellow-400" :
                "text-gray-400"}`
                } />
              
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isEditing ?
          <>
              <Textarea
              value={editScenario}
              onChange={(e) => setEditScenario(e.target.value)}
              rows={2}
              className="text-sm" />
            
              <input
              value={editHints}
              onChange={(e) => setEditHints(e.target.value)}
              className="w-full h-9 px-2 rounded border text-sm"
              placeholder={t("\u63D0\u793A\u8BCD\uFF0C\u7528\u9017\u53F7\u5206\u9694")} />
            
            </> :

          <>
              <p className="text-sm text-gray-600">{item.scenario}</p>
              {item.hints.length > 0 &&
            <ul className="list-disc list-inside text-sm text-gray-700">
                  {item.hints.map((hint, idx) =>
              <li key={idx}>{hint}</li>
              )}
                </ul>
            }
            </>
          }
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(item.date)}</span>
            <span>·</span>
            <span>{item.level}</span>
            {isCustom && <span>{t("\xB7 \u81EA\u5B9A\u4E49")}</span>}
          </div>
          {isCustom &&
          <div className="flex gap-2 pt-2">
              {isEditing ?
            <Button size="sm" onClick={() => saveEdit(item.id)}>{t("\u4FDD\u5B58")}

            </Button> :

            <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                  <Pencil className="w-3 h-3 mr-1" />{t("\u7F16\u8F91")}

            </Button>
            }
              <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => removeCustomTopic(item.id)}>
              
                <Trash2 className="w-3 h-3 mr-1" />{t("\u5220\u9664")}

            </Button>
            </div>
          }
        </CardContent>
      </Card>);

  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t("\u5386\u53F2\u8BDD\u9898")}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />{t("\u65B0\u5EFA\u81EA\u5B9A\u4E49\u8BDD\u9898")}

          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("\u8BDD\u9898\u6807\u9898")}
            className="w-full h-10 px-3 rounded border text-sm" />
          
          <Textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder={t("\u573A\u666F\u63CF\u8FF0")}
            rows={2}
            className="text-sm" />
          
          <input
            value={hints}
            onChange={(e) => setHints(e.target.value)}
            placeholder={t("\u63D0\u793A\u8BCD\uFF0C\u7528\u9017\u53F7\u5206\u9694")}
            className="w-full h-10 px-3 rounded border text-sm" />
          
          <Button onClick={handleAdd} disabled={!topic.trim()}>{t("\u6DFB\u52A0\u8BDD\u9898")}

          </Button>
        </CardContent>
      </Card>

      {customTopics.length > 0 &&
      <>
          <h2 className="text-lg font-semibold mb-3">{t("\u81EA\u5B9A\u4E49\u8BDD\u9898")}</h2>
          <div className="space-y-4 mb-6">
            {customTopics.map((t) => renderTopicCard(t, true))}
          </div>
        </>
      }

      {aiTopics.length === 0 && customTopics.length === 0 &&
      <p className="text-gray-500">{t("\u8FD8\u6CA1\u6709\u8BDD\u9898\uFF0C\u53BB\u53E3\u8BED\u7EC3\u4E60\u9875\u5F00\u59CB\u7EC3\u4E60\u6216\u6DFB\u52A0\u81EA\u5B9A\u4E49\u8BDD\u9898\u5427\u3002")}</p>
      }


      {aiTopics.length > 0 &&
      <>
          <h2 className="text-lg font-semibold mb-3">{t("AI \u751F\u6210\u8BDD\u9898")}</h2>
          <div className="space-y-4">
            {aiTopics.map((t) => renderTopicCard(t, false))}
          </div>
        </>
      }
    </div>);

}