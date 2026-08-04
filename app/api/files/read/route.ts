import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATIC_DIR = path.join(process.cwd(), "static");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

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
