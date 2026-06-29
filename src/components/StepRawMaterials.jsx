import { usePlanner } from '../context/PlannerContext';
import { RECIPES } from '../data/recipes';
import { DECORATIONS } from '../data/decorations';
import { getEffectiveGuestCount, getHeadCount } from '../utils/calculations';
import { useState } from 'react';

function parseIngredientQty(str) {
  const fractionMap = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 0.333, '⅔': 0.667, '⅛': 0.125 };
  let s = str.trim();

  for (const [frac, val] of Object.entries(fractionMap)) {
    if (s.startsWith(frac)) {
      const rest = s.slice(frac.length).trim();
      const unitMatch = rest.match(/^(cups?|tbsp|tsp|g|kg|ml|l|cans?|packets?|cloves?|pieces?|sheets?|slices?|large|medium|small)\b/i);
      if (unitMatch) {
        return { qty: val, unit: unitMatch[1].toLowerCase(), item: rest.slice(unitMatch[0].length).replace(/^[\s,]+/, '').trim() || s };
      }
      return { qty: val, unit: '', item: rest || s };
    }
  }

  const numMatch = s.match(/^(\d+(?:\.\d+)?)\s*/);
  if (numMatch) {
    let qty = parseFloat(numMatch[1]);
    let rest = s.slice(numMatch[0].length);

    for (const [frac, val] of Object.entries(fractionMap)) {
      if (rest.startsWith(frac)) {
        qty += val;
        rest = rest.slice(frac.length).trim();
        break;
      }
    }

    const unitMatch = rest.match(/^(cups?|tbsp|tsp|g|kg|ml|l|cans?|packets?|cloves?|pieces?|sheets?|slices?|large|medium|small)\b/i);
    if (unitMatch) {
      return { qty, unit: unitMatch[1].toLowerCase(), item: rest.slice(unitMatch[0].length).replace(/^[\s,]+/, '').trim() || s };
    }
    return { qty, unit: '', item: rest.trim() || s };
  }

  return { qty: null, unit: '', item: s };
}

function normalizeUnit(unit) {
  const map = { cup: 'cups', can: 'cans', packet: 'packets', clove: 'cloves', piece: 'pieces', sheet: 'sheets', slice: 'slices' };
  return map[unit] || unit;
}

function buildIngredientList(selectedMenu, scaleFactor) {
  const allItems = [];
  const categories = ['appetizers', 'mains', 'desserts'];

  for (const cat of categories) {
    for (const item of selectedMenu[cat] || []) {
      const recipe = RECIPES[item.name];
      if (!recipe) continue;

      const recipeScale = scaleFactor / (recipe.servings || 8);

      for (const ingStr of recipe.ingredients) {
        const parsed = parseIngredientQty(ingStr);
        allItems.push({
          dish: item.name,
          raw: ingStr,
          qty: parsed.qty ? Math.ceil(parsed.qty * recipeScale * 10) / 10 : null,
          unit: normalizeUnit(parsed.unit),
          item: parsed.item,
          originalQty: parsed.qty,
        });
      }
    }
  }

  return allItems;
}

function aggregateIngredients(items) {
  const grouped = {};
  for (const ing of items) {
    const key = ing.item.toLowerCase().replace(/[,\s]+$/, '');
    if (!grouped[key]) {
      grouped[key] = { item: ing.item, qty: 0, unit: ing.unit, dishes: [], hasQty: false };
    }
    if (ing.qty !== null) {
      grouped[key].qty += ing.qty;
      grouped[key].hasQty = true;
    }
    if (!grouped[key].dishes.includes(ing.dish)) {
      grouped[key].dishes.push(ing.dish);
    }
  }

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      qty: g.hasQty ? Math.ceil(g.qty * 10) / 10 : null,
      display: g.hasQty ? `${g.qty} ${g.unit}`.trim() : 'As needed',
    }))
    .sort((a, b) => a.item.localeCompare(b.item));
}

const CUTLERY_CONFIG = {
  buffet: {
    label: 'Buffet',
    perGuest: [
      { item: 'Dinner plates', qty: 1.5, icon: '🍽️' },
      { item: 'Side plates', qty: 1, icon: '🥗' },
      { item: 'Forks', qty: 2, icon: '🍴' },
      { item: 'Spoons', qty: 2, icon: '🥄' },
      { item: 'Knives', qty: 1, icon: '🔪' },
      { item: 'Water glasses', qty: 1, icon: '🥛' },
      { item: 'Beverage glasses', qty: 1.5, icon: '🥤' },
      { item: 'Paper napkins', qty: 3, icon: '🧻' },
    ],
    shared: [
      { item: 'Serving spoons / ladles', perDish: true, icon: '🥄' },
      { item: 'Serving bowls / platters', perDish: true, icon: '🥘' },
      { item: 'Chafing dishes / warmers', perHotDish: true, icon: '🔥' },
      { item: 'Tongs', qty: 3, icon: '🦀' },
      { item: 'Ice bucket', qty: 1, icon: '🧊' },
    ],
  },
  sitdown: {
    label: 'Sit-Down Dinner',
    perGuest: [
      { item: 'Dinner plates', qty: 1, icon: '🍽️' },
      { item: 'Appetizer plates', qty: 1, icon: '🥗' },
      { item: 'Dessert plates', qty: 1, icon: '🍰' },
      { item: 'Dinner forks', qty: 1, icon: '🍴' },
      { item: 'Salad forks', qty: 1, icon: '🥗' },
      { item: 'Dinner knives', qty: 1, icon: '🔪' },
      { item: 'Soup spoons', qty: 1, icon: '🥄' },
      { item: 'Dessert spoons', qty: 1, icon: '🥄' },
      { item: 'Water glasses', qty: 1, icon: '🥛' },
      { item: 'Wine/beverage glasses', qty: 1, icon: '🍷' },
      { item: 'Cloth napkins', qty: 1, icon: '🧣' },
    ],
    shared: [
      { item: 'Serving spoons / ladles', perDish: true, icon: '🥄' },
      { item: 'Serving platters', perDish: true, icon: '🍽️' },
      { item: 'Bread baskets', qty: Math.ceil, perTable: true, icon: '🍞' },
      { item: 'Salt & pepper sets', perTable: true, icon: '🧂' },
      { item: 'Water pitchers', perTable: true, icon: '🫗' },
    ],
  },
  cocktail: {
    label: 'Cocktail Style',
    perGuest: [
      { item: 'Small plates / appetizer plates', qty: 3, icon: '🥗' },
      { item: 'Cocktail forks', qty: 2, icon: '🍴' },
      { item: 'Cocktail napkins', qty: 5, icon: '🧻' },
      { item: 'Glasses (cocktail/wine)', qty: 2, icon: '🍸' },
    ],
    shared: [
      { item: 'Serving trays', qty: 4, icon: '🍽️' },
      { item: 'Cocktail picks / toothpicks', qty: 1, icon: '📌', unit: 'box' },
      { item: 'Ice bucket', qty: 2, icon: '🧊' },
      { item: 'Bar tools set', qty: 1, icon: '🍹' },
    ],
  },
  familyStyle: {
    label: 'Family Style',
    perGuest: [
      { item: 'Dinner plates', qty: 1, icon: '🍽️' },
      { item: 'Side plates', qty: 1, icon: '🥗' },
      { item: 'Forks', qty: 2, icon: '🍴' },
      { item: 'Spoons', qty: 1, icon: '🥄' },
      { item: 'Knives', qty: 1, icon: '🔪' },
      { item: 'Water glasses', qty: 1, icon: '🥛' },
      { item: 'Beverage glasses', qty: 1, icon: '🥤' },
      { item: 'Napkins', qty: 2, icon: '🧻' },
    ],
    shared: [
      { item: 'Large sharing platters', perDish: true, icon: '🍽️' },
      { item: 'Serving spoons', perDish: true, icon: '🥄' },
      { item: 'Bread baskets', perTable: true, icon: '🍞' },
      { item: 'Water pitchers', perTable: true, icon: '🫗' },
    ],
  },
  stations: {
    label: 'Food Stations',
    perGuest: [
      { item: 'Plates (multiple rounds)', qty: 2, icon: '🍽️' },
      { item: 'Forks', qty: 2, icon: '🍴' },
      { item: 'Spoons', qty: 1, icon: '🥄' },
      { item: 'Napkins', qty: 3, icon: '🧻' },
      { item: 'Beverage glasses', qty: 1.5, icon: '🥤' },
    ],
    shared: [
      { item: 'Station serving utensils', perDish: true, icon: '🥄' },
      { item: 'Station platters / bowls', perDish: true, icon: '🥘' },
      { item: 'Chafing dishes', perHotDish: true, icon: '🔥' },
      { item: 'Station labels / signs', perDish: true, icon: '🏷️' },
      { item: 'Tongs', qty: 4, icon: '🦀' },
    ],
  },
  picnic: {
    label: 'Picnic / Casual',
    perGuest: [
      { item: 'Paper / disposable plates', qty: 2, icon: '🍽️' },
      { item: 'Plastic forks', qty: 2, icon: '🍴' },
      { item: 'Plastic spoons', qty: 1, icon: '🥄' },
      { item: 'Paper cups', qty: 2, icon: '🥤' },
      { item: 'Paper napkins', qty: 4, icon: '🧻' },
    ],
    shared: [
      { item: 'Serving bowls', perDish: true, icon: '🥘' },
      { item: 'Serving spoons', perDish: true, icon: '🥄' },
      { item: 'Cooler / ice box', qty: 1, icon: '🧊' },
      { item: 'Trash bags', qty: 3, icon: '🗑️' },
      { item: 'Wet wipes pack', qty: 2, icon: '🧴' },
    ],
  },
};

function getCutleryList(servingStyleId, headCount, dishCount) {
  const config = CUTLERY_CONFIG[servingStyleId] || CUTLERY_CONFIG.buffet;
  const tablesEstimate = Math.max(1, Math.ceil(headCount / 8));
  const hotDishEstimate = Math.max(1, Math.ceil(dishCount * 0.6));

  const perGuestItems = config.perGuest.map((c) => ({
    ...c,
    total: Math.ceil(c.qty * headCount),
    note: `${c.qty} per guest`,
  }));

  const sharedItems = config.shared.map((c) => {
    let total;
    let note;
    if (c.perDish) {
      total = dishCount;
      note = '1 per dish';
    } else if (c.perHotDish) {
      total = hotDishEstimate;
      note = '1 per hot dish';
    } else if (c.perTable) {
      total = tablesEstimate;
      note = `1 per table (~${tablesEstimate} tables)`;
    } else {
      total = c.qty;
      note = 'fixed';
    }
    return { ...c, total, note };
  });

  return { label: config.label, perGuest: perGuestItems, shared: sharedItems };
}

export default function StepRawMaterials() {
  const { state, dispatch } = usePlanner();
  const [showByDish, setShowByDish] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const headCount = getHeadCount(state);
  const effectiveCount = getEffectiveGuestCount(state);
  const servingStyleId = state.servingStyle?.id || 'buffet';

  const allIngredients = buildIngredientList(state.selectedMenu, effectiveCount);
  const aggregated = aggregateIngredients(allIngredients);

  const dishCount =
    (state.selectedMenu.appetizers?.length || 0) +
    (state.selectedMenu.mains?.length || 0) +
    (state.selectedMenu.desserts?.length || 0);

  const cutlery = getCutleryList(servingStyleId, headCount, dishCount);

  const dishesWithRecipes = new Set(allIngredients.map((i) => i.dish));
  const allMenuDishes = [];
  for (const cat of ['appetizers', 'mains', 'desserts']) {
    for (const item of state.selectedMenu[cat] || []) {
      allMenuDishes.push(item.name);
    }
  }
  const dishesWithoutRecipes = allMenuDishes.filter((d) => !dishesWithRecipes.has(d));

  const toggleCheck = (key) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCheckable = aggregated.length + cutlery.perGuest.length + cutlery.shared.length;

  return (
    <div className="step-content">
      <h2>Raw Materials & Cutlery</h2>
      <p className="step-subtitle">
        Everything you need to buy and arrange for {headCount} guests ({effectiveCount}x appetite-adjusted servings)
      </p>

      {checkedCount > 0 && (
        <div className="rm-progress-bar">
          <div className="rm-progress-fill" style={{ width: `${(checkedCount / totalCheckable) * 100}%` }} />
          <span className="rm-progress-text">{checkedCount}/{totalCheckable} items checked</span>
        </div>
      )}

      <div className="rm-section">
        <div className="rm-section-header">
          <h3>🛒 Ingredients Shopping List</h3>
          <div className="rm-toggle-group">
            <button
              className={`rm-view-btn ${!showByDish ? 'active' : ''}`}
              onClick={() => setShowByDish(false)}
            >
              Consolidated
            </button>
            <button
              className={`rm-view-btn ${showByDish ? 'active' : ''}`}
              onClick={() => setShowByDish(true)}
            >
              By Dish
            </button>
          </div>
        </div>

        {!showByDish ? (
          <div className="rm-list">
            {aggregated.map((ing) => (
              <label
                key={ing.item}
                className={`rm-item ${checkedItems[`ing-${ing.item}`] ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[`ing-${ing.item}`]}
                  onChange={() => toggleCheck(`ing-${ing.item}`)}
                />
                <span className="rm-item-qty">{ing.display}</span>
                <span className="rm-item-name">{ing.item}</span>
                <span className="rm-item-dishes">
                  {ing.dishes.map((d) => (
                    <span key={d} className="rm-dish-tag">{d}</span>
                  ))}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="rm-by-dish">
            {[...dishesWithRecipes].map((dish) => {
              const dishIngredients = allIngredients.filter((i) => i.dish === dish);
              return (
                <div key={dish} className="rm-dish-group">
                  <h4>{dish}</h4>
                  <div className="rm-dish-ingredients">
                    {dishIngredients.map((ing, idx) => (
                      <div key={idx} className="rm-dish-ingredient">
                        <span className="rm-item-qty">
                          {ing.qty !== null ? `${ing.qty} ${ing.unit}`.trim() : 'As needed'}
                        </span>
                        <span className="rm-item-name">{ing.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {dishesWithoutRecipes.length > 0 && (
          <div className="rm-no-recipe-note">
            <strong>No recipe data for:</strong>{' '}
            {dishesWithoutRecipes.join(', ')}
            <span className="rm-hint"> — estimate ingredients separately for these dishes</span>
          </div>
        )}

        {aggregated.length === 0 && (
          <p className="rm-empty">No recipes found for your selected menu items.</p>
        )}
      </div>

      <div className="rm-section">
        <div className="rm-section-header">
          <h3>🍴 Cutlery & Serveware</h3>
          <span className="rm-style-badge">{cutlery.label} style</span>
        </div>

        <p className="rm-cutlery-note">
          Based on {headCount} guests with {cutlery.label.toLowerCase()} service
        </p>

        <div className="rm-cutlery-group">
          <h4>Per-Guest Items</h4>
          <div className="rm-list">
            {cutlery.perGuest.map((c) => (
              <label
                key={c.item}
                className={`rm-item ${checkedItems[`cut-${c.item}`] ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[`cut-${c.item}`]}
                  onChange={() => toggleCheck(`cut-${c.item}`)}
                />
                <span className="rm-item-icon">{c.icon}</span>
                <span className="rm-item-name">{c.item}</span>
                <span className="rm-item-total">{c.total}</span>
                <span className="rm-item-note">{c.note}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rm-cutlery-group">
          <h4>Shared / Serving Items</h4>
          <div className="rm-list">
            {cutlery.shared.map((c) => (
              <label
                key={c.item}
                className={`rm-item ${checkedItems[`srv-${c.item}`] ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[`srv-${c.item}`]}
                  onChange={() => toggleCheck(`srv-${c.item}`)}
                />
                <span className="rm-item-icon">{c.icon}</span>
                <span className="rm-item-name">{c.item}</span>
                <span className="rm-item-total">{c.total}</span>
                <span className="rm-item-note">{c.note}</span>
              </label>
            ))}
          </div>
        </div>

        {state.servingStyle && (
          <div className="rm-style-info">
            <span className="rm-style-info-icon">{state.servingStyle.icon}</span>
            <div>
              <strong>{state.servingStyle.name}</strong>
              <p>{state.servingStyle.description}</p>
            </div>
          </div>
        )}

        {!state.servingStyle && (
          <div className="rm-no-style-note">
            No serving style selected — showing default buffet estimates.
            Go back to Presentation step to choose a serving style.
          </div>
        )}
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          View Summary
        </button>
      </div>
    </div>
  );
}
