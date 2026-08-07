/**
 * @file app/api/files/read/route.ts
 * @description 读取 static 文件夹中指定的备份文件
 * @author English Agent Team
 * @date 2026-08-07
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";

/** static 文件夹路径 */
const STATIC_DIR = path.join(process.cwd(), "static");

/**
 * 读取指定文件并返回二进制流
 * @param request - HTTP 请求对象
 * @returns 文件内容
 */
export async function GET(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // 仅允许访问 STATIC_DIR 下的文件，防止路径遍历
    const filePath = path.join(STATIC_DIR, path.basename(filename));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fs.readFileSync(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${path.basename(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Read file error:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
