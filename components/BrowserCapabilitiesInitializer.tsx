/**
 * @file components/BrowserCapabilitiesInitializer.tsx
 * @description 浏览器能力检测初始化组件，在应用启动时自动检测语音和听力能力
 * @author English Agent Team
 * @date 2026-09-23
 */

"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { getCachedCapabilities, detectBrowserCapabilities, setCachedCapabilities } from "@/lib/utils/browser-capabilities";

/**
 * 浏览器能力检测初始化组件
 * - 首次进入页面时检测浏览器对语音识别、TTS、麦克风的支持
 * - 检测结果优先读 localStorage 缓存（同步），已有结果时不重复检测
 * - 结果同步到 store.settings.browserCapabilities 供各组件使用
 * - 彻底修复：只在组件挂载时运行一次，避免与 Zustand 异步持久化产生竞态
 * @example
 * ```tsx
 * <BrowserCapabilitiesInitializer />
 * ```
 */
export function BrowserCapabilitiesInitializer() {
  const updateSettings = useAppStore((state) => state.updateSettings);
  const initialized = useRef(false);

  useEffect(() => {
    // 确保只执行一次，防止 React StrictMode 或 Store 重放导致的重复执行
    if (initialized.current) return;
    initialized.current = true;

    // 优先读 localStorage 缓存
    const cached = getCachedCapabilities();
    if (cached) {
      // 有缓存时直接同步到 store，不重新检测
      updateSettings({ browserCapabilities: cached });
      return;
    }

    // 无缓存时才执行检测并缓存
    const capabilities = detectBrowserCapabilities();
    setCachedCapabilities(capabilities);
    updateSettings({ browserCapabilities: capabilities });
  }, [updateSettings]);

  return null;
}
