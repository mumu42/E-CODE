/**
 * @file components/MobileNav.tsx
 * @description 移动端底部导航栏
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, Pen, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "今日", icon: Home },
  { href: "/speak", label: "口语", icon: Mic },
  { href: "/write", label: "写作", icon: Pen },
  { href: "/chat", label: "对话", icon: MessageCircle },
  { href: "/settings", label: "设置", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 dark:border-gray-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs",
                active
                  ? "text-primary font-medium"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
