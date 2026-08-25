/**
 * @file app/api/push/subscribe/route.ts
 * @description 接收并记录浏览器 Web Push 订阅信息
 * @author English Agent Team
 * @date 2026-08-25
 */

import { NextResponse } from "next/server";

/** 简单内存存储，生产环境应写入数据库 */
const subscriptions: PushSubscription[] = [];

/** 上报订阅信息 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { subscription?: PushSubscription };
    if (!body.subscription) {
      return NextResponse.json({ error: "subscription is required" }, { status: 400 });
    }
    subscriptions.push(body.subscription);
    console.log("Received push subscription:", body.subscription.endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}

/** 调试用：返回已记录的订阅数量（生产环境建议移除） */
export async function GET() {
  return NextResponse.json({ count: subscriptions.length });
}
