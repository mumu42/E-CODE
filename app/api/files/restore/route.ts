/**
 * @file app/api/files/restore/route.ts
 * @description 从 static 文件夹恢复指定备份文件
 * @author English Agent Team
 * @date 2026-08-11
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** static 文件夹路径 */
const STATIC_DIR = path.join(process.cwd(), "static");

/**
 * 处理恢复请求
 * @param request - HTTP 请求对象
 * @returns 备份 JSON 内容
 */
export async function POST(request: Request) {
  try {
    const { filename } = (await request.json()) as { filename: string };

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const filePath = path.join(STATIC_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content) as Record<string, unknown>;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
