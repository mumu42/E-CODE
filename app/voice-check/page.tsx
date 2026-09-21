/**
 * @file app/voice-check/page.tsx
 * @description 浏览器语音功能检测页面
 * @author English Agent Team
 * @date 2026-09-21 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrowserCapabilitiesChecker } from "@/components/BrowserCapabilitiesChecker";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n/translate";

/**
 * 语音检测页面
 * - 显示当前浏览器的语音识别、TTS、麦克风支持状态
 * - 提供重新检测按钮
 * - 检测完成后可以跳转到学习页
 */
export default function VoiceCheckPage() {
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const profile = useAppStore((state) => state.profile);

  const capabilities = settings.browserCapabilities;

  // 如果已经检测完成且没有用户档案，跳转到 onboarding
  useEffect(() => {
    if (capabilities && !profile) {
      // 给用户一点时间查看检测结果后再跳转
      const timer = setTimeout(() => {
        router.replace("/onboarding");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [capabilities, profile, router]);

  // 如果已经检测完成且有用户档案，可以跳转到 dashboard
  const handleGoToDashboard = () => {
    if (profile) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <span>🎤</span>
            {t("语音功能检测")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600">
            {t("请确认您的浏览器是否支持以下语音功能，以确保最佳学习体验。")}
          </p>

          <div className="border rounded-lg p-6 bg-muted/50">
            <BrowserCapabilitiesChecker />
          </div>

          {capabilities && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-sm mb-2">{t("检测结果说明")}</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• {t("语音识别：用于口语练习中的语音输入功能")}</li>
                  <li>• {t("语音合成（TTS）：用于AI对话中的语音播放")}</li>
                  <li>• {t("麦克风输入：用于录音和语音识别")}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleGoToDashboard} className="flex-1">
                  {profile ? t("进入学习页") : t("下一步：设置学习目标")}
                </Button>
              </div>
            </div>
          )}

          {capabilities && !profile && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                {t("检测完成，即将跳转到学习目标设置...")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}