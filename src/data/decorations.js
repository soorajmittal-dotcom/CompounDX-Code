export const DECORATIONS = {
  themes: [
    { id: 'elegant', name: 'Elegant / Formal', icon: '✨', items: ['Candelabras', 'Linen tablecloths', 'Fresh flower centerpieces', 'Crystal glassware', 'Place cards', 'Cloth napkins with rings'], costEstimate: 8 },
    { id: 'casual', name: 'Casual / Relaxed', icon: '🎈', items: ['Balloons', 'Paper plates & cups', 'Bunting banners', 'Mason jar lights', 'Colorful tablecloths', 'Simple flower vases'], costEstimate: 3 },
    { id: 'outdoor', name: 'Garden / Outdoor', icon: '🌿', items: ['String lights', 'Lanterns', 'Potted plants', 'Outdoor rugs', 'Picnic blankets', 'Citronella candles'], costEstimate: 5 },
    { id: 'tropical', name: 'Tropical / Beach', icon: '🌴', items: ['Palm leaves', 'Tiki torches', 'Pineapple decor', 'Hibiscus flowers', 'Bamboo placemats', 'Seashells'], costEstimate: 5 },
    { id: 'rustic', name: 'Rustic / Country', icon: '🪵', items: ['Burlap runners', 'Wooden crates', 'Wildflowers', 'Mason jars', 'Twine accents', 'Chalkboard signs'], costEstimate: 4 },
    { id: 'festive', name: 'Festive / Holiday', icon: '🎄', items: ['Fairy lights', 'Wreaths', 'Themed ornaments', 'Metallic accents', 'Gift wrap details', 'Candles'], costEstimate: 6 },
    { id: 'kids', name: 'Kids / Fun', icon: '🎪', items: ['Character balloons', 'Bright tablecloths', 'Party hats', 'Streamers', 'Photo booth props', 'Confetti'], costEstimate: 4 },
    { id: 'minimalist', name: 'Minimalist / Modern', icon: '🤍', items: ['Single stem flowers', 'Geometric accents', 'Neutral palette', 'Clean linens', 'Simple candles', 'Minimal centerpieces'], costEstimate: 4 },
  ],
  servingStyles: [
    { id: 'buffet', name: 'Buffet', icon: '🍱', description: 'Self-serve stations where guests help themselves', pros: ['Easy to manage', 'Guests choose portions', 'Less staff needed'], costMultiplier: 1 },
    { id: 'sitdown', name: 'Sit-Down Dinner', icon: '🍽️', description: 'Plated meals served at the table', pros: ['Elegant feel', 'Controlled portions', 'Formal atmosphere'], costMultiplier: 1.3 },
    { id: 'cocktail', name: 'Cocktail Style', icon: '🥂', description: 'Passed appetizers and small bites', pros: ['Social atmosphere', 'Variety of bites', 'Standing/mingling'], costMultiplier: 1.1 },
    { id: 'familyStyle', name: 'Family Style', icon: '👨‍👩‍👧‍👦', description: 'Large shared platters at each table', pros: ['Community feel', 'Shared experience', 'Generous portions'], costMultiplier: 1.1 },
    { id: 'stations', name: 'Food Stations', icon: '🏪', description: 'Multiple themed food stations around the venue', pros: ['Interactive', 'Variety', 'Guests can explore'], costMultiplier: 1.2 },
    { id: 'picnic', name: 'Picnic / Casual', icon: '🧺', description: 'Laid-back outdoor spread on blankets or low tables', pros: ['Relaxed vibe', 'Low cost', 'Fun for all ages'], costMultiplier: 0.9 },
  ],
};

export const PARTY_TYPES = [
  { id: 'birthday', name: 'Birthday Party', icon: '🎂' },
  { id: 'dinner', name: 'Dinner Party', icon: '🍷' },
  { id: 'bbq', name: 'BBQ / Cookout', icon: '🔥' },
  { id: 'holiday', name: 'Holiday Gathering', icon: '🎄' },
  { id: 'wedding', name: 'Wedding Reception', icon: '💍' },
  { id: 'graduation', name: 'Graduation', icon: '🎓' },
  { id: 'baby', name: 'Baby Shower', icon: '🍼' },
  { id: 'housewarming', name: 'Housewarming', icon: '🏠' },
  { id: 'gameday', name: 'Game Day', icon: '🏈' },
  { id: 'potluck', name: 'Potluck', icon: '🥘' },
  { id: 'cocktail', name: 'Cocktail Party', icon: '🍸' },
  { id: 'other', name: 'Other', icon: '🎉' },
];
