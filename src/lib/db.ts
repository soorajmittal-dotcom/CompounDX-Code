import Dexie, { type EntityTable } from 'dexie';
import { Workout, Exercise, NutritionEntry, UserSettings, WorkoutTemplate } from '@/types';
import { defaultExercises } from './exercise-library';

const db = new Dexie('CompounDX') as Dexie & {
  workouts: EntityTable<Workout, 'id'>;
  exercises: EntityTable<Exercise, 'id'>;
  nutrition: EntityTable<NutritionEntry, 'id'>;
  settings: EntityTable<UserSettings, 'id'>;
  templates: EntityTable<WorkoutTemplate, 'id'>;
};

db.version(1).stores({
  workouts: 'id, date, name, createdAt',
  exercises: 'id, name, category, *muscleGroups',
  nutrition: 'id, date, mealType, createdAt',
  settings: 'id',
});

db.version(2).stores({
  workouts: 'id, date, name, createdAt',
  exercises: 'id, name, category, *muscleGroups',
  nutrition: 'id, date, mealType, createdAt',
  settings: 'id',
  templates: 'id, name, createdAt',
});

db.on('populate', (tx) => {
  const exercises = defaultExercises.map((e) => ({ ...e, isCustom: false }));
  (tx as unknown as { exercises: EntityTable<Exercise, 'id'> }).exercises.bulkAdd(exercises);

  (tx as unknown as { settings: EntityTable<UserSettings, 'id'> }).settings.add({
    id: 'user-settings',
    weightUnit: 'lbs',
    distanceUnit: 'mi',
    calorieGoal: 2500,
    proteinGoal: 180,
    carbGoal: 250,
    fatGoal: 80,
  });
});

export { db };
