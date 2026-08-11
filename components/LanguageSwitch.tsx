/**
 * @file components/LanguageSwitch.tsx
 * @description 语言切换按钮
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

/**
 * 语言切换组件
 * @example
 * ```tsx
 * <LanguageSwitch />
 * ```
 */
export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
      className="flex items-center gap-1"
    >
      <Globe className="w-4 h-4" />
      {locale === "zh-CN" ? "EN" : "中"}
    </Button>
  );
}
