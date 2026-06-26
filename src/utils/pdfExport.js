import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  calculateBudgetBreakdown,
  calculatePrepTime,
  getDifficultyScore,
  getHeadCount,
  getEffectiveGuestCount,
  formatCurrency,
  formatTime,
} from './calculations';

const FOOD_SOURCE_LABELS = {
  self: 'Self Cooking',
  order: 'Order / Cater',
  mix: 'Mix & Match',
};

const CATEGORY_LABELS = {
  starters: 'Starters',
  appetizers: 'Appetizers',
  mains: 'Main Courses',
  sides: 'Sides',
  desserts: 'Desserts',
};

export function exportPDF(state) {
  const doc = new jsPDF();
  const budget = calculateBudgetBreakdown(state);
  const prepTime = calculatePrepTime(state.selectedMenu, state.selectedDrinks || []);
  const difficulty = getDifficultyScore(state.selectedMenu);
  const headCount = getHeadCount(state);
  const effectiveCount = getEffectiveGuestCount(state);
  const guests = state.guestList || [];
  const categories = ['appetizers', 'mains', 'desserts'];

  const purple = [124, 58, 237];
  const white = [255, 255, 255];

  doc.setFillColor(...purple);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(24);
  doc.text('PartyPlanner', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Your Complete Party Menu Plan', 105, 27, { align: 'center' });

  let y = 45;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Party Details', 14, y);
  y += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  const vegCount = guests.filter((g) => g.diet === 'veg').length;
  const details = [
    ['Event', state.partyType?.name || 'Custom Party'],
    ['Guests', `${headCount} (${vegCount} veg, ${headCount - vegCount} non-veg)`],
    ['Servings', `${effectiveCount}x (appetite-adjusted)`],
    ['Food Source', FOOD_SOURCE_LABELS[state.foodSource] || '-'],
    ['Prep Time', formatTime(prepTime)],
    ['Difficulty', difficulty],
  ];

  for (const [label, value] of details) {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont(undefined, 'normal');
    doc.text(value, 55, y);
    y += 6;
  }

  if (guests.length > 0) {
    y += 4;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...purple);
    doc.text('Guest List', 14, y);
    y += 4;

    const guestRows = guests.map((g) => [
      g.name,
      g.diet === 'veg' ? 'Veg' : 'Non-Veg',
      g.alcohol ? 'Yes' : 'No',
      `${g.appetite}x`,
      g.rsvp,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Diet', 'Drinks', 'Appetite', 'RSVP']],
      body: guestRows,
      theme: 'striped',
      headStyles: { fillColor: purple, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...purple);
  doc.text('Menu', 14, y);
  y += 4;

  const menuRows = [];
  for (const cat of categories) {
    const items = state.selectedMenu[cat] || [];
    for (const item of items) {
      menuRows.push([
        item.name,
        CATEGORY_LABELS[cat] || cat,
        item.veg ? 'Yes' : 'No',
        item.difficulty || '-',
        item.prepTime ? `${item.prepTime}m` : '-',
        item.cuisine || '-',
      ]);
    }
  }

  if (menuRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Dish', 'Category', 'Veg', 'Difficulty', 'Prep', 'Cuisine']],
      body: menuRows,
      theme: 'striped',
      headStyles: { fillColor: purple, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if ((state.selectedDrinks || []).length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...purple);
    doc.text('Drinks', 14, y);
    y += 4;

    const drinkRows = state.selectedDrinks.map((d) => [
      d.name,
      d.description || '',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Drink', 'Description']],
      body: drinkRows,
      theme: 'striped',
      headStyles: { fillColor: purple, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  const presentations = state.presentations || {};
  if (Object.keys(presentations).length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...purple);
    doc.text('Presentation Ideas', 14, y);
    y += 4;

    const presRows = Object.entries(presentations).map(([name, idea]) => [name, idea]);
    autoTable(doc, {
      startY: y,
      head: [['Dish', 'Presentation']],
      body: presRows,
      theme: 'striped',
      headStyles: { fillColor: purple, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      columnStyles: { 1: { cellWidth: 100 } },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`PartyPlanner — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save('party-menu-plan.pdf');
}
