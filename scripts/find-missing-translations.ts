/**
 * @file scripts/find-missing-translations.ts
 * @description 找出源码中 t("...") 调用但 translations.json 缺失的 key
 * @author English Agent Team
 * @date 2026-08-25
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

const root = process.cwd();
const translations = JSON.parse(
  fs.readFileSync(path.join(root, "messages", "translations.json"), "utf-8")
) as Record<string, string>;

const missing = new Set<string>();
const seen = new Set<string>();

function walk(dir: string, files: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
}

function collectTCalls(filePath: string) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    CallExpression(pathNode) {
      const { node } = pathNode;
      if (!t.isIdentifier(node.callee, { name: "t" })) return;
      const firstArg = node.arguments[0];
      if (!t.isStringLiteral(firstArg)) return;
      const key = firstArg.value;
      seen.add(key);
      if (!(key in translations)) {
        missing.add(key);
      }
    },
  });
}

const files: string[] = [];
walk(path.join(root, "app"), files);
walk(path.join(root, "components"), files);

for (const file of files) {
  try {
    collectTCalls(file);
  } catch (error) {
    console.error("Failed to parse", file, error);
  }
}

console.log(`Total t() keys: ${seen.size}`);
console.log(`Missing translations: ${missing.size}`);
for (const key of [...missing].sort()) {
  console.log(JSON.stringify(key));
}
