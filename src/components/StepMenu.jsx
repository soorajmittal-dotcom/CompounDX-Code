import { usePlanner } from '../context/PlannerContext';
import { MENU_DATABASE } from '../data/menuItems';
import { formatCurrency } from '../utils/calculations';
import { useState } from 'react';

const CATEGORY_LABELS = {
  starters: { label: 'Starters & Appetizers', icon: '🥗' },
  mains: { label: 'Main Courses', icon: '🍛' },
  sides: { label: 'Sides & Accompaniments', icon: '🥖' },
  desserts: { label: 'Desserts', icon: '🍰' },
};

export default function StepMenu() {
  const { state, dispatch } = usePlanner();
  const [activeCategory, setActiveCategory] = useState('starters');
  const [filterVeg, setFilterVeg] = useState(false);

  const allItems = {};
  const categories = ['starters', 'mains', 'sides', 'desserts'];

  for (const cat of categories) {
    allItems[cat] = [];
    for (const cuisine of state.cuisines) {
      const cuisineMenu = MENU_DATABASE[cuisine.id];
      if (cuisineMenu && cuisineMenu[cat]) {
        for (const item of cuisineMenu[cat]) {
          if (!allItems[cat].find((i) => i.name === item.name)) {
            allItems[cat].push({ ...item, cuisine: cuisine.name });
          }
        }
      }
    }
  }

  const isVegRequired =
    state.dietaryNeeds.includes('vegetarian') || state.dietaryNeeds.includes('vegan');
  const shouldFilterVeg = filterVeg || isVegRequired;

  const filteredItems = shouldFilterVeg
    ? allItems[activeCategory].filter((i) => i.veg)
    : allItems[activeCategory];

  const isSelected = (item) =>
    (state.selectedMenu[activeCategory] || []).some((i) => i.name === item.name);

  const totalSelected = categories.reduce(
    (sum, cat) => sum + (state.selectedMenu[cat]?.length || 0),
    0
  );

  const difficultyColor = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

  return (
    <div className="step-content">
      <h2>Build Your Menu</h2>
      <p className="step-subtitle">
        Select dishes from your chosen cuisines ({totalSelected} items selected)
      </p>

      <div className="menu-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`menu-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}
            {(state.selectedMenu[cat]?.length || 0) > 0 && (
              <span className="tab-badge">{state.selectedMenu[cat].length}</span>
            )}
          </button>
        ))}
      </div>

      {!isVegRequired && (
        <div className="filter-bar">
          <button
            className={`chip ${shouldFilterVeg ? 'selected' : ''}`}
            onClick={() => setFilterVeg(!filterVeg)}
          >
            🥬 Vegetarian Only
          </button>
        </div>
      )}

      <div className="menu-grid">
        {filteredItems.map((item) => (
          <div
            key={item.name}
            className={`menu-card ${isSelected(item) ? 'selected' : ''}`}
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
              <span className="meta-tag cost">
                {formatCurrency(item.costPerServing * state.guestCount)}
              </span>
            </div>
            <div className="menu-card-check">{isSelected(item) ? '✓' : '+'}</div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="empty-state">No items available for this category with your filters.</p>
        )}
      </div>

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
