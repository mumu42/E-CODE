/**
 * @file components/ThemeToggle.tsx
 * @description 主题切换按钮组（浅色 / 深色 / 跟随系统）
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import { t } from "@/lib/i18n/translate";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

/** 可选主题配置 */
const themes = [
  { value: "light", label: "浅色", Icon: Sun },
  { value: "dark", label: "深色", Icon: Moon },
  { value: "system", label: "跟随系统", Icon: Monitor },
] as const;

/**
 * 主题切换组件
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      {themes.map(({ value, label, Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "ghost"}
          size="icon"
          onClick={() => setTheme(value)}
          title={t(label)}
          className="h-7 w-7"
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}
