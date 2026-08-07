import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const STATIC_DIR = path.join(process.cwd(), "static");

export async function POST(request: Request) {
  try {
    const { filename, buffer } = (await request.json()) as {
      filename: string;
      buffer: number[];
    };

    if (!fs.existsSync(STATIC_DIR)) {
      fs.mkdirSync(STATIC_DIR, { recursive: true });
    }

    const filePath = path.join(STATIC_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Save report error:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
