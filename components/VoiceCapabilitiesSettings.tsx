/**
 * @file components/VoiceCapabilitiesSettings.tsx
 * @description 语音功能设置组件，允许用户手动修改检测结果
 * @author English Agent Team
 * @date 2026-09-21
 */

"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setCachedCapabilities } from "@/lib/utils/browser-capabilities";
import { t } from "@/lib/i18n/translate";
import { Settings, Save, RotateCcw, AlertTriangle } from "lucide-react";

/**
 * 语音功能设置组件
 * - 允许用户手动修改浏览器语音功能检测结果
 * - 提供保存和重置功能
 * - 显示警告信息提醒用户风险
 */
export function VoiceCapabilitiesSettings() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const capabilities = settings.browserCapabilities;

  // 本地状态用于编辑
  const [editState, setEditState] = useState(
    capabilities ? {
      speechRecognition: capabilities.speechRecognition,
      tts: capabilities.tts,
      microphone: capabilities.microphone,
    } : {
      speechRecognition: false,
      tts: false,
      microphone: false,
    }
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // 检查是否有变更
  const checkChanges = (newState: typeof editState) => {
    if (!capabilities) {
      setHasChanges(newState.speechRecognition || newState.tts || newState.microphone);
      return;
    }
    setHasChanges(
      newState.speechRecognition !== capabilities.speechRecognition ||
      newState.tts !== capabilities.tts ||
      newState.microphone !== capabilities.microphone
    );
  };

  const handleToggle = (feature: keyof typeof editState) => {
    const newState = { ...editState, [feature]: !editState[feature] };
    setEditState(newState);
    checkChanges(newState);

    // 如果用户尝试启用功能，显示警告
    if (!editState[feature] && !capabilities?.[feature]) {
      setShowWarning(true);
    }
  };

  const handleSave = () => {
    if (!capabilities) return;

    const newCapabilities = {
      ...capabilities,
      ...editState,
      detectedAt: Date.now(),
    };

    // 更新缓存
    setCachedCapabilities(newCapabilities);
    // 更新 store
    updateSettings({ browserCapabilities: newCapabilities });

    setHasChanges(false);
    setShowWarning(false);
  };

  const handleReset = () => {
    if (!capabilities) return;
    setEditState({
      speechRecognition: capabilities.speechRecognition,
      tts: capabilities.tts,
      microphone: capabilities.microphone,
    });
    setHasChanges(false);
    setShowWarning(false);
  };

  if (!capabilities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t("语音功能设置")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {t("请先完成语音功能检测后再进行设置。")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {t("语音功能设置")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showWarning && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">{t("注意：手动修改检测结果")}</p>
                <p>{t("强制启用浏览器不支持的功能可能会导致功能异常或应用崩溃。请谨慎操作。")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t("语音识别")}</span>
            <button
              onClick={() => handleToggle("speechRecognition")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editState.speechRecognition ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editState.speechRecognition ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">{t("语音合成（TTS）")}</span>
            <button
              onClick={() => handleToggle("tts")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editState.tts ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editState.tts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">{t("麦克风输入")}</span>
            <button
              onClick={() => handleToggle("microphone")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editState.microphone ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editState.microphone ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            size="sm"
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {t("保存更改")}
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasChanges}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("重置")}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>{t("原始检测结果时间：")}{new Date(capabilities.detectedAt ?? Date.now()).toLocaleString("zh-CN")}</p>
          <p>{t("提示：某些浏览器可能需要 HTTPS 环境才能使用语音功能。")}</p>
        </div>
      </CardContent>
    </Card>
  );
}