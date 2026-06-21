import { usePlanner } from '../context/PlannerContext';
import { DIETARY_OPTIONS } from '../data/cuisines';

export default function StepGuestsBudget() {
  const { state, dispatch } = usePlanner();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  const toggleDietary = (id) => {
    const current = state.dietaryNeeds;
    const updated = current.includes(id) ? current.filter((d) => d !== id) : [...current, id];
    setField('dietaryNeeds', updated);
  };

  return (
    <div className="step-content">
      <h2>Guest & Budget Details</h2>
      <p className="step-subtitle">Tell us about your party size and constraints</p>

      <div className="form-section">
        <label className="form-label">
          Number of Guests
          <span className="form-value">{state.guestCount}</span>
        </label>
        <input
          type="range"
          min="2"
          max="200"
          value={state.guestCount}
          onChange={(e) => setField('guestCount', Number(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>2</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">
          Total Budget
          <span className="form-value">${state.budget}</span>
        </label>
        <input
          type="range"
          min="50"
          max="5000"
          step="50"
          value={state.budget}
          onChange={(e) => setField('budget', Number(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>$50</span>
          <span>$1,000</span>
          <span>$2,500</span>
          <span>$5,000</span>
        </div>
        <p className="per-person-note">
          ~${Math.round(state.budget / state.guestCount)} per person
        </p>
      </div>

      <div className="form-section">
        <label className="form-label">
          Available Prep Time
          <span className="form-value">
            {state.timeAvailable >= 60
              ? `${Math.floor(state.timeAvailable / 60)}h ${state.timeAvailable % 60 > 0 ? `${state.timeAvailable % 60}m` : ''}`
              : `${state.timeAvailable}m`}
          </span>
        </label>
        <input
          type="range"
          min="30"
          max="480"
          step="30"
          value={state.timeAvailable}
          onChange={(e) => setField('timeAvailable', Number(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>30m</span>
          <span>2h</span>
          <span>4h</span>
          <span>6h</span>
          <span>8h</span>
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">Dietary Requirements</label>
        <div className="chip-grid">
          {DIETARY_OPTIONS.map((d) => (
            <button
              key={d.id}
              className={`chip ${state.dietaryNeeds.includes(d.id) ? 'selected' : ''}`}
              onClick={() => toggleDietary(d.id)}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          Continue
        </button>
      </div>
    </div>
  );
}
