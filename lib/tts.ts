/**
 * @file lib/tts.ts
 * @description 浏览器语音合成（TTS）与跟读相似度计算工具
 * @author English Agent Team
 * @date 2026-08-07
 */

/**
 * 朗读指定英文文本
 * @param text - 要朗读的文本
 * @param rate - 语速倍率，默认 1
 * @returns Promise，朗读结束时 resolve
 * @example
 * ```ts
 * await speak("Hello world", 1);
 * ```
 */
export function speak(text: string, rate: number = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("TTS not supported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error));

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 停止当前正在播放的语音
 */
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 判断当前浏览器是否支持 TTS
 * @returns 支持返回 true，否则返回 false
 */
export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * 计算两个文本的 Jaccard 相似度（用于跟读评分）
 * @param a - 原始文本
 * @param b - 用户输入文本
 * @returns 0 - 100 的相似度分数
 * @example
 * ```ts
 * calculateSimilarity("hello world", "hello");
 * // => 50
 * ```
 */
export function calculateSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const s2 = b.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return Math.round((intersection.size / union.size) * 100);
}
