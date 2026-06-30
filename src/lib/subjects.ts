import { SubjectInfo } from '@/types';

export const SUBJECTS: SubjectInfo[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'calculator',
    color: 'indigo',
    chapters: [
      { id: 'quadratic-equations', name: 'Quadratic Equations', topics: ['Factorisation', 'Quadratic Formula', 'Nature of Roots', 'Word Problems'] },
      { id: 'ap-gp', name: 'AP & GP', topics: ['Arithmetic Progression', 'Geometric Progression', 'Sum of Series'] },
      { id: 'coordinate-geometry', name: 'Coordinate Geometry', topics: ['Section Formula', 'Slope', 'Equation of Line', 'Distance Formula'] },
      { id: 'circles', name: 'Circles', topics: ['Tangent Properties', 'Arc and Sector', 'Cyclic Quadrilateral'] },
      { id: 'mensuration', name: 'Mensuration', topics: ['Cylinder', 'Cone', 'Sphere', 'Combined Solids'] },
      { id: 'trigonometry', name: 'Trigonometry', topics: ['Identities', 'Heights and Distances', 'Complementary Angles'] },
      { id: 'statistics', name: 'Statistics & Probability', topics: ['Mean', 'Median', 'Ogive', 'Probability'] },
      { id: 'matrices', name: 'Matrices', topics: ['Matrix Operations', 'Determinant', 'Inverse'] },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: 'atom',
    color: 'cyan',
    chapters: [
      { id: 'force', name: 'Force, Work, Energy & Power', topics: ['Force', 'Work', 'Energy', 'Power', 'Machines'] },
      { id: 'light', name: 'Light', topics: ['Refraction', "Snell's Law", 'Total Internal Reflection', 'Lenses', 'Prism'] },
      { id: 'sound', name: 'Sound', topics: ['Wave Properties', 'Echo', 'Resonance', 'Loudness and Pitch'] },
      { id: 'electricity', name: 'Current Electricity', topics: ["Ohm's Law", 'Resistors in Series/Parallel', 'Electrical Energy', 'Household Circuits'] },
      { id: 'electromagnetism', name: 'Electromagnetism', topics: ['Magnetic Field', 'Electromagnetic Induction', 'Transformer', 'Motor and Generator'] },
      { id: 'calorimetry', name: 'Calorimetry', topics: ['Specific Heat', 'Latent Heat', 'Heat Calculations'] },
      { id: 'radioactivity', name: 'Radioactivity', topics: ['Nuclear Reactions', 'Half-life', 'Uses of Radioactivity'] },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'flask-conical',
    color: 'emerald',
    chapters: [
      { id: 'periodic-table', name: 'Periodic Table', topics: ['Periods and Groups', 'Trends', 'Element Properties'] },
      { id: 'chemical-bonding', name: 'Chemical Bonding', topics: ['Ionic Bonding', 'Covalent Bonding', 'Coordinate Bonding', 'Electrovalency'] },
      { id: 'acids-bases', name: 'Acids, Bases & Salts', topics: ['Properties', 'pH Scale', 'Neutralisation', 'Salt Preparation'] },
      { id: 'mole-concept', name: 'Mole Concept', topics: ['Mole Calculations', 'Stoichiometry', 'Empirical Formula', 'Gas Laws'] },
      { id: 'electrolysis', name: 'Electrolysis', topics: ['Electrolyte Types', 'Electrode Reactions', 'Applications'] },
      { id: 'metallurgy', name: 'Metallurgy', topics: ['Extraction Methods', 'Alloys', 'Corrosion'] },
      { id: 'organic-chemistry', name: 'Organic Chemistry', topics: ['Homologous Series', 'Functional Groups', 'IUPAC Naming', 'Isomerism'] },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'leaf',
    color: 'green',
    chapters: [
      { id: 'cell-division', name: 'Cell Division', topics: ['Mitosis', 'Meiosis', 'Cell Cycle'] },
      { id: 'genetics', name: 'Genetics', topics: ["Mendel's Laws", 'Monohybrid Cross', 'Sex Determination', 'Genetic Disorders'] },
      { id: 'plant-physiology', name: 'Plant Physiology', topics: ['Photosynthesis', 'Transpiration', 'Absorption by Roots'] },
      { id: 'human-anatomy', name: 'Human Anatomy', topics: ['Circulatory System', 'Nervous System', 'Excretory System', 'Endocrine System'] },
      { id: 'reproduction', name: 'Reproduction', topics: ['Asexual Reproduction', 'Sexual Reproduction', 'Fertilisation'] },
      { id: 'ecology', name: 'Ecology & Environment', topics: ['Ecosystem', 'Food Chain', 'Pollution', 'Conservation'] },
    ],
  },
  {
    id: 'english',
    name: 'English',
    icon: 'book-open',
    color: 'amber',
    chapters: [
      { id: 'grammar', name: 'Grammar', topics: ['Tenses', 'Active/Passive Voice', 'Direct/Indirect Speech', 'Prepositions', 'Conjunctions'] },
      { id: 'comprehension', name: 'Comprehension', topics: ['Passage Analysis', 'Inference', 'Vocabulary in Context'] },
      { id: 'composition', name: 'Composition', topics: ['Letter Writing', 'Essay Writing', 'Notice/Email Writing'] },
    ],
  },
  {
    id: 'history',
    name: 'History & Civics',
    icon: 'landmark',
    color: 'rose',
    chapters: [
      { id: 'indian-freedom', name: 'Indian Freedom Movement', topics: ['Early Nationalism', 'Gandhian Era', 'Independence'] },
      { id: 'world-wars', name: 'World Wars', topics: ['Causes', 'Events', 'Consequences', 'League of Nations'] },
      { id: 'united-nations', name: 'United Nations', topics: ['Organs', 'Agencies', 'Peacekeeping'] },
      { id: 'indian-constitution', name: 'Indian Constitution', topics: ['Fundamental Rights', 'Directive Principles', 'Parliament', 'Judiciary'] },
    ],
  },
];

export function getSubject(id: string): SubjectInfo | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function getChapter(subjectId: string, chapterId: string): { subject: SubjectInfo; chapter: SubjectInfo['chapters'][0] } | undefined {
  const subject = getSubject(subjectId);
  if (!subject) return undefined;
  const chapter = subject.chapters.find((c) => c.id === chapterId);
  if (!chapter) return undefined;
  return { subject, chapter };
}

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  mathematics: { bg: 'bg-indigo-600/20', text: 'text-indigo-400', border: 'border-indigo-500/30', iconBg: 'bg-indigo-600/20' },
  physics: { bg: 'bg-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-500/30', iconBg: 'bg-cyan-600/20' },
  chemistry: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-500/30', iconBg: 'bg-emerald-600/20' },
  biology: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500/30', iconBg: 'bg-green-600/20' },
  english: { bg: 'bg-amber-600/20', text: 'text-amber-400', border: 'border-amber-500/30', iconBg: 'bg-amber-600/20' },
  history: { bg: 'bg-rose-600/20', text: 'text-rose-400', border: 'border-rose-500/30', iconBg: 'bg-rose-600/20' },
};
