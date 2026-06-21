'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBodyWeight, useSettings } from '@/lib/db-hooks';
import { db } from '@/lib/db';
import { todayStr, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function BodyWeightPage() {
  const entries = useBodyWeight(90);
  const settings = useSettings();
  const [weight, setWeight] = useState('');
  const unit = settings?.weightUnit ?? 'lbs';

  const handleAdd = async () => {
    if (!weight) return;
    const today = todayStr();
    const existing = entries?.find((e) => e.date === today);
    if (existing) {
      await db.bodyweight.update(existing.id, { weight: Number(weight) });
    } else {
      await db.bodyweight.add({
        id: uuid(),
        date: today,
        weight: Number(weight),
        weightUnit: unit,
        createdAt: Date.now(),
      });
    }
    setWeight('');
  };

  const chartData = entries
    ? [...entries].reverse().map((e) => ({ date: e.date, weight: e.weight }))
    : [];

  const latest = entries?.[0];
  const previous = entries?.[1];
  const diff = latest && previous ? latest.weight - previous.weight : 0;
  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <div>
      <Header title="Body Weight" showBack />

      <div className="px-4 py-4 space-y-4">
        <Card>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label={`Today's Weight (${unit})`}
                type="number"
                inputMode="decimal"
                placeholder={latest ? String(latest.weight) : '0'}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} disabled={!weight} className="h-10">
              <Plus className="h-4 w-4 mr-1" /> Log
            </Button>
          </div>
        </Card>

        {latest && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center py-3">
              <div className="text-lg font-bold text-zinc-100">{latest.weight}</div>
              <div className="text-[10px] text-zinc-500">Current ({unit})</div>
            </Card>
            <Card className="text-center py-3">
              <div className="flex items-center justify-center gap-1">
                <TrendIcon className={`h-4 w-4 ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span className={`text-lg font-bold ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-emerald-400' : 'text-zinc-100'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">Change</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-lg font-bold text-zinc-100">{entries?.length ?? 0}</div>
              <div className="text-[10px] text-zinc-500">Entries</div>
            </Card>
          </div>
        )}

        {chartData.length > 1 && (
          <Card>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(parseISO(d), 'M/d')}
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    stroke="#3f3f46"
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    stroke="#3f3f46"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
                    formatter={(value) => [`${value} ${unit}`, 'Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {entries && entries.length === 0 && (
          <EmptyState
            icon={Scale}
            title="No weight logged"
            description="Track your body weight to see trends over time"
          />
        )}

        {entries && entries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">History</h3>
            <Card>
              {entries.slice(0, 14).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-300">{formatDate(entry.date)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-100">{entry.weight} {entry.weightUnit}</span>
                    <button
                      onClick={() => db.bodyweight.delete(entry.id)}
                      className="p-1 text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
