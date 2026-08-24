/**
 * @file lib/notifications.ts
 * @description 跨平台通知工具：Capacitor 本地通知 / Web Notification / ServiceWorker
 * @author English Agent Team
 * @date 2026-08-24
 */

import { LocalNotifications } from "@capacitor/local-notifications";

/** 判断是否在 Capacitor 原生环境中运行 */
function isNative() {
  if (typeof window === "undefined") return false;
  // @ts-expect-error Capacitor adds this global on native platforms
  return typeof window?.Capacitor !== "undefined";
}

/** 请求通知权限 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (isNative()) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  }
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.requestPermission();
}

/** 检查通知权限 */
export async function checkNotificationPermission(): Promise<NotificationPermission | "unsupported" | "prompt"> {
  if (isNative()) {
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted" ? "granted" : "prompt";
  }
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/** 显示一条即时通知 */
export async function showNotification(title: string, body: string) {
  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: new Date().getTime(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: "default",
        },
      ],
    });
    return;
  }
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, { body });
  } else {
    new Notification(title, { body });
  }
}

/** 取消所有已安排的学习提醒 */
export async function cancelLearningReminders() {
  if (isNative()) {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    return;
  }
}

/** 安排每日学习提醒（仅在 Capacitor 原生环境使用） */
export async function scheduleDailyReminder(hour: number, minute: number) {
  if (!isNative()) return;
  await cancelLearningReminders();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: "英语学习提醒",
        body: "该开始学习啦！坚持每日练习，英语水平稳步提升。",
        schedule: { on: { hour, minute } },
        sound: "default",
      },
    ],
  });
}
