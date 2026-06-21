import { usePlanner } from '../context/PlannerContext';
import { DECORATIONS } from '../data/decorations';

export default function StepPresentation() {
  const { state, dispatch } = usePlanner();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div className="step-content">
      <h2>Presentation & Decor</h2>
      <p className="step-subtitle">Choose how you want to serve and style your party</p>

      <div className="form-section">
        <label className="form-label">Serving Style</label>
        <div className="serving-grid">
          {DECORATIONS.servingStyles.map((s) => (
            <button
              key={s.id}
              className={`serving-card ${state.servingStyle?.id === s.id ? 'selected' : ''}`}
              onClick={() => setField('servingStyle', s)}
            >
              <span className="serving-icon">{s.icon}</span>
              <span className="serving-name">{s.name}</span>
              <span className="serving-desc">{s.description}</span>
              <div className="serving-pros">
                {s.pros.map((p, i) => (
                  <span key={i} className="pro-tag">
                    {p}
                  </span>
                ))}
              </div>
              {s.costMultiplier !== 1 && (
                <span className="cost-modifier">
                  {s.costMultiplier > 1
                    ? `+${Math.round((s.costMultiplier - 1) * 100)}% cost`
                    : `-${Math.round((1 - s.costMultiplier) * 100)}% cost`}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">Decoration Theme</label>
        <div className="deco-grid">
          {DECORATIONS.themes.map((t) => (
            <button
              key={t.id}
              className={`deco-card ${state.decoration?.id === t.id ? 'selected' : ''}`}
              onClick={() => setField('decoration', t)}
            >
              <span className="deco-icon">{t.icon}</span>
              <span className="deco-name">{t.name}</span>
              <div className="deco-items">
                {t.items.slice(0, 4).map((item, i) => (
                  <span key={i} className="deco-item">
                    {item}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {state.decoration && (
        <div className="deco-preview">
          <h4>{state.decoration.icon} {state.decoration.name} - What You'll Need:</h4>
          <ul>
            {state.decoration.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          View Summary
        </button>
      </div>
    </div>
  );
}
