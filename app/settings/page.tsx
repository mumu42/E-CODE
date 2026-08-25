/**
 * @file app/settings/page.tsx
 * @description 设置中心：Prompt、提醒、快捷键、本地保存、导入导出、迁移
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { DirectoryAutoSave } from "@/components/DirectoryAutoSave";
import { FileImporter } from "@/components/FileImporter";
import { FileExporter } from "@/components/FileExporter";
import { PromptEditor } from "@/components/PromptEditor";
import { LearningReminder } from "@/components/LearningReminder";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { DataMigration } from "@/components/DataMigration";
import { OfflinePackage } from "@/components/OfflinePackage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Upload, Download, MessageSquare, Bell, Keyboard, Database, Wifi, Cloud } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t("\u8BBE\u7F6E")}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />{t("\u81EA\u5B9A\u4E49 Prompt")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <PromptEditor />
          <p className="text-xs text-gray-500 mt-4">{t("\u53EF\u7528\u53D8\u91CF\u4EE5 `")}
            {t("{{\u53D8\u91CF}}")}{t("` \u5F62\u5F0F\u63D2\u5165\u3002\u7F16\u8F91\u540E\u4FDD\u5B58\u5373\u751F\u6548\u3002")}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-500" />{t("\u5B66\u4E60\u63D0\u9192")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <LearningReminder />
          <p className="text-xs text-gray-500 mt-4">{t("\u5F00\u542F\u540E\u4F1A\u5728\u8BBE\u5B9A\u65F6\u95F4\u63A8\u9001\u6D4F\u89C8\u5668\u901A\u77E5\u3002\u82E5\u4ECA\u5929\u5DF2\u6253\u5361\uFF0C\u5219\u4E0D\u518D\u63D0\u9192\u3002")}

          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-500" />{t("\u4E91\u7AEF\u63A8\u9001")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <PushNotificationManager />
          <p className="text-xs text-gray-500 mt-4">{t("\u5F00\u542F\u540E\u53EF\u4EE5\u63A5\u6536\u6765\u81EA FCM / APNs / Web Push \u7684\u5B66\u4E60\u63D0\u9192\u548C\u7CFB\u7EDF\u6D88\u606F\u3002")}

          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-orange-500" />{t("\u952E\u76D8\u5FEB\u6377\u952E")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-2">{t("Alt + 1~9 \u5FEB\u901F\u8DF3\u8F6C\u9875\u9762")}</p>
          <p className="text-xs text-gray-500">{t("1 \u4ECA\u65E5\u4EFB\u52A1 \xB7 2 \u53E3\u8BED \xB7 3 \u5199\u4F5C \xB7 4 \u5BF9\u8BDD \xB7 5 \u590D\u4E60 \xB7 6 \u8BA1\u5212 \xB7 7 \u6A21\u8003 \xB7 8 \u8FDB\u5EA6 \xB7 9 \u8BBE\u7F6E \xB7 R \u9605\u8BFB \xB7 L \u542C\u529B \xB7 V \u8BCD\u6C47 \xB7 A \u987E\u95EE")}

          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-500" />{t("\u672C\u5730\u6587\u4EF6\u5939\u81EA\u52A8\u4FDD\u5B58")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <DirectoryAutoSave />
          <p className="text-xs text-gray-500 mt-4">{t("\u4EC5 Chrome / Edge \u7B49\u652F\u6301 File System Access API \u7684\u6D4F\u89C8\u5668\u53EF\u7528\u3002\u6388\u6743\u540E\uFF0C\u6570\u636E\u53D8\u5316\u4F1A\u81EA\u52A8\u5199\u5165\u6388\u6743\u6587\u4EF6\u5939\u3002")}

          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-500" />{t("\u6279\u91CF\u5BFC\u5165\u5386\u53F2\u6587\u4EF6")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileImporter batch />
          <p className="text-xs text-gray-500 mt-4">{t("\u652F\u6301\u540C\u65F6\u9009\u62E9\u591A\u4E2A JSON / Excel \u6587\u4EF6\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u53BB\u91CD\u5E76\u5408\u5E76\u6570\u636E\u3002")}

          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-600" />{t("\u6570\u636E\u8FC1\u79FB")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataMigration />
          <p className="text-xs text-gray-500 mt-4">{t("\u5BFC\u51FA\u65E7\u683C\u5F0F JSON \u6216\u5BFC\u5165\u65E7\u683C\u5F0F\u6570\u636E\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u8FC1\u79FB\u5230\u65B0\u7ED3\u6784\u3002")}

          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-500" />{t("\u79BB\u7EBF\u7EC3\u4E60\u5305")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <OfflinePackage />
          <p className="text-xs text-gray-500 mt-4">{t("\u7F13\u5B58\u540E\uFF0C\u5373\u4F7F\u65E0\u7F51\u7EDC\u4E5F\u80FD\u8BBF\u95EE\u6838\u5FC3\u5B66\u4E60\u9875\u9762\u3002PWA \u5B89\u88C5\u540E\u4F53\u9A8C\u66F4\u4F73\u3002")}

          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-500" />{t("\u6570\u636E\u5BFC\u51FA")}

          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileExporter />
        </CardContent>
      </Card>
    </div>);

}