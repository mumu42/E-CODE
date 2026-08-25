/**
 * @file lib/capacitor.ts
 * @description Capacitor / 移动端环境判断工具
 * @author English Agent Team
 * @date 2026-08-25
 */

/**
 * 判断是否在 Capacitor 原生 WebView 中运行
 */
export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error Capacitor global on native platforms
  return typeof window.Capacitor !== "undefined" && window.Capacitor.isNativePlatform?.() === true;
}

/**
 * 判断是否为移动设备（含 Capacitor 与移动浏览器）
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (isCapacitor()) return true;
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
