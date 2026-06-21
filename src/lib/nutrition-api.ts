export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return [];

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();

  return (data.products ?? [])
    .filter((p: Record<string, unknown>) => p.product_name && p.nutriments)
    .map((p: Record<string, unknown>): FoodSearchResult => {
      const n = p.nutriments as Record<string, number>;
      return {
        id: p.code as string ?? String(Math.random()),
        name: p.product_name as string,
        brand: p.brands as string | undefined,
        calories: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
        protein: Math.round(n['proteins_100g'] ?? n['proteins'] ?? 0),
        carbs: Math.round(n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0),
        fat: Math.round(n['fat_100g'] ?? n['fat'] ?? 0),
        servingSize: p.serving_size as string | undefined,
      };
    })
    .filter((f: FoodSearchResult) => f.calories > 0);
}
