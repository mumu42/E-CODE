/**
 * @file hooks/usePrompts.ts
 * @description 从全局状态读取用户自定义 Prompt 设置的便捷 Hook
 * @author English Agent Team
 * @date 2026-08-21
 */

import { useAppStore } from "@/lib/store";
import type { PromptType } from "@/lib/types";

/**
 * 获取单个自定义 Prompt
 * @param type - Prompt 类型
 * @returns 对应自定义 Prompt 字符串
 */
export function useCustomPrompt(type: PromptType): string {
  return useAppStore((state) => state.settings?.prompts?.[type] ?? "");
}

/**
 * 获取全部自定义 Prompt 设置
 * @returns Prompt 设置对象
 */
export function usePromptSettings() {
  return useAppStore((state) => state.settings?.prompts);
}
