import { usePlanner } from '../context/PlannerContext';
import { DRINKS } from '../data/menuItems';
import { formatCurrency } from '../utils/calculations';

export default function StepDrinks() {
  const { state, dispatch } = usePlanner();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  const isSelected = (drink) => state.selectedDrinks.some((d) => d.name === drink.name);

  return (
    <div className="step-content">
      <h2>Drinks & Beverages</h2>
      <p className="step-subtitle">Select beverages for your guests</p>

      <div className="form-section">
        <div className="alcohol-toggle">
          <label className="toggle-label">
            <span>Include Alcoholic Beverages</span>
            <button
              className={`toggle-btn ${state.includeAlcohol ? 'active' : ''}`}
              onClick={() => setField('includeAlcohol', !state.includeAlcohol)}
            >
              <span className="toggle-knob" />
            </button>
          </label>
        </div>
      </div>

      <div className="drinks-section">
        <h3>Non-Alcoholic</h3>
        <div className="drinks-grid">
          {DRINKS.nonAlcoholic.map((drink) => (
            <div
              key={drink.name}
              className={`drink-card ${isSelected(drink) ? 'selected' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_DRINK', drink })}
            >
              <div className="drink-info">
                <h4>{drink.name}</h4>
                <p>{drink.description}</p>
                <span className="drink-cost">
                  {formatCurrency(drink.costPerServing * state.guestCount)} total
                </span>
              </div>
              <div className="menu-card-check">{isSelected(drink) ? '✓' : '+'}</div>
            </div>
          ))}
        </div>
      </div>

      {state.includeAlcohol && (
        <div className="drinks-section">
          <h3>Alcoholic</h3>
          <div className="drinks-grid">
            {DRINKS.alcoholic.map((drink) => (
              <div
                key={drink.name}
                className={`drink-card ${isSelected(drink) ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_DRINK', drink })}
              >
                <div className="drink-info">
                  <h4>{drink.name}</h4>
                  <p>{drink.description}</p>
                  <span className="drink-cost">
                    {formatCurrency(drink.costPerServing * state.guestCount)} total
                  </span>
                </div>
                <div className="menu-card-check">{isSelected(drink) ? '✓' : '+'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          Continue ({state.selectedDrinks.length} drinks)
        </button>
      </div>
    </div>
  );
}
