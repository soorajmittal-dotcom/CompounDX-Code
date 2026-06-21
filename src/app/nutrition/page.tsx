'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NutritionSummary } from '@/components/nutrition/NutritionSummary';
import { FoodEntry } from '@/components/nutrition/FoodEntry';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useNutritionLog, useSettings } from '@/lib/db-hooks';
import { db } from '@/lib/db';
import { todayStr } from '@/lib/utils';
import { NutritionEntry } from '@/types';
import { Apple, Plus } from 'lucide-react';

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function NutritionPage() {
  const today = todayStr();
  const entries = useNutritionLog(today);
  const settings = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [mealType, setMealType] = useState<typeof mealTypes[number]>('lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleAdd = async () => {
    if (!foodName || !calories) return;

    const entry: NutritionEntry = {
      id: uuid(),
      date: today,
      mealType,
      foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      createdAt: Date.now(),
    };

    await db.nutrition.add(entry);
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setShowAdd(false);
  };

  const groupedEntries = mealTypes.reduce((acc, type) => {
    acc[type] = entries?.filter((e) => e.mealType === type) ?? [];
    return acc;
  }, {} as Record<string, NutritionEntry[]>);

  return (
    <div>
      <Header
        title="Nutrition"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {settings && entries && (
          <Card>
            <NutritionSummary entries={entries} settings={settings} />
          </Card>
        )}

        {entries && entries.length === 0 && (
          <EmptyState
            icon={Apple}
            title="No food logged today"
            description="Track your meals to monitor your nutrition"
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" /> Log Food
              </Button>
            }
          />
        )}

        {mealTypes.map((type) => {
          const items = groupedEntries[type];
          if (!items || items.length === 0) return null;
          return (
            <div key={type}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 capitalize">{type}</h3>
              <Card>
                {items.map((entry) => (
                  <FoodEntry key={entry.id} entry={entry} />
                ))}
              </Card>
            </div>
          );
        })}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Food">
        <div className="space-y-3">
          <div className="flex gap-2">
            {mealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  type === mealType ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <Input label="Food Name" placeholder="e.g. Chicken breast" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Calories" type="number" inputMode="numeric" placeholder="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
            <Input label="Protein (g)" type="number" inputMode="numeric" placeholder="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
            <Input label="Carbs (g)" type="number" inputMode="numeric" placeholder="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            <Input label="Fat (g)" type="number" inputMode="numeric" placeholder="0" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>

          <Button onClick={handleAdd} disabled={!foodName || !calories} className="w-full">
            Add Food
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
