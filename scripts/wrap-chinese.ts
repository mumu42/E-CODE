/**
 * @file scripts/wrap-chinese.ts
 * @description 将 app/ 与 components/ 中 TSX 文件的中文 JSX 文本/属性替换为 t("...")
 * @author English Agent Team
 * @date 2026-08-24
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

const root = process.cwd();
const targetDirs = [path.join(root, "app"), path.join(root, "components")];

const EXCLUDED_ATTRIBUTES = new Set([
  "className",
  "class",
  "id",
  "name",
  "key",
  "ref",
  "src",
  "href",
  "to",
  "type",
  "value",
  "defaultValue",
  "htmlFor",
  "for",
  "onClick",
  "onChange",
  "onSubmit",
  "onBlur",
  "onFocus",
  "onKeyDown",
  "onKeyUp",
  "onMouseEnter",
  "onMouseLeave",
]);

function hasChinese(str: string) {
  return /[一-鿿]/.test(str);
}

function createTCall(value: string) {
  return t.callExpression(t.identifier("t"), [t.stringLiteral(value)]);
}

function processStringLiteral(node: t.StringLiteral): t.CallExpression | null {
  const trimmed = node.value.trim();
  if (!trimmed || !hasChinese(trimmed)) return null;
  return createTCall(trimmed);
}

function processJSXText(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !hasChinese(trimmed)) return null;
  return trimmed;
}

function shouldWrapAttribute(name: string) {
  return !EXCLUDED_ATTRIBUTES.has(name);
}

function addImport(ast: t.File) {
  const importPath = "@/lib/i18n/translate";
  const existing = ast.program.body.find(
    (stmt): stmt is t.ImportDeclaration =>
      t.isImportDeclaration(stmt) &&
      stmt.source.value === importPath &&
      stmt.specifiers.some(
        (s) => t.isImportSpecifier(s) && t.isIdentifier(s.imported) && s.imported.name === "t"
      )
  );
  if (existing) return;

  const decl = t.importDeclaration(
    [t.importSpecifier(t.identifier("t"), t.identifier("t"))],
    t.stringLiteral(importPath)
  );
  ast.program.body.unshift(decl);
}

function transformFile(filePath: string) {
  const code = fs.readFileSync(filePath, "utf-8");

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  let changed = false;

  traverse(ast, {
    // 已经包裹在 t(...) 中的字符串不要再处理
    StringLiteral(pathNode) {
      const parent = pathNode.parent;
      if (
        t.isCallExpression(parent) &&
        t.isIdentifier(parent.callee, { name: "t" })
      ) {
        return;
      }
    },
    JSXText(pathNode) {
      const node = pathNode.node;
      const value = processJSXText(node.value);
      if (!value) return;

      // 父节点是 JSXElement，把文本节点替换为 {t("...")}
      const exprContainer = t.jsxExpressionContainer(createTCall(value));
      // 保留原空白：在 Babel 里替换 JSXText 为表达式容器
      pathNode.replaceWith(exprContainer);
      changed = true;
    },
    JSXAttribute(pathNode) {
      const attrName = t.isJSXIdentifier(pathNode.node.name)
        ? pathNode.node.name.name
        : "";
      if (!shouldWrapAttribute(attrName)) return;

      const valueNode = pathNode.node.value;
      if (!valueNode || !t.isStringLiteral(valueNode)) return;

      const call = processStringLiteral(valueNode);
      if (!call) return;

      pathNode.node.value = t.jsxExpressionContainer(call);
      changed = true;
    },
  });

  if (!changed) return false;

  addImport(ast);
  const output = generate(ast, { retainLines: true, compact: false }, code).code;
  fs.writeFileSync(filePath, output, "utf-8");
  return true;
}

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

function main() {
  const files: string[] = [];
  for (const dir of targetDirs) {
    walk(dir, files);
  }

  let transformed = 0;
  for (const file of files) {
    try {
      const changed = transformFile(file);
      if (changed) {
        transformed++;
        console.log("Wrapped:", path.relative(root, file));
      }
    } catch (error) {
      console.error("Failed to transform", file, error);
    }
  }

  console.log(`Transformed ${transformed} files.`);
}

main();
