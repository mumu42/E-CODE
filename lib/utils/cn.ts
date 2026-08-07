/**
 * @file lib/utils/cn.ts
 * @description 通用 CSS 类名合并工具函数
 * @author English Agent Team
 * @date 2026-08-07
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 clsx 条件类名与 tailwind-merge 去重结果
 * @param inputs - 任意类名值（字符串、数组、对象等）
 * @returns 合并并去重后的类名字符串
 * @example
 * ```ts
 * cn("px-2", "px-4", { "bg-red-500": true });
 * // => "px-4 bg-red-500"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
