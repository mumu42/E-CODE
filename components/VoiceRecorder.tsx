/**
 * @file components/VoiceRecorder.tsx
 * @description 浏览器语音识别输入组件，支持实时转写、置信度反馈与静音自动结束
 * @author English Agent Team
 * @date 2026-08-25
 */

"use client";
import { t } from "@/lib/i18n/translate";

import {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
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
  /** 是否在检测到静音后自动结束并提交 */
  autoStopOnSilence?: boolean;
  /** 结束识别后是否自动提交最终文本 */
  autoSubmit?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/** 暴露给父组件的方法 */
export interface VoiceRecorderHandle {
  /** 开始语音识别 */
  start: () => void;
  /** 停止语音识别 */
  stop: () => void;
}

/**
 * 语音输入组件
 * @param props - 组件属性
 * @example
 * ```tsx
 * <VoiceRecorder value={input} onChange={setInput} autoStopOnSilence autoSubmit />
 * ```
 */
export const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(
  function VoiceRecorder(
    {
      value,
      onChange,
      onConfidenceChange,
      onFinalTranscript,
      autoStopOnSilence = false,
      autoSubmit = false,
      disabled = false,
    },
    ref
  ) {
    const [isListening, setIsListening] = useState(false);
    const [supported] = useState(() => {
      if (typeof window === "undefined") return false;
      return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    });
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const transcriptRef = useRef(value);
    const submittedRef = useRef(false);

    transcriptRef.current = value;

    const extractConfidence = useCallback(
      (event: SpeechRecognitionEvent) => {
        if (!onConfidenceChange) return;

        const words: WordConfidence[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal && i !== event.results.length - 1) continue;
          const alt = result[0];
          if (alt && Array.isArray((alt as unknown as { confidence?: number }).confidence)) {
            continue;
          }
          const transcript = alt.transcript.trim();
          const confidence = alt.confidence ?? 0;
          transcript
            .split(/\s+/)
            .filter(Boolean)
            .forEach((word) => {
              words.push({ word, confidence });
            });
        }
        onConfidenceChange(words);
      },
      [onConfidenceChange]
    );

    const stopListening = useCallback(() => {
      recognitionRef.current?.stop();
      setIsListening(false);
    }, []);

    const startListening = useCallback(() => {
      if (!supported) return;
      if (isListening) return;

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = !autoStopOnSilence;

      submittedRef.current = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        onChange(transcript);
        extractConfidence(event);

        if (autoStopOnSilence && !recognition.continuous) {
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              stopListening();
              break;
            }
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (autoSubmit && !submittedRef.current) {
          const final = transcriptRef.current.trim();
          if (final) {
            submittedRef.current = true;
            onFinalTranscript?.(final);
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    }, [
      supported,
      isListening,
      autoStopOnSilence,
      autoSubmit,
      onChange,
      onFinalTranscript,
      extractConfidence,
      stopListening,
    ]);

    useImperativeHandle(ref, () => ({
      start: startListening,
      stop: stopListening,
    }));

    if (!supported) {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("当前浏览器不支持语音输入，请直接输入文字...")}
          rows={6}
          className="resize-none"
          disabled={disabled}
        />
      );
    }

    return (
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            supported
              ? t("点击麦克风开始录音，或直接输入文字...")
              : t("当前浏览器不支持语音输入，请直接输入文字...")
          }
          rows={6}
          className="resize-none"
          disabled={disabled}
        />

        <Button
          type="button"
          variant={isListening ? "destructive" : "default"}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
        >
          {isListening ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              {t("停止录音")}
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              {t("开始录音")}
            </>
          )}
        </Button>

        {autoStopOnSilence && isListening && (
          <p className="text-xs text-blue-600 animate-pulse">
            {t("正在听… 停顿后自动结束")}
          </p>
        )}
      </div>
    );
  }
);
