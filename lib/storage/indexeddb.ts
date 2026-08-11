/**
 * @file lib/storage/indexeddb.ts
 * @description 基于浏览器 IndexedDB 的 Zustand persist storage
 * @author English Agent Team
 * @date 2026-08-11
 */

import type { PersistStorage } from "zustand/middleware";

/** 数据库名称 */
const DB_NAME = "english-agent";
/** 对象存储名称 */
const STORE_NAME = "app-store";
/** 数据库版本 */
const DB_VERSION = 1;

/**
 * 打开 IndexedDB 数据库
 * @returns IndexedDB 数据库对象
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in browser"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * 执行对象存储事务
 * @param mode 事务模式
 * @returns 对象存储
 */
async function getStore(mode: IDBTransactionMode) {
  const db = await openDB();
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

/**
 * 创建 IndexedDB storage 实例
 * @returns Zustand persist storage 实例
 */
export function createIndexedDBStorage<T>(): PersistStorage<T> {
  return {
    /**
     * 读取指定键的值
     * @param name 键名
     * @returns 解析后的存储值
     */
    async getItem(name) {
      if (typeof window === "undefined") return null;
      try {
        const store = await getStore("readonly");
        return new Promise((resolve, reject) => {
          const request = store.get(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const result = request.result;
            if (typeof result === "string") {
              try {
                resolve(JSON.parse(result));
              } catch {
                resolve(null);
              }
            } else {
              resolve(result ?? null);
            }
          };
        });
      } catch (error) {
        console.error("IndexedDB getItem error:", error);
        return null;
      }
    },

    /**
     * 写入指定键的值
     * @param name 键名
     * @param value 存储值
     */
    async setItem(name, value) {
      if (typeof window === "undefined") return;
      try {
        const store = await getStore("readwrite");
        return new Promise<void>((resolve, reject) => {
          const request = store.put(JSON.stringify(value), name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.error("IndexedDB setItem error:", error);
      }
    },

    /**
     * 删除指定键
     * @param name 键名
     */
    async removeItem(name) {
      if (typeof window === "undefined") return;
      try {
        const store = await getStore("readwrite");
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      } catch (error) {
        console.error("IndexedDB removeItem error:", error);
      }
    },
  };
}
