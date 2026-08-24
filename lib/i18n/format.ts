/**
 * @file lib/i18n/format.ts
 * @description 日期/数字/得分本地化工具（跟随 I18nProvider 当前语言）
 * @author English Agent Team
 * @date 2026-08-24
 */

import { getLocale } from "@/lib/i18n/translate";

function normalizeDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/** 本地化日期 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  return new Intl.DateTimeFormat(getLocale(), options).format(normalizeDate(date));
}

/** 本地化数字 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(getLocale(), options).format(value);
}

/** 本地化得分（保留一位小数） */
export function formatScore(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** 本地化练习次数/天数等整数 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}
