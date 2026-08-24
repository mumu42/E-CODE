/**
 * @file public/sw.js
 * @description Service Worker：缓存核心静态资源，支持离线访问与后台同步
 * @author English Agent Team
 * @date 2026-08-24
 */

const CACHE_NAME = "english-agent-v2";
const CACHE_URLS = [
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
  "/exam/session",
  "/reading",
  "/listening",
  "/listening/dictation",
  "/vocabulary",
  "/vocabulary/review",
  "/advisor",
  "/report",
  "/settings",
];

// 需要预缓存的核心资源
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon.svg",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 addAll 的变体，忽略单个页面预缓存失败
      return Promise.all(
        [...CACHE_URLS, ...STATIC_ASSETS].map((url) =>
          cache.add(url).catch((error) => {
            console.warn("Failed to cache:", url, error);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

/**
 * 判断请求是否为导航请求
 */
function isNavigationRequest(request) {
  return request.mode === "navigate";
}

/**
 * 判断请求是否为静态资源
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    request.method === "GET" &&
    (url.pathname.startsWith("/_next/") ||
      url.pathname.startsWith("/static/") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".ico"))
  );
}

/**
 * 判断请求是否为 AI API
 */
function isAiApi(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/ai/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // AI API 不缓存
  if (isAiApi(request)) {
    return;
  }

  // 静态资源：stale-while-revalidate
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // 导航请求：network first, fallback to cache, 最后回退到首页
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match("/");
          })
        )
    );
    return;
  }

  // 其他 GET 请求：优先缓存
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).catch(() => caches.match("/"));
      })
    );
  }
});

/**
 * 后台同步：尝试重试离线队列中的请求
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "english-agent-sync") {
    event.waitUntil(drainQueue());
  }
});

/**
 * 简单的 IndexedDB 离线队列
 */
const DB_NAME = "english-agent-offline";
const DB_VERSION = 1;
const STORE_NAME = "queue";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

async function drainQueue() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const all = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  for (const item of all) {
    try {
      const response = await fetch(item.url, {
        method: item.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: item.body,
      });
      if (response.ok) {
        await new Promise((resolve, reject) => {
          const request = store.delete(item.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.warn("Failed to replay queued request:", error);
    }
  }
}
