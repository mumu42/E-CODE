"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { exportToExcel, saveToStatic } from "@/lib/storage/excel";
import { Download, Save } from "lucide-react";

export function FileExporter() {
  const appData = useAppStore((state) => ({
    profile: state.profile,
    assessments: state.assessments,
    sessions: state.sessions,
  }));

  const [saving, setSaving] = useState(false);

  async function handleSaveToStatic() {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await saveToStatic(appData, `english-agent-data-${today}.xlsx`);
      alert("已保存到项目 static 文件夹");
    } catch (error) {
      console.error(error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    exportToExcel(appData);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleSaveToStatic} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? "保存中..." : "保存到 static"}
      </Button>
      <Button variant="outline" onClick={handleDownload}>
        <Download className="w-4 h-4 mr-2" />
        下载
      </Button>
    </div>
  );
}
