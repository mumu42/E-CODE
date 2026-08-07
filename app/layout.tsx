/**
 * @file app/layout.tsx
 * @description 根布局，配置字体、主题、全局导航
 * @author English Agent Team
 * @date 2026-08-07
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils/cn";

/** 无衬线字体配置 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** 等宽字体配置 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 页面元数据 */
export const metadata: Metadata = {
  title: "English Agent - AI 英语学习助手",
  description: "本地优先、完全私人的 AI 英语学习 Web Agent",
};

/**
 * 根布局组件
 * @param children - 子页面内容
 * @returns 根布局 JSX
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn(geistSans.variable, geistMono.variable, "h-full antialiased")}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
