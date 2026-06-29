const EQUIPMENT_TAGS = {
  oven: ['bake', 'roast', 'broil', '°F', '°C', 'oven', 'preheat'],
  stove: ['sauté', 'simmer', 'boil', 'fry', 'stir-fry', 'pan-sear', 'reduce', 'cook on'],
  grill: ['grill', 'charred', 'barbecue', 'bbq'],
  fridge: ['refrigerate', 'chill', 'cool', 'overnight', 'marinate'],
};

function detectEquipment(item) {
  const recipe = item._recipe;
  if (!recipe) return [];
  const text = (recipe.steps || []).join(' ').toLowerCase() + ' ' + (recipe.tips || '').toLowerCase();
  const equipment = [];
  for (const [equip, keywords] of Object.entries(EQUIPMENT_TAGS)) {
    if (keywords.some((k) => text.includes(k))) equipment.push(equip);
  }
  return equipment;
}

function canDoDayBefore(item) {
  const recipe = item._recipe;
  if (!recipe) return false;
  const text = ((recipe.tips || '') + ' ' + (recipe.steps || []).join(' ')).toLowerCase();
  return text.includes('ahead') || text.includes('overnight') || text.includes('day before')
    || text.includes('freeze') || text.includes('marinate') || text.includes('soak');
}

export function generateTimeline(selectedMenu, selectedDrinks, partyTime = '18:00', recipes = null) {
  const [startHour, startMin] = partyTime.split(':').map(Number);
  const partyMinutes = startHour * 60 + startMin;

  const allTasks = [];
  const categories = ['desserts', 'mains', 'starters', 'sides', 'appetizers'];
  const categoryLabels = { starters: 'Starter', mains: 'Main', sides: 'Side', desserts: 'Dessert', appetizers: 'Appetizer' };

  for (const cat of categories) {
    const items = selectedMenu[cat] || [];
    for (const item of items) {
      const recipeData = recipes ? recipes[item.name] : null;
      allTasks.push({
        name: item.name,
        category: categoryLabels[cat] || cat,
        prepTime: item.prepTime || 30,
        difficulty: item.difficulty,
        _recipe: recipeData,
      });
    }
  }

  allTasks.sort((a, b) => b.prepTime - a.prepTime);

  const timeline = [];
  const dayBeforeTasks = [];
  const dayOfTasks = [];

  for (const task of allTasks) {
    const equipment = detectEquipment(task);
    const dayBefore = canDoDayBefore(task);
    if (dayBefore) {
      dayBeforeTasks.push({ ...task, equipment });
    }
    dayOfTasks.push({ ...task, equipment, dayBeforePrep: dayBefore });
  }

  if (dayBeforeTasks.length > 0) {
    timeline.push({
      time: 'Day Before',
      task: '📝 Advance prep — do these tasks the evening before',
      duration: 0,
      type: 'section',
    });
    for (const task of dayBeforeTasks) {
      timeline.push({
        time: 'Evening',
        task: `Prep ${task.name}: ${task._recipe?.tips || 'Prepare components ahead'}`,
        duration: Math.round(task.prepTime * 0.3),
        type: 'prep',
        equipment: task.equipment,
      });
    }
    timeline.push({
      time: 'Day Of',
      task: '📝 Party day — main cooking and setup',
      duration: 0,
      type: 'section',
    });
  }

  const totalPrep = totalPrepTime(dayOfTasks);

  timeline.push({
    time: formatTimeOfDay(partyMinutes - totalPrep - 30),
    task: 'Mise en place — gather all ingredients and equipment',
    duration: 30,
    type: 'prep',
  });

  let currentOffset = 30;
  const equipmentSlots = {};

  for (const task of dayOfTasks) {
    const startAt = partyMinutes - totalPrep - 30 + currentOffset;

    const contentions = [];
    for (const equip of task.equipment) {
      const slot = equipmentSlots[equip];
      if (slot && startAt < slot.end) {
        contentions.push({ equipment: equip, conflictWith: slot.name });
      }
      equipmentSlots[equip] = { name: task.name, end: startAt + task.prepTime };
    }

    timeline.push({
      time: formatTimeOfDay(startAt),
      task: `${task.dayBeforePrep ? '(Finish) ' : ''}Prepare ${task.name} (${task.category})`,
      duration: task.prepTime,
      type: 'cook',
      difficulty: task.difficulty,
      equipment: task.equipment,
      contentions,
    });

    currentOffset += Math.max(task.prepTime * 0.4, 10);
  }

  for (const drink of selectedDrinks) {
    if (drink.prepTime > 0) {
      timeline.push({
        time: formatTimeOfDay(partyMinutes - 45),
        task: `Prepare ${drink.name}`,
        duration: drink.prepTime,
        type: 'drink',
      });
    }
  }

  timeline.push({
    time: formatTimeOfDay(partyMinutes - 30),
    task: 'Set up serving area, plates, and table decor',
    duration: 30,
    type: 'setup',
  });

  timeline.push({
    time: formatTimeOfDay(partyMinutes),
    task: 'Guests arrive — party begins!',
    duration: 0,
    type: 'event',
  });

  const sections = timeline.filter((t) => t.type === 'section');
  const rest = timeline.filter((t) => t.type !== 'section');
  rest.sort((a, b) => {
    if (a.time === 'Evening' && b.time !== 'Evening') return -1;
    if (b.time === 'Evening' && a.time !== 'Evening') return 1;
    return parseTime(a.time) - parseTime(b.time);
  });

  const result = [];
  if (sections.length > 0) {
    const dayBeforeSection = sections.find((s) => s.time === 'Day Before');
    const dayOfSection = sections.find((s) => s.time === 'Day Of');
    if (dayBeforeSection) {
      result.push(dayBeforeSection);
      result.push(...rest.filter((t) => t.time === 'Evening'));
    }
    if (dayOfSection) {
      result.push(dayOfSection);
    }
    result.push(...rest.filter((t) => t.time !== 'Evening'));
  } else {
    result.push(...rest);
  }

  return result;
}

export function detectContentions(selectedMenu, recipes) {
  const equipment = {};
  const categories = ['appetizers', 'mains', 'desserts', 'starters', 'sides'];

  for (const cat of categories) {
    for (const item of selectedMenu[cat] || []) {
      const recipe = recipes?.[item.name];
      if (!recipe) continue;
      const text = (recipe.steps || []).join(' ').toLowerCase();
      for (const [equip, keywords] of Object.entries(EQUIPMENT_TAGS)) {
        if (keywords.some((k) => text.includes(k))) {
          if (!equipment[equip]) equipment[equip] = [];
          equipment[equip].push(item.name);
        }
      }
    }
  }

  const warnings = [];
  for (const [equip, dishes] of Object.entries(equipment)) {
    if (dishes.length >= 3) {
      warnings.push({
        equipment: equip,
        dishes,
        message: `${dishes.length} dishes need the ${equip} — consider staggering prep times`,
      });
    }
  }
  return warnings;
}

function totalPrepTime(tasks) {
  if (tasks.length === 0) return 0;
  const maxTime = Math.max(...tasks.map((t) => t.prepTime));
  const overlap = tasks.length > 2 ? (tasks.length - 2) * 10 : 0;
  return maxTime + overlap + 15;
}

function formatTimeOfDay(totalMinutes) {
  let mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function parseTime(timeStr) {
  if (!timeStr || timeStr === 'Evening' || timeStr === 'Day Before' || timeStr === 'Day Of') return -1;
  const [time, period] = timeStr.split(' ');
  if (!period) return -1;
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}
