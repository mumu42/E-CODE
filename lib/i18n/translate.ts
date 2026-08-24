/**
 * @file lib/i18n/translate.ts
 * @description 同步翻译函数（客户端/服务端安全，用于 JSX 和普通 TS 代码）
 * @author English Agent Team
 * @date 2026-08-24
 */

import translations from "@/messages/translations.json";

type Locale = "zh-CN" | "en-US";

let currentLocale: Locale = "zh-CN";

/** 设置当前语言（由 I18nProvider 调用） */
export function setI18nLocale(locale: Locale) {
  currentLocale = locale;
}

/** 获取当前语言 */
export function getLocale(): Locale {
  return currentLocale;
}

/** 同步翻译函数
 * 在中文环境下返回原字符串；英文环境下返回 translations.json 中的翻译，
 * 缺失时返回原字符串作为兜底。
 */
export function t(key: string): string {
  if (currentLocale === "zh-CN") return key;
  const translated = (translations as Record<string, string>)[key];
  if (typeof translated === "string" && translated) {
    return translated;
  }
  return key;
}
