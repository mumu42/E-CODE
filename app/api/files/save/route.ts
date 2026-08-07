/**
 * @file app/api/files/save/route.ts
 * @description 将应用数据以 Excel 格式保存到 static 文件夹
 * @author English Agent Team
 * @date 2026-08-07
 */

import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { AppData } from "@/lib/types";

/** static 文件夹路径 */
const STATIC_DIR = path.join(process.cwd(), "static");

/**
 * 保存 Excel 备份文件
 * @param request - HTTP 请求对象
 * @returns 保存结果
 */
export async function POST(request: Request) {
  try {
    const { filename, data } = (await request.json()) as {
      filename: string;
      data: AppData;
    };

    // 防止路径遍历：仅使用文件名部分
    const safeFilename = path.basename(filename);

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

    const chatSessionsSheet = XLSX.utils.json_to_sheet(data.chatSessions || []);
    XLSX.utils.book_append_sheet(workbook, chatSessionsSheet, "chatSessions");

    const topicsSheet = XLSX.utils.json_to_sheet(data.topics || []);
    XLSX.utils.book_append_sheet(workbook, topicsSheet, "topics");

    const errorsSheet = XLSX.utils.json_to_sheet(data.errors || []);
    XLSX.utils.book_append_sheet(workbook, errorsSheet, "errors");

    const filePath = path.join(STATIC_DIR, safeFilename);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, buffer as Buffer);

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Save file error:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
