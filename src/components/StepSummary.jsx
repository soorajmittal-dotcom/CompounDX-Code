import { usePlanner } from '../context/PlannerContext';
import {
  calculateBudgetBreakdown,
  calculatePrepTime,
  getDifficultyScore,
  generateShoppingList,
  formatCurrency,
  formatTime,
} from '../utils/calculations';
import { useState } from 'react';

const FOOD_SOURCE_LABELS = {
  self: 'Self Cooking',
  catering: 'Professional Catering',
  order: 'Restaurant Orders',
  mix: 'Mix & Match',
};

export default function StepSummary() {
  const { state, dispatch } = usePlanner();
  const [showShoppingList, setShowShoppingList] = useState(false);

  const budget = calculateBudgetBreakdown(state);
  const prepTime = calculatePrepTime(state.selectedMenu, state.selectedDrinks);
  const difficulty = getDifficultyScore(state.selectedMenu);
  const shoppingList = generateShoppingList(state.selectedMenu, state.guestCount);
  const isOverBudget = budget.total > state.budget;
  const categories = ['starters', 'mains', 'sides', 'desserts'];
  const categoryLabels = { starters: 'Starters', mains: 'Main Courses', sides: 'Sides', desserts: 'Desserts' };

  const handlePrint = () => window.print();

  const handleExport = () => {
    let text = `PARTY MENU PLAN\n${'='.repeat(40)}\n\n`;
    text += `Party: ${state.partyType?.name || 'Custom'}\n`;
    text += `Guests: ${state.guestCount}\n`;
    text += `Budget: ${formatCurrency(state.budget)}\n`;
    text += `Cuisines: ${state.cuisines.map((c) => c.name).join(', ')}\n`;
    text += `Food Source: ${FOOD_SOURCE_LABELS[state.foodSource]}\n`;
    text += `Serving Style: ${state.servingStyle?.name || 'Not selected'}\n`;
    text += `Decoration: ${state.decoration?.name || 'Not selected'}\n\n`;
    text += `MENU\n${'-'.repeat(30)}\n`;
    for (const cat of categories) {
      const items = state.selectedMenu[cat] || [];
      if (items.length > 0) {
        text += `\n${categoryLabels[cat]}:\n`;
        for (const item of items) {
          text += `  - ${item.name} (${formatCurrency(item.costPerServing * state.guestCount)})\n`;
        }
      }
    }
    if (state.selectedDrinks.length > 0) {
      text += `\nDrinks:\n`;
      for (const d of state.selectedDrinks) {
        text += `  - ${d.name} (${formatCurrency(d.costPerServing * state.guestCount)})\n`;
      }
    }
    text += `\nBUDGET BREAKDOWN\n${'-'.repeat(30)}\n`;
    text += `Food: ${formatCurrency(budget.food)}\n`;
    text += `Drinks: ${formatCurrency(budget.drinks)}\n`;
    text += `Decoration: ${formatCurrency(budget.decoration)}\n`;
    text += `Total: ${formatCurrency(budget.total)}\n`;
    text += `\nPrep Time: ${formatTime(prepTime)}\n`;
    text += `Difficulty: ${difficulty}\n`;

    if (state.decoration) {
      text += `\nDECORATION CHECKLIST\n${'-'.repeat(30)}\n`;
      for (const item of state.decoration.items) {
        text += `  [ ] ${item}\n`;
      }
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'party-menu-plan.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="step-content summary">
      <h2>Your Party Plan Summary</h2>

      <div className="summary-header">
        <div className="summary-stat">
          <span className="stat-icon">🎉</span>
          <span className="stat-label">{state.partyType?.name}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">👥</span>
          <span className="stat-label">{state.guestCount} Guests</span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">🍽️</span>
          <span className="stat-label">{state.cuisines.map((c) => c.name).join(', ')}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">👨‍🍳</span>
          <span className="stat-label">{FOOD_SOURCE_LABELS[state.foodSource]}</span>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card budget-card">
          <h3>Budget Breakdown</h3>
          <div className={`budget-total ${isOverBudget ? 'over' : 'under'}`}>
            <span>{formatCurrency(budget.total)}</span>
            <span className="budget-label">
              of {formatCurrency(state.budget)} budget
              {isOverBudget ? ' (Over Budget!)' : ' (Within Budget)'}
            </span>
          </div>
          <div className="budget-bar">
            <div
              className="budget-fill food"
              style={{ width: `${(budget.food / budget.total) * 100}%` }}
            />
            <div
              className="budget-fill drinks"
              style={{ width: `${(budget.drinks / budget.total) * 100}%` }}
            />
            <div
              className="budget-fill deco"
              style={{ width: `${(budget.decoration / budget.total) * 100}%` }}
            />
          </div>
          <div className="budget-legend">
            <span className="legend-item">
              <span className="legend-dot food" /> Food {formatCurrency(budget.food)}
            </span>
            <span className="legend-item">
              <span className="legend-dot drinks" /> Drinks {formatCurrency(budget.drinks)}
            </span>
            <span className="legend-item">
              <span className="legend-dot deco" /> Decor {formatCurrency(budget.decoration)}
            </span>
          </div>
        </div>

        <div className="summary-card stats-card">
          <h3>Quick Stats</h3>
          <div className="quick-stats">
            <div className="qs-item">
              <span className="qs-value">{formatTime(prepTime)}</span>
              <span className="qs-label">Prep Time</span>
            </div>
            <div className="qs-item">
              <span className="qs-value">{difficulty}</span>
              <span className="qs-label">Difficulty</span>
            </div>
            <div className="qs-item">
              <span className="qs-value">{formatCurrency(Math.round(budget.total / state.guestCount))}</span>
              <span className="qs-label">Per Person</span>
            </div>
            <div className="qs-item">
              <span className="qs-value">
                {categories.reduce((s, c) => s + (state.selectedMenu[c]?.length || 0), 0) +
                  state.selectedDrinks.length}
              </span>
              <span className="qs-label">Total Items</span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-card menu-summary-card">
        <h3>Complete Menu</h3>
        {categories.map((cat) => {
          const items = state.selectedMenu[cat] || [];
          if (items.length === 0) return null;
          return (
            <div key={cat} className="menu-category-summary">
              <h4>{categoryLabels[cat]}</h4>
              <div className="summary-items">
                {items.map((item) => (
                  <div key={item.name} className="summary-item">
                    <span className="item-name">
                      {item.name} {item.veg && <span className="veg-badge-sm">V</span>}
                    </span>
                    <span className="item-meta">
                      {formatCurrency(item.costPerServing * state.guestCount)} | {item.prepTime}m |{' '}
                      {item.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {state.selectedDrinks.length > 0 && (
          <div className="menu-category-summary">
            <h4>Drinks</h4>
            <div className="summary-items">
              {state.selectedDrinks.map((d) => (
                <div key={d.name} className="summary-item">
                  <span className="item-name">{d.name}</span>
                  <span className="item-meta">
                    {formatCurrency(d.costPerServing * state.guestCount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {state.servingStyle && (
        <div className="summary-card">
          <h3>{state.servingStyle.icon} Serving: {state.servingStyle.name}</h3>
          <p>{state.servingStyle.description}</p>
        </div>
      )}

      {state.decoration && (
        <div className="summary-card">
          <h3>{state.decoration.icon} Decor: {state.decoration.name}</h3>
          <div className="deco-checklist">
            {state.decoration.items.map((item, i) => (
              <label key={i} className="checklist-item">
                <input type="checkbox" /> {item}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="summary-card">
        <div className="shopping-header">
          <h3>Shopping List</h3>
          <button
            className="btn btn-sm"
            onClick={() => setShowShoppingList(!showShoppingList)}
          >
            {showShoppingList ? 'Hide' : 'Show'}
          </button>
        </div>
        {showShoppingList && (
          <table className="shopping-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Servings</th>
                <th>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {shoppingList.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{categoryLabels[item.category]}</td>
                  <td>{item.servings}</td>
                  <td>{formatCurrency(item.estimatedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="step-actions summary-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-outline" onClick={handlePrint}>
          🖨️ Print
        </button>
        <button className="btn btn-outline" onClick={handleExport}>
          📥 Export
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'RESET' })}>
          Start New Plan
        </button>
      </div>
    </div>
  );
}
