import { usePlanner } from '../context/PlannerContext';
import GuestManager from './GuestManager';

export default function StepGuests() {
  const { state, dispatch } = usePlanner();
  const guests = state.guestList || [];

  return (
    <div className="step-content">
      <h2>Who's Coming?</h2>
      <p className="step-subtitle">
        Add your guests and set their dietary preferences, drink choices, and appetite levels
      </p>

      <GuestManager />

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={guests.length === 0}
          onClick={() => dispatch({ type: 'NEXT_STEP' })}
        >
          Continue ({guests.length} guest{guests.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}
