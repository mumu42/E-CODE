/**
 * @file lib/storage/directory.ts
 * @description 本地文件夹授权、读写与自动保存工具（基于 File System Access API）
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { AppData } from "@/lib/types";

/** 补齐 TypeScript lib.dom 中未包含的 File System Access API 类型 */
declare global {
  interface FileSystemHandle {
    queryPermission(descriptor?: { mode: "readwrite" }): Promise<PermissionState>;
    requestPermission(descriptor?: { mode: "readwrite" }): Promise<PermissionState>;
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
  }

  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

/** 已授权目录句柄缓存 */
let cachedHandle: FileSystemDirectoryHandle | null = null;

/** 最近一次自动保存时间 */
let lastAutoSavedAt = 0;

/** 获取本地持久化的目录句柄 */
async function getStoredHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    const db = await openDB();
    const transaction = db.transaction("handles", "readonly");
    const store = transaction.objectStore("handles");
    const request = store.get("directory");
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as FileSystemDirectoryHandle | undefined);
    });
  } catch {
    return undefined;
  }
}

/** 持久化目录句柄到 IndexedDB */
async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction("handles", "readwrite");
  const store = transaction.objectStore("handles");
  store.put(handle, "directory");
  return new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

/** 删除持久化的目录句柄 */
async function removeStoredHandle(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction("handles", "readwrite");
    const store = transaction.objectStore("handles");
    store.delete("directory");
    await new Promise<void>((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  } catch {
    // ignore
  }
}

/** 打开用于保存目录句柄的 IndexedDB */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ea-directory-handle", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("handles")) {
        db.createObjectStore("handles");
      }
    };
  });
}

/** 请求用户授权本地文件夹 */
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined") return null;
  try {
    const handle = await window.showDirectoryPicker();
    cachedHandle = handle;
    await storeHandle(handle);
    return handle;
  } catch (error) {
    console.error("Directory authorization failed:", error);
    return null;
  }
}

/** 加载已持久化的目录句柄并校验权限 */
export async function loadAuthorizedDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedHandle) return cachedHandle;
  const handle = await getStoredHandle();
  if (!handle) return null;
  try {
    const state = await handle.queryPermission({ mode: "readwrite" });
    if (state === "granted") {
      cachedHandle = handle;
      return handle;
    }
    return null;
  } catch {
    return null;
  }
}

/** 移除已授权的目录 */
export async function clearAuthorizedDirectory(): Promise<void> {
  cachedHandle = null;
  await removeStoredHandle();
}

/** 获取当前已授权的目录句柄 */
export function getAuthorizedDirectory(): FileSystemDirectoryHandle | null {
  return cachedHandle;
}

/** 列出目录下的文件 */
export async function listDirectoryFiles(
  handle: FileSystemDirectoryHandle
): Promise<{ name: string; kind: "file" | "directory" }[]> {
  const files: { name: string; kind: "file" | "directory" }[] = [];
  for await (const entry of handle.values()) {
    files.push({ name: entry.name, kind: entry.kind });
  }
  return files;
}

/** 写入文件到授权目录 */
export async function writeFileToDirectory(
  handle: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<void> {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** 从授权目录读取文件 */
export async function readFileFromDirectory(
  handle: FileSystemDirectoryHandle,
  filename: string
): Promise<File | null> {
  try {
    const fileHandle = await handle.getFileHandle(filename);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

/** 自动保存应用数据到授权目录（带简单的节流） */
export async function autoSaveToDirectory(data: AppData): Promise<void> {
  const now = Date.now();
  if (now - lastAutoSavedAt < 2000) return;
  lastAutoSavedAt = now;

  const handle = cachedHandle ?? (await loadAuthorizedDirectory());
  if (!handle) return;

  try {
    const state = await handle.queryPermission({ mode: "readwrite" });
    if (state !== "granted") {
      cachedHandle = null;
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const today = new Date().toISOString().split("T")[0];
    await writeFileToDirectory(handle, `english-agent-backup-${today}.json`, blob);
  } catch (error) {
    console.error("Auto save to directory failed:", error);
  }
}
