import { usePlanner } from '../context/PlannerContext';

const STEPS = [
  { label: 'Party Type', icon: '🎉' },
  { label: 'Guests & Budget', icon: '👥' },
  { label: 'Cuisine', icon: '🍽️' },
  { label: 'Food Source', icon: '👨‍🍳' },
  { label: 'Menu', icon: '📋' },
  { label: 'Drinks', icon: '🥤' },
  { label: 'Presentation', icon: '🎨' },
  { label: 'Summary', icon: '✅' },
];

export default function ProgressBar() {
  const { state, dispatch } = usePlanner();

  return (
    <div className="progress-bar">
      {STEPS.map((s, i) => (
        <button
          key={i}
          className={`progress-step ${i === state.step ? 'active' : ''} ${i < state.step ? 'completed' : ''}`}
          onClick={() => i < state.step && dispatch({ type: 'GO_TO_STEP', step: i })}
          disabled={i > state.step}
        >
          <span className="step-icon">{i < state.step ? '✓' : s.icon}</span>
          <span className="step-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

export { STEPS };
