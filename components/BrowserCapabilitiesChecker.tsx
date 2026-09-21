/**
 * @file components/BrowserCapabilitiesChecker.tsx
 * @description 浏览器能力检测与重新检测组件，显示当前检测结果并支持重新检测
 * @author English Agent Team
 * @date 2026-09-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import {
  detectBrowserCapabilities,
  setCachedCapabilities,
} from "@/lib/utils/browser-capabilities";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

/**
 * 浏览器能力检测组件
 * - 显示当前浏览器的语音识别、TTS、麦克风支持状态
 * - 提供重新检测按钮
 */
export function BrowserCapabilitiesChecker() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const capabilities = settings.browserCapabilities;

  const handleRedetect = () => {
    // 重新执行浏览器能力检测，并更新缓存与 store
    const newCapabilities = detectBrowserCapabilities();
    setCachedCapabilities(newCapabilities);
    updateSettings({ browserCapabilities: newCapabilities });
  };

  if (!capabilities) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t("尚未检测浏览器能力，请点击下方按钮开始检测")}</p>
        <Button onClick={handleRedetect}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("开始检测")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* 语音识别 */}
        <div className="flex items-center gap-3">
          {capabilities.speechRecognition ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm">
            {t("语音识别")}
            <span className="text-gray-500 ml-2">
              {capabilities.speechRecognition ? t("支持") : t("不支持")}
            </span>
          </span>
        </div>

        {/* 语音合成 */}
        <div className="flex items-center gap-3">
          {capabilities.tts ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm">
            {t("语音合成（TTS）")}
            <span className="text-gray-500 ml-2">
              {capabilities.tts ? t("支持") : t("不支持")}
            </span>
          </span>
        </div>

        {/* 麦克风 */}
        <div className="flex items-center gap-3">
          {capabilities.microphone ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm">
            {t("麦克风输入")}
            <span className="text-gray-500 ml-2">
              {capabilities.microphone ? t("支持") : t("不支持")}
            </span>
          </span>
        </div>

        {/* 检测时间 */}
        {capabilities.detectedAt && (
          <p className="text-xs text-gray-500">
            {t("检测时间")}: {new Date(capabilities.detectedAt).toLocaleString("zh-CN")}
          </p>
        )}
      </div>

      <Button onClick={handleRedetect} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        {t("重新检测")}
      </Button>
    </div>
  );
}