import { Workout, PersonalRecord, MuscleGroup } from '@/types';
import { totalVolume } from './utils';

export function calculatePRs(workouts: Workout[]): PersonalRecord[] {
  const prMap = new Map<string, PersonalRecord>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const existing = prMap.get(exercise.exerciseId);
      let maxWeight = existing?.maxWeight ?? 0;
      let maxReps = existing?.maxReps ?? 0;
      let maxVol = existing?.maxVolume ?? 0;
      let prDate = existing?.date ?? workout.date;

      for (const set of exercise.sets) {
        if (!set.completed) continue;
        if (set.weight && set.weight > maxWeight) {
          maxWeight = set.weight;
          prDate = workout.date;
        }
        if (set.reps && set.reps > maxReps) {
          maxReps = set.reps;
        }
        const vol = (set.weight ?? 0) * (set.reps ?? 0);
        if (vol > maxVol) maxVol = vol;
      }

      prMap.set(exercise.exerciseId, {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        maxWeight,
        maxReps,
        maxVolume: maxVol,
        date: prDate,
      });
    }
  }

  return Array.from(prMap.values()).sort((a, b) => b.maxWeight - a.maxWeight);
}

export function getVolumeOverTime(
  workouts: Workout[],
  exerciseId?: string
): { date: string; volume: number }[] {
  const volumeByDate = new Map<string, number>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exerciseId && exercise.exerciseId !== exerciseId) continue;
      const vol = totalVolume(exercise.sets);
      volumeByDate.set(workout.date, (volumeByDate.get(workout.date) ?? 0) + vol);
    }
  }

  return Array.from(volumeByDate.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeightProgression(
  workouts: Workout[],
  exerciseId: string
): { date: string; maxWeight: number }[] {
  const data: { date: string; maxWeight: number }[] = [];

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      const maxW = Math.max(
        ...exercise.sets.filter((s) => s.completed && s.weight).map((s) => s.weight!),
        0
      );
      if (maxW > 0) data.push({ date: workout.date, maxWeight: maxW });
    }
  }

  return data.sort((a, b) => a.date.localeCompare(b.date));
}

export function getWorkoutFrequency(workouts: Workout[], days: number = 30): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return workouts.filter((w) => w.date >= cutoffStr).length;
}

export function getCurrentStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;

  const dates = [...new Set(workouts.map((w) => w.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  if (dates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dates[0] !== yesterday.toISOString().split('T')[0]) return 0;
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1]);
    const prev = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) streak++;
    else break;
  }

  return streak;
}

export function getMuscleGroupVolume(
  workouts: Workout[],
  exerciseMap: Map<string, MuscleGroup[]>,
  days: number = 7
): Map<MuscleGroup, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const volumeMap = new Map<MuscleGroup, number>();

  for (const workout of workouts) {
    if (workout.date < cutoffStr) continue;
    for (const exercise of workout.exercises) {
      const groups = exerciseMap.get(exercise.exerciseId) ?? [];
      const vol = totalVolume(exercise.sets);
      for (const group of groups) {
        volumeMap.set(group, (volumeMap.get(group) ?? 0) + vol);
      }
    }
  }

  return volumeMap;
}
