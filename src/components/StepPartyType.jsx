import { usePlanner } from '../context/PlannerContext';
import { PARTY_TYPES } from '../data/decorations';

export default function StepPartyType() {
  const { state, dispatch } = usePlanner();

  return (
    <div className="step-content">
      <h2>What kind of party are you planning?</h2>
      <p className="step-subtitle">Select the occasion to help us tailor your menu</p>
      <div className="card-grid">
        {PARTY_TYPES.map((pt) => (
          <button
            key={pt.id}
            className={`selection-card ${state.partyType?.id === pt.id ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'partyType', value: pt })}
          >
            <span className="card-icon">{pt.icon}</span>
            <span className="card-label">{pt.name}</span>
          </button>
        ))}
      </div>
      <div className="step-actions">
        <button
          className="btn btn-primary"
          disabled={!state.partyType}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
