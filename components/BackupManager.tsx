/**
 * @file components/BackupManager.tsx
 * @description 本地备份管理：列出历史备份、恢复到指定版本
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStaticFiles } from "@/lib/storage/excel";
import type { AppData } from "@/lib/types";
import { RotateCcw, Database, RefreshCw } from "lucide-react";

/**
 * 备份管理组件
 * @example
 * ```tsx
 * <BackupManager />
 * ```
 */
export function BackupManager() {
  const importData = useAppStore((state) => state.importData);
  const [backups, setBackups] = useState<{name: string;updatedAt: string;}[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadBackups() {
    try {
      const files = await listStaticFiles();
      const backupFiles = files.
      filter((f) => f.name.startsWith("backup-") && f.name.endsWith(".json")).
      sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setBackups(backupFiles);
    } catch (error) {
      console.error("Failed to list backups:", error);
    }
  }

  /** 恢复到指定备份 */
  async function handleRestore(filename: string) {
    if (!confirm(`确定要恢复到 ${filename} 吗？当前数据将被覆盖。`)) return;
    setLoading(true);
    try {
      const response = await fetch("/api/files/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      if (!response.ok) throw new Error("Restore failed");
      const { data } = (await response.json()) as {data: AppData;};
      importData(data);
      alert("恢复成功");
    } catch (error) {
      console.error(error);
      alert("恢复失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" />{t("\u5386\u53F2\u5907\u4EFD")}

        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="sm" className="w-full" onClick={loadBackups}>
          <RefreshCw className="w-4 h-4 mr-2" />{t("\u5237\u65B0\u5217\u8868")}

        </Button>
        {backups.length === 0 ?
        <p className="text-sm text-muted-foreground">{t("\u6682\u65E0\u5386\u53F2\u5907\u4EFD\u3002")}</p> :

        <ul className="space-y-2 max-h-60 overflow-auto">
            {backups.map((backup) =>
          <li
            key={backup.name}
            className="flex items-center justify-between p-2 rounded-md border text-sm">
            
                <span className="truncate">{backup.name}</span>
                <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleRestore(backup.name)}
              disabled={loading}>
              
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </li>
          )}
          </ul>
        }
      </CardContent>
    </Card>);

}