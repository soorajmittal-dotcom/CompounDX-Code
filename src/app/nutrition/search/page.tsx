'use client';

import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FoodSearchCard } from '@/components/nutrition/FoodSearchCard';
import { searchFoods, FoodSearchResult } from '@/lib/nutrition-api';
import { db } from '@/lib/db';
import { todayStr } from '@/lib/utils';
import { Search, Apple } from 'lucide-react';

export default function FoodSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const foods = await searchFoods(query);
      setResults(foods);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [query]);

  const handleAdd = async (food: FoodSearchResult) => {
    await db.nutrition.add({
      id: uuid(),
      date: todayStr(),
      mealType: 'snack',
      foodName: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize,
      createdAt: Date.now(),
    });
    setAdded(food.id);
    setTimeout(() => setAdded(null), 2000);
  };

  return (
    <div>
      <Header title="Search Food" showBack />

      <div className="px-4 py-4 space-y-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search foods (e.g. chicken breast)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {added && (
          <div className="p-3 rounded-xl bg-emerald-900/20 text-emerald-400 text-sm text-center">
            Added to today&apos;s nutrition log
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
            Searching OpenFoodFacts...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <EmptyState
            icon={Apple}
            title="No results found"
            description="Try a different search term"
          />
        )}

        {results.length > 0 && (
          <Card>
            {results.map((food) => (
              <FoodSearchCard key={food.id} food={food} onAdd={handleAdd} />
            ))}
          </Card>
        )}

        {!searched && (
          <div className="text-center py-12 text-zinc-600 text-sm">
            Search the OpenFoodFacts database for nutritional info
          </div>
        )}
      </div>
    </div>
  );
}
