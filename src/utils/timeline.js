export function generateTimeline(selectedMenu, selectedDrinks, partyTime = '18:00') {
  const [startHour, startMin] = partyTime.split(':').map(Number);
  const partyMinutes = startHour * 60 + startMin;

  const allTasks = [];
  const categories = ['desserts', 'mains', 'starters', 'sides'];
  const categoryLabels = { starters: 'Starter', mains: 'Main', sides: 'Side', desserts: 'Dessert' };

  for (const cat of categories) {
    const items = selectedMenu[cat] || [];
    for (const item of items) {
      allTasks.push({
        name: item.name,
        category: categoryLabels[cat],
        prepTime: item.prepTime,
        difficulty: item.difficulty,
      });
    }
  }

  allTasks.sort((a, b) => b.prepTime - a.prepTime);

  const timeline = [];
  let currentOffset = 0;

  timeline.push({
    time: formatTimeOfDay(partyMinutes - totalPrepTime(allTasks) - 30),
    task: 'Mise en place — gather all ingredients and equipment',
    duration: 30,
    type: 'prep',
  });
  currentOffset += 30;

  for (const task of allTasks) {
    const startAt = partyMinutes - totalPrepTime(allTasks) - 30 + currentOffset;
    timeline.push({
      time: formatTimeOfDay(startAt),
      task: `Prepare ${task.name} (${task.category})`,
      duration: task.prepTime,
      type: 'cook',
      difficulty: task.difficulty,
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

  timeline.sort((a, b) => {
    const aMin = parseTime(a.time);
    const bMin = parseTime(b.time);
    return aMin - bMin;
  });

  return timeline;
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
  const [time, period] = timeStr.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}
