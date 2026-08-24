/**
 * @file scripts/extract-chinese.ts
 * @description 从 TSX 中提取含中文的字符串，并生成 messages/_extracted.json 供翻译
 * @author English Agent Team
 * @date 2026-08-24
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

const root = process.cwd();
const targetDirs = ["app", "components"];

const extracted = new Set<string>();

function hasChinese(str: string) {
  return /[一-鿿]/.test(str);
}

function collectFromFile(filePath: string) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    StringLiteral(pathNode) {
      const value = pathNode.node.value;
      if (hasChinese(value) && value.trim()) {
        // 避免重复包裹 t("...")
        if (t.isCallExpression(pathNode.parent) && t.isIdentifier(pathNode.parent.callee, { name: "t" })) {
          return;
        }
        extracted.add(value);
      }
    },
    JSXText(pathNode) {
      const value = pathNode.node.value;
      if (hasChinese(value) && value.trim()) {
        extracted.add(value.trim());
      }
    },
  });
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith(".tsx")) {
      collectFromFile(fullPath);
    }
  }
}

for (const dir of targetDirs) {
  walk(path.join(root, dir));
}

const output: Record<string, string> = {};
[...extracted].sort().forEach((str) => {
  output[str] = str;
});

fs.writeFileSync(path.join(root, "messages", "_extracted.json"), JSON.stringify(output, null, 2), "utf-8");

console.log(`Extracted ${extracted.size} Chinese strings to messages/_extracted.json`);
