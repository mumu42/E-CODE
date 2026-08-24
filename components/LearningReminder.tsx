/**
 * @file components/LearningReminder.tsx
 * @description 学习提醒设置与调度（支持 Web 与 Capacitor 本地通知）
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import {
  requestNotificationPermission,
  checkNotificationPermission,
  showNotification,
  scheduleDailyReminder,
  cancelLearningReminders,
} from "@/lib/notifications";

const LAST_REMINDED_KEY = "ea-last-reminded-date";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | "prompt">(
    "default"
  );

  useEffect(() => {
    checkNotificationPermission().then(setPermission).catch(console.error);
  }, []);

  return { permission, setPermission };
}

/** 学习提醒组件 */
export function LearningReminder() {
  const settings = useAppStore((state) => state.settings);
  const checkIns = useAppStore((state) => state.checkIns);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const { permission, setPermission } = useNotificationPermission();

  async function handleRequestPermission() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settings.reminders.enabled) {
      cancelLearningReminders().catch(console.error);
      return;
    }
    if (permission !== "granted") return;

    const [hour, minute] = settings.reminders.time.split(":").map(Number);
    scheduleDailyReminder(hour, minute).catch(console.error);

    const interval = setInterval(() => {
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (timeString !== settings.reminders.time) return;
      if (checkIns.includes(getToday())) return;

      const last = window.localStorage.getItem(LAST_REMINDED_KEY);
      if (last === getToday()) return;

      window.localStorage.setItem(LAST_REMINDED_KEY, getToday());
      showNotification("英语学习提醒", "该开始学习啦！坚持每日练习，英语水平稳步提升。").catch(
        console.error
      );
    }, 60_000);

    return () => clearInterval(interval);
  }, [settings.reminders.enabled, settings.reminders.time, permission, checkIns]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={settings.reminders.enabled ? "default" : "outline"}
          onClick={() =>
            updateSettings({
              reminders: { ...settings.reminders, enabled: !settings.reminders.enabled },
            })
          }
        >
          {settings.reminders.enabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
          {settings.reminders.enabled ? "已开启" : "已关闭"}
        </Button>
        {permission !== "granted" && permission !== "unsupported" && (
          <Button variant="outline" onClick={handleRequestPermission}>
            请求通知权限
          </Button>
        )}
      </div>

      {settings.reminders.enabled && (
        <div className="flex items-center gap-2">
          <label className="text-sm">每日提醒时间</label>
          <input
            type="time"
            value={settings.reminders.time}
            onChange={(e) =>
              updateSettings({
                reminders: { ...settings.reminders, time: e.target.value },
              })
            }
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      )}

      {permission === "unsupported" && (
        <p className="text-xs text-orange-600">当前浏览器不支持桌面通知。</p>
      )}
      {permission === "denied" && (
        <p className="text-xs text-red-600">通知权限被拒绝，请在浏览器设置中开启。</p>
      )}
    </div>
  );
}
