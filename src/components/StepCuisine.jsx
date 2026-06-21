import { usePlanner } from '../context/PlannerContext';
import { CUISINES } from '../data/cuisines';

export default function StepCuisine() {
  const { state, dispatch } = usePlanner();

  const toggleCuisine = (cuisine) => {
    const current = state.cuisines;
    const exists = current.find((c) => c.id === cuisine.id);
    const updated = exists ? current.filter((c) => c.id !== cuisine.id) : [...current, cuisine];
    dispatch({ type: 'SET_FIELD', field: 'cuisines', value: updated });
  };

  return (
    <div className="step-content">
      <h2>Choose Your Cuisine</h2>
      <p className="step-subtitle">Select one or more cuisines for your party menu</p>
      <div className="card-grid cuisine-grid">
        {CUISINES.map((c) => (
          <button
            key={c.id}
            className={`selection-card cuisine-card ${state.cuisines.find((sc) => sc.id === c.id) ? 'selected' : ''}`}
            onClick={() => toggleCuisine(c)}
          >
            <span className="card-icon">{c.icon}</span>
            <span className="card-label">{c.name}</span>
            <span className="card-sub">{c.subTypes.slice(0, 3).join(', ')}</span>
          </button>
        ))}
      </div>
      {state.cuisines.length > 0 && (
        <p className="selection-count">
          {state.cuisines.length} cuisine{state.cuisines.length > 1 ? 's' : ''} selected
        </p>
      )}
      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={state.cuisines.length === 0}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
