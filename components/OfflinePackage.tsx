/**
 * @file components/OfflinePackage.tsx
 * @description 离线练习包：预缓存核心页面与资源
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";

const CACHE_NAME = "english-agent-v2";

const OFFLINE_URLS = [
"/",
"/dashboard",
"/speak",
"/write",
"/chat",
"/review",
"/topics",
"/progress",
"/plan",
"/exam",
"/exam/full",
"/reading",
"/listening",
"/vocabulary",
"/vocabulary/review",
"/advisor",
"/report",
"/settings"];


/**
 * 离线练习包组件
 * @example
 * ```tsx
 * <OfflinePackage />
 * ```
 */
export function OfflinePackage() {
  const [cached, setCached] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("caches" in window)) return;

    async function checkCache() {
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const hasAll = OFFLINE_URLS.every((url) =>
        keys.some((request) => request.url.endsWith(url))
        );
        setCached(hasAll);
      } catch {
        setCached(false);
      }
    }

    checkCache();
  }, []);

  async function handleCache() {
    if (typeof window === "undefined" || !("caches" in window)) {
      setStatus(t("当前浏览器不支持离线缓存"));
      return;
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        OFFLINE_URLS.map((url) =>
        cache.add(url).catch((error) => {
          console.warn("Failed to cache:", url, error);
        })
        )
      );
      setCached(true);
      setStatus(t("已缓存核心页面"));
    } catch (error) {
      console.error(error);
      setStatus(t("缓存失败，请重试"));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {cached ?
        <>
            <CheckCircle className="w-4 h-4 text-green-500" />{t("\u6838\u5FC3\u9875\u9762\u5DF2\u7F13\u5B58")}

        </> :

        <>
            <Download className="w-4 h-4" />{t("\u5C1A\u672A\u7F13\u5B58\u6838\u5FC3\u9875\u9762")}

        </>
        }
      </div>
      <Button onClick={handleCache} disabled={cached}>
        <Download className="w-4 h-4 mr-2" />
        {cached ? t("\u5DF2\u7F13\u5B58") : t("\u4E0B\u8F7D\u79BB\u7EBF\u7EC3\u4E60\u5305")}
      </Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>);

}