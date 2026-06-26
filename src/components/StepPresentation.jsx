import { usePlanner } from '../context/PlannerContext';
import { useState } from 'react';

const PRESENTATION_IDEAS = {
  'Samosa': 'Serve in newspaper-style paper cones with green chutney and tamarind dipping bowls',
  'Paneer Tikka': 'Arrange on a wooden platter with sliced onions, lemon wedges, and mint chutney',
  'Chicken Tikka': 'Serve on sizzling hot plate with onion rings and lemon wedges',
  'Spring Rolls': 'Serve standing upright in tall glasses with sweet chili sauce at the bottom',
  'Bruschetta': 'Line up on a long wooden board with basil leaves scattered around',
  'Guacamole & Chips': 'Serve in a stone molcajete with colorful tortilla chips fanned around it',
  'Nachos Supreme': 'Build a nacho tower on a large sharing platter with toppings cascading down',
  'Dumplings': 'Present in traditional bamboo steamers stacked two or three high',
  'Gyoza': 'Arrange in a circle on a dark plate with dipping sauce in the center',
  'Edamame': 'Serve in a rustic bowl with flaky sea salt and lime wedges on the side',
  'Buffalo Wings': 'Pile on a metal tray lined with parchment, blue cheese dip on the side',
  'Hummus & Pita': 'Swirl hummus in a shallow bowl, drizzle olive oil, serve pita triangles around',
  'Falafel': 'Arrange on a mezze board with tahini, pickles, and fresh herbs',
  'Butter Chicken': 'Serve in a copper handi with a swirl of cream and fresh coriander on top',
  'Biryani': 'Present in a sealed clay pot (handi), break the seal at the table for drama',
  'Dal Makhani': 'Serve in a black stone bowl with a dollop of butter melting on top',
  'Lasagna': 'Cut into perfect squares, plate with a basil leaf and parmesan shavings',
  'Margherita Pizza': 'Serve on a wooden pizza board, pre-sliced, with fresh basil scattered',
  'Tacos al Pastor': 'Set up a DIY taco bar with fillings in colorful bowls',
  'Pad Thai': 'Serve in individual wok-shaped bowls with lime wedge and crushed peanuts',
  'Green Curry': 'Present in a coconut shell bowl with a thai basil sprig',
  'Sushi Platter': 'Arrange on a long slate board with wasabi, ginger, and edible flowers',
  'Ramen': 'Serve in deep ceramic bowls with toppings arranged in sections',
  'Gourmet Burgers': 'Stack tall with a wooden skewer, serve on a mini cutting board',
  'Mac & Cheese': 'Serve in individual cast-iron skillets with a crispy breadcrumb top',
  'Chicken Shawarma': 'Wrap in foil cones, stand upright in a wire holder',
  'Gulab Jamun': 'Serve warm in small copper bowls with a drizzle of saffron syrup',
  'Tiramisu': 'Layer in clear glass cups to show the beautiful layers',
  'Churros': 'Stand churros upright in a tall cup with chocolate dipping sauce',
  'Mochi': 'Arrange different flavors on a black slate with edible flowers',
  'Cheesecake': 'Serve individual slices with berry coulis drizzled artistically on the plate',
  'Baklava': 'Stack in a pyramid on a brass plate with crushed pistachios around',
};

const GENERIC_IDEAS = [
  'Serve on a clean white plate with a garnish of fresh herbs',
  'Use a rustic wooden board for a farm-to-table feel',
  'Present in individual portions in small ceramic bowls',
  'Arrange on a slate plate with colorful garnishes',
  'Serve family-style on a large sharing platter',
  'Use mini cast-iron skillets for an elevated presentation',
];

const CATEGORIES = ['appetizers', 'mains', 'desserts'];
const CAT_LABELS = { appetizers: '🥗 Appetizers', mains: '🍛 Mains', desserts: '🍰 Desserts' };

export default function StepPresentation() {
  const { state, dispatch } = usePlanner();
  const [editingItem, setEditingItem] = useState(null);
  const [customText, setCustomText] = useState('');

  const allMenuItems = [];
  for (const cat of CATEGORIES) {
    const items = state.selectedMenu[cat] || [];
    for (const item of items) {
      allMenuItems.push({ ...item, category: cat });
    }
  }
  for (const drink of state.selectedDrinks) {
    allMenuItems.push({ ...drink, category: 'drinks' });
  }

  const getPresentation = (itemName) => {
    if (state.presentations[itemName]) return state.presentations[itemName];
    if (PRESENTATION_IDEAS[itemName]) return PRESENTATION_IDEAS[itemName];
    return null;
  };

  const setPresentation = (itemName, text) => {
    dispatch({ type: 'SET_PRESENTATION', itemName, presentation: text });
    setEditingItem(null);
    setCustomText('');
  };

  const startEdit = (itemName) => {
    setEditingItem(itemName);
    setCustomText(getPresentation(itemName) || '');
  };

  const itemsWithIdeas = allMenuItems.filter((i) => getPresentation(i.name));
  const itemsWithout = allMenuItems.filter((i) => !getPresentation(i.name));

  return (
    <div className="step-content">
      <h2>Presentation Style</h2>
      <p className="step-subtitle">
        How each dish should be served — we've added ideas where we can
      </p>

      {CATEGORIES.map((cat) => {
        const items = (state.selectedMenu[cat] || []);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="presentation-category">
            <h3>{CAT_LABELS[cat]}</h3>
            <div className="presentation-list">
              {items.map((item) => {
                const idea = getPresentation(item.name);
                const isEditing = editingItem === item.name;
                return (
                  <div key={item.name} className="presentation-card">
                    <div className="presentation-header">
                      <span className="presentation-name">
                        {item.name}
                        {item.veg && <span className="veg-badge-sm">V</span>}
                      </span>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => isEditing ? setEditingItem(null) : startEdit(item.name)}
                      >
                        {isEditing ? 'Cancel' : idea ? 'Edit' : 'Add Idea'}
                      </button>
                    </div>
                    {isEditing ? (
                      <div className="presentation-edit">
                        <textarea
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Describe how this dish should be presented..."
                          rows={2}
                          className="presentation-textarea"
                        />
                        {PRESENTATION_IDEAS[item.name] && !state.presentations[item.name] && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => setCustomText(PRESENTATION_IDEAS[item.name])}
                          >
                            Use suggestion
                          </button>
                        )}
                        <div className="presentation-suggestions">
                          {GENERIC_IDEAS.map((g, i) => (
                            <button
                              key={i}
                              className="pref-chip small"
                              onClick={() => setCustomText(g)}
                            >
                              {g.slice(0, 40)}...
                            </button>
                          ))}
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!customText.trim()}
                          onClick={() => setPresentation(item.name, customText.trim())}
                        >
                          Save
                        </button>
                      </div>
                    ) : idea ? (
                      <p className="presentation-idea">{idea}</p>
                    ) : (
                      <p className="presentation-empty">No presentation idea yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {state.selectedDrinks.length > 0 && (
        <div className="presentation-category">
          <h3>🥤 Drinks</h3>
          <div className="presentation-list">
            {state.selectedDrinks.map((drink) => {
              const idea = getPresentation(drink.name);
              const isEditing = editingItem === drink.name;
              return (
                <div key={drink.name} className="presentation-card">
                  <div className="presentation-header">
                    <span className="presentation-name">{drink.name}</span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => isEditing ? setEditingItem(null) : startEdit(drink.name)}
                    >
                      {isEditing ? 'Cancel' : idea ? 'Edit' : 'Add Idea'}
                    </button>
                  </div>
                  {isEditing ? (
                    <div className="presentation-edit">
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Describe how this drink should be presented..."
                        rows={2}
                        className="presentation-textarea"
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!customText.trim()}
                        onClick={() => setPresentation(drink.name, customText.trim())}
                      >
                        Save
                      </button>
                    </div>
                  ) : idea ? (
                    <p className="presentation-idea">{idea}</p>
                  ) : (
                    <p className="presentation-empty">No presentation idea yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'PREV_STEP' })}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
          View Summary
        </button>
      </div>
    </div>
  );
}
