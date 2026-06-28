import { supabase } from './supabase';

const LOCAL_KEY = 'partyplanner_cheers';

function getDeviceId() {
  let id = localStorage.getItem('partyplanner_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('partyplanner_device_id', id);
  }
  return id;
}

function loadLocalCheers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalCheers(cheers) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(cheers));
}

export async function toggleCheer(recipeName, category) {
  const deviceId = getDeviceId();
  const locals = loadLocalCheers();
  const key = recipeName.toLowerCase();
  const wasCheered = !!locals[key];

  if (wasCheered) {
    delete locals[key];
    saveLocalCheers(locals);
    try {
      await supabase
        .from('recipe_cheers')
        .delete()
        .eq('device_id', deviceId)
        .eq('recipe_name', recipeName);
    } catch {}
    return false;
  } else {
    locals[key] = { category, cheeredAt: Date.now() };
    saveLocalCheers(locals);
    try {
      await supabase.from('recipe_cheers').insert({
        device_id: deviceId,
        recipe_name: recipeName,
        category: category || 'other',
      });
    } catch {}
    return true;
  }
}

export function isCheeredLocally(recipeName) {
  const locals = loadLocalCheers();
  return !!locals[recipeName.toLowerCase()];
}

export async function getTopRecipes(limit = 20) {
  try {
    const { data } = await supabase
      .rpc('get_top_recipes', { result_limit: limit });

    if (data && data.length > 0) {
      return data;
    }
  } catch {}

  try {
    const { data } = await supabase
      .from('recipe_cheers')
      .select('recipe_name, category')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const counts = {};
      for (const row of data) {
        const key = row.recipe_name;
        if (!counts[key]) counts[key] = { recipe_name: key, category: row.category, cheers: 0 };
        counts[key].cheers++;
      }
      return Object.values(counts)
        .sort((a, b) => b.cheers - a.cheers)
        .slice(0, limit);
    }
  } catch {}

  return [];
}

export async function getTopByCategory(category, limit = 5) {
  try {
    const { data } = await supabase
      .from('recipe_cheers')
      .select('recipe_name')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(200);

    if (data && data.length > 0) {
      const counts = {};
      for (const row of data) {
        counts[row.recipe_name] = (counts[row.recipe_name] || 0) + 1;
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, cheers]) => ({ recipe_name: name, cheers }));
    }
  } catch {}

  return [];
}
