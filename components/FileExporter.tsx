/**
 * @file components/FileExporter.tsx
 * @description 数据导出组件，支持 Excel、Word 报告、JSON 备份及保存到 static 文件夹
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { exportToExcel, saveToStatic } from "@/lib/storage/excel";
import { exportReportToWord } from "@/lib/storage/report";
import { exportReportToPdf } from "@/lib/storage/pdf";
import { exportToJson } from "@/lib/storage/json";
import { ReportPreview } from "@/components/ReportPreview";
import { exportToZip } from "@/lib/storage/zip";
import { Download, Save, FileText, Database, FileDown, Package } from "lucide-react";

/**
 * 文件导出组件
 * @example
 * ```tsx
 * <FileExporter />
 * ```
 */
export function FileExporter() {
  const appData = useAppStore((state) => state);
  const reportRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);

  /** 保存到项目 static 文件夹 */
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

  /** 下载 Excel 备份 */
  function handleDownload() {
    exportToExcel(appData);
  }

  /** 下载 Word 报告 */
  async function handleDownloadReport() {
    try {
      const blob = await exportReportToWord(appData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `english-agent-report-${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("导出报告失败");
    }
  }

  /** 下载 PDF 报告 */
  async function handleDownloadPdf() {
    if (!reportRef.current) return;
    try {
      await exportReportToPdf(
        reportRef.current,
        `english-agent-report-${new Date().toISOString().split("T")[0]}`
      );
    } catch (error) {
      console.error(error);
      alert("导出 PDF 失败");
    }
  }

  /** 下载 JSON 备份 */
  function handleDownloadJson() {
    exportToJson(appData);
  }

  /** 下载 ZIP 归档 */
  async function handleDownloadZip() {
    try {
      await exportToZip(appData);
    } catch (error) {
      console.error(error);
      alert("导出 ZIP 失败");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleSaveToStatic} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? "保存中..." : "保存到 static"}
      </Button>
      <Button variant="outline" onClick={handleDownload}>
        <Download className="w-4 h-4 mr-2" />{t("\u4E0B\u8F7D Excel")}

      </Button>
      <Button variant="outline" onClick={handleDownloadReport}>
        <FileText className="w-4 h-4 mr-2" />{t("Word \u62A5\u544A")}

      </Button>
      <Button variant="outline" onClick={handleDownloadPdf}>
        <FileDown className="w-4 h-4 mr-2" />{t("PDF \u62A5\u544A")}

      </Button>
      <Button variant="outline" onClick={handleDownloadJson}>
        <Database className="w-4 h-4 mr-2" />{t("JSON \u5907\u4EFD")}

      </Button>
      <Button variant="outline" onClick={handleDownloadZip}>
        <Package className="w-4 h-4 mr-2" />{t("ZIP \u5F52\u6863")}

      </Button>
      <div className="fixed left-[-9999px] top-0">
        <ReportPreview ref={reportRef} data={appData} />
      </div>
    </div>);

}