/**
 * @file components/ExamTimer.tsx
 * @description 模拟考试倒计时组件
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";

import { useEffect, useState } from "react";

/** 倒计时组件属性 */
interface ExamTimerProps {
  /** 剩余秒数 */
  seconds: number;
  /** 倒计时结束回调 */
  onFinish: () => void;
}

/**
 * 倒计时组件
 * @example
 * ```tsx
 * <ExamTimer seconds={1800} onFinish={() => alert("时间到")} />
 * ```
 */
export function ExamTimer({ seconds, onFinish }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onFinish();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, onFinish]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="text-lg font-mono font-bold dark:text-white">
      {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}
