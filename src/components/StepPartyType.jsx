import { usePlanner } from '../context/PlannerContext';
import { PARTY_TYPES } from '../data/decorations';

const festivals = PARTY_TYPES.filter((p) => p.group === 'festival');
const occasions = PARTY_TYPES.filter((p) => p.group === 'occasion');

export default function StepPartyType() {
  const { state, dispatch } = usePlanner();

  return (
    <div className="step-content">
      <h2>What's the occasion?</h2>
      <p className="step-subtitle">Pick the theme to help us tailor your menu</p>

      <div className="party-type-section">
        <h3 className="party-type-group-label">Festivals & Celebrations</h3>
        <div className="card-grid">
          {festivals.map((pt) => (
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
      </div>

      <div className="party-type-section">
        <h3 className="party-type-group-label">Occasions & Gatherings</h3>
        <div className="card-grid">
          {occasions.map((pt) => (
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
