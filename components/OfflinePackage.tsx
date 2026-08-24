/**
 * @file components/OfflinePackage.tsx
 * @description 离线练习包：预缓存核心页面与资源
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";

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
  "/settings",
];

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
      setStatus("当前浏览器不支持离线缓存");
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
      setStatus("已缓存核心页面");
    } catch (error) {
      console.error(error);
      setStatus("缓存失败，请重试");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {cached ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            核心页面已缓存
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            尚未缓存核心页面
          </>
        )}
      </div>
      <Button onClick={handleCache} disabled={cached}>
        <Download className="w-4 h-4 mr-2" />
        {cached ? "已缓存" : "下载离线练习包"}
      </Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
