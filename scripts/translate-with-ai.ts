/**
 * @file scripts/translate-with-ai.ts
 * @description 使用本地 AI Provider 将 messages/_extracted.json 中的中文翻译成英文
 * @author English Agent Team
 * @date 2026-08-24
 */

import * as fs from "fs";
import * as path from "path";
import { callAI } from "@/lib/ai/provider";

const root = process.cwd();
const extractedPath = path.join(root, "messages", "_extracted.json");
const outputPath = path.join(root, "messages", "translations.json");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const BATCH_SIZE = 25;

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function safeParseJson<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

async function translateBatch(batch: string[], attempt = 0): Promise<Record<string, string>> {
  const prompt = [
    "Translate the following UI strings from Chinese to English.",
    "Return a JSON object where keys are the original Chinese strings and values are the English translations.",
    "Keep any placeholders, variables, and formatting unchanged (e.g. {{variable}}, /, ·, emoji, numbers).",
    "Use concise, natural English suitable for a language-learning app UI.",
    "JSON only:",
    JSON.stringify(batch, null, 2),
  ].join("\n");

  try {
    const { result } = await callAI({ prompt, maxTokens: 4096 });
    const parsed = safeParseJson<Record<string, string>>(result);
    if (!parsed) {
      console.error("Raw response (first 1000 chars):", result.slice(0, 1000));
      throw new Error("Failed to parse AI response");
    }
    return parsed;
  } catch (error) {
    if (attempt < 2) {
      console.warn(`Batch failed, retrying... (${attempt + 1})`);
      return translateBatch(batch, attempt + 1);
    }
    throw error;
  }
}

async function main() {
  if (!fs.existsSync(extractedPath)) {
    console.error("Extracted file not found:", extractedPath);
    process.exit(1);
  }

  const extracted = JSON.parse(fs.readFileSync(extractedPath, "utf-8")) as Record<string, string>;
  const keys = Object.keys(extracted);
  const batches = chunk(keys, BATCH_SIZE);

  const translations: Record<string, string> = {};

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Translating batch ${i + 1}/${batches.length} (${batch.length} strings)...`);
    const result = await translateBatch(batch);
    Object.assign(translations, result);
    // Be nice to the API
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Ensure every key has a value; fallback to original Chinese if missing
  for (const key of keys) {
    if (typeof translations[key] !== "string" || !translations[key]) {
      translations[key] = key;
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2), "utf-8");
  console.log(`Saved ${Object.keys(translations).length} translations to ${outputPath}`);
}

main().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
