import { Workout, PersonalRecord, MuscleGroup, Exercise } from '@/types';
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

export interface ExerciseRecommendation {
  exercise: Exercise;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export function getExerciseRecommendations(
  workouts: Workout[],
  allExercises: Exercise[],
  days: number = 7
): ExerciseRecommendation[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentWorkouts = workouts.filter((w) => w.date >= cutoffStr);

  const exerciseMap = new Map<string, MuscleGroup[]>();
  allExercises.forEach((e) => exerciseMap.set(e.id, e.muscleGroups));

  const groupVolume = getMuscleGroupVolume(recentWorkouts, exerciseMap, days);
  const recentExerciseIds = new Set<string>();
  recentWorkouts.forEach((w) => w.exercises.forEach((e) => recentExerciseIds.add(e.exerciseId)));

  const allGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'quads', 'hamstrings', 'glutes', 'calves', 'abs',
  ];

  const volumes = allGroups.map((g) => groupVolume.get(g) ?? 0);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / allGroups.length;
  const underworked = allGroups.filter((g) => (groupVolume.get(g) ?? 0) < avgVolume * 0.3);

  const recommendations: ExerciseRecommendation[] = [];

  for (const group of underworked) {
    const candidates = allExercises.filter(
      (e) => e.muscleGroups.includes(group) && !recentExerciseIds.has(e.id)
    );
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      recommendations.push({
        exercise: pick,
        reason: `Your ${group.replace('_', ' ')} hasn't been trained recently`,
        priority: (groupVolume.get(group) ?? 0) === 0 ? 'high' : 'medium',
      });
    }
  }

  const exerciseHistory = new Map<string, { weight: number; date: string }[]>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const maxW = Math.max(
        ...exercise.sets.filter((s) => s.completed && s.weight).map((s) => s.weight!),
        0
      );
      if (maxW > 0) {
        const history = exerciseHistory.get(exercise.exerciseId) ?? [];
        history.push({ weight: maxW, date: workout.date });
        exerciseHistory.set(exercise.exerciseId, history);
      }
    }
  }

  for (const [exId, history] of exerciseHistory) {
    if (history.length < 3) continue;
    const recent = history.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const allSameWeight = recent.every((h) => h.weight === recent[0].weight);
    if (allSameWeight) {
      const ex = allExercises.find((e) => e.id === exId);
      if (ex) {
        recommendations.push({
          exercise: ex,
          reason: `Plateau detected at ${recent[0].weight} lbs — try increasing weight or reps`,
          priority: 'low',
        });
      }
    }
  }

  return recommendations
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 5);
}
