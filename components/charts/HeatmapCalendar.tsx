"use client";

interface HeatmapCalendarProps {
  data: Record<string, number>;
}

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
          title={`${day.date.toLocaleDateString()}: ${day.count} 次练习`}
          className={`aspect-square rounded-sm ${getColor(day.count)}`}
        />
      ))}
    </div>
  );
}
