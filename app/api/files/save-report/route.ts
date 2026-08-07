/**
 * @file app/api/files/save-report/route.ts
 * @description 保存生成的 Word 报告到 static 文件夹
 * @author English Agent Team
 * @date 2026-08-07
 */

import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

/** static 文件夹路径 */
const STATIC_DIR = path.join(process.cwd(), "static");

/**
 * 保存报告文件
 * @param request - HTTP 请求对象
 * @returns 保存结果
 */
export async function POST(request: Request) {
  try {
    const { filename, buffer } = (await request.json()) as {
      filename: string;
      buffer: number[];
    };

    // 防止路径遍历
    const safeFilename = path.basename(filename);

    if (!fs.existsSync(STATIC_DIR)) {
      fs.mkdirSync(STATIC_DIR, { recursive: true });
    }

    const filePath = path.join(STATIC_DIR, safeFilename);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Save report error:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
