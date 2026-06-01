"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = [
  "#4f86f7", "#f7c948", "#e05c5c", "#5cbf85", "#a78bfa",
  "#fb923c", "#34d399", "#60a5fa", "#f472b6", "#94a3b8",
];

interface Props {
  data: { agent: string; count: number; commission: number; currency: string }[];
}

export default function SalesBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400 text-sm">
        Продажів ще немає
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="agent" tick={false} axisLine={false} tickLine={false} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip
          cursor={{ fill: "#f9fafb" }}
          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 12 }}
          formatter={(value: number, name: string) =>
            name === "count" ? [`${value} продажів`, "Продажі"] : value
          }
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
