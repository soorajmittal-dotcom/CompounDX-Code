import { usePlanner, DIETARY_TAGS } from '../context/PlannerContext';
import {
  calculateBudgetBreakdown,
  calculatePrepTime,
  getDifficultyScore,
  getEffectiveGuestCount,
  getHeadCount,
  formatTime,
} from '../utils/calculations';
import { generateTimeline, detectContentions } from '../utils/timeline';
import { RECIPES } from '../data/recipes';
import { savePlan, loadAllPlans, deletePlan } from '../utils/storage';
import { getShareUrl } from '../utils/share';
import { useState, useEffect } from 'react';

const CATEGORIES = ['appetizers', 'mains', 'desserts'];
const categoryLabels = { appetizers: 'Appetizers', mains: 'Main Courses', desserts: 'Desserts' };

export default function StepSummary() {
  const { state, dispatch } = usePlanner();
  const [showTimeline, setShowTimeline] = useState(true);
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

  const totalMenuItems = CATEGORIES.reduce(
    (s, c) => s + (state.selectedMenu[c]?.length || 0),
    0
  ) + (state.selectedDrinks?.length || 0);

  const currencySymbol = state.currency === 'INR' ? '₹' : '$';
  const costMultiplier = state.currency === 'INR' ? 83 : 1;
  const totalCost = Math.round(budget.total * costMultiplier);

  const isSelfCooking = state.foodSource === 'self' || state.foodSource === 'mix';

  const contentions = isSelfCooking ? detectContentions(state.selectedMenu, RECIPES) : [];
  const timeline = isSelfCooking
    ? generateTimeline(state.selectedMenu, state.selectedDrinks || [], partyTime, RECIPES)
    : [];

  const allRestrictions = new Set();
  for (const g of guests) {
    for (const r of g.restrictions || []) allRestrictions.add(r);
  }

  const handleExport = () => {
    let text = `PARTY MENU PLAN\n${'='.repeat(40)}\n\n`;
    text += `Party: ${state.partyType?.name || 'Custom'}\n`;
    text += `Guests: ${headCount} (${vegCount} veg, ${nonVegCount} non-veg)\n`;
    text += `Appetite-adjusted servings: ${effectiveCount}\n`;
    if (totalCost > 0) text += `Estimated Cost: ${currencySymbol}${totalCost.toLocaleString()}\n`;
    text += `\n`;

    text += `GUEST LIST\n${'-'.repeat(30)}\n`;
    for (const g of guests) {
      const restrictions = (g.restrictions || []).map((r) => DIETARY_TAGS[r]?.label).filter(Boolean);
      text += `  ${g.name} — ${g.diet === 'veg' ? 'Veg' : 'Non-Veg'}, ${g.alcohol ? 'Drinks' : 'No alcohol'}, ${g.appetite}x`;
      if (restrictions.length > 0) text += `, ${restrictions.join(', ')}`;
      text += `, RSVP: ${g.rsvp}\n`;
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
          <span className="stat-label">{headCount} guests ({vegCount}V / {nonVegCount}NV)</span>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">🍺</span>
          <span className="stat-label">{alcoholCount} drink, {headCount - alcoholCount} no-alcohol</span>
        </div>
        {allRestrictions.size > 0 && (
          <div className="summary-stat">
            <span className="stat-icon">🛡️</span>
            <span className="stat-label">
              {[...allRestrictions].map((r) => DIETARY_TAGS[r]?.label).filter(Boolean).join(', ')}
            </span>
          </div>
        )}
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
              <span className="qs-value">{Math.round(effectiveCount * (state.leftoverTolerance || 1.15))}x</span>
              <span className="qs-label">Servings</span>
            </div>
          </div>
        </div>

        {totalCost > 0 && (
          <div className="summary-card stats-card">
            <h3>Estimated Cost</h3>
            <div className="budget-total-display">
              <span className="budget-amount">{currencySymbol}{totalCost.toLocaleString()}</span>
              {state.budget > 0 && (
                <span className={`budget-status ${totalCost > state.budget ? 'over' : 'under'}`}>
                  {totalCost > state.budget
                    ? `${currencySymbol}${(totalCost - state.budget).toLocaleString()} over budget`
                    : `${currencySymbol}${(state.budget - totalCost).toLocaleString()} under budget`}
                </span>
              )}
              <span className="budget-per-head">{currencySymbol}{Math.round(totalCost / Math.max(1, headCount))}/person</span>
            </div>
          </div>
        )}
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
                      {item.costPerServing > 0 && ` | ${currencySymbol}${Math.round(item.costPerServing * costMultiplier)}/srv`}
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

      {isSelfCooking && (
        <div className="summary-card timeline-card">
          <div className="shopping-header">
            <h3>Prep Timeline</h3>
            <div className="timeline-controls">
              <label className="time-input-label">
                Party at
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

          {contentions.length > 0 && (
            <div className="contention-warnings">
              {contentions.map((w, i) => (
                <div key={i} className="contention-warning">
                  <span className="contention-icon">⚠️</span>
                  <span>{w.message}: {w.dishes.join(', ')}</span>
                </div>
              ))}
            </div>
          )}

          {showTimeline && (
            <div className="timeline">
              {timeline.map((entry, i) => (
                <div key={i} className={`timeline-entry timeline-${entry.type}`}>
                  <span className="timeline-time">{entry.time}</span>
                  {entry.type !== 'section' && <span className="timeline-dot" />}
                  <div className="timeline-info">
                    <span className="timeline-task">
                      {entry.task}
                      {entry.equipment?.length > 0 && (
                        <span className="timeline-equipment">
                          {entry.equipment.map((e) => (
                            <span key={e} className="equip-tag">{e}</span>
                          ))}
                        </span>
                      )}
                    </span>
                    {entry.duration > 0 && <span className="timeline-duration">{entry.duration}m</span>}
                  </div>
                  {entry.contentions?.length > 0 && (
                    <span className="timeline-contention" title={`Conflicts with ${entry.contentions.map((c) => c.conflictWith).join(', ')}`}>
                      ⚠️
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                {(g.restrictions || []).map((r) => (
                  <span key={r} className="tag tag-restriction">{DIETARY_TAGS[r]?.icon} {DIETARY_TAGS[r]?.label}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

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
          Print
        </button>
        <button className="btn btn-outline" onClick={handleExport}>
          Export
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
          {shareCopied ? '✓ Copied!' : 'Share'}
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'RESET' })}>
          Start New Plan
        </button>
      </div>
    </div>
  );
}
