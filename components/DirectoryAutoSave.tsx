/**
 * @file components/DirectoryAutoSave.tsx
 * @description 本地文件夹授权与自动保存设置
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  requestDirectoryAccess,
  clearAuthorizedDirectory,
  loadAuthorizedDirectory,
} from "@/lib/storage/directory";
import { Folder, FolderOpen, Trash2 } from "lucide-react";

const AUTO_SAVE_KEY = "ea-auto-save-directory";

function readAutoSavePreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_SAVE_KEY) === "true";
}

/** 本地文件夹授权与自动保存设置组件 */
export function DirectoryAutoSave() {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(readAutoSavePreference);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuthorizedDirectory()
      .then((handle) => {
        if (handle) setFolderName(handle.name);
      })
      .catch(console.error);
  }, []);

  async function handleAuthorize() {
    setLoading(true);
    try {
      const handle = await requestDirectoryAccess();
      if (handle) {
        setFolderName(handle.name);
      } else {
        alert("授权失败或未选择文件夹");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleToggleAutoSave(value: boolean) {
    setAutoSave(value);
    window.localStorage.setItem(AUTO_SAVE_KEY, value ? "true" : "false");
  }

  async function handleClear() {
    await clearAuthorizedDirectory();
    setFolderName(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {folderName ? (
          <>
            <FolderOpen className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">{folderName}</span>
          </>
        ) : (
          <>
            <Folder className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">未授权本地文件夹</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAuthorize} disabled={loading} variant="outline">
          <FolderOpen className="w-4 h-4 mr-2" />
          {folderName ? "重新授权文件夹" : "授权本地文件夹"}
        </Button>
        {folderName && (
          <Button variant="ghost" size="icon" onClick={handleClear}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoSave}
          onChange={(e) => handleToggleAutoSave(e.target.checked)}
          className="w-4 h-4"
        />
        数据变化时自动保存到授权文件夹
      </label>
    </div>
  );
}
