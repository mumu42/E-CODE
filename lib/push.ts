/**
 * @file lib/push.ts
 * @description 跨平台推送通知封装：Capacitor(FCM/APNs) + Web Push
 * @author English Agent Team
 * @date 2026-08-25
 */

/** 注册结果 */
export interface PushRegistration {
  /** FCM/APNs 设备令牌（原生环境） */
  token?: string;
  /** Web Push 订阅信息（浏览器环境） */
  subscription?: PushSubscription | null;
}

/** 判断是否在 Capacitor 原生环境 */
function isNative() {
  if (typeof window === "undefined") return false;
  // @ts-expect-error Capacitor global on native platforms
  return typeof window.Capacitor !== "undefined";
}

/** 判断是否支持推送（原生 or 支持 Service Worker + PushManager 的浏览器） */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (isNative()) return true;
  return "serviceWorker" in navigator && "PushManager" in window;
}

/** 请求推送权限 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";

  if (isNative()) {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { receive } = await PushNotifications.requestPermissions();
    return receive === "granted" ? "granted" : "denied";
  }

  return Notification.requestPermission();
}

/** 查询当前推送权限 */
export function checkPushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** 注册设备/浏览器以接收推送通知 */
export async function registerForPushNotifications(): Promise<PushRegistration> {
  if (isNative()) {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    return new Promise((resolve) => {
      let settled = false;

      const finish = (result: PushRegistration) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      PushNotifications.addListener("registration", ({ value }) => {
        finish({ token: value });
      }).catch((error: unknown) => {
        console.error("Failed to add push registration listener:", error);
        finish({});
      });

      PushNotifications.addListener("registrationError", (error) => {
        console.error("Push registration error:", error);
        finish({});
      }).catch((error: unknown) => {
        console.error("Failed to add push error listener:", error);
        finish({});
      });

      PushNotifications.register().catch((error: unknown) => {
        console.error("PushNotifications.register failed:", error);
        finish({});
      });
    });
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return {};
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await reportSubscription(existing);
    return { subscription: existing };
  }

  const publicKey = await fetchPublicKey();
  if (!publicKey) {
    throw new Error("Web Push VAPID public key not configured");
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  await reportSubscription(subscription);
  return { subscription };
}

/** 取消 Web Push 订阅 */
export async function unregisterPushNotifications(): Promise<void> {
  if (isNative()) {
    // Capacitor PushNotifications plugin does not expose unregister()
    return;
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

/** 获取服务端 VAPID 公钥 */
async function fetchPublicKey(): Promise<string | null> {
  try {
    const response = await fetch("/api/push/public-key");
    if (!response.ok) return null;
    const { key } = (await response.json()) as { key?: string };
    return key ?? null;
  } catch (error) {
    console.error("Failed to fetch VAPID public key:", error);
    return null;
  }
}

/** 将 Web Push 订阅信息上报给服务端 */
async function reportSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });
  } catch (error) {
    console.error("Failed to report push subscription:", error);
  }
}

/** Base64URL -> Uint8Array（用于 applicationServerKey） */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
