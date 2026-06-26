import { supabase } from './supabase';

const LOCAL_KEY = 'partyplanner_known_guests';

function getDeviceId() {
  let id = localStorage.getItem('partyplanner_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('partyplanner_device_id', id);
  }
  return id;
}

function loadLocalGuests() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalGuests(guests) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(guests));
}

export async function saveGuestProfile(guest) {
  const locals = loadLocalGuests();
  const idx = locals.findIndex(
    (g) => g.name.toLowerCase() === guest.name.toLowerCase()
  );
  const profile = {
    name: guest.name,
    diet: guest.diet || 'nonveg',
    alcohol: guest.alcohol ?? true,
    appetite: guest.appetite || 1,
  };
  if (idx >= 0) locals[idx] = profile;
  else locals.push(profile);
  saveLocalGuests(locals);

  try {
    const deviceId = getDeviceId();
    const { data } = await supabase
      .from('known_guests')
      .select('id')
      .eq('device_id', deviceId)
      .ilike('name', guest.name)
      .limit(1);

    if (data && data.length > 0) {
      await supabase
        .from('known_guests')
        .update({ diet: profile.diet, alcohol: profile.alcohol, appetite: profile.appetite })
        .eq('id', data[0].id);
    } else {
      await supabase.from('known_guests').insert({
        device_id: deviceId,
        name: profile.name,
        diet: profile.diet,
        alcohol: profile.alcohol,
        appetite: profile.appetite,
      });
    }
  } catch {}
}

export async function searchGuests(query) {
  if (!query || query.length < 1) return [];

  try {
    const { data } = await supabase
      .from('known_guests')
      .select('*')
      .eq('device_id', getDeviceId())
      .ilike('name', `%${query}%`)
      .limit(5);

    if (data && data.length > 0) {
      return data.map((g) => ({
        name: g.name,
        diet: g.diet || 'nonveg',
        alcohol: g.alcohol ?? true,
        appetite: g.appetite || 1,
      }));
    }
  } catch {}

  return loadLocalGuests().filter(
    (g) => g.name.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getAllKnownGuests() {
  try {
    const { data } = await supabase
      .from('known_guests')
      .select('*')
      .eq('device_id', getDeviceId())
      .order('name');

    if (data && data.length > 0) {
      return data.map((g) => ({
        name: g.name,
        diet: g.diet || 'nonveg',
        alcohol: g.alcohol ?? true,
        appetite: g.appetite || 1,
      }));
    }
  } catch {}

  return loadLocalGuests();
}
