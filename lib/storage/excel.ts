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

function parseWorkbook<T>(workbook: XLSX.WorkBook, sheetName: string): T[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<T>(sheet);
}

export function exportToExcel(data: AppData): void {
  const workbook = buildWorkbook(data);
  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `english-agent-data-${today}.xlsx`);
}

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

export async function readStaticFile(filename: string): Promise<Partial<AppData>> {
  const response = await fetch(`/api/files/read?filename=${encodeURIComponent(filename)}`);
  if (!response.ok) {
    throw new Error("Failed to read file");
  }

  const blob = await response.blob();
  const file = new File([blob], filename);
  return importFromExcel(file);
}
