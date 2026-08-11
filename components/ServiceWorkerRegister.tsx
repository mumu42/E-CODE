/**
 * @file components/ServiceWorkerRegister.tsx
 * @description 注册 Service Worker（仅在生产环境）
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useEffect } from "react";

/**
 * 注册 Service Worker
 * @example
 * ```tsx
 * <ServiceWorkerRegister />
 * ```
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    }
  }, []);
  return null;
}
