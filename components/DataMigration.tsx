/**
 * @file components/DataMigration.tsx
 * @description 数据迁移工具：导出旧格式 / 导入旧格式
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useRef } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { exportLegacyFormat } from "@/lib/storage/migration";
import { Database, Upload } from "lucide-react";

/** 数据迁移工具组件 */
export function DataMigration() {
  const appData = useAppStore((state) => state as unknown as import("@/lib/types").AppData);
  const importData = useAppStore((state) => state.importData);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExportLegacy() {
    const blob = new Blob([exportLegacyFormat(appData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `english-agent-legacy-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImportLegacy(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importData(data);
      alert("旧格式数据导入成功");
    } catch (error) {
      console.error(error);
      alert("导入失败，请检查文件格式");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept=".json"
        ref={fileRef}
        className="hidden"
        onChange={handleImportLegacy} />
      
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleExportLegacy}>
          <Database className="w-4 h-4 mr-2" />{t("\u5BFC\u51FA\u65E7\u683C\u5F0F")}

        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />{t("\u5BFC\u5165\u65E7\u683C\u5F0F")}

        </Button>
      </div>
    </div>);

}