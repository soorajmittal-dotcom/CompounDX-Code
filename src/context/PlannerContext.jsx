import { createContext, useContext, useReducer } from 'react';

const PlannerContext = createContext(null);

const initialState = {
  started: false,
  step: 0,
  partyType: null,
  guestCount: 10,
  guestList: [],
  cuisines: [],
  foodSource: null,
  cookingSkill: 'medium',
  budget: 500,
  timeAvailable: 180,
  dietaryNeeds: [],
  selectedMenu: { starters: [], mains: [], sides: [], desserts: [] },
  selectedDrinks: [],
  servingStyle: null,
  decoration: null,
  includeAlcohol: false,
};

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
    case 'TOGGLE_MENU_ITEM': {
      const { category, item } = action;
      const current = state.selectedMenu[category] || [];
      const exists = current.find((i) => i.name === item.name);
      const updated = exists ? current.filter((i) => i.name !== item.name) : [...current, item];
      return { ...state, selectedMenu: { ...state.selectedMenu, [category]: updated } };
    }
    case 'TOGGLE_DRINK': {
      const exists = state.selectedDrinks.find((d) => d.name === action.drink.name);
      const updated = exists
        ? state.selectedDrinks.filter((d) => d.name !== action.drink.name)
        : [...state.selectedDrinks, action.drink];
      return { ...state, selectedDrinks: updated };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <PlannerContext.Provider value={{ state, dispatch }}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}
