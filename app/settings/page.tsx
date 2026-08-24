/**
 * @file app/settings/page.tsx
 * @description 设置中心：Prompt、提醒、快捷键、本地保存、导入导出、迁移
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { DirectoryAutoSave } from "@/components/DirectoryAutoSave";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";
import { PromptEditor } from "@/components/PromptEditor";
import { LearningReminder } from "@/components/LearningReminder";
import { DataMigration } from "@/components/DataMigration";
import { OfflinePackage } from "@/components/OfflinePackage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Upload, Download, MessageSquare, Bell, Keyboard, Database, Wifi } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            自定义 Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PromptEditor />
          <p className="text-xs text-gray-500 mt-4">
            可用变量以 `{'{{变量}}'}` 形式插入。编辑后保存即生效。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-500" />
            学习提醒
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LearningReminder />
          <p className="text-xs text-gray-500 mt-4">
            开启后会在设定时间推送浏览器通知。若今天已打卡，则不再提醒。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-orange-500" />
            键盘快捷键
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-2">Alt + 1~9 快速跳转页面</p>
          <p className="text-xs text-gray-500">
            1 今日任务 · 2 口语 · 3 写作 · 4 对话 · 5 复习 · 6 计划 · 7 模考 · 8 进度 · 9 设置 · R 阅读 · L 听力 · V 词汇 · A 顾问
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-500" />
            本地文件夹自动保存
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DirectoryAutoSave />
          <p className="text-xs text-gray-500 mt-4">
            仅 Chrome / Edge 等支持 File System Access API 的浏览器可用。授权后，数据变化会自动写入授权文件夹。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-500" />
            批量导入历史文件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileImporter batch />
          <p className="text-xs text-gray-500 mt-4">
            支持同时选择多个 JSON / Excel 文件，系统会自动去重并合并数据。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-600" />
            数据迁移
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataMigration />
          <p className="text-xs text-gray-500 mt-4">
            导出旧格式 JSON 或导入旧格式数据，系统会自动迁移到新结构。
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-500" />
            离线练习包
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OfflinePackage />
          <p className="text-xs text-gray-500 mt-4">
            缓存后，即使无网络也能访问核心学习页面。PWA 安装后体验更佳。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-500" />
            数据导出
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileExporter />
        </CardContent>
      </Card>
    </div>
  );
}
