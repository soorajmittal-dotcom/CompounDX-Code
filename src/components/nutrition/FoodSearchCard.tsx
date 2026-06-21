'use client';

import { FoodSearchResult } from '@/lib/nutrition-api';
import { Plus } from 'lucide-react';

interface FoodSearchCardProps {
  food: FoodSearchResult;
  onAdd: (food: FoodSearchResult) => void;
}

export function FoodSearchCard({ food, onAdd }: FoodSearchCardProps) {
  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-zinc-800 last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-sm font-medium text-zinc-100 truncate">{food.name}</div>
        {food.brand && (
          <div className="text-xs text-zinc-500 truncate">{food.brand}</div>
        )}
        <div className="text-xs text-zinc-400 mt-0.5">
          {food.calories} cal &middot; {food.protein}p &middot; {food.carbs}c &middot; {food.fat}f
          {food.servingSize && <span className="text-zinc-600"> &middot; {food.servingSize}</span>}
        </div>
      </div>
      <button
        onClick={() => onAdd(food)}
        className="shrink-0 h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 active:scale-90 transition-all"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
