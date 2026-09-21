/**
 * @file components/withVoiceCheck.tsx
 * @description 高阶组件：为需要语音功能的页面添加检测拦截
 * @author English Agent Team
 * @date 2026-09-21
 */

"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

/**
 * withVoiceCheck HOC 的 props
 */
interface WithVoiceCheckProps {
  children: ReactNode;
  /** 是否强制要求检测，即使某些功能不支持也允许进入 */
  requireAll?: boolean;
  /** 检测失败时的自定义提示文本 */
  customMessage?: string;
}

/**
 * 语音功能检测高阶组件
 * - 检查浏览器是否已完成语音功能检测
 * - 未检测时重定向到语音检测页面
 * - 可配置是否强制要求所有功能都支持
 *
 * @param props - 组件属性
 * @returns 包装后的组件
 *
 * @example
 * ```tsx
 * // 基础用法：必须先检测
 * export default function SpeakPage() {
 *   return (
 *     <WithVoiceCheck>
 *       <SpeakPageContent />
 *     </WithVoiceCheck>
 *   );
 * }
 *
 * // 强制要求所有功能支持
 * <WithVoiceCheck requireAll>
 *   <VoiceIntensivePage />
 * </WithVoiceCheck>
 * ```
 */
export function WithVoiceCheck({
  children,
  requireAll = false,
  customMessage
}: WithVoiceCheckProps) {
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);

  const capabilities = settings.browserCapabilities;

  useEffect(() => {
    // 如果还没有检测结果，重定向到检测页面
    if (!capabilities) {
      router.replace("/voice-check");
      return;
    }

    // 如果强制要求所有功能，检查是否有不支持的功能
    if (requireAll) {
      const unsupportedFeatures = [];
      if (!capabilities.speechRecognition) {
        unsupportedFeatures.push("语音识别");
      }
      if (!capabilities.tts) {
        unsupportedFeatures.push("语音合成");
      }
      if (!capabilities.microphone) {
        unsupportedFeatures.push("麦克风输入");
      }

      // 如果有不支持的功能，可以显示警告或阻止进入
      if (unsupportedFeatures.length > 0 && customMessage) {
        // 这里可以添加一个提示弹窗或警告
        console.warn(`以下功能不支持: ${unsupportedFeatures.join(", ")}`);
      }
    }
  }, [capabilities, router, requireAll, customMessage]);

  // 如果还没有检测结果，显示加载状态
  if (!capabilities) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到语音功能检测...</p>
      </div>
    );
  }

  // 如果强制要求所有功能但有不支持的，可以选择渲染警告或阻止
  if (requireAll) {
    const unsupportedFeatures = [];
    if (!capabilities.speechRecognition) {
      unsupportedFeatures.push("语音识别");
    }
    if (!capabilities.tts) {
      unsupportedFeatures.push("语音合成");
    }
    if (!capabilities.microphone) {
      unsupportedFeatures.push("麦克风输入");
    }

    if (unsupportedFeatures.length > 0) {
      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            ⚠️ 功能不支持
          </h1>
          <p className="text-gray-600 mb-6">
            {customMessage || `您的浏览器不支持以下功能：${unsupportedFeatures.join("、")}`}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            您可以仍尝试使用，但体验可能受限。
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              返回上页
            </button>
            <button
              onClick={() => router.push("/voice-check")}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              重新检测
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}