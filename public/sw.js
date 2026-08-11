/**
 * @file public/sw.js
 * @description Service Worker：缓存核心静态资源，支持离线访问
 * @author English Agent Team
 * @date 2026-08-11
 */

const CACHE_NAME = "english-agent-v1";
const CACHE_URLS = ["/", "/dashboard", "/speak", "/write", "/chat", "/review", "/topics", "/progress", "/plan", "/exam"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => caches.match("/"));
    })
  );
});
