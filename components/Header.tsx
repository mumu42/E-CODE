"use client";

import Link from "next/link";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "今日任务" },
  { href: "/speak", label: "口语" },
  { href: "/write", label: "写作" },
  { href: "/chat", label: "对话" },
  { href: "/topics", label: "话题" },
  { href: "/review", label: "复习" },
  { href: "/progress", label: "进度" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg dark:text-white">
          <BookOpen className="w-5 h-5" />
          English Agent
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white dark:bg-gray-900 dark:border-gray-800 px-4 py-3 space-y-2 transition-colors">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm py-2 dark:text-gray-200"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
