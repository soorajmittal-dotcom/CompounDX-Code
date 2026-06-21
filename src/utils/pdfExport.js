import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  calculateBudgetBreakdown,
  calculatePrepTime,
  getDifficultyScore,
  formatCurrency,
  formatTime,
} from './calculations';

const FOOD_SOURCE_LABELS = {
  self: 'Self Cooking',
  catering: 'Professional Catering',
  order: 'Restaurant Orders',
  mix: 'Mix & Match',
};

const CATEGORY_LABELS = {
  starters: 'Starters',
  mains: 'Main Courses',
  sides: 'Sides',
  desserts: 'Desserts',
};

export function exportPDF(state) {
  const doc = new jsPDF();
  const budget = calculateBudgetBreakdown(state);
  const prepTime = calculatePrepTime(state.selectedMenu, state.selectedDrinks);
  const difficulty = getDifficultyScore(state.selectedMenu);
  const categories = ['starters', 'mains', 'sides', 'desserts'];

  const purple = [124, 58, 237];
  const darkBg = [26, 26, 46];
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
  const details = [
    ['Event', state.partyType?.name || 'Custom Party'],
    ['Guests', String(state.guestCount)],
    ['Budget', formatCurrency(state.budget)],
    ['Cuisines', state.cuisines.map((c) => c.name).join(', ')],
    ['Food Source', FOOD_SOURCE_LABELS[state.foodSource] || '-'],
    ['Serving Style', state.servingStyle?.name || '-'],
    ['Decoration', state.decoration?.name || '-'],
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

  y += 6;
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
        CATEGORY_LABELS[cat],
        item.veg ? 'Yes' : 'No',
        item.difficulty,
        `${item.prepTime}m`,
        formatCurrency(item.costPerServing * state.guestCount),
      ]);
    }
  }

  if (menuRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Dish', 'Category', 'Veg', 'Difficulty', 'Prep', 'Cost']],
      body: menuRows,
      theme: 'striped',
      headStyles: { fillColor: purple, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (state.selectedDrinks.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...purple);
    doc.text('Drinks', 14, y);
    y += 4;

    const drinkRows = state.selectedDrinks.map((d) => [
      d.name,
      d.description,
      formatCurrency(d.costPerServing * state.guestCount),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Drink', 'Description', 'Cost']],
      body: drinkRows,
      theme: 'striped',
      headStyles: { fillColor: purple, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...purple);
  doc.text('Budget Breakdown', 14, y);
  y += 4;

  const isOver = budget.total > state.budget;
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount']],
    body: [
      ['Food', formatCurrency(budget.food)],
      ['Drinks', formatCurrency(budget.drinks)],
      ['Decoration', formatCurrency(budget.decoration)],
      ['Total', formatCurrency(budget.total)],
      ['Budget', formatCurrency(state.budget)],
      ['Status', isOver ? 'OVER BUDGET' : 'Within Budget'],
      ['Per Person', formatCurrency(Math.round(budget.total / state.guestCount))],
    ],
    theme: 'striped',
    headStyles: { fillColor: purple, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  if (state.decoration) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...purple);
    doc.text(`Decoration Checklist — ${state.decoration.name}`, 14, y);
    y += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    for (const item of state.decoration.items) {
      doc.rect(14, y - 3, 3, 3);
      doc.text(item, 20, y);
      y += 6;
    }
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
