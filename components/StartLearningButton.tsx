"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/translate";

/**
 * 开始学习按钮：根据本地是否已有学习档案跳转
 * @example
 * ```tsx
 * <StartLearningButton />
 * ```
 */
export function StartLearningButton() {
  const router = useRouter();

  function handleStart() {
    const state = useAppStore.getState();
    const profile = state.profile;
    const capabilities = state.settings.browserCapabilities;

    // 优先检查语音检测结果，没有则先跳转到语音检测页面
    if (!capabilities) {
      router.push("/voice-check");
    } else if (profile) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <Button size="lg" onClick={handleStart}>
      {t("开始学习")}
    </Button>
  );
}
