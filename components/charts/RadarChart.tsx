/**
 * @file components/charts/RadarChart.tsx
 * @description 能力雷达图组件
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface SkillRadarChartProps {
  data: {
    subject: string;
    value: number;
    fullMark: number;
  }[];
}

/**
 * 技能雷达图组件
 * @param props - 雷达图属性
 * @param props.data - 雷达图数据
 * @returns 雷达图 JSX 元素
 */
export function SkillRadarChart({ data }: SkillRadarChartProps) {
  // recharts 3.x 在 React 19 下类型不兼容，用断言绕过
  const TypedPolarAngleAxis = PolarAngleAxis as unknown as React.FC<{ dataKey: string }>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <TypedPolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar
          name="能力值"
          dataKey="value"
          stroke="#2563eb"
          fill="#3b82f6"
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
