/**
 * @file scripts/apply-format-locales.ts
 * @description 将源码中的 toLocaleDateString/toLocaleString/toFixed 替换为 i18n format helpers
 * @author English Agent Team
 * @date 2026-08-24
 */

import * as fs from "fs";
import * as path from "path";

const root = process.cwd();
const targetDirs = [path.join(root, "app"), path.join(root, "components"), path.join(root, "lib")];

const REPLACEMENTS: {
  regex: RegExp;
  replacer: (...args: string[]) => string;
  helper: string;
}[] = [
  {
    regex: /new Date\(([^)]+)\)\.toLocaleDateString\(\)/g,
    replacer: (_, expr) => `formatDate(${expr})`,
    helper: "formatDate",
  },
  {
    regex: /new Date\(([^)]+)\)\.toLocaleString\(\)/g,
    replacer: (_, expr) => `formatDate(${expr})`,
    helper: "formatDate",
  },
  {
    regex: /(\w+(?:\.\w+)*)\.toLocaleDateString\(\)/g,
    replacer: (_, expr) => `formatDate(${expr})`,
    helper: "formatDate",
  },
  {
    regex: /(\w+(?:\.\w+)*)\.toFixed\(1\)/g,
    replacer: (_, expr) => `formatScore(${expr})`,
    helper: "formatScore",
  },
];

function transformFile(filePath: string) {
  let code = fs.readFileSync(filePath, "utf-8");
  const helpers = new Set<string>();

  for (const { regex, replacer, helper } of REPLACEMENTS) {
    if (regex.test(code)) {
      code = code.replace(regex, replacer);
      helpers.add(helper);
    }
  }

  if (helpers.size === 0) return false;

  const importLine = `import { ${Array.from(helpers).join(", ")} } from "@/lib/i18n/format";`;
  if (!code.includes("@/lib/i18n/format")) {
    // Insert after "use client" / "use server" directive if present
    const directiveMatch = code.match(/^("use (client|server)";)/m);
    if (directiveMatch) {
      const idx = code.indexOf(directiveMatch[0]) + directiveMatch[0].length;
      code = code.slice(0, idx) + "\n" + importLine + code.slice(idx);
    } else {
      code = importLine + "\n" + code;
    }
  }

  fs.writeFileSync(filePath, code, "utf-8");
  return true;
}

function walk(dir: string, files: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }
}

function main() {
  const files: string[] = [];
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) continue;
    walk(dir, files);
  }

  let transformed = 0;
  for (const file of files) {
    try {
      if (transformFile(file)) {
        transformed++;
        console.log("Formatted:", path.relative(root, file));
      }
    } catch (error) {
      console.error("Failed to format", file, error);
    }
  }
  console.log(`Formatted ${transformed} files.`);
}

main();
