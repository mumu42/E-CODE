import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import type { AppData } from "@/lib/types";

const STATIC_DIR = path.join(process.cwd(), "static");

export async function POST(request: Request) {
  try {
    const { filename, data } = (await request.json()) as {
      filename: string;
      data: AppData;
    };

    if (!fs.existsSync(STATIC_DIR)) {
      fs.mkdirSync(STATIC_DIR, { recursive: true });
    }

    const workbook = XLSX.utils.book_new();

    const profileSheet = data.profile
      ? XLSX.utils.json_to_sheet([data.profile])
      : XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, profileSheet, "profile");

    const assessmentsSheet = XLSX.utils.json_to_sheet(data.assessments);
    XLSX.utils.book_append_sheet(workbook, assessmentsSheet, "assessments");

    const sessionsSheet = XLSX.utils.json_to_sheet(data.sessions);
    XLSX.utils.book_append_sheet(workbook, sessionsSheet, "sessions");

    const filePath = path.join(STATIC_DIR, filename);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, buffer as Buffer);

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Save file error:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
