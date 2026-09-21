/**
 * @file components/BrowserCapabilitiesInitializer.tsx
 * @description 浏览器能力检测初始化组件，在应用启动时自动检测语音和听力能力
 * @author English Agent Team
 * @date 2026-09-21
 */

"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getOrDetectCapabilities } from "@/lib/utils/browser-capabilities";

/**
 * 浏览器能力检测初始化组件
 * - 首次进入页面时检测浏览器对语音识别、TTS、麦克风的支持
 * - 检测结果优先读 localStorage 缓存（同步），已有结果时不重复检测
 * - 结果同步到 store.settings.browserCapabilities 供各组件使用
 * @example
 * ```tsx
 * <BrowserCapabilitiesInitializer />
 * ```
 */
export function BrowserCapabilitiesInitializer() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  useEffect(() => {
    // 有缓存时直接返回缓存（不重复检测），否则执行检测并缓存
    const capabilities = getOrDetectCapabilities();

    // 同步到 store：store 中无结果或结果不一致时更新
    const current = settings.browserCapabilities;
    const needSync =
      !current?.detectedAt || current.detectedAt !== capabilities.detectedAt;
    if (needSync) {
      updateSettings({ browserCapabilities: capabilities });
    }
  }, [settings.browserCapabilities, updateSettings]);

  return null;
}
