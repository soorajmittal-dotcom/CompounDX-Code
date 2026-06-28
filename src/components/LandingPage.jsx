import { usePlanner } from '../context/PlannerContext';
import { useState } from 'react';
import Dashboard from './Dashboard';

const FEATURES = [
  { icon: '🪔', title: 'Festivals & Themes', desc: 'Diwali, Holi, Halloween, Christmas, and 20+ party types' },
  { icon: '👥', title: 'Per-Guest Preferences', desc: 'Veg/non-veg, drinks, appetite — saved for next time' },
  { icon: '🍽️', title: '9 Cuisines, 100+ Dishes', desc: 'Indian, Italian, Mexican, Chinese, Japanese, and more' },
  { icon: '🎨', title: 'Presentation Ideas', desc: 'Serving suggestions for every dish on your menu' },
  { icon: '📋', title: 'Shopping Lists & Timelines', desc: 'Scaled to your guest list with prep schedules' },
  { icon: '🏆', title: 'Community Dashboard', desc: 'See trending dishes and cheer your favorites' },
];

export default function LandingPage() {
  const { dispatch } = usePlanner();
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="landing">
      <div className="landing-hero">
        <span className="landing-emoji">🎉</span>
        <h1 className="landing-title">Plan Your Perfect Party Menu</h1>
        <p className="landing-desc">
          From Diwali dinners to birthday bashes — build a complete menu with
          per-guest preferences, presentation ideas, and scaled shopping lists.
        </p>
        <div className="landing-cta">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'started', value: true })}
          >
            Start Planning
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => setShowDashboard(true)}
          >
            🏆 Dashboard
          </button>
        </div>
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
            <span>Pick your festival or occasion</span>
          </div>
          <div className="how-step">
            <span className="how-number">2</span>
            <span>Add guests with diet & drink preferences</span>
          </div>
          <div className="how-step">
            <span className="how-number">3</span>
            <span>Choose cuisines and build your menu</span>
          </div>
          <div className="how-step">
            <span className="how-number">4</span>
            <span>Get presentation ideas, timelines & shopping list</span>
          </div>
        </div>
      </div>

      {showDashboard && <Dashboard onClose={() => setShowDashboard(false)} />}
    </div>
  );
}
