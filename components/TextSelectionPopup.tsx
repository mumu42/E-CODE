/**
 * @file components/TextSelectionPopup.tsx
 * @description 全局右键查词弹窗组件
 * @author English Agent Team
 * @date 2026-09-24
 *
 * 监听 contextmenu 事件，当用户选中文本后右键点击时，
 * 弹窗显示单词的释义、词性、例句，并提供语音朗读和添加到词汇本功能。
 */

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { speak, isTTSSupported } from "@/lib/tts";
import { useAppStore } from "@/lib/store";
import type { WordLookupResult } from "@/lib/types";
import { Volume2, BookPlus, Check, X, Loader2 } from "lucide-react";

/** 简单的线程安全风格缓存 */
const lookupCache = new Map<string, { data: WordLookupResult; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

export default function TextSelectionPopup() {
  const profile = useAppStore((state) => state.profile);
  const addVocabulary = useAppStore((state) => state.addVocabulary);
  const vocabulary = useAppStore((state) => state.vocabulary);

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WordLookupResult | null>(null);
  const [added, setAdded] = useState(false);
  const [playing, setPlaying] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const lastRequestRef = useRef(0); // 防抖

  /** 关闭弹窗 */
  const close = useCallback(() => {
    setVisible(false);
    setResult(null);
    setError("");
    setAdded(false);
    setPlaying(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  /** 查询单词释义 */
  const lookupWord = useCallback(async (word: string) => {
    const now = Date.now();
    lastRequestRef.current = now;

    // 检查缓存
    const cached = lookupCache.get(word);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      setResult(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/word-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      if (!res.ok) {
        throw new Error("查询失败");
      }

      const { result: raw } = (await res.json()) as { result: string };

      // 如果关闭了或后续新请求，不再处理
      if (lastRequestRef.current !== now) return;

      // 安全解析 JSON
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned) as WordLookupResult;

      // 验证必需字段
      if (!parsed.word || !parsed.meaning) {
        throw new Error("返回数据不完整");
      }

      lookupCache.set(word, { data: parsed, timestamp: now });
      setResult(parsed);
    } catch (e) {
      if (lastRequestRef.current === now) {
        setError(e instanceof Error ? e.message : "查询失败，请稍后重试");
      }
    } finally {
      if (lastRequestRef.current === now) {
        setLoading(false);
      }
    }
  }, []);

  /** 处理右键事件 */
  useEffect(() => {
    function handleContextMenu(e: MouseEvent) {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";

      // 校验选中文本
      if (!text || text.length < 2 || text.length > 200) return;
      // 只处理英文文本（含常见标点）
      if (!/^[a-zA-Z\s'-]+$/.test(text)) return;

      // 阻止默认右键菜单
      e.preventDefault();

      const selected = text.slice(0, 200);
      setSelectedText(selected);

      // 计算弹窗位置：鼠标点击位置
      let top = e.clientY + 10;
      let left = e.clientX - 100;

      // 确保不超出视口
      if (left < 10) left = 10;
      if (top + 400 > window.innerHeight) {
        top = e.clientY - 410; // 超出下方则显示在鼠标上方
      }

      setPosition({ top, left });
      setVisible(true);
      setAdded(false);

      // 检查是否已在词汇本中
      const exists = vocabulary.some(
        (v) => v.word.toLowerCase() === selected.toLowerCase()
      );
      setAdded(exists);

      // 发起查询
      lookupWord(selected);
    }

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [lookupWord, vocabulary]);

  /** 点击外部关闭 */
  useEffect(() => {
    if (!visible) return;

    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        close();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    // 延迟绑定，避免点击弹窗自身时立即关闭
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, close]);

  /** 朗读 */
  async function handlePlay() {
    if (playing || !selectedText) return;
    if (!isTTSSupported()) return;
    setPlaying(true);
    try {
      await speak(selectedText, 1);
    } catch {
      // 静默失败
    } finally {
      setPlaying(false);
    }
  }

  /** 添加到词汇本 */
  function handleAddToVocab() {
    if (!profile || !result) return;
    if (added) return;

    addVocabulary({
      id: crypto.randomUUID(),
      userId: profile.id,
      word: result.word,
      meaning: result.meaning,
      example: result.example.english,
      source: "manual",
      createdAt: new Date().toISOString(),
    });
    setAdded(true);
  }

  if (!visible) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 99999,
        width: "320px",
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 space-y-3"
    >
      {/* 头部：关闭按钮 */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base text-gray-900 truncate max-w-[240px]">
          {selectedText}
        </span>
        <button
          type="button"
          onClick={close}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 加载态 */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>正在查询...</span>
        </div>
      )}

      {/* 错误态 */}
      {error && (
        <div className="text-sm text-red-500 py-2">{error}</div>
      )}

      {/* 查询结果 */}
      {result && !loading && (
        <>
          {/* 音标 + 词性 + 释义 */}
          <div className="space-y-1">
            {result.phonetic && (
              <span className="text-sm text-gray-400 font-mono">{result.phonetic}</span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                {result.partOfSpeech}
              </span>
              <span className="text-sm text-gray-800">{result.meaning}</span>
            </div>
          </div>

          {/* 其他词性 */}
          {result.otherMeanings && result.otherMeanings.length > 0 && (
            <div className="space-y-0.5">
              {result.otherMeanings.map((m, i) => (
                <div key={i} className="flex items-baseline gap-2 text-xs text-gray-500">
                  <span className="text-blue-500 font-medium">{m.partOfSpeech}</span>
                  <span>{m.meaning}</span>
                </div>
              ))}
            </div>
          )}

          {/* 例句 */}
          <div className="bg-gray-50 rounded p-2 space-y-1">
            <p className="text-sm text-gray-700 italic">{result.example.english}</p>
            <p className="text-xs text-gray-500">{result.example.chinese}</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handlePlay}
              disabled={playing || !isTTSSupported()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {playing ? "播放中..." : "朗读"}
            </button>

            <button
              type="button"
              onClick={handleAddToVocab}
              disabled={added || !profile}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                added
                  ? "bg-green-50 text-green-600"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  已添加
                </>
              ) : (
                <>
                  <BookPlus className="w-3.5 h-3.5" />
                  添加到词汇本
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* TTS 不支持提示 */}
      {!isTTSSupported() && (
        <p className="text-xs text-orange-500">当前浏览器不支持语音功能</p>
      )}
    </div>
  );
}
