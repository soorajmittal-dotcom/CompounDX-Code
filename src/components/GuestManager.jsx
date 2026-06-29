import { usePlanner, DIETARY_TAGS } from '../context/PlannerContext';
import { useState, useEffect, useRef } from 'react';
import { searchGuests, saveGuestProfile } from '../utils/guestDb';

const DIET_OPTIONS = [
  { id: 'veg', label: 'Veg', icon: '🥬' },
  { id: 'nonveg', label: 'Non-Veg', icon: '🍗' },
];

const APPETITE_OPTIONS = [
  { value: 0.5, label: 'Light (0.5x)' },
  { value: 1, label: 'Regular (1x)' },
  { value: 2, label: 'Heavy (2x)' },
];

const RESTRICTION_KEYS = Object.keys(DIETARY_TAGS);

export default function GuestManager() {
  const { state, dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkCount, setBulkCount] = useState(4);
  const [bulkDiet, setBulkDiet] = useState('nonveg');
  const inputRef = useRef(null);
  const guests = state.guestList || [];

  const vegCount = guests.filter((g) => g.diet === 'veg').length;
  const nonVegCount = guests.filter((g) => g.diet !== 'veg').length;
  const alcoholCount = guests.filter((g) => g.alcohol).length;
  const noAlcoholCount = guests.length - alcoholCount;

  useEffect(() => {
    if (name.length >= 1) {
      searchGuests(name).then((results) => {
        const existing = guests.map((g) => g.name.toLowerCase());
        const filtered = results.filter(
          (r) => !existing.includes(r.name.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name]);

  const addGuest = (profile) => {
    const guestName = profile ? profile.name : name.trim();
    if (!guestName) return;
    if (guests.some((g) => g.name.toLowerCase() === guestName.toLowerCase())) return;

    const guest = {
      id: Date.now(),
      name: guestName,
      diet: profile?.diet || 'nonveg',
      alcohol: profile?.alcohol ?? true,
      appetite: profile?.appetite || 1,
      rsvp: 'confirmed',
      restrictions: profile?.restrictions || [],
    };
    dispatch({ type: 'ADD_GUEST', guest });
    saveGuestProfile(guest);
    setName('');
    setShowSuggestions(false);
  };

  const addBulkGuests = () => {
    const newGuests = [];
    const startNum = guests.length + 1;
    for (let i = 0; i < bulkCount; i++) {
      newGuests.push({
        id: Date.now() + i,
        name: `Guest ${startNum + i}`,
        diet: bulkDiet,
        alcohol: bulkDiet === 'nonveg',
        appetite: 1,
        rsvp: 'confirmed',
        restrictions: [],
      });
    }
    dispatch({ type: 'ADD_GUESTS_BULK', guests: newGuests });
    setShowBulkAdd(false);
  };

  const updateGuest = (id, updates) => {
    dispatch({ type: 'UPDATE_GUEST', id, updates });
    const guest = guests.find((g) => g.id === id);
    if (guest) saveGuestProfile({ ...guest, ...updates });
  };

  const toggleRestriction = (id, restriction) => {
    const guest = guests.find((g) => g.id === id);
    if (!guest) return;
    const current = guest.restrictions || [];
    const updated = current.includes(restriction)
      ? current.filter((r) => r !== restriction)
      : [...current, restriction];
    updateGuest(id, { restrictions: updated });
  };

  const removeGuest = (id) => dispatch({ type: 'REMOVE_GUEST', id });

  const rsvpColors = {
    pending: '#6b7280',
    confirmed: '#22c55e',
    declined: '#ef4444',
    maybe: '#f59e0b',
  };
  const rsvpOrder = ['confirmed', 'pending', 'maybe', 'declined'];

  const allRestrictions = new Set();
  for (const g of guests) {
    for (const r of g.restrictions || []) allRestrictions.add(r);
  }

  return (
    <div className="guest-manager">
      <div className="guest-header">
        <h3>Guest List</h3>
        {guests.length > 0 && (
          <span className="guest-stats">
            {guests.length} guests &middot; {vegCount} veg, {nonVegCount} non-veg &middot; {alcoholCount} drinks, {noAlcoholCount} no-alcohol
            {allRestrictions.size > 0 && (
              <> &middot; {[...allRestrictions].map((r) => DIETARY_TAGS[r]?.icon).join('')}</>
            )}
          </span>
        )}
      </div>

      <div className="guest-add" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addGuest()}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Type guest name..."
          className="guest-input"
        />
        <button className="btn btn-primary btn-compact" onClick={() => addGuest()}>
          Add
        </button>
        <button
          className="btn btn-outline btn-compact"
          onClick={() => setShowBulkAdd(!showBulkAdd)}
          title="Quick-add multiple guests"
        >
          +{bulkCount}
        </button>
        {showSuggestions && (
          <div className="suggestion-dropdown">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="suggestion-item"
                onMouseDown={() => addGuest(s)}
              >
                <span className="suggestion-name">{s.name}</span>
                <span className="suggestion-meta">
                  {s.diet === 'veg' ? '🥬' : '🍗'}
                  {s.alcohol ? ' 🍺' : ' 🚫'}
                  {' '}
                  {s.appetite}x
                  {(s.restrictions || []).map((r) => ` ${DIETARY_TAGS[r]?.icon || ''}`)}
                </span>
              </button>
            ))}
            <div className="suggestion-hint">Saved guests — click to add with preferences</div>
          </div>
        )}
      </div>

      {showBulkAdd && (
        <div className="bulk-add-panel">
          <div className="bulk-add-row">
            <label>
              Add
              <input
                type="number"
                min="1"
                max="50"
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="bulk-count-input"
              />
              guests as
            </label>
            <div className="pref-group">
              {DIET_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  className={`pref-chip ${bulkDiet === d.id ? 'active' : ''}`}
                  onClick={() => setBulkDiet(d.id)}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-compact" onClick={addBulkGuests}>
              Add All
            </button>
          </div>
        </div>
      )}

      {guests.length > 0 && (
        <div className="guest-list">
          {guests.map((g) => (
            <div key={g.id} className="guest-row">
              <div className="guest-main">
                <button
                  className="rsvp-badge"
                  style={{ background: rsvpColors[g.rsvp] }}
                  onClick={() => {
                    const next = rsvpOrder[(rsvpOrder.indexOf(g.rsvp) + 1) % rsvpOrder.length];
                    updateGuest(g.id, { rsvp: next });
                  }}
                  title="Click to change RSVP"
                >
                  {g.rsvp}
                </button>
                <span className="guest-name">{g.name}</span>
                <button className="guest-remove" onClick={() => removeGuest(g.id)}>
                  &times;
                </button>
              </div>
              <div className="guest-prefs">
                <div className="pref-group">
                  {DIET_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      className={`pref-chip ${g.diet === d.id ? 'active' : ''}`}
                      onClick={() => updateGuest(g.id, { diet: d.id })}
                    >
                      {d.icon} {d.label}
                    </button>
                  ))}
                </div>
                <div className="pref-group">
                  <button
                    className={`pref-chip ${g.alcohol ? 'active' : ''}`}
                    onClick={() => updateGuest(g.id, { alcohol: !g.alcohol })}
                  >
                    {g.alcohol ? '🍺 Drinks' : '🚫 No Alcohol'}
                  </button>
                </div>
                <div className="pref-group">
                  {APPETITE_OPTIONS.map((a) => (
                    <button
                      key={a.value}
                      className={`pref-chip small ${g.appetite === a.value ? 'active' : ''}`}
                      onClick={() => updateGuest(g.id, { appetite: a.value })}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="guest-restrictions">
                {RESTRICTION_KEYS.map((key) => {
                  const tag = DIETARY_TAGS[key];
                  const active = (g.restrictions || []).includes(key);
                  return (
                    <button
                      key={key}
                      className={`pref-chip small ${active ? 'active restriction-active' : ''}`}
                      onClick={() => toggleRestriction(g.id, key)}
                      title={tag.label}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {guests.length === 0 && (
        <p className="guest-empty">
          Add guests individually or use the +N button to quick-add a group.
          Previously added guests will be auto-suggested.
        </p>
      )}
    </div>
  );
}
