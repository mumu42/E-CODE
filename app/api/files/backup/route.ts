/**
 * @file app/api/files/backup/route.ts
 * @description 将完整应用数据备份到 static 文件夹，保留最近 10 份
 * @author English Agent Team
 * @date 2026-08-11
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** static 文件夹路径 */
const STATIC_DIR = path.join(process.cwd(), "static");

/** 最大保留备份数量 */
const MAX_BACKUPS = 10;

/**
 * 处理备份请求
 * @param request - HTTP 请求对象
 * @returns 备份结果
 */
export async function POST(request: Request) {
  try {
    const { state } = (await request.json()) as { state: Record<string, unknown> };

    if (!state) {
      return NextResponse.json({ error: "State is required" }, { status: 400 });
    }

    if (!fs.existsSync(STATIC_DIR)) {
      fs.mkdirSync(STATIC_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const filename = `backup-${timestamp}.json`;
    const filePath = path.join(STATIC_DIR, filename);

    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));

    // 清理旧备份，只保留最近的 MAX_BACKUPS 份
    const backups = fs
      .readdirSync(STATIC_DIR)
      .filter((name) => name.startsWith("backup-") && name.endsWith(".json"))
      .map((name) => ({ name, mtime: fs.statSync(path.join(STATIC_DIR, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (backups.length > MAX_BACKUPS) {
      backups.slice(MAX_BACKUPS).forEach(({ name }) => {
        fs.unlinkSync(path.join(STATIC_DIR, name));
      });
    }

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}
