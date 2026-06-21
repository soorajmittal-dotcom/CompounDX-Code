'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

interface VolumeChartProps {
  data: { date: string; volume: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-zinc-500">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'M/d')}
            tick={{ fontSize: 11, fill: '#71717a' }}
            stroke="#3f3f46"
          />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} stroke="#3f3f46" />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
            formatter={(value) => [`${Number(value).toLocaleString()} lbs`, 'Volume']}
          />
          <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
