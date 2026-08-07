/**
 * @file components/ThemeProvider.tsx
 * @description 主题上下文 Provider，支持 light / dark / system 三种模式
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import { createContext, useContext, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { ThemeMode } from "@/lib/types";

/** 主题上下文类型 */
interface ThemeContextType {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 设置主题模式 */
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
});

/**
 * 主题 Provider
 * @param children - 子节点
 * @example
 * ```tsx
 * <ThemeProvider>{children}</ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme ?? "system");
  const setTheme = useAppStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

/**
 * 获取当前主题上下文
 * @returns 主题上下文
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * ```
 */
export function useTheme() {
  return useContext(ThemeContext);
}
