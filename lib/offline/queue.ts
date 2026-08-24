/**
 * @file lib/offline/queue.ts
 * @description 离线请求队列：在联网后由 Service Worker 后台同步重试
 * @author English Agent Team
 * @date 2026-08-24
 */

const DB_NAME = "english-agent-offline";
const DB_VERSION = 1;
const STORE_NAME = "queue";

interface QueuedRequest {
  id?: number;
  url: string;
  method?: string;
  body?: string;
  timestamp: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

/**
 * 将失败的请求加入离线队列
 * @param request - 请求信息
 */
export async function enqueueFailedRequest(request: Omit<QueuedRequest, "timestamp">): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const addRequest = store.add({ ...request, timestamp: Date.now() });
    addRequest.onsuccess = () => resolve();
    addRequest.onerror = () => reject(addRequest.error);
  });
}

/**
 * 获取当前队列中的请求数量
 * @returns 队列长度
 */
export async function getQueueLength(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const countRequest = store.count();
    countRequest.onsuccess = () => resolve(countRequest.result);
    countRequest.onerror = () => reject(countRequest.error);
  });
}

/**
 * 触发 Service Worker 后台同步
 * @returns 是否成功注册同步
 */
export async function requestBackgroundSync(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.ready) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register("english-agent-sync");
      return true;
    }
  } catch (error) {
    console.warn("Background sync registration failed:", error);
  }
  return false;
}
