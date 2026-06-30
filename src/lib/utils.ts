import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function subjectLabel(s: string): string {
  const labels: Record<string, string> = {
    mathematics: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    english: 'English',
    history: 'History & Civics',
  };
  return labels[s] || s;
}

export function difficultyColor(d: string): string {
  switch (d) {
    case 'easy': return 'text-emerald-400';
    case 'medium': return 'text-amber-400';
    case 'hard': return 'text-red-400';
    default: return 'text-zinc-400';
  }
}
