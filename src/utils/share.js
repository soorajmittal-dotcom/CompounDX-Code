const SHAREABLE_FIELDS = [
  'partyType', 'guestList', 'courseCounts', 'foodSource', 'cookingSkill',
  'timeAvailable', 'cuisinesByCategory', 'selectedMenu', 'customItems',
  'selectedDrinks', 'presentations', 'servingStyle', 'decoration',
];

export function encodePlan(state) {
  const data = {};
  for (const key of SHAREABLE_FIELDS) {
    if (state[key] !== undefined && state[key] !== null) {
      data[key] = state[key];
    }
  }
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodePlan(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getShareUrl(state) {
  const encoded = encodePlan(state);
  const base = window.location.origin + window.location.pathname;
  return `${base}?plan=${encoded}`;
}

export function getPlanFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('plan');
  if (!encoded) return null;
  return decodePlan(encoded);
}
