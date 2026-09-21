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
/**
 * 等待浏览器语音列表加载完成
 * Chrome 首次调用时 getVoices() 常返回空数组，需监听一次 voiceschanged 再开始
 * @returns 加载完成后的语音列表；不支持时返回空数组
 */
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // HACK: Chrome 的 getVoices() 异步加载，监听 voiceschanged 后再取一次
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    // 兜底：1s 后无论是否触发都 resolve，避免永久挂起
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

export async function speak(text: string, rate: number = 1): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("TTS not supported");
  }

  // 首次播放前确保语音列表就绪，否则可能静默失败或报错
  await waitForVoices();

  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;

    // 清掉上一次可能卡住的播放，规避 Chrome speechSynthesis 卡死 bug
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;

    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(resumeTimer);
      fn();
    };

    utterance.onend = () => settle(resolve);
    // 把真实 event.error 透传给调用方，便于定位（而非笼统提示「不支持 TTS」）
    utterance.onerror = (event) =>
      settle(() => reject(new Error(event.error || "speech-synthesis-error")));

    synth.speak(utterance);

    // HACK: Chrome speechSynthesis 在某些情况下会卡住不触发 onend/onerror
    // 调用后短暂延时若仍未结束，resume() 一次唤醒引擎
    const resumeTimer = setTimeout(() => {
      if (!settled && synth.speaking) {
        synth.resume();
      }
    }, 250);
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
