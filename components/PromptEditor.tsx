/**
 * @file components/PromptEditor.tsx
 * @description 自定义 Prompt 模板编辑器
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

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
  reading: "阅读理解生成",
  listening: "听力理解生成",
  advisor: "AI 学习顾问"
};

const PROMPT_VARIABLES: Record<PromptType, string[]> = {
  speak: ["target", "level", "topic", "scenario", "userInput", "learningContext"],
  write: ["target", "level", "topic", "instructions", "userInput", "learningContext"],
  chat: ["target", "level", "role", "roleDescription", "history", "userMessage", "learningContext"],
  plan: ["target", "level", "availableMinutes", "weakPoints", "weeks", "totalDays"],
  assessment: ["answers", "sample"],
  drill: ["weakPoint", "count"],
  summary: ["target", "level", "sessionCount", "errorCount", "recentTopics", "commonErrors"],
  reading: ["target", "level"],
  listening: ["target", "level"],
  advisor: ["target", "level", "question", "context", "errorOriginal", "errorCorrection", "errorExplanation", "learningContext"]
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
    if (!confirm(t("确定要恢复所有默认 Prompt 吗？当前自定义内容将被覆盖。"))) return;
    setDrafts({ ...DEFAULT_PROMPTS });
    updateSettings({ prompts: { ...DEFAULT_PROMPTS } });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROMPT_LABELS) as PromptType[]).map((key) =>
        <Button
          key={key}
          variant={active === key ? "default" : "outline"}
          size="sm"
          onClick={() => setActive(key)}>
          
            {PROMPT_LABELS[key]}
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500">{t("\u53EF\u7528\u53D8\u91CF\uFF1A")}
        {PROMPT_VARIABLES[active].map((v) => `{{${v}}}`).join(" ")}
      </div>

      <textarea
        value={drafts[active]}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-64 p-3 border rounded-md text-sm font-mono"
        spellCheck={false} />
      

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave}>{t("\u4FDD\u5B58\u5F53\u524D Prompt")}</Button>
        <Button variant="outline" onClick={() => handleReset(active)}>{t("\u6062\u590D\u9ED8\u8BA4")}

        </Button>
        <Button variant="outline" onClick={handleResetAll}>{t("\u6062\u590D\u5168\u90E8\u9ED8\u8BA4")}

        </Button>
      </div>
    </div>);

}