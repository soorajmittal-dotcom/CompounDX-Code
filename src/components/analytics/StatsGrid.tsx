'use client';

import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${stat.color}`}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-100">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
