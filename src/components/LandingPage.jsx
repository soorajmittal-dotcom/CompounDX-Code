import { usePlanner } from '../context/PlannerContext';

const FEATURES = [
  { icon: '🍽️', title: '9 Cuisines, 100+ Dishes', desc: 'Indian, Italian, Mexican, Chinese, Japanese, and more' },
  { icon: '💰', title: 'Smart Budget Planning', desc: 'Auto-recommendations that fit your budget and constraints' },
  { icon: '📋', title: 'Shopping Lists & Timelines', desc: 'Export prep schedules and shopping lists' },
  { icon: '🎨', title: 'Decor & Presentation', desc: '8 decoration themes and 6 serving styles' },
  { icon: '👥', title: 'Guest Management', desc: 'Track guests with individual dietary needs' },
  { icon: '💾', title: 'Save & Compare', desc: 'Save multiple plans and load them anytime' },
];

export default function LandingPage() {
  const { dispatch } = usePlanner();

  return (
    <div className="landing">
      <div className="landing-hero">
        <span className="landing-emoji">🎉</span>
        <h1 className="landing-title">Plan Your Perfect Party Menu</h1>
        <p className="landing-desc">
          From intimate dinners to grand celebrations — build a complete menu with
          budget tracking, prep timelines, shopping lists, and decoration ideas.
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => dispatch({ type: 'SET_FIELD', field: 'started', value: true })}
        >
          Start Planning
        </button>
      </div>

      <div className="landing-features">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="landing-how">
        <h2>How It Works</h2>
        <div className="how-steps">
          <div className="how-step">
            <span className="how-number">1</span>
            <span>Pick your party type and set your budget</span>
          </div>
          <div className="how-step">
            <span className="how-number">2</span>
            <span>Choose cuisines and build your menu</span>
          </div>
          <div className="how-step">
            <span className="how-number">3</span>
            <span>Add drinks, decor, and serving style</span>
          </div>
          <div className="how-step">
            <span className="how-number">4</span>
            <span>Get your plan with timelines and shopping list</span>
          </div>
        </div>
      </div>
    </div>
  );
}
