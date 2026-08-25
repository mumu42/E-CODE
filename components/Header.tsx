/**
 * @file components/Header.tsx
 * @description 全局顶部导航栏组件（含主题切换、移动端菜单）
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";
import { t } from "@/lib/i18n/translate";

import Link from "next/link";
import { BookOpen, Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ProfileManager } from "@/components/ProfileManager";
import { BackupManager } from "@/components/BackupManager";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { isCapacitor } from "@/lib/capacitor";

/** 导航项配置 */
const navItems = [
{ href: "/dashboard", label: "今日任务" },
{ href: "/speak", label: "口语" },
{ href: "/write", label: "写作" },
{ href: "/chat", label: "对话" },
{ href: "/advisor", label: "顾问" },
{ href: "/reading", label: "阅读" },
{ href: "/listening", label: "听力" },
{ href: "/vocabulary", label: "词汇" },
{ href: "/topics", label: "话题" },
{ href: "/review", label: "复习" },
{ href: "/exam", label: "模考" },
{ href: "/progress", label: "进度" }];


/**
 * 顶部导航栏
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [capacitor] = useState(() => isCapacitor());

  if (capacitor) {
    return null;
  }

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg dark:text-white">
          <BookOpen className="w-5 h-5" />
          English Agent
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          {navItems.map((item) =>
          <Link
            key={item.href}
            href={item.href}
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            
              {t(item.label)}
            </Link>
          )}
          <ThemeToggle />
          <LanguageSwitch />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(!settingsOpen)}>
            
            <Settings className="w-5 h-5" />
          </Button>
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <LanguageSwitch />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(!settingsOpen)}>
            
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}>
            
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {settingsOpen &&
      <div className="absolute right-0 top-14 z-40 p-4 bg-white dark:bg-gray-900 border-b shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <ProfileManager />
            <BackupManager />
          </div>
          <div className="mt-4 border-t pt-4">
            <Link
            href="/settings"
            onClick={() => setSettingsOpen(false)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400">{t("\u6253\u5F00\u8BBE\u7F6E\u4E2D\u5FC3 \u2192")}


          </Link>
          </div>
        </div>
      }

      {mobileOpen &&
      <div className="md:hidden border-t bg-white dark:bg-gray-900 dark:border-gray-800 px-4 py-3 space-y-2 transition-colors">
          {navItems.map((item) =>
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className="block text-sm py-2 dark:text-gray-200">
          
              {t(item.label)}
            </Link>
        )}
        </div>
      }
    </header>);

}