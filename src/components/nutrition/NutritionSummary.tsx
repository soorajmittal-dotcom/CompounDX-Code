'use client';

import { NutritionEntry, UserSettings } from '@/types';

interface NutritionSummaryProps {
  entries: NutritionEntry[];
  settings: UserSettings;
}

function MacroRing({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#27272a" strokeWidth="4" />
          <circle
            cx="32" cy="32" r={radius} fill="none"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-zinc-100">{current}</span>
        </div>
      </div>
      <span className="text-[10px] text-zinc-400">{label}</span>
      <span className="text-[10px] text-zinc-600">{goal}g</span>
    </div>
  );
}

export function NutritionSummary({ entries, settings }: NutritionSummaryProps) {
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calPct = Math.min((totals.calories / settings.calorieGoal) * 100, 100);
  const calRadius = 44;
  const calCircumference = 2 * Math.PI * calRadius;
  const calOffset = calCircumference - (calPct / 100) * calCircumference;

  return (
    <div className="flex items-center justify-around py-4">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={calRadius} fill="none" stroke="#27272a" strokeWidth="5" />
          <circle
            cx="48" cy="48" r={calRadius} fill="none"
            stroke="#6366f1" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={calCircumference} strokeDashoffset={calOffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-zinc-100">{totals.calories}</span>
          <span className="text-[10px] text-zinc-500">/ {settings.calorieGoal} cal</span>
        </div>
      </div>

      <div className="flex gap-4">
        <MacroRing label="Protein" current={totals.protein} goal={settings.proteinGoal} color="#10b981" />
        <MacroRing label="Carbs" current={totals.carbs} goal={settings.carbGoal} color="#f59e0b" />
        <MacroRing label="Fat" current={totals.fat} goal={settings.fatGoal} color="#ef4444" />
      </div>
    </div>
  );
}
