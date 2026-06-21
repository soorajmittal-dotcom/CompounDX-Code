import { PlannerProvider, usePlanner } from './context/PlannerContext';
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
  const { state } = usePlanner();
  const StepComponent = STEP_COMPONENTS[state.step];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">
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
