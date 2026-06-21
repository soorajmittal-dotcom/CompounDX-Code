import { useEffect } from 'react';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import { getPlanFromUrl } from './utils/share';
import LandingPage from './components/LandingPage';
import ThemeToggle from './components/ThemeToggle';
import ProgressBar from './components/ProgressBar';
import StepPartyType from './components/StepPartyType';
import StepGuestsBudget from './components/StepGuestsBudget';
import StepCuisine from './components/StepCuisine';
import StepFoodSource from './components/StepFoodSource';
import StepMenu from './components/StepMenu';
import StepDrinks from './components/StepDrinks';
import StepPresentation from './components/StepPresentation';
import StepSummary from './components/StepSummary';
import './App.css';

const STEP_COMPONENTS = [
  StepPartyType,
  StepGuestsBudget,
  StepCuisine,
  StepFoodSource,
  StepMenu,
  StepDrinks,
  StepPresentation,
  StepSummary,
];

function PlannerApp() {
  const { state, dispatch } = usePlanner();

  useEffect(() => {
    const shared = getPlanFromUrl();
    if (shared) {
      for (const [key, value] of Object.entries(shared)) {
        dispatch({ type: 'SET_FIELD', field: key, value });
      }
      dispatch({ type: 'SET_FIELD', field: 'started', value: true });
      dispatch({ type: 'GO_TO_STEP', step: 7 });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!state.started) {
    return (
      <div className="app">
        <header className="app-header app-header-landing">
          <div className="header-content">
            <h1 className="logo">
              <span className="logo-icon">🎉</span>
              PartyPlanner
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="main-content landing-content">
          <LandingPage />
        </main>
        <footer className="app-footer">
          <p>PartyPlanner — Making every gathering delicious</p>
        </footer>
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[state.step];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1
            className="logo logo-clickable"
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'started', value: false })}
            title="Back to home"
          >
            <span className="logo-icon">🎉</span>
            PartyPlanner
          </h1>
          <p className="tagline">Plan the perfect party menu</p>
        </div>
      </header>
      <ProgressBar />
      <main className="main-content">
        <StepComponent />
      </main>
      <footer className="app-footer">
        <p>PartyPlanner — Making every gathering delicious</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <PlannerProvider>
      <PlannerApp />
    </PlannerProvider>
  );
}

export default App;
