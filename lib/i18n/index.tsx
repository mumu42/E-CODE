/**
 * @file lib/i18n/index.tsx
 * @description 轻量级国际化上下文（基于 messages JSON 和 store 中的 locale）
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import zhCN from "@/messages/zh-CN.json";
import enUS from "@/messages/en-US.json";
import translations from "@/messages/translations.json";

import { setI18nLocale } from "@/lib/i18n/translate";

/** 支持的语言 */
type Locale = "zh-CN" | "en-US";

/** 国际化上下文类型 */
interface I18nContextType {
  /** 当前语言 */
  locale: Locale;
  /** 切换语言 */
  setLocale: (locale: Locale) => void;
  /** 翻译函数（支持点号路径和整句直译） */
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/** 加载对应语言的 messages */
function loadMessages(locale: Locale): Record<string, unknown> {
  return locale === "en-US" ? enUS : zhCN;
}

/** 按点号路径取值 */
function getByPath(obj: Record<string, unknown>, path: string): string {
  // 直接匹配完整键（用于中文整句翻译）
  if (path in obj && typeof obj[path] === "string") {
    return obj[path] as string;
  }

  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

/** 国际化上下文 Provider */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((state) => state.locale) as Locale;
  const setLocale = useAppStore((state) => state.setLocale);

  // 同步全局 locale，使同步 t() 也能读到当前语言
  setI18nLocale(locale);

  const messages = useMemo(() => loadMessages(locale), [locale]);

  const t = (key: string) => {
    // 英文优先使用 translations.json 中的整句直译
    if (locale === "en-US") {
      const translated = (translations as Record<string, string>)[key];
      if (typeof translated === "string") {
        return translated;
      }
    }
    // 兜底：尝试结构化 messages（中文返回原字符串）
    return getByPath(messages, key);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/** 获取国际化上下文 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
