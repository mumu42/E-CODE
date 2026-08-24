/**
 * @file components/KeyboardShortcuts.tsx
 * @description 全局键盘快捷键：Alt+数字快速跳转常用页面
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

const SHORTCUTS: Record<string, string> = {
  "1": "/dashboard",
  "2": "/speak",
  "3": "/write",
  "4": "/chat",
  "5": "/review",
  "6": "/plan",
  "7": "/exam",
  "8": "/progress",
  "9": "/settings",
};

const LETTER_SHORTCUTS: Record<string, string> = {
  r: "/reading",
  l: "/listening",
  v: "/vocabulary",
  a: "/advisor",
};

/** 全局键盘快捷键组件 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const enabled = useAppStore((state) => state.settings?.shortcuts?.enabled ?? true);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        const key = event.key.toLowerCase();
        const path = SHORTCUTS[key] ?? LETTER_SHORTCUTS[key];
        if (path) {
          event.preventDefault();
          router.push(path);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, router]);

  return null;
}
