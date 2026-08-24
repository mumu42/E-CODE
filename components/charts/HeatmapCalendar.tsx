/**
 * @file components/charts/HeatmapCalendar.tsx
 * @description 练习热力图日历组件
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";
import { formatDate } from "@/lib/i18n/format";

interface HeatmapCalendarProps {
  data: Record<string, number>;
}

/**
 * 热力图日历组件
 * @param props - 热力图属性
 * @param props.data - 日期到练习次数的映射数据
 * @returns 热力图日历 JSX 元素
 */
export function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const today = new Date();
  const days: { date: Date; count: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    days.push({ date, count: data[key] || 0 });
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count < 3) return "bg-green-200 dark:bg-green-900";
    if (count < 5) return "bg-green-400 dark:bg-green-700";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, idx) => (
        <div
          key={idx}
          title={`${formatDate(day.date)}: ${day.count} 次练习`}
          className={`aspect-square rounded-sm ${getColor(day.count)}`}
        />
      ))}
    </div>
  );
}
