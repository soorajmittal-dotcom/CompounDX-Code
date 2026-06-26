import { usePlanner } from '../context/PlannerContext';
import {
  calculateBudgetBreakdown,
  calculatePrepTime,
  getDifficultyScore,
  generateShoppingList,
  getEffectiveGuestCount,
  getHeadCount,
  formatCurrency,
  formatTime,
} from '../utils/calculations';
import { generateTimeline } from '../utils/timeline';
import { savePlan, loadAllPlans, deletePlan } from '../utils/storage';
import { getShareUrl } from '../utils/share';
import { useState, useEffect } from 'react';

const FOOD_SOURCE_LABELS = {
  self: 'Self Cooking',
  order: 'Order / Cater',
  mix: 'Mix & Match',
};

const CATEGORIES = ['appetizers', 'mains', 'desserts'];
const categoryLabels = { appetizers: 'Appetizers', mains: 'Main Courses', desserts: 'Desserts' };

export default function StepSummary() {
  const { state, dispatch } = usePlanner();
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [partyTime, setPartyTime] = useState('18:00');
  const [savedPlans, setSavedPlans] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    loadAllPlans().then(setSavedPlans);
  }, []);

  const guests = state.guestList || [];
  const headCount = getHeadCount(state);
  const effectiveCount = getEffectiveGuestCount(state);
  const vegCount = guests.filter((g) => g.diet === 'veg').length;
  const nonVegCount = guests.length - vegCount;
  const alcoholCount = guests.filter((g) => g.alcohol).length;

  const budget = calculateBudgetBreakdown(state);
  const prepTime = calculatePrepTime(state.selectedMenu, state.selectedDrinks);
  const difficulty = getDifficultyScore(state.selectedMenu);
  const shoppingList = generateShoppingList(state.selectedMenu, effectiveCount);

  const totalMenuItems = CATEGORIES.reduce(
    (s, c) => s + (state.selectedMenu[c]?.length || 0),
    0
  ) + (state.selectedDrinks?.length || 0);

  const handleExport = () => {
    let text = `PARTY MENU PLAN\n${'='.repeat(40)}\n\n`;
    text += `Party: ${state.partyType?.name || 'Custom'}\n`;
    text += `Guests: ${headCount} (${vegCount} veg, ${nonVegCount} non-veg)\n`;
    text += `Appetite-adjusted servings: ${effectiveCount}\n`;
    text += `Food Source: ${FOOD_SOURCE_LABELS[state.foodSource] || 'Not set'}\n\n`;

    text += `GUEST LIST\n${'-'.repeat(30)}\n`;
    for (const g of guests) {
      text += `  ${g.name} — ${g.diet === 'veg' ? 'Veg' : 'Non-Veg'}, ${g.alcohol ? 'Drinks' : 'No alcohol'}, ${g.appetite}x appetite, RSVP: ${g.rsvp}\n`;
    }

    text += `\nMENU\n${'-'.repeat(30)}\n`;
    for (const cat of CATEGORIES) {
      const items = state.selectedMenu[cat] || [];
      if (items.length > 0) {
        text += `\n${categoryLabels[cat]}:\n`;
        for (const item of items) {
          text += `  - ${item.name}${item.veg ? ' (V)' : ''} — ${item.cuisine || ''}\n`;
        }
      }
    }
    if (state.selectedDrinks?.length > 0) {
      text += `\nDrinks:\n`;
      for (const d of state.selectedDrinks) text += `  - ${d.name}\n`;
    }

    if (Object.keys(state.presentations || {}).length > 0) {
      text += `\nPRESENTATION\n${'-'.repeat(30)}\n`;
      for (const [name, idea] of Object.entries(state.presentations)) {
        text += `  ${name}: ${idea}\n`;
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
      <h2>Your Party Plan</h2>

      <div className="summary-header">
        <div className="summary-stat">
          <span className="stat-icon">🎉</span>
          <span className="stat-label">{state.partyType?.name || 'Party'}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">👥</span>
          <span className="stat-label">
            {headCount} guests ({vegCount}V / {nonVegCount}NV)
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">🍺</span>
          <span className="stat-label">{alcoholCount} drink, {headCount - alcoholCount} no-alcohol</span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">👨‍🍳</span>
          <span className="stat-label">{FOOD_SOURCE_LABELS[state.foodSource] || '—'}</span>
        </div>
      </div>

      <div className="summary-grid">
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
              <span className="qs-value">{totalMenuItems}</span>
              <span className="qs-label">Menu Items</span>
            </div>
            <div className="qs-item">
              <span className="qs-value">{effectiveCount}x</span>
              <span className="qs-label">Servings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-card menu-summary-card">
        <h3>Complete Menu</h3>
        {CATEGORIES.map((cat) => {
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
                      {item.cuisine} | {item.prepTime}m | {item.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {state.selectedDrinks?.length > 0 && (
          <div className="menu-category-summary">
            <h4>Drinks</h4>
            <div className="summary-items">
              {state.selectedDrinks.map((d) => (
                <div key={d.name} className="summary-item">
                  <span className="item-name">{d.name}</span>
                  <span className="item-meta">{d.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {Object.keys(state.presentations || {}).length > 0 && (
        <div className="summary-card">
          <h3>Presentation Ideas</h3>
          {Object.entries(state.presentations).map(([name, idea]) => (
            <div key={name} className="presentation-summary-item">
              <strong>{name}:</strong> {idea}
            </div>
          ))}
        </div>
      )}

      <div className="summary-card">
        <div className="shopping-header">
          <h3>Guest List</h3>
        </div>
        <div className="guest-summary-list">
          {guests.map((g) => (
            <div key={g.id} className="guest-summary-row">
              <span className="guest-summary-name">{g.name}</span>
              <span className="guest-summary-tags">
                <span className={`tag ${g.diet === 'veg' ? 'tag-veg' : 'tag-nonveg'}`}>
                  {g.diet === 'veg' ? '🥬 Veg' : '🍗 NV'}
                </span>
                <span className="tag">{g.alcohol ? '🍺' : '🚫'}</span>
                <span className="tag">{g.appetite}x</span>
                <span className={`tag tag-rsvp-${g.rsvp}`}>{g.rsvp}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-card">
        <div className="shopping-header">
          <h3>Shopping List</h3>
          <button className="btn btn-sm" onClick={() => setShowShoppingList(!showShoppingList)}>
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
              </tr>
            </thead>
            <tbody>
              {shoppingList.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{categoryLabels[item.category] || item.category}</td>
                  <td>{item.servings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(state.foodSource === 'self' || state.foodSource === 'mix') && (
        <div className="summary-card">
          <div className="shopping-header">
            <h3>Prep Timeline</h3>
            <div className="timeline-controls">
              <label className="time-input-label">
                Party starts at
                <input
                  type="time"
                  value={partyTime}
                  onChange={(e) => setPartyTime(e.target.value)}
                  className="time-input"
                />
              </label>
              <button className="btn btn-sm" onClick={() => setShowTimeline(!showTimeline)}>
                {showTimeline ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {showTimeline && (
            <div className="timeline">
              {generateTimeline(state.selectedMenu, state.selectedDrinks || [], partyTime).map((entry, i) => (
                <div key={i} className={`timeline-entry timeline-${entry.type}`}>
                  <span className="timeline-time">{entry.time}</span>
                  <span className="timeline-dot" />
                  <div className="timeline-info">
                    <span className="timeline-task">{entry.task}</span>
                    {entry.duration > 0 && <span className="timeline-duration">{entry.duration}m</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="summary-card">
        <div className="shopping-header">
          <h3>Saved Plans</h3>
          <div className="save-controls">
            <button
              className="btn btn-accent btn-sm"
              onClick={async () => {
                await savePlan(state);
                setSavedPlans(await loadAllPlans());
                setSaveConfirm(true);
                setTimeout(() => setSaveConfirm(false), 2000);
              }}
            >
              {saveConfirm ? '✓ Saved!' : 'Save This Plan'}
            </button>
            {savedPlans.length > 0 && (
              <button className="btn btn-sm" onClick={() => setShowSaved(!showSaved)}>
                {showSaved ? 'Hide' : `View (${savedPlans.length})`}
              </button>
            )}
          </div>
        </div>
        {showSaved && savedPlans.length > 0 && (
          <div className="saved-plans-list">
            {savedPlans.map((plan) => (
              <div key={plan.id} className="saved-plan-item">
                <div className="saved-plan-info">
                  <span className="saved-plan-name">{plan.name}</span>
                  <span className="saved-plan-date">{new Date(plan.savedAt).toLocaleDateString()}</span>
                </div>
                <div className="saved-plan-actions">
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      for (const [key, value] of Object.entries(plan.state)) {
                        dispatch({ type: 'SET_FIELD', field: key, value });
                      }
                    }}
                  >
                    Load
                  </button>
                  <button
                    className="btn btn-sm btn-danger-sm"
                    onClick={async () => {
                      await deletePlan(plan.id);
                      setSavedPlans(await loadAllPlans());
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="step-actions summary-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          🖨️ Print
        </button>
        <button className="btn btn-outline" onClick={handleExport}>
          📄 Export
        </button>
        <button
          className="btn btn-accent"
          onClick={() => {
            const url = getShareUrl(state);
            navigator.clipboard.writeText(url).then(() => {
              setShareCopied(true);
              setTimeout(() => setShareCopied(false), 2500);
            });
          }}
        >
          {shareCopied ? '✓ Link Copied!' : '🔗 Share'}
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'RESET' })}>
          Start New Plan
        </button>
      </div>
    </div>
  );
}
