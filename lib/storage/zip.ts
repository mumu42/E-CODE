/**
 * @file lib/storage/zip.ts
 * @description 将学习数据打包为 ZIP 归档（JSON + Excel）
 * @author English Agent Team
 * @date 2026-08-21
 */

import JSZip from "jszip";
import * as XLSX from "xlsx";
import type { AppData } from "@/lib/types";
import { buildWorkbook } from "@/lib/storage/excel";

/**
 * 导出应用数据为 ZIP 压缩包并触发浏览器下载
 * @param data - 应用全局数据
 */
export async function exportToZip(data: AppData): Promise<void> {
  const zip = new JSZip();

  // JSON 备份
  zip.file("backup.json", JSON.stringify(data, null, 2));

  // Excel 备份
  const workbook = buildWorkbook(data);
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  zip.file("backup.xlsx", excelBuffer);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `english-agent-backup-${new Date().toISOString().split("T")[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
