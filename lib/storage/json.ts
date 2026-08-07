/**
 * @file lib/storage/json.ts
 * @description JSON 备份与导入导出工具
 * @author English Agent Team
 * @date 2026-08-07
 */

import type { AppData } from "@/lib/types";

/**
 * 将应用数据导出为 JSON 文件并触发浏览器下载
 * @param data - 应用全局数据
 * @example
 * ```ts
 * exportToJson(appData);
 * ```
 */
export function exportToJson(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `english-agent-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件导入应用数据
 * @param file - 用户选择的 JSON 文件
 * @returns 部分 AppData 对象
 * @example
 * ```ts
 * const data = await importFromJson(file);
 * ```
 */
export async function importFromJson(file: File): Promise<Partial<AppData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as Partial<AppData>;
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
