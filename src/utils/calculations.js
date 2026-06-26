export function getEffectiveGuestCount(state) {
  const guests = state.guestList || [];
  if (guests.length === 0) return state.guestCount || 0;
  return guests.reduce((sum, g) => sum + (g.appetite || 1), 0);
}

export function getHeadCount(state) {
  return (state.guestList || []).length || state.guestCount || 0;
}

export function calculateBudgetBreakdown(plan) {
  const guestCount = getEffectiveGuestCount(plan);
  const { selectedMenu, selectedDrinks, decoration, servingStyle } = plan;
  const servingMultiplier = servingStyle?.costMultiplier || 1;

  let foodCost = 0;
  const categories = ['starters', 'mains', 'sides', 'desserts', 'appetizers'];
  for (const cat of categories) {
    const items = selectedMenu[cat] || [];
    for (const item of items) {
      foodCost += (item.costPerServing || 0) * guestCount;
    }
  }
  foodCost *= servingMultiplier;

  let drinkCost = 0;
  for (const drink of selectedDrinks || []) {
    drinkCost += (drink.costPerServing || 0) * guestCount;
  }

  const decoCost = (decoration?.costEstimate || 0) * guestCount * 0.3;

  return {
    food: Math.round(foodCost),
    drinks: Math.round(drinkCost),
    decoration: Math.round(decoCost),
    total: Math.round(foodCost + drinkCost + decoCost),
  };
}

export function calculatePrepTime(selectedMenu, selectedDrinks) {
  let maxPrepTime = 0;
  let totalItems = 0;
  const categories = ['starters', 'mains', 'sides', 'desserts', 'appetizers'];

  for (const cat of categories) {
    const items = selectedMenu[cat] || [];
    for (const item of items) {
      if (item.prepTime > maxPrepTime) maxPrepTime = item.prepTime;
      totalItems++;
    }
  }

  const overheadMinutes = totalItems > 3 ? (totalItems - 3) * 15 : 0;
  return maxPrepTime + overheadMinutes;
}

export function getDifficultyScore(selectedMenu) {
  const difficultyMap = { easy: 1, medium: 2, hard: 3 };
  let totalDifficulty = 0;
  let count = 0;
  const categories = ['starters', 'mains', 'sides', 'desserts', 'appetizers'];

  for (const cat of categories) {
    const items = selectedMenu[cat] || [];
    for (const item of items) {
      totalDifficulty += difficultyMap[item.difficulty] || 1;
      count++;
    }
  }

  if (count === 0) return 'N/A';
  const avg = totalDifficulty / count;
  if (avg <= 1.3) return 'Easy';
  if (avg <= 2.2) return 'Medium';
  return 'Hard';
}

export function generateShoppingList(selectedMenu, guestCount) {
  const rawMaterials = {};
  const categories = ['starters', 'mains', 'sides', 'desserts', 'appetizers'];

  for (const cat of categories) {
    const items = selectedMenu[cat] || [];
    for (const item of items) {
      const key = item.name;
      if (!rawMaterials[key]) {
        rawMaterials[key] = {
          name: item.name,
          servings: guestCount,
          estimatedCost: Math.round((item.costPerServing || 0) * guestCount * 100) / 100,
          category: cat,
        };
      }
    }
  }

  return Object.values(rawMaterials);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
