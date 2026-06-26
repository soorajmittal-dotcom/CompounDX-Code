import { usePlanner } from '../context/PlannerContext';
import { DRINKS } from '../data/menuItems';

export default function StepDrinks() {
  const { state, dispatch } = usePlanner();
  const guests = state.guestList || [];
  const alcoholCount = guests.filter((g) => g.alcohol).length;
  const noAlcoholCount = guests.length - alcoholCount;
  const drinkTarget = state.courseCounts.drinks || 3;

  const isSelected = (drink) => state.selectedDrinks.some((d) => d.name === drink.name);

  return (
    <div className="step-content">
      <h2>Drinks & Beverages</h2>
      <p className="step-subtitle">
        {guests.length} guests — {alcoholCount} drink alcohol, {noAlcoholCount} don't
        {' · '}Target: {drinkTarget} drinks
      </p>

      <div className="drinks-section">
        <h3>Non-Alcoholic ({noAlcoholCount > 0 ? `for all ${guests.length} guests` : 'Everyone'})</h3>
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
              </div>
              <div className="menu-card-check">{isSelected(drink) ? '✓' : '+'}</div>
            </div>
          ))}
        </div>
      </div>

      {alcoholCount > 0 && (
        <div className="drinks-section">
          <h3>Alcoholic (for {alcoholCount} guests)</h3>
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
