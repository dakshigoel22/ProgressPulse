'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { date: string; mood: number | null }[];
}

export default function MoodChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
          formatter={(v) => [v, 'Mood']}
        />
        <Line
          type="monotone"
          dataKey="mood"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 3 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
