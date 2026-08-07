/**
 * @file app/api/files/list/route.ts
 * @description 获取 static 文件夹中的备份文件列表
 * @author English Agent Team
 * @date 2026-08-07
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** static 文件夹路径 */
const STATIC_DIR = path.join(process.cwd(), "static");

/**
 * 列出 static 文件夹中的 Excel/Word 备份文件
 * @returns 文件列表
 */
export async function GET() {
  try {
    if (!fs.existsSync(STATIC_DIR)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs
      .readdirSync(STATIC_DIR)
      .filter((name) => name.endsWith(".xlsx") || name.endsWith(".docx"))
      .map((name) => {
        const stat = fs.statSync(path.join(STATIC_DIR, name));
        return {
          name,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
