import { usePlanner } from '../context/PlannerContext';
import { calculateBudgetBreakdown, getHeadCount } from '../utils/calculations';

const STEPS = [
  { label: 'Party Type', icon: '🎉' },
  { label: 'Guests', icon: '👥' },
  { label: 'Courses', icon: '📊' },
  { label: 'Cuisine', icon: '🍽️' },
  { label: 'Menu', icon: '📋' },
  { label: 'Drinks', icon: '🥤' },
  { label: 'Presentation', icon: '🎨' },
  { label: 'Materials', icon: '🛒' },
  { label: 'Summary', icon: '✅' },
];

const SUMMARY_STEP = STEPS.length - 1;

export default function ProgressBar() {
  const { state, dispatch } = usePlanner();
  const budget = calculateBudgetBreakdown(state);
  const headCount = getHeadCount(state);

  const shouldSkipStep = (stepIndex) => {
    if (state.foodSource === 'order') {
      if (stepIndex === 7) return true;
    }
    return false;
  };

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        {STEPS.map((s, i) => {
          const skipped = shouldSkipStep(i);
          return (
            <button
              key={i}
              className={`progress-step ${i === state.step ? 'active' : ''} ${i < state.step ? 'completed' : ''} ${skipped ? 'skipped' : ''}`}
              onClick={() => dispatch({ type: 'GO_TO_STEP', step: i })}
              title={skipped ? `${s.label} (auto-skipped for catering)` : s.label}
            >
              <span className="step-icon">{i < state.step ? '✓' : s.icon}</span>
              <span className="step-label">{s.label}</span>
            </button>
          );
        })}
      </div>
      <div className="progress-meta">
        {headCount > 0 && <span className="progress-meta-item">👥 {headCount}</span>}
        {budget.total > 0 && (
          <span className={`progress-meta-item ${state.budget > 0 && budget.total > state.budget ? 'over-budget' : ''}`}>
            {state.currency === 'INR' ? '₹' : '$'}{budget.total.toLocaleString()}
            {state.budget > 0 && ` / ${state.currency === 'INR' ? '₹' : '$'}${state.budget.toLocaleString()}`}
          </span>
        )}
        {state.step < SUMMARY_STEP && state.step >= 2 && (
          <button
            className="skip-to-summary"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: SUMMARY_STEP })}
          >
            Skip to Summary →
          </button>
        )}
      </div>
    </div>
  );
}

export { STEPS };
