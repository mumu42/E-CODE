/**
 * @file components/FileImporter.tsx
 * @description 数据导入组件，支持 static 文件夹导入、本地单文件导入和批量历史文件合并导入
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { readStaticFile, listStaticFiles, importFromExcel } from "@/lib/storage/excel";
import { importFromJson } from "@/lib/storage/json";
import { mergeAppData } from "@/lib/storage/merge";
import type { AppData } from "@/lib/types";
import { Upload, FolderOpen, Layers } from "lucide-react";

interface FileImporterProps {
  /** 是否启用批量合并导入模式 */
  batch?: boolean;
}

/**
 * 文件导入组件
 * @example
 * ```tsx
 * <FileImporter batch />
 * ```
 */
export function FileImporter({ batch }: FileImporterProps) {
  const [mode, setMode] = useState<"static" | "local">("static");
  const [files, setFiles] = useState<{name: string;size: number;updatedAt: string;}[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const importData = useAppStore((state) => state.importData);
  const mergeData = useAppStore((state) => state.mergeData);
  const router = useRouter();

  /** 切换为 static 模式时拉取文件列表 */
  useEffect(() => {
    if (mode === "static") {
      listStaticFiles().then(setFiles).catch(console.error);
    }
  }, [mode]);

  /** 从 static 文件夹导入 */
  async function handleStaticImport() {
    if (!selectedFile) return;
    setIsImporting(true);
    try {
      const data = await readStaticFile(selectedFile);
      importData(data);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("导入失败");
    } finally {
      setIsImporting(false);
    }
  }

  /** 从单个本地文件导入 */
  async function handleLocalImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      let data;
      if (file.name.endsWith(".json")) {
        data = await importFromJson(file);
      } else {
        data = await importFromExcel(file);
      }
      importData(data);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("导入失败，请检查文件格式是否正确。");
    } finally {
      setIsImporting(false);
    }
  }

  /** 批量合并导入多个历史文件 */
  async function handleBatchImport() {
    if (selectedFiles.length === 0) return;
    setIsImporting(true);
    try {
      const snapshots = await Promise.all(
        selectedFiles.map(async (file) => {
          if (file.name.endsWith(".json")) {
            return importFromJson(file);
          }
          return importFromExcel(file);
        })
      );
      const merged = mergeAppData(snapshots as Partial<AppData>[]);
      mergeData(merged);
      setSelectedFiles([]);
      alert(`成功合并导入 ${snapshots.length} 个文件`);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("批量导入失败，请检查文件格式是否正确。");
    } finally {
      setIsImporting(false);
    }
  }

  if (batch) {
    return (
      <div className="flex flex-col gap-3">
        <input
          type="file"
          accept=".xlsx,.xls,.json"
          multiple
          ref={inputRef}
          className="hidden"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))} />
        
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isImporting}>
          <Layers className="w-4 h-4 mr-2" />{t("\u9009\u62E9\u591A\u4E2A\u5386\u53F2\u6587\u4EF6")}

        </Button>
        {selectedFiles.length > 0 &&
        <div className="text-sm text-gray-600">{t("\u5DF2\u9009\u62E9")}
          {selectedFiles.length}{t("\u4E2A\u6587\u4EF6\uFF1A")}
          <ul className="list-disc list-inside mt-1">
              {selectedFiles.map((file) =>
            <li key={file.name}>{file.name}</li>
            )}
            </ul>
          </div>
        }
        <Button onClick={handleBatchImport} disabled={selectedFiles.length === 0 || isImporting}>
          {isImporting ? "导入中..." : "合并导入"}
        </Button>
      </div>);

  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setMode("static")}>
          <FolderOpen className="w-4 h-4 mr-2" />{t("static \u6587\u4EF6\u5939")}

        </Button>
        <Button variant="outline" onClick={() => setMode("local")}>
          <Upload className="w-4 h-4 mr-2" />{t("\u672C\u5730\u6587\u4EF6")}

        </Button>
      </div>

      {mode === "static" &&
      <div className="flex items-center gap-2">
          <select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="border rounded px-2 py-1 text-sm">
          
            <option value="">{t("\u9009\u62E9 static \u6587\u4EF6\u5939\u4E2D\u7684\u6587\u4EF6")}</option>
            {files.map((file) =>
          <option key={file.name} value={file.name}>
                {file.name}
              </option>
          )}
          </select>
          <Button onClick={handleStaticImport} disabled={!selectedFile || isImporting}>
            {isImporting ? "导入中..." : "导入"}
          </Button>
        </div>
      }

      {mode === "local" &&
      <>
          <input
          type="file"
          accept=".xlsx,.xls,.json"
          ref={inputRef}
          className="hidden"
          onChange={handleLocalImport} />
        
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isImporting}>
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? "导入中..." : "选择本地 Excel/JSON 文件"}
          </Button>
        </>
      }
    </div>);

}