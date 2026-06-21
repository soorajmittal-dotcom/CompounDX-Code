import { usePlanner } from '../context/PlannerContext';

const FOOD_SOURCES = [
  {
    id: 'self',
    name: 'Self Cooking',
    icon: '👨‍🍳',
    description: 'Prepare everything yourself at home',
    pros: ['Most affordable', 'Personal touch', 'Full control'],
    cons: ['Time consuming', 'Skill dependent'],
  },
  {
    id: 'catering',
    name: 'Professional Catering',
    icon: '🍽️',
    description: 'Hire a catering service for the event',
    pros: ['Professional quality', 'No cooking stress', 'Serving included'],
    cons: ['Most expensive', 'Less flexibility'],
  },
  {
    id: 'order',
    name: 'Order from Restaurants',
    icon: '📦',
    description: 'Order dishes from local restaurants',
    pros: ['Restaurant quality', 'Easy to arrange', 'Variety of options'],
    cons: ['Delivery logistics', 'Medium cost'],
  },
  {
    id: 'mix',
    name: 'Mix & Match',
    icon: '🔀',
    description: 'Cook some dishes, order or cater the rest',
    pros: ['Balanced effort', 'Cost flexible', 'Best of both worlds'],
    cons: ['Coordination needed'],
  },
];

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: '🌱', description: 'Simple recipes, basic techniques' },
  { id: 'medium', label: 'Intermediate', icon: '🍳', description: 'Comfortable with most recipes' },
  { id: 'advanced', label: 'Advanced', icon: '👨‍🍳', description: 'Complex dishes, experienced cook' },
  { id: 'pro', label: 'Professional', icon: '⭐', description: 'Restaurant-level skills' },
];

export default function StepFoodSource() {
  const { state, dispatch } = usePlanner();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const showSkillLevel = state.foodSource === 'self' || state.foodSource === 'mix';

  return (
    <div className="step-content">
      <h2>How will the food be prepared?</h2>
      <p className="step-subtitle">Choose how you want to source your party food</p>

      <div className="source-grid">
        {FOOD_SOURCES.map((src) => (
          <button
            key={src.id}
            className={`source-card ${state.foodSource === src.id ? 'selected' : ''}`}
            onClick={() => setField('foodSource', src.id)}
          >
            <span className="source-icon">{src.icon}</span>
            <span className="source-name">{src.name}</span>
            <span className="source-desc">{src.description}</span>
            <div className="source-pros">
              {src.pros.map((p, i) => (
                <span key={i} className="pro-tag">
                  {p}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {showSkillLevel && (
        <div className="form-section">
          <label className="form-label">Your Cooking Skill Level</label>
          <div className="skill-grid">
            {SKILL_LEVELS.map((s) => (
              <button
                key={s.id}
                className={`chip skill-chip ${state.cookingSkill === s.id ? 'selected' : ''}`}
                onClick={() => setField('cookingSkill', s.id)}
              >
                {s.icon} {s.label}
                <span className="skill-desc">{s.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={!state.foodSource}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
