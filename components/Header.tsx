"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="w-5 h-5" />
          English Agent
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-gray-600">
            今日任务
          </Link>
          <Link href="/speak" className="hover:text-gray-600">
            口语练习
          </Link>
          <Link href="/progress" className="hover:text-gray-600">
            学习进度
          </Link>
        </nav>
      </div>
    </header>
  );
}
