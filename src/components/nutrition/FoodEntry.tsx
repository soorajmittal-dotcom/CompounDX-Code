'use client';

import { NutritionEntry } from '@/types';
import { db } from '@/lib/db';
import { Trash2 } from 'lucide-react';

interface FoodEntryProps {
  entry: NutritionEntry;
}

export function FoodEntry({ entry }: FoodEntryProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-100 truncate">{entry.foodName}</div>
        <div className="text-xs text-zinc-500">
          {entry.calories} cal &middot; {entry.protein}p &middot; {entry.carbs}c &middot; {entry.fat}f
          {entry.servingSize && ` &middot; ${entry.servingSize}`}
        </div>
      </div>
      <button
        onClick={() => db.nutrition.delete(entry.id)}
        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
