/**
 * @file components/PushNotificationManager.tsx
 * @description 推送通知设置：FCM/APNs/Web Push 开关与令牌展示
 * @author English Agent Team
 * @date 2026-08-25
 */

"use client";

import { useState } from "react";
import { t } from "@/lib/i18n/translate";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Copy } from "lucide-react";
import {
  isPushSupported,
  checkPushPermission,
  requestPushPermission,
  registerForPushNotifications,
  unregisterPushNotifications,
} from "@/lib/push";

const STORAGE_KEY = "ea-push-enabled";
const TOKEN_KEY = "ea-push-token";

function getInitialToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

function getInitialEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

/** 推送通知管理组件 */
export function PushNotificationManager() {
  const [enabled, setEnabled] = useState(getInitialEnabled);
  const [token, setToken] = useState(getInitialToken);
  const [permission, setPermission] = useState(checkPushPermission);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      const newPermission = await requestPushPermission();
      setPermission(newPermission);
      if (newPermission !== "granted") {
        setEnabled(false);
        return;
      }

      const { token: deviceToken, subscription } = await registerForPushNotifications();
      const tokenValue = deviceToken ?? subscription?.endpoint ?? "";

      if (tokenValue) {
        setToken(tokenValue);
        localStorage.setItem(TOKEN_KEY, tokenValue);
      }
      setEnabled(true);
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      await unregisterPushNotifications();
      setEnabled(false);
      setToken("");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      setPermission(checkPushPermission());
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy token:", error);
    }
  }

  if (!isPushSupported()) {
    return (
      <p className="text-xs text-orange-600">
        {t("当前环境不支持推送通知（需安装 PWA 或原生 App）")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={enabled ? "default" : "outline"}
          onClick={enabled ? handleDisable : handleEnable}
          disabled={loading}
        >
          {enabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
          {enabled ? t("已开启推送") : t("开启推送")}
        </Button>
      </div>

      {permission === "denied" && (
        <p className="text-xs text-red-600">
          {t("推送权限被拒绝，请在系统设置中允许通知。")}
        </p>
      )}

      {token && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md space-y-2">
          <p className="text-xs text-gray-500">{t("推送令牌 / Endpoint")}</p>
          <div className="flex items-start gap-2">
            <code className="text-xs break-all flex-1 text-gray-700 dark:text-gray-300">
              {token}
            </code>
            <Button variant="ghost" size="sm" onClick={copyToken} className="shrink-0">
              <Copy className="w-3 h-3 mr-1" />
              {copied ? t("已复制") : t("复制")}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {t("原生 App 使用 FCM (Android) 或 APNs (iOS)；浏览器 PWA 使用 Web Push。")}
      </p>
    </div>
  );
}
