const STORAGE_KEY = 'partyplanner_saved_plans';

export function savePlan(state) {
  const plans = loadAllPlans();
  const plan = {
    id: Date.now().toString(36),
    name: `${state.partyType?.name || 'Party'} — ${state.guestCount} guests`,
    savedAt: new Date().toISOString(),
    state,
  };
  plans.unshift(plan);
  if (plans.length > 10) plans.length = 10;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return plan;
}

export function loadAllPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deletePlan(id) {
  const plans = loadAllPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}
