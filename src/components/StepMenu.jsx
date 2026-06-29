import { usePlanner, DIETARY_TAGS } from '../context/PlannerContext';
import { MENU_DATABASE } from '../data/menuItems';
import { RECIPES } from '../data/recipes';
import { getEffectiveGuestCount, getHeadCount } from '../utils/calculations';
import RecipeModal from './RecipeModal';
import { useState } from 'react';

const CATEGORY_CONFIG = {
  appetizers: {
    label: 'Appetizers',
    icon: '🥗',
    menuKey: 'starters',
    vegCountKey: 'vegAppetizers',
    nonVegCountKey: 'nonVegAppetizers',
    portionPerPerson: 2.5,
  },
  mains: {
    label: 'Main Courses',
    icon: '🍛',
    menuKey: 'mains',
    vegCountKey: 'vegMains',
    nonVegCountKey: 'nonVegMains',
    portionPerPerson: 1,
  },
  desserts: {
    label: 'Desserts',
    icon: '🍰',
    menuKey: 'desserts',
    vegCountKey: 'desserts',
    nonVegCountKey: null,
    portionPerPerson: 1,
  },
};

const CATEGORIES = ['appetizers', 'mains', 'desserts'];
const difficultyColor = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const skillRank = { beginner: 0, medium: 1, advanced: 2, pro: 3 };
const diffRank = { easy: 0, medium: 1, hard: 2 };

function getGuestRestrictions(guestList) {
  const all = new Set();
  for (const g of guestList || []) {
    for (const r of g.restrictions || []) all.add(r);
  }
  return all;
}

function hasConflict(item, restrictions) {
  if (restrictions.size === 0) return null;
  const recipe = RECIPES[item.name];
  const ingredientText = recipe
    ? recipe.ingredients.join(' ').toLowerCase()
    : (item.description || '').toLowerCase() + ' ' + item.name.toLowerCase();

  for (const r of restrictions) {
    const tag = DIETARY_TAGS[r];
    if (!tag) continue;

    if (tag.excludes) {
      for (const ex of tag.excludes) {
        if (ingredientText.includes(ex.toLowerCase())) {
          return { restriction: r, label: tag.label, ingredient: ex };
        }
      }
    }
    if (tag.excludeItems) {
      for (const ex of tag.excludeItems) {
        if (ingredientText.includes(ex.toLowerCase())) {
          return { restriction: r, label: tag.label, ingredient: ex };
        }
      }
    }
  }
  return null;
}

function getAvailableItems(state, category) {
  const config = CATEGORY_CONFIG[category];
  const cuisines = state.cuisinesByCategory[category] || [];
  const items = [];
  const seen = new Set();

  for (const cuisine of cuisines) {
    const cuisineMenu = MENU_DATABASE[cuisine.id];
    if (!cuisineMenu) continue;
    const catItems = cuisineMenu[config.menuKey] || [];
    for (const item of catItems) {
      if (!seen.has(item.name)) {
        seen.add(item.name);
        items.push({ ...item, cuisine: cuisine.name });
      }
    }
  }

  return items;
}

function getSuggestions(state, category) {
  const config = CATEGORY_CONFIG[category];
  const items = getAvailableItems(state, category);
  const vegTarget = state.courseCounts[config.vegCountKey] || 0;
  const nonVegTarget = config.nonVegCountKey ? (state.courseCounts[config.nonVegCountKey] || 0) : 0;
  const showCookFilter = state.foodSource === 'self' || state.foodSource === 'mix';
  const playerSkill = skillRank[state.cookingSkill] ?? 1;
  const restrictions = getGuestRestrictions(state.guestList);

  const score = (item) => {
    let s = 0;
    if (showCookFilter && diffRank[item.difficulty] <= playerSkill) s += 2;
    if (showCookFilter && item.prepTime <= state.timeAvailable) s += 1;
    if (RECIPES[item.name]) s += 1;
    if (hasConflict(item, restrictions)) s -= 5;
    return s;
  };

  const vegItems = items.filter((i) => i.veg).sort((a, b) => score(b) - score(a));
  const nonVegItems = items.filter((i) => !i.veg).sort((a, b) => score(b) - score(a));

  const vegSuggestions = vegItems.slice(0, vegTarget * 3);
  const nonVegSuggestions = nonVegItems.slice(0, nonVegTarget * 3);

  if (category === 'desserts') {
    return items.sort((a, b) => score(b) - score(a)).slice(0, vegTarget * 3);
  }

  return [...vegSuggestions, ...nonVegSuggestions];
}

export default function StepMenu() {
  const { state, dispatch } = usePlanner();
  const [activeCategory, setActiveCategory] = useState('appetizers');
  const [showAll, setShowAll] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customVeg, setCustomVeg] = useState(true);
  const [recipeItem, setRecipeItem] = useState(null);
  const [hideConflicts, setHideConflicts] = useState(false);

  const config = CATEGORY_CONFIG[activeCategory];
  const suggested = getSuggestions(state, activeCategory);
  const allItems = getAvailableItems(state, activeCategory);
  const restrictions = getGuestRestrictions(state.guestList);

  let displayItems = showAll ? allItems : suggested;
  if (hideConflicts && restrictions.size > 0) {
    displayItems = displayItems.filter((item) => !hasConflict(item, restrictions));
  }

  const selected = state.selectedMenu[activeCategory] || [];
  const isSelected = (item) => selected.some((i) => i.name === item.name);

  const totalSelected = CATEGORIES.reduce(
    (sum, cat) => sum + (state.selectedMenu[cat]?.length || 0),
    0
  );

  const effectiveCount = getEffectiveGuestCount(state);
  const headCount = getHeadCount(state);
  const tolerance = state.leftoverTolerance || 1.15;

  const runningCost = CATEGORIES.reduce((sum, cat) => {
    const items = state.selectedMenu[cat] || [];
    const catConfig = CATEGORY_CONFIG[cat];
    for (const item of items) {
      sum += (item.costPerServing || 0) * effectiveCount * catConfig.portionPerPerson;
    }
    return sum;
  }, 0);

  const vegTarget = state.courseCounts[config.vegCountKey] || 0;
  const nonVegTarget = config.nonVegCountKey
    ? state.courseCounts[config.nonVegCountKey] || 0
    : 0;
  const vegSelected = selected.filter((i) => i.veg).length;
  const nonVegSelected = selected.filter((i) => !i.veg).length;

  const servingsPerDish = Math.ceil(effectiveCount * config.portionPerPerson * tolerance / Math.max(1, selected.length || 1));

  const addCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (selected.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) return;
    const item = {
      name: trimmed,
      veg: customVeg,
      difficulty: 'medium',
      prepTime: 30,
      costPerServing: 0,
      description: 'Custom item',
      cuisine: 'Custom',
    };
    dispatch({ type: 'ADD_CUSTOM_ITEM', category: activeCategory, item });
    setCustomName('');
  };

  const currencySymbol = state.currency === 'INR' ? '₹' : '$';
  const costMultiplier = state.currency === 'INR' ? 83 : 1;

  return (
    <div className="step-content">
      <h2>Build Your Menu</h2>
      <p className="step-subtitle">
        {headCount} guests, ~{Math.round(effectiveCount * tolerance)}x servings with {Math.round((tolerance - 1) * 100)}% buffer
      </p>

      <div className="menu-tabs">
        {CATEGORIES.map((cat) => {
          const count = (state.selectedMenu[cat]?.length || 0);
          return (
            <button
              key={cat}
              className={`menu-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat); setShowAll(false); }}
            >
              {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
              {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="menu-target-bar">
        <span>Target: {vegTarget} veg{nonVegTarget > 0 ? `, ${nonVegTarget} non-veg` : ''}</span>
        <span className="menu-target-progress">
          Selected: {vegSelected} veg{nonVegTarget > 0 ? `, ${nonVegSelected} non-veg` : ''}
        </span>
        {selected.length > 0 && (
          <span className="menu-portion-hint">
            ~{servingsPerDish} servings/dish
          </span>
        )}
        {restrictions.size > 0 && (
          <button
            className={`btn btn-sm ${hideConflicts ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setHideConflicts(!hideConflicts)}
            title="Filter out dishes that conflict with guest dietary restrictions"
          >
            {hideConflicts ? '🛡️ Filtered' : '🛡️ Filter Restrictions'}
          </button>
        )}
        <button
          className={`btn btn-sm btn-outline ${showAll ? 'active' : ''}`}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Suggested' : 'Show All Options'}
        </button>
      </div>

      {runningCost > 0 && (
        <div className="menu-cost-bar">
          <span>Food cost so far: <strong>{currencySymbol}{Math.round(runningCost * costMultiplier).toLocaleString()}</strong></span>
          {state.budget > 0 && (
            <span className={runningCost * costMultiplier > state.budget ? 'over-budget' : 'under-budget'}>
              {runningCost * costMultiplier > state.budget
                ? `Over budget by ${currencySymbol}${Math.round(runningCost * costMultiplier - state.budget).toLocaleString()}`
                : `${currencySymbol}${Math.round(state.budget - runningCost * costMultiplier).toLocaleString()} remaining`}
            </span>
          )}
        </div>
      )}

      <div className="menu-grid">
        {displayItems.map((item) => {
          const conflict = hasConflict(item, restrictions);
          return (
            <div
              key={item.name}
              className={`menu-card ${isSelected(item) ? 'selected' : ''} ${conflict ? 'has-conflict' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_MENU_ITEM', category: activeCategory, item })}
            >
              <div className="menu-card-header">
                <h4>{item.name}</h4>
                {item.veg && <span className="veg-badge">VEG</span>}
              </div>
              <p className="menu-card-desc">{item.description}</p>
              <div className="menu-card-meta">
                <span className="meta-tag">{item.cuisine}</span>
                <span className="meta-tag" style={{ color: difficultyColor[item.difficulty] }}>
                  {item.difficulty}
                </span>
                <span className="meta-tag">{item.prepTime}m</span>
                {item.costPerServing > 0 && (
                  <span className="meta-tag cost">{currencySymbol}{Math.round(item.costPerServing * costMultiplier)}/srv</span>
                )}
              </div>
              {conflict && (
                <div className="conflict-warning">
                  ⚠️ {conflict.label}: contains {conflict.ingredient}
                </div>
              )}
              {RECIPES[item.name] && (
                <button
                  className="recipe-link"
                  onClick={(e) => { e.stopPropagation(); setRecipeItem(item); }}
                >
                  View Recipe
                </button>
              )}
              <div className="menu-card-check">{isSelected(item) ? '✓' : '+'}</div>
            </div>
          );
        })}
        {displayItems.length === 0 && (
          <p className="empty-state">
            {hideConflicts
              ? 'All items conflict with guest restrictions. Try disabling the filter.'
              : 'No items available. Go back and select cuisines for this category.'}
          </p>
        )}
      </div>

      <div className="custom-item-add">
        <h4>Add a Custom Dish</h4>
        <div className="custom-item-row">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Dish name..."
            className="guest-input"
          />
          <button
            className={`pref-chip ${customVeg ? 'active' : ''}`}
            onClick={() => setCustomVeg(true)}
          >
            🥬 Veg
          </button>
          <button
            className={`pref-chip ${!customVeg ? 'active' : ''}`}
            onClick={() => setCustomVeg(false)}
          >
            🍗 Non-Veg
          </button>
          <button className="btn btn-primary btn-compact" onClick={addCustom}>
            Add
          </button>
        </div>
      </div>

      {recipeItem && (
        <RecipeModal item={recipeItem} onClose={() => setRecipeItem(null)} />
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={totalSelected === 0}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue ({totalSelected} items)
        </button>
      </div>
    </div>
  );
}
