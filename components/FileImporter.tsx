"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { readStaticFile, listStaticFiles, importFromExcel } from "@/lib/storage/excel";
import { Upload, FolderOpen } from "lucide-react";

export function FileImporter() {
  const [mode, setMode] = useState<"static" | "local">("static");
  const [files, setFiles] = useState<{ name: string; size: number; updatedAt: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const importData = useAppStore((state) => state.importData);

  useEffect(() => {
    if (mode === "static") {
      listStaticFiles().then(setFiles).catch(console.error);
    }
  }, [mode]);

  async function handleStaticImport() {
    if (!selectedFile) return;
    setIsImporting(true);
    try {
      const data = await readStaticFile(selectedFile);
      importData(data);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("导入失败");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleLocalImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await importFromExcel(file);
      importData(data);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("导入失败，请检查文件格式是否正确。");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setMode("static")}>
          <FolderOpen className="w-4 h-4 mr-2" />
          static 文件夹
        </Button>
        <Button variant="outline" onClick={() => setMode("local")}>
          <Upload className="w-4 h-4 mr-2" />
          本地文件
        </Button>
      </div>

      {mode === "static" && (
        <div className="flex items-center gap-2">
          <Select value={selectedFile} onValueChange={(value) => setSelectedFile(value ?? "")}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="选择 static 文件夹中的文件" />
            </SelectTrigger>
            <SelectContent>
              {files.map((file) => (
                <SelectItem key={file.name} value={file.name}>
                  {file.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStaticImport} disabled={!selectedFile || isImporting}>
            {isImporting ? "导入中..." : "导入"}
          </Button>
        </div>
      )}

      {mode === "local" && (
        <>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={inputRef}
            className="hidden"
            onChange={handleLocalImport}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? "导入中..." : "选择本地文件"}
          </Button>
        </>
      )}
    </div>
  );
}
