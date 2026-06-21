import { usePlanner } from '../context/PlannerContext';
import { useState } from 'react';
import { DIETARY_OPTIONS } from '../data/cuisines';

export default function GuestManager() {
  const { state, dispatch } = usePlanner();
  const [newName, setNewName] = useState('');
  const guests = state.guestList || [];

  const setGuests = (list) => {
    dispatch({ type: 'SET_FIELD', field: 'guestList', value: list });
    dispatch({ type: 'SET_FIELD', field: 'guestCount', value: Math.max(list.length, 2) });
  };

  const addGuest = () => {
    const name = newName.trim();
    if (!name) return;
    setGuests([...guests, { id: Date.now(), name, dietary: [], rsvp: 'pending' }]);
    setNewName('');
  };

  const removeGuest = (id) => setGuests(guests.filter((g) => g.id !== id));

  const toggleDietary = (id, dietId) => {
    setGuests(
      guests.map((g) => {
        if (g.id !== id) return g;
        const has = g.dietary.includes(dietId);
        return { ...g, dietary: has ? g.dietary.filter((d) => d !== dietId) : [...g.dietary, dietId] };
      })
    );
  };

  const cycleRsvp = (id) => {
    const order = ['pending', 'confirmed', 'declined', 'maybe'];
    setGuests(
      guests.map((g) => {
        if (g.id !== id) return g;
        const next = order[(order.indexOf(g.rsvp) + 1) % order.length];
        return { ...g, rsvp: next };
      })
    );
  };

  const rsvpColors = {
    pending: '#6b7280',
    confirmed: '#22c55e',
    declined: '#ef4444',
    maybe: '#f59e0b',
  };

  const confirmed = guests.filter((g) => g.rsvp === 'confirmed').length;
  const pending = guests.filter((g) => g.rsvp === 'pending').length;

  return (
    <div className="guest-manager">
      <div className="guest-header">
        <h3>Guest List</h3>
        {guests.length > 0 && (
          <span className="guest-stats">
            {confirmed} confirmed, {pending} pending, {guests.length} total
          </span>
        )}
      </div>

      <div className="guest-add">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addGuest()}
          placeholder="Add guest name..."
          className="guest-input"
        />
        <button className="btn btn-primary btn-compact" onClick={addGuest}>
          Add
        </button>
      </div>

      {guests.length > 0 && (
        <div className="guest-list">
          {guests.map((g) => (
            <div key={g.id} className="guest-row">
              <div className="guest-main">
                <button
                  className="rsvp-badge"
                  style={{ background: rsvpColors[g.rsvp] }}
                  onClick={() => cycleRsvp(g.id)}
                  title="Click to change RSVP status"
                >
                  {g.rsvp}
                </button>
                <span className="guest-name">{g.name}</span>
                <button className="guest-remove" onClick={() => removeGuest(g.id)}>
                  x
                </button>
              </div>
              <div className="guest-dietary">
                {DIETARY_OPTIONS.filter((d) => d.id !== 'none').map((d) => (
                  <button
                    key={d.id}
                    className={`dietary-chip ${g.dietary.includes(d.id) ? 'active' : ''}`}
                    onClick={() => toggleDietary(g.id, d.id)}
                    title={d.label}
                  >
                    {d.icon}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {guests.length === 0 && (
        <p className="guest-empty">
          Add guests to track RSVPs and individual dietary needs, or use the slider above for a quick count.
        </p>
      )}
    </div>
  );
}
