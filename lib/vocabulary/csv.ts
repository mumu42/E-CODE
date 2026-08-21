/**
 * @file lib/vocabulary/csv.ts
 * @description 词汇本 CSV/JSON 导入导出工具
 * @author English Agent Team
 * @date 2026-08-21
 */

import type { VocabularyItem } from "@/lib/types";

/** CSV 列分隔符 */
const CSV_DELIMITER = ",";

/** 将 CSV 文本解析为词汇条目 */
export function parseVocabularyCsv(csv: string, userId: string): Omit<VocabularyItem, "source">[] {
  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // 跳过表头
  const dataLines = lines[0]?.startsWith("word") ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const [word, meaning, example] = line.split(CSV_DELIMITER).map((s) => s.trim()) as [
        string,
        string,
        string | undefined,
      ];
      if (!word || !meaning) return null;
      return {
        id: crypto.randomUUID(),
        userId,
        word,
        meaning,
        ...(example ? { example } : {}),
        createdAt: new Date().toISOString(),
      };
    })
    .filter((item): item is Omit<VocabularyItem, "source"> => item !== null);
}

/** 将词汇条目导出为 CSV 文本 */
export function exportVocabularyCsv(items: VocabularyItem[]): string {
  const header = "word,meaning,example";
  const rows = items.map((item) => {
    const example = item.example ? `"${item.example.replace(/"/g, '""')}"` : "";
    return `"${item.word}","${item.meaning}",${example}`;
  });
  return [header, ...rows].join("\n");
}

/** 将词汇条目导出为 JSON 文本 */
export function exportVocabularyJson(items: VocabularyItem[]): string {
  return JSON.stringify(items, null, 2);
}
