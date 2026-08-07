/**
 * @file lib/storage/excel.ts
 * @description Excel 导入导出及 static 文件夹读写工具
 * @author English Agent Team
 * @date 2026-08-07
 */

import * as XLSX from "xlsx";
import type {
  AppData,
  AssessmentRecord,
  PracticeRecord,
  UserProfile,
  ChatSession,
  TopicRecord,
  ErrorItem,
} from "@/lib/types";

/**
 * 根据应用数据构建 Excel 工作簿
 * @param data - 应用全局数据
 * @returns 工作簿对象
 */
function buildWorkbook(data: AppData) {
  const workbook = XLSX.utils.book_new();

  const profileSheet = data.profile
    ? XLSX.utils.json_to_sheet([data.profile])
    : XLSX.utils.json_to_sheet([]);
  XLSX.utils.book_append_sheet(workbook, profileSheet, "profile");

  const assessmentsSheet = XLSX.utils.json_to_sheet(data.assessments);
  XLSX.utils.book_append_sheet(workbook, assessmentsSheet, "assessments");

  const sessionsSheet = XLSX.utils.json_to_sheet(data.sessions);
  XLSX.utils.book_append_sheet(workbook, sessionsSheet, "sessions");

  return workbook;
}

/**
 * 从工作簿中解析指定 sheet 的数据
 * @param workbook - xlsx 工作簿
 * @param sheetName - sheet 名称
 * @returns 解析后的数据列表
 */
function parseWorkbook<T>(workbook: XLSX.WorkBook, sheetName: string): T[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<T>(sheet);
}

/**
 * 将应用数据导出为 Excel 文件并触发浏览器下载
 * @param data - 应用全局数据
 * @example
 * ```ts
 * exportToExcel(appData);
 * ```
 */
export function exportToExcel(data: AppData): void {
  const workbook = buildWorkbook(data);
  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `english-agent-data-${today}.xlsx`);
}

/**
 * 从 Excel 文件导入应用数据
 * @param file - 用户选择的 Excel 文件
 * @returns 部分 AppData 对象
 * @example
 * ```ts
 * const data = await importFromExcel(file);
 * ```
 */
export async function importFromExcel(file: File): Promise<Partial<AppData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: "array" });

        const profile = parseWorkbook<UserProfile>(workbook, "profile")[0] ?? null;
        const assessments = parseWorkbook<AssessmentRecord>(workbook, "assessments");
        const sessions = parseWorkbook<PracticeRecord>(workbook, "sessions");
        const chatSessions = parseWorkbook<ChatSession>(workbook, "chatSessions");
        const topics = parseWorkbook<TopicRecord>(workbook, "topics");
        const errors = parseWorkbook<ErrorItem>(workbook, "errors");

        resolve({ profile, assessments, sessions, chatSessions, topics, errors });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 将应用数据保存到项目的 static 文件夹
 * @param data - 应用全局数据
 * @param filename - 保存的文件名
 * @example
 * ```ts
 * await saveToStatic(appData, "english-agent-data-2026-08-07.xlsx");
 * ```
 */
export async function saveToStatic(data: AppData, filename: string): Promise<void> {
  const response = await fetch("/api/files/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, data }),
  });

  if (!response.ok) {
    throw new Error("Failed to save file to static folder");
  }
}

/**
 * 获取 static 文件夹中的文件列表
 * @returns 文件元信息列表
 * @example
 * ```ts
 * const files = await listStaticFiles();
 * ```
 */
export async function listStaticFiles(): Promise<
  { name: string; size: number; updatedAt: string }[]
> {
  const response = await fetch("/api/files/list");
  if (!response.ok) {
    throw new Error("Failed to list files");
  }
  const { files } = (await response.json()) as {
    files: { name: string; size: number; updatedAt: string }[];
  };
  return files;
}

/**
 * 读取 static 文件夹中的指定 Excel 文件并导入
 * @param filename - 文件名
 * @returns 部分 AppData 对象
 * @example
 * ```ts
 * const data = await readStaticFile("english-agent-data-2026-08-07.xlsx");
 * ```
 */
export async function readStaticFile(filename: string): Promise<Partial<AppData>> {
  const response = await fetch(`/api/files/read?filename=${encodeURIComponent(filename)}`);
  if (!response.ok) {
    throw new Error("Failed to read file");
  }

  const blob = await response.blob();
  const file = new File([blob], filename);
  return importFromExcel(file);
}
