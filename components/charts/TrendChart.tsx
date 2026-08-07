/**
 * @file components/charts/TrendChart.tsx
 * @description 分数趋势折线图组件
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScoreTrendChartProps {
  data: {
    date: string;
    score: number;
  }[];
}

/**
 * 分数趋势图组件
 * @param props - 趋势图属性
 * @param props.data - 趋势图数据
 * @returns 趋势图 JSX 元素
 */
export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
