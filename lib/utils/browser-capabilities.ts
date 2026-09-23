/**
 * @file lib/utils/browser-capabilities.ts
 * @description 浏览器语音与听力能力检测，支持检测结果缓存到 localStorage
 * @author English Agent Team
 * @date 2026-09-23
 */

/** 浏览器能力检测结果 */
export interface BrowserCapabilities {
  /** 是否支持语音识别（SpeechRecognition / webkitSpeechRecognition） */
  speechRecognition: boolean;
  /** 是否支持语音合成（TTS） */
  tts: boolean;
  /** 是否支持麦克风输入（mediaDevices.getUserMedia） */
  microphone: boolean;
  /** 检测时间戳（毫秒） */
  detectedAt: number;
}

/** localStorage 缓存 key */
const CACHE_KEY = "ea-browser-capabilities";

/**
 * 执行浏览器语音与听力能力检测
 * @returns 检测结果
 * @example
 * ```ts
 * const cap = detectBrowserCapabilities();
 * console.log(cap.speechRecognition); // true / false
 * ```
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  const speechRecognition =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const tts =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const microphone =
    typeof navigator !== "undefined" &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return {
    speechRecognition,
    tts,
    microphone,
    detectedAt: Date.now(),
  };
}

/**
 * 从 localStorage 读取缓存的检测结果
 * @returns 缓存的检测结果，无缓存时返回 null
 */
export function getCachedCapabilities(): BrowserCapabilities | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrowserCapabilities;
    // 校验必要字段
    if (
      typeof parsed.speechRecognition === "boolean" &&
      typeof parsed.tts === "boolean" &&
      typeof parsed.microphone === "boolean" &&
      typeof parsed.detectedAt === "number"
    ) {
      return parsed;
    }
    // 格式无效时清除损坏的缓存
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    // localStorage 不可用时静默忽略
    return null;
  }
}

/**
 * 将检测结果写入 localStorage 缓存（同步写入）
 * @param cap - 检测结果
 */
export function setCachedCapabilities(cap: BrowserCapabilities): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cap));
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/**
 * 清除缓存的检测结果
 */
export function clearCachedCapabilities(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/**
 * 获取检测结果：有缓存则返回缓存，否则执行检测并缓存
 * @returns 检测结果
 */
export function getOrDetectCapabilities(): BrowserCapabilities {
  const cached = getCachedCapabilities();
  if (cached) return cached;

  const cap = detectBrowserCapabilities();
  setCachedCapabilities(cap);
  return cap;
}
