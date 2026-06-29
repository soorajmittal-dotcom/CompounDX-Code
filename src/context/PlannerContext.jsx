import { createContext, useContext, useReducer, useEffect } from 'react';

const PlannerContext = createContext(null);

const PERSIST_KEY = 'partyplanner_state';

const initialState = {
  started: false,
  step: 0,
  guestList: [],
  courseCounts: {
    vegAppetizers: 2,
    nonVegAppetizers: 1,
    vegMains: 2,
    nonVegMains: 1,
    desserts: 2,
    drinks: 3,
  },
  foodSource: null,
  cookingSkill: 'medium',
  timeAvailable: 180,
  cuisinesByCategory: {
    appetizers: [],
    mains: [],
    desserts: [],
  },
  selectedMenu: { appetizers: [], mains: [], desserts: [] },
  customItems: { appetizers: [], mains: [], desserts: [] },
  selectedDrinks: [],
  includeAlcohol: false,
  presentations: {},
  budget: 0,
  currency: 'INR',
  servingStyle: null,
  decoration: null,
  partyType: null,
  leftoverTolerance: 1.15,
};

const DIETARY_TAGS = {
  jain: { label: 'Jain', icon: '🙏', excludes: ['onion', 'garlic', 'potato', 'carrot', 'beetroot', 'radish', 'turnip', 'ginger'] },
  vegan: { label: 'Vegan', icon: '🌱', excludes: ['paneer', 'cream', 'yogurt', 'cheese', 'butter', 'ghee', 'milk', 'egg', 'honey', 'mascarpone', 'ricotta', 'mozzarella', 'parmesan'] },
  glutenFree: { label: 'Gluten-Free', icon: '🌾', excludes: ['flour', 'bread', 'pasta', 'noodle', 'naan', 'pita', 'tortilla', 'baguette', 'bun', 'lasagna', 'ladyfinger', 'bhature', 'soy sauce'] },
  nutFree: { label: 'Nut-Free', icon: '🥜', excludes: ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'pine nut'] },
  halal: { label: 'Halal', icon: '☪️', excludeItems: ['pork', 'bacon', 'ham', 'lard', 'wine', 'beer', 'rum', 'liqueur'] },
  noPork: { label: 'No Pork', icon: '🐷', excludeItems: ['pork', 'bacon', 'ham', 'lard', 'prosciutto', 'pancetta'] },
  noBeef: { label: 'No Beef', icon: '🐄', excludeItems: ['beef', 'steak', 'ground beef'] },
};

export { DIETARY_TAGS };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'GO_TO_STEP':
      return { ...state, step: action.step };
    case 'UPDATE_GUEST': {
      const list = state.guestList.map((g) =>
        g.id === action.id ? { ...g, ...action.updates } : g
      );
      return { ...state, guestList: list };
    }
    case 'ADD_GUEST':
      return { ...state, guestList: [...state.guestList, action.guest] };
    case 'ADD_GUESTS_BULK': {
      return { ...state, guestList: [...state.guestList, ...action.guests] };
    }
    case 'REMOVE_GUEST':
      return { ...state, guestList: state.guestList.filter((g) => g.id !== action.id) };
    case 'SET_COURSE_COUNT':
      return {
        ...state,
        courseCounts: { ...state.courseCounts, [action.field]: action.value },
      };
    case 'SET_CUISINE_FOR_CATEGORY':
      return {
        ...state,
        cuisinesByCategory: { ...state.cuisinesByCategory, [action.category]: action.cuisines },
      };
    case 'TOGGLE_MENU_ITEM': {
      const { category, item } = action;
      const current = state.selectedMenu[category] || [];
      const exists = current.find((i) => i.name === item.name);
      const updated = exists ? current.filter((i) => i.name !== item.name) : [...current, item];
      return { ...state, selectedMenu: { ...state.selectedMenu, [category]: updated } };
    }
    case 'ADD_CUSTOM_ITEM': {
      const { category, item } = action;
      const current = state.customItems[category] || [];
      return {
        ...state,
        customItems: { ...state.customItems, [category]: [...current, item] },
        selectedMenu: {
          ...state.selectedMenu,
          [category]: [...(state.selectedMenu[category] || []), item],
        },
      };
    }
    case 'TOGGLE_DRINK': {
      const exists = state.selectedDrinks.find((d) => d.name === action.drink.name);
      const updated = exists
        ? state.selectedDrinks.filter((d) => d.name !== action.drink.name)
        : [...state.selectedDrinks, action.drink];
      return { ...state, selectedDrinks: updated };
    }
    case 'SET_PRESENTATION':
      return {
        ...state,
        presentations: { ...state.presentations, [action.itemName]: action.presentation },
      };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

function loadPersistedState() {
  try {
    const saved = localStorage.getItem(PERSIST_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch {}
  return initialState;
}

function persistState(state) {
  try {
    const { started, ...rest } = state;
    if (started) {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
    }
  } catch {}
}

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadPersistedState);

  useEffect(() => {
    persistState(state);
  }, [state]);

  return <PlannerContext.Provider value={{ state, dispatch }}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}
