'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { MuscleGroup, ExerciseCategory } from '@/types';

export function useWorkouts(limit?: number) {
  return useLiveQuery(
    () => db.workouts.orderBy('createdAt').reverse().limit(limit ?? 50).toArray(),
    [limit]
  );
}

export function useWorkoutsByDate(date: string) {
  return useLiveQuery(() => db.workouts.where('date').equals(date).toArray(), [date]);
}

export function useWorkout(id: string) {
  return useLiveQuery(() => db.workouts.get(id), [id]);
}

export function useAllWorkouts() {
  return useLiveQuery(() => db.workouts.orderBy('date').reverse().toArray());
}

export function useExerciseLibrary(filters?: {
  category?: ExerciseCategory;
  muscleGroup?: MuscleGroup;
  search?: string;
}) {
  return useLiveQuery(async () => {
    let collection = db.exercises.orderBy('name');

    let results = await collection.toArray();

    if (filters?.category) {
      results = results.filter((e) => e.category === filters.category);
    }
    if (filters?.muscleGroup) {
      results = results.filter((e) => e.muscleGroups.includes(filters.muscleGroup!));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((e) => e.name.toLowerCase().includes(q));
    }

    return results;
  }, [filters?.category, filters?.muscleGroup, filters?.search]);
}

export function useNutritionLog(date: string) {
  return useLiveQuery(() => db.nutrition.where('date').equals(date).toArray(), [date]);
}

export function useSettings() {
  return useLiveQuery(() => db.settings.get('user-settings'));
}

export function useTemplates() {
  return useLiveQuery(() => db.templates.orderBy('createdAt').reverse().toArray());
}

export function useTemplate(id: string) {
  return useLiveQuery(() => db.templates.get(id), [id]);
}

export function useBodyWeight(limit?: number) {
  return useLiveQuery(
    () => db.bodyweight.orderBy('date').reverse().limit(limit ?? 90).toArray(),
    [limit]
  );
}
