"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
  "#4f86f7", "#f7c948", "#e05c5c", "#5cbf85", "#a78bfa",
  "#fb923c", "#34d399", "#60a5fa", "#f472b6", "#94a3b8",
];

interface Props {
  data: { name: string; value: number }[];
  title: string;
}

export default function SourcePieChart({ data, title }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center min-h-[260px]">
        <p className="text-sm font-semibold text-navy-900 mb-1">{title}</p>
        <p className="text-gray-400 text-sm">Немає даних</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`, ""]}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
