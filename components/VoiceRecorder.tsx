/**
 * @file components/VoiceRecorder.tsx
 * @description 浏览器语音识别输入组件，支持实时转写和置信度反馈
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square } from "lucide-react";

/** 单词置信度 */
export interface WordConfidence {
  word: string;
  confidence: number;
}

/** VoiceRecorder 组件 props */
interface VoiceRecorderProps {
  /** 当前文本值 */
  value: string;
  /** 文本变化回调 */
  onChange: (value: string) => void;
  /** 置信度变化回调（可选） */
  onConfidenceChange?: (words: WordConfidence[]) => void;
  /** 当语音识别产生最终结果时的回调（可选） */
  onFinalTranscript?: (transcript: string) => void;
}

/**
 * 语音输入组件
 * @param props - 组件属性
 * @example
 * ```tsx
 * <VoiceRecorder value={input} onChange={setInput} />
 * ```
 */
export function VoiceRecorder({ value, onChange, onConfidenceChange, onFinalTranscript }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const extractConfidence = useCallback(
    (event: SpeechRecognitionEvent) => {
      if (!onConfidenceChange) return;

      const words: WordConfidence[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal && i !== event.results.length - 1) continue;
        const alt = result[0];
        if (alt && Array.isArray((alt as unknown as {confidence?: number;}).confidence)) {
          // some browsers provide word-level confidence
          continue;
        }
        // Fallback: split transcript into words and assign result confidence to each word
        const transcript = alt.transcript.trim();
        const confidence = alt.confidence ?? 0;
        transcript.
        split(/\s+/).
        filter(Boolean).
        forEach((word) => {
          words.push({ word, confidence });
        });
      }
      onConfidenceChange(words);
    },
    [onConfidenceChange]
  );

  /** 开始语音识别 */
  function startListening() {
    const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).
      map((result) => result[0].transcript).
      join("");
      onChange(transcript);
      extractConfidence(event);

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && onFinalTranscript) {
          onFinalTranscript(transcript);
          break;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }

  /** 停止语音识别 */
  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
        supported ? t("\u70B9\u51FB\u9EA6\u514B\u98CE\u5F00\u59CB\u5F55\u97F3\uFF0C\u6216\u76F4\u63A5\u8F93\u5165\u6587\u5B57...") : t("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u8F93\u5165\uFF0C\u8BF7\u76F4\u63A5\u8F93\u5165\u6587\u5B57...")


        }
        rows={6}
        className="resize-none" />
      
      {supported &&
      <Button
        type="button"
        variant={isListening ? "destructive" : "default"}
        onClick={isListening ? stopListening : startListening}>
        
          {isListening ?
        <>
              <Square className="w-4 h-4 mr-2" />{t("\u505C\u6B62\u5F55\u97F3")}

        </> :

        <>
              <Mic className="w-4 h-4 mr-2" />{t("\u5F00\u59CB\u5F55\u97F3")}

        </>
        }
        </Button>
      }
    </div>);

}