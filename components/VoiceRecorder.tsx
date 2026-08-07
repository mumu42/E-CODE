/**
 * @file components/VoiceRecorder.tsx
 * @description 浏览器语音识别输入组件，支持实时转写
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square } from "lucide-react";

/** VoiceRecorder 组件 props */
interface VoiceRecorderProps {
  /** 当前文本值 */
  value: string;
  /** 文本变化回调 */
  onChange: (value: string) => void;
}

/**
 * 语音输入组件
 * @param props - 组件属性
 * @example
 * ```tsx
 * <VoiceRecorder value={input} onChange={setInput} />
 * ```
 */
export function VoiceRecorder({ value, onChange }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      onChange(transcript);
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
          supported
            ? "点击麦克风开始录音，或直接输入文字..."
            : "当前浏览器不支持语音输入，请直接输入文字..."
        }
        rows={6}
        className="resize-none"
      />
      {supported && (
        <Button
          type="button"
          variant={isListening ? "destructive" : "default"}
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              停止录音
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              开始录音
            </>
          )}
        </Button>
      )}
    </div>
  );
}
