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
    const profile = useAppStore.getState().profile;
    if (profile) {
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
