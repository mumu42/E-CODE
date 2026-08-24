/**
 * @file components/LearningReminder.tsx
 * @description 学习提醒设置与调度
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

const LAST_REMINDED_KEY = "ea-last-reminded-date";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function useNotificationPermission() {
  return useSyncExternalStore(
    () => () => {},
    getNotificationPermission,
    () => "default" as NotificationPermission
  );
}

/** 学习提醒组件 */
export function LearningReminder() {
  const settings = useAppStore((state) => state.settings);
  const checkIns = useAppStore((state) => state.checkIns);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const permission = useNotificationPermission();
  const [requestedPermission, setRequestedPermission] = useState<NotificationPermission | null>(null);

  const effectivePermission = requestedPermission ?? permission;

  async function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setRequestedPermission(result);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settings.reminders.enabled) return;
    if (effectivePermission !== "granted") return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (timeString !== settings.reminders.time) return;

      if (checkIns.includes(getToday())) return;

      const last = window.localStorage.getItem(LAST_REMINDED_KEY);
      if (last === getToday()) return;

      window.localStorage.setItem(LAST_REMINDED_KEY, getToday());

      const title = "英语学习提醒";
      const body = "该开始学习啦！坚持每日练习，英语水平稳步提升。";

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, { body });
        });
      } else {
        new Notification(title, { body });
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [settings.reminders.enabled, settings.reminders.time, effectivePermission, checkIns]);

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
        {effectivePermission !== "granted" && effectivePermission !== "unsupported" && (
          <Button variant="outline" onClick={requestPermission}>
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

      {effectivePermission === "unsupported" && (
        <p className="text-xs text-orange-600">当前浏览器不支持桌面通知。</p>
      )}
      {effectivePermission === "denied" && (
        <p className="text-xs text-red-600">通知权限被拒绝，请在浏览器设置中开启。</p>
      )}
    </div>
  );
}
