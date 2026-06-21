import { MENU_DATABASE, DRINKS } from '../data/menuItems';

const DIFFICULTY_RANK = { easy: 1, medium: 2, hard: 3 };
const SKILL_MAP = { beginner: 1, medium: 2, advanced: 3, pro: 4 };

export function generateRecommendation(state) {
  const { cuisines, guestCount, budget, timeAvailable, cookingSkill, foodSource, dietaryNeeds } = state;
  const isVeg = dietaryNeeds.includes('vegetarian') || dietaryNeeds.includes('vegan');
  const maxDifficulty = SKILL_MAP[cookingSkill] || 2;
  const selfCooking = foodSource === 'self' || foodSource === 'mix';

  const allItems = { starters: [], mains: [], sides: [], desserts: [] };
  for (const cuisine of cuisines) {
    const menu = MENU_DATABASE[cuisine.id];
    if (!menu) continue;
    for (const cat of Object.keys(allItems)) {
      if (!menu[cat]) continue;
      for (const item of menu[cat]) {
        if (isVeg && !item.veg) continue;
        if (selfCooking && DIFFICULTY_RANK[item.difficulty] > maxDifficulty) continue;
        if (!allItems[cat].find((i) => i.name === item.name)) {
          allItems[cat].push({ ...item, cuisine: cuisine.name });
        }
      }
    }
  }

  const perPersonBudget = budget / guestCount;
  const foodBudgetRatio = 0.65;
  const drinkBudgetRatio = 0.2;
  const perPersonFood = perPersonBudget * foodBudgetRatio;
  const perPersonDrink = perPersonBudget * drinkBudgetRatio;

  const selected = { starters: [], mains: [], sides: [], desserts: [] };
  let remainingFoodBudget = perPersonFood;
  let remainingTime = timeAvailable;

  const targets = { starters: 2, mains: 2, sides: 2, desserts: 1 };
  if (guestCount > 30) {
    targets.starters = 3;
    targets.mains = 3;
    targets.sides = 3;
    targets.desserts = 2;
  }

  for (const cat of ['mains', 'starters', 'sides', 'desserts']) {
    const sorted = [...allItems[cat]].sort((a, b) => {
      const costScore = a.costPerServing - b.costPerServing;
      const timeScore = a.prepTime - b.prepTime;
      return costScore * 0.6 + timeScore * 0.4;
    });

    let count = 0;
    for (const item of sorted) {
      if (count >= targets[cat]) break;
      if (item.costPerServing > remainingFoodBudget) continue;
      if (selfCooking && item.prepTime > remainingTime) continue;
      selected[cat].push(item);
      remainingFoodBudget -= item.costPerServing;
      if (selfCooking && item.prepTime > remainingTime * 0.5) {
        remainingTime -= item.prepTime * 0.3;
      }
      count++;
    }
  }

  const selectedDrinks = [];
  const drinkPool = [...DRINKS.nonAlcoholic];
  const sortedDrinks = drinkPool.sort((a, b) => a.costPerServing - b.costPerServing);
  let drinkBudget = perPersonDrink;
  for (const drink of sortedDrinks) {
    if (selectedDrinks.length >= 2) break;
    if (drink.costPerServing <= drinkBudget) {
      selectedDrinks.push(drink);
      drinkBudget -= drink.costPerServing;
    }
  }

  return { selectedMenu: selected, selectedDrinks };
}
