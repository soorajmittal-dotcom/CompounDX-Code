import { createContext, useContext, useReducer } from 'react';

const PlannerContext = createContext(null);

const initialState = {
  started: false,
  step: 0,
  // Step 1: Guests
  guestList: [],
  // Step 2: Course counts
  courseCounts: {
    vegAppetizers: 2,
    nonVegAppetizers: 1,
    vegMains: 2,
    nonVegMains: 1,
    desserts: 2,
    drinks: 3,
  },
  // Cooking config
  foodSource: null, // 'self', 'order', 'mix'
  cookingSkill: 'medium',
  timeAvailable: 180,
  // Step 3: Cuisines per course
  cuisinesByCategory: {
    appetizers: [],
    mains: [],
    desserts: [],
  },
  // Step 4: Selected menu
  selectedMenu: { appetizers: [], mains: [], desserts: [] },
  customItems: { appetizers: [], mains: [], desserts: [] },
  // Step 5: Drinks
  selectedDrinks: [],
  includeAlcohol: false,
  // Step 6: Presentation
  presentations: {},
  // Budget
  budget: 500,
  // Serving & decoration
  servingStyle: null,
  decoration: null,
  partyType: null,
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
    case 'UPDATE_GUEST': {
      const list = state.guestList.map((g) =>
        g.id === action.id ? { ...g, ...action.updates } : g
      );
      return { ...state, guestList: list };
    }
    case 'ADD_GUEST': {
      return { ...state, guestList: [...state.guestList, action.guest] };
    }
    case 'REMOVE_GUEST': {
      return { ...state, guestList: state.guestList.filter((g) => g.id !== action.id) };
    }
    case 'SET_COURSE_COUNT': {
      return {
        ...state,
        courseCounts: { ...state.courseCounts, [action.field]: action.value },
      };
    }
    case 'SET_CUISINE_FOR_CATEGORY': {
      return {
        ...state,
        cuisinesByCategory: { ...state.cuisinesByCategory, [action.category]: action.cuisines },
      };
    }
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
    case 'SET_PRESENTATION': {
      return {
        ...state,
        presentations: { ...state.presentations, [action.itemName]: action.presentation },
      };
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
