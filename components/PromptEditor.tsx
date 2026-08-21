/**
 * @file components/PromptEditor.tsx
 * @description 自定义 Prompt 模板编辑器
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { DEFAULT_PROMPTS } from "@/lib/settings/defaults";
import type { PromptType } from "@/lib/types";

const PROMPT_LABELS: Record<PromptType, string> = {
  speak: "口语练习反馈",
  write: "写作批改反馈",
  chat: "AI 对话",
  plan: "学习计划生成",
  assessment: "水平测评",
  drill: "薄弱点专项练习",
  summary: "学习摘要",
};

const PROMPT_VARIABLES: Record<PromptType, string[]> = {
  speak: ["target", "level", "topic", "scenario", "userInput", "learningContext"],
  write: ["target", "level", "topic", "instructions", "userInput", "learningContext"],
  chat: ["target", "level", "role", "roleDescription", "history", "userMessage", "learningContext"],
  plan: ["target", "level", "availableMinutes", "weakPoints", "weeks", "totalDays"],
  assessment: ["answers", "sample"],
  drill: ["weakPoint", "count"],
  summary: ["target", "level", "sessionCount", "errorCount", "recentTopics", "commonErrors"],
};

/** Prompt 编辑器组件 */
export function PromptEditor() {
  const prompts = useAppStore((state) => state.settings?.prompts ?? DEFAULT_PROMPTS);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [active, setActive] = useState<PromptType>("speak");
  const [drafts, setDrafts] = useState<Record<PromptType, string>>(() => ({ ...prompts }));

  function handleChange(value: string) {
    setDrafts((prev) => ({ ...prev, [active]: value }));
  }

  function handleSave() {
    updateSettings({ prompts: { ...prompts, [active]: drafts[active] } });
    alert("已保存当前 Prompt");
  }

  function handleReset(type: PromptType) {
    const next = { ...drafts, [type]: DEFAULT_PROMPTS[type] };
    setDrafts(next);
    updateSettings({ prompts: { ...prompts, [type]: DEFAULT_PROMPTS[type] } });
  }

  function handleResetAll() {
    if (!confirm("确定要恢复所有默认 Prompt 吗？当前自定义内容将被覆盖。")) return;
    setDrafts({ ...DEFAULT_PROMPTS });
    updateSettings({ prompts: { ...DEFAULT_PROMPTS } });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROMPT_LABELS) as PromptType[]).map((key) => (
          <Button
            key={key}
            variant={active === key ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(key)}
          >
            {PROMPT_LABELS[key]}
          </Button>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        可用变量：{PROMPT_VARIABLES[active].map((v) => `{{${v}}}`).join(" ")}
      </div>

      <textarea
        value={drafts[active]}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-64 p-3 border rounded-md text-sm font-mono"
        spellCheck={false}
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave}>保存当前 Prompt</Button>
        <Button variant="outline" onClick={() => handleReset(active)}>
          恢复默认
        </Button>
        <Button variant="outline" onClick={handleResetAll}>
          恢复全部默认
        </Button>
      </div>
    </div>
  );
}
