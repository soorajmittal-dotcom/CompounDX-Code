import { supabase } from './supabase';

const STORAGE_KEY = 'partyplanner_saved_plans';

function getDeviceId() {
  let id = localStorage.getItem('partyplanner_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('partyplanner_device_id', id);
  }
  return id;
}

function loadLocalPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export async function savePlan(state) {
  const guestCount = (state.guestList || []).length || state.guestCount || 0;
  const plan = {
    id: Date.now().toString(36),
    name: `${state.partyType?.name || 'Party'} — ${guestCount} guests`,
    savedAt: new Date().toISOString(),
    state,
  };

  const plans = loadLocalPlans();
  plans.unshift(plan);
  if (plans.length > 10) plans.length = 10;
  saveLocalPlans(plans);

  try {
    await supabase.from('plans').insert({
      plan_id: plan.id,
      device_id: getDeviceId(),
      name: plan.name,
      data: plan.state,
    });
  } catch {}

  return plan;
}

export async function loadAllPlans() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('device_id', getDeviceId())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.plan_id,
        name: row.name,
        savedAt: row.created_at,
        state: row.data,
      }));
    }
  } catch {}

  return loadLocalPlans();
}

export async function deletePlan(id) {
  const plans = loadLocalPlans().filter((p) => p.id !== id);
  saveLocalPlans(plans);

  try {
    await supabase
      .from('plans')
      .delete()
      .eq('plan_id', id)
      .eq('device_id', getDeviceId());
  } catch {}
}
