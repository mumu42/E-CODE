/**
 * @file app/vocabulary/page.tsx
 * @description 词汇本管理页面
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { parseVocabularyCsv, exportVocabularyCsv, exportVocabularyJson } from "@/lib/vocabulary/csv";
import { BookOpen, Trash2, Upload, Download, Brain } from "lucide-react";

/**
 * 词汇本管理页面
 * @example
 * ```tsx
 * <VocabularyPage />
 * ```
 */
export default function VocabularyPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const vocabulary = useAppStore((state) => state.vocabulary);
  const addVocabulary = useAppStore((state) => state.addVocabulary);
  const removeVocabulary = useAppStore((state) => state.removeVocabulary);
  const importVocabulary = useAppStore((state) => state.importVocabulary);

  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-gray-500">{t("\u8BF7\u5148\u521B\u5EFA\u5B66\u4E60\u6863\u6848\u3002")}</p>
      </div>);

  }

  function handleAdd() {
    if (!profile) return;
    if (!word.trim() || !meaning.trim()) return;
    addVocabulary({
      id: crypto.randomUUID(),
      userId: profile.id,
      word: word.trim(),
      meaning: meaning.trim(),
      example: example.trim(),
      source: "manual",
      createdAt: new Date().toISOString()
    });
    setWord("");
    setMeaning("");
    setExample("");
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    if (!profile) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text) as {word: string;meaning: string;example?: string;}[];
          const items = parsed.map((item) => ({
            id: crypto.randomUUID(),
            userId: profile.id,
            word: item.word,
            meaning: item.meaning,
            example: item.example,
            source: "import" as const,
            createdAt: new Date().toISOString()
          }));
          importVocabulary(items);
        } else {
          const items = parseVocabularyCsv(text, profile.id).map((item) => ({
            ...item,
            source: "import" as const
          }));
          importVocabulary(items);
        }
      } catch (error) {
        console.error(error);
        alert("导入失败，请检查文件格式。");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleExportCsv() {
    const blob = new Blob([exportVocabularyCsv(vocabulary)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocabulary-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    const blob = new Blob([exportVocabularyJson(vocabulary)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocabulary-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />{t("\u8BCD\u6C47\u672C")}

          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word">{t("\u5355\u8BCD / \u77ED\u8BED")}</Label>
              <input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder={t("\u4F8B\u5982\uFF1Aambiguous")}
                className="w-full border rounded-md px-3 py-2 text-sm" />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="meaning">{t("\u91CA\u4E49")}</Label>
              <input
                id="meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder={t("\u4F8B\u5982\uFF1A\u6A21\u7CCA\u7684\uFF1B\u4E0D\u660E\u786E\u7684")}
                className="w-full border rounded-md px-3 py-2 text-sm" />
              
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="example">{t("\u4F8B\u53E5\uFF08\u53EF\u9009\uFF09")}</Label>
            <input
              id="example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="His answer was ambiguous."
              className="w-full border rounded-md px-3 py-2 text-sm" />
            
          </div>
          <Button onClick={handleAdd} disabled={!word.trim() || !meaning.trim()}>{t("\u6DFB\u52A0\u5230\u8BCD\u6C47\u672C")}

          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("\u5BFC\u5165 / \u5BFC\u51FA")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            type="file"
            accept=".csv,.json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden" />
          
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />{t("\u5BFC\u5165 CSV/JSON")}

          </Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />{t("\u5BFC\u51FA CSV")}

          </Button>
          <Button variant="outline" onClick={handleExportJson}>
            <Download className="w-4 h-4 mr-2" />{t("\u5BFC\u51FA JSON")}

          </Button>
          <Button variant="outline" onClick={() => router.push("/vocabulary/review")}>
            <Brain className="w-4 h-4 mr-2" />{t("\u95EA\u5361\u590D\u4E60")}

          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("\u5DF2\u6709\u8BCD\u6C47\uFF08")}{vocabulary.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          {vocabulary.length === 0 ?
          <p className="text-gray-500">{t("\u6682\u65E0\u8BCD\u6C47\uFF0C\u8BF7\u624B\u52A8\u6DFB\u52A0\u6216\u5BFC\u5165\u3002")}</p> :

          <div className="space-y-3">
              {vocabulary.map((item) =>
            <div
              key={item.id}
              className="flex items-start justify-between border rounded-lg p-3">
              
                  <div>
                    <p className="font-bold text-lg">{item.word}</p>
                    <p className="text-sm text-gray-700">{item.meaning}</p>
                    {item.example &&
                <p className="text-xs text-gray-500 mt-1">{item.example}</p>
                }
                  </div>
                  <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVocabulary(item.id)}
                aria-label={t("\u5220\u9664")}>
                
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}