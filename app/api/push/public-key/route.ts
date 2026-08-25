/**
 * @file app/api/push/public-key/route.ts
 * @description 返回 Web Push VAPID 公钥
 * @author English Agent Team
 * @date 2026-08-25
 */

import { NextResponse } from "next/server";

/** 获取 VAPID 公钥 */
export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ key });
}
