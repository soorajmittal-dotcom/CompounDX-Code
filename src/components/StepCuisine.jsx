import { usePlanner } from '../context/PlannerContext';
import { CUISINES } from '../data/cuisines';
import { useState } from 'react';

const CATEGORIES = [
  { key: 'appetizers', label: 'Appetizers', icon: '🥗' },
  { key: 'mains', label: 'Main Courses', icon: '🍛' },
  { key: 'desserts', label: 'Desserts', icon: '🍰' },
];

export default function StepCuisine() {
  const { state, dispatch } = usePlanner();
  const [activeTab, setActiveTab] = useState('appetizers');

  const toggleCuisine = (category, cuisine) => {
    const current = state.cuisinesByCategory[category] || [];
    const exists = current.find((c) => c.id === cuisine.id);
    const updated = exists ? current.filter((c) => c.id !== cuisine.id) : [...current, cuisine];
    dispatch({ type: 'SET_CUISINE_FOR_CATEGORY', category, cuisines: updated });
  };

  const applyToAll = () => {
    const current = state.cuisinesByCategory[activeTab] || [];
    if (current.length === 0) return;
    for (const cat of CATEGORIES) {
      if (cat.key !== activeTab) {
        dispatch({ type: 'SET_CUISINE_FOR_CATEGORY', category: cat.key, cuisines: [...current] });
      }
    }
  };

  const totalSelected = CATEGORIES.reduce(
    (sum, cat) => sum + (state.cuisinesByCategory[cat.key]?.length || 0),
    0
  );

  const canContinue = CATEGORIES.every(
    (cat) => (state.cuisinesByCategory[cat.key]?.length || 0) > 0
  );

  return (
    <div className="step-content">
      <h2>Choose Cuisines</h2>
      <p className="step-subtitle">
        Select cuisines for each course category — you can mix and match
      </p>

      <div className="menu-tabs">
        {CATEGORIES.map((cat) => {
          const count = state.cuisinesByCategory[cat.key]?.length || 0;
          return (
            <button
              key={cat.key}
              className={`menu-tab ${activeTab === cat.key ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.key)}
            >
              {cat.icon} {cat.label}
              {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="cuisine-apply-bar">
        <button className="btn btn-sm btn-outline" onClick={applyToAll}>
          Apply these cuisines to all categories
        </button>
      </div>

      <div className="card-grid cuisine-grid">
        {CUISINES.map((c) => {
          const selected = (state.cuisinesByCategory[activeTab] || []).find(
            (sc) => sc.id === c.id
          );
          return (
            <button
              key={c.id}
              className={`selection-card cuisine-card ${selected ? 'selected' : ''}`}
              onClick={() => toggleCuisine(activeTab, c)}
            >
              <span className="card-icon">{c.icon}</span>
              <span className="card-label">{c.name}</span>
              <span className="card-sub">{c.subTypes.slice(0, 3).join(', ')}</span>
            </button>
          );
        })}
      </div>

      {!canContinue && (
        <p className="selection-count" style={{ color: 'var(--warning)' }}>
          Select at least one cuisine for each category to continue
        </p>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
