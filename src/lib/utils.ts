import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
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

export function totalVolume(sets: { reps?: number; weight?: number; completed: boolean }[]): number {
  return sets
    .filter((s) => s.completed && s.reps && s.weight)
    .reduce((sum, s) => sum + (s.reps! * s.weight!), 0);
}

export function muscleGroupLabel(mg: string): string {
  return mg.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
