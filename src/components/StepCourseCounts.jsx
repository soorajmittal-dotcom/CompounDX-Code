import { usePlanner } from '../context/PlannerContext';

const FOOD_SOURCES = [
  { id: 'self', name: 'Self Cooking', icon: '👨‍🍳', desc: 'Prepare everything yourself' },
  { id: 'order', name: 'Order / Cater', icon: '📦', desc: 'Order from restaurants or caterers' },
  { id: 'mix', name: 'Mix & Match', icon: '🔀', desc: 'Cook some, order the rest' },
];

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: '🌱' },
  { id: 'medium', label: 'Intermediate', icon: '🍳' },
  { id: 'advanced', label: 'Advanced', icon: '👨‍🍳' },
  { id: 'pro', label: 'Professional', icon: '⭐' },
];

const COURSE_FIELDS = [
  { key: 'vegAppetizers', label: 'Veg Appetizers', icon: '🥬🥗', max: 6 },
  { key: 'nonVegAppetizers', label: 'Non-Veg Appetizers', icon: '🍗🥗', max: 6 },
  { key: 'vegMains', label: 'Veg Main Courses', icon: '🥬🍛', max: 6 },
  { key: 'nonVegMains', label: 'Non-Veg Main Courses', icon: '🍗🍛', max: 6 },
  { key: 'desserts', label: 'Desserts', icon: '🍰', max: 6 },
  { key: 'drinks', label: 'Drinks', icon: '🥤', max: 8 },
];

export default function StepCourseCounts() {
  const { state, dispatch } = usePlanner();
  const counts = state.courseCounts;
  const guests = state.guestList || [];

  const vegCount = guests.filter((g) => g.diet === 'veg').length;
  const nonVegCount = guests.length - vegCount;

  const setCount = (field, value) =>
    dispatch({ type: 'SET_COURSE_COUNT', field, value });
  const setField = (field, value) =>
    dispatch({ type: 'SET_FIELD', field, value });

  const showCookingOptions = state.foodSource === 'self' || state.foodSource === 'mix';

  const totalCourses = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="step-content">
      <h2>Plan Your Courses</h2>
      <p className="step-subtitle">
        {guests.length} guests ({vegCount} veg, {nonVegCount} non-veg) — choose how many dishes per category
      </p>

      <div className="course-counts-grid">
        {COURSE_FIELDS.map((f) => (
          <div key={f.key} className="course-count-card">
            <div className="course-count-header">
              <span className="course-count-icon">{f.icon}</span>
              <span className="course-count-label">{f.label}</span>
            </div>
            <div className="counter-controls">
              <button
                className="counter-btn"
                onClick={() => setCount(f.key, Math.max(0, counts[f.key] - 1))}
                disabled={counts[f.key] <= 0}
              >
                −
              </button>
              <span className="counter-value">{counts[f.key]}</span>
              <button
                className="counter-btn"
                onClick={() => setCount(f.key, Math.min(f.max, counts[f.key] + 1))}
                disabled={counts[f.key] >= f.max}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="form-section">
        <label className="form-label">How will the food be prepared?</label>
        <div className="food-source-row">
          {FOOD_SOURCES.map((src) => (
            <button
              key={src.id}
              className={`source-chip ${state.foodSource === src.id ? 'active' : ''}`}
              onClick={() => setField('foodSource', src.id)}
            >
              <span>{src.icon}</span>
              <span className="source-chip-name">{src.name}</span>
              <span className="source-chip-desc">{src.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {showCookingOptions && (
        <>
          <div className="form-section">
            <label className="form-label">Cooking Skill Level</label>
            <div className="skill-row">
              {SKILL_LEVELS.map((s) => (
                <button
                  key={s.id}
                  className={`pref-chip ${state.cookingSkill === s.id ? 'active' : ''}`}
                  onClick={() => setField('cookingSkill', s.id)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">
              Available Prep Time
              <span className="form-value">
                {state.timeAvailable >= 60
                  ? `${Math.floor(state.timeAvailable / 60)}h${state.timeAvailable % 60 > 0 ? ` ${state.timeAvailable % 60}m` : ''}`
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
        </>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={totalCourses === 0 || !state.foodSource}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue ({totalCourses} dishes planned)
        </button>
      </div>
    </div>
  );
}
