import { Exercise } from '@/types';

export const defaultExercises: Omit<Exercise, 'isCustom'>[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell'] },
  { id: 'incline-bench-press', name: 'Incline Bench Press', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'], equipment: ['barbell'] },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps'], equipment: ['dumbbell'] },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'strength', muscleGroups: ['chest', 'shoulders'], equipment: ['dumbbell'] },
  { id: 'chest-fly', name: 'Chest Fly', category: 'strength', muscleGroups: ['chest'], equipment: ['dumbbell', 'cable'] },
  { id: 'cable-crossover', name: 'Cable Crossover', category: 'strength', muscleGroups: ['chest'], equipment: ['cable'] },
  { id: 'push-up', name: 'Push Up', category: 'bodyweight', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['bodyweight'] },
  { id: 'dips', name: 'Dips', category: 'bodyweight', muscleGroups: ['chest', 'triceps'], equipment: ['bodyweight'] },

  // Back
  { id: 'deadlift', name: 'Deadlift', category: 'strength', muscleGroups: ['back', 'hamstrings', 'glutes'], equipment: ['barbell'] },
  { id: 'barbell-row', name: 'Barbell Row', category: 'strength', muscleGroups: ['back', 'biceps'], equipment: ['barbell'] },
  { id: 'dumbbell-row', name: 'Dumbbell Row', category: 'strength', muscleGroups: ['back', 'biceps'], equipment: ['dumbbell'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'strength', muscleGroups: ['back', 'biceps'], equipment: ['cable'] },
  { id: 'pull-up', name: 'Pull Up', category: 'bodyweight', muscleGroups: ['back', 'biceps'], equipment: ['bodyweight'] },
  { id: 'chin-up', name: 'Chin Up', category: 'bodyweight', muscleGroups: ['back', 'biceps'], equipment: ['bodyweight'] },
  { id: 'seated-cable-row', name: 'Seated Cable Row', category: 'strength', muscleGroups: ['back'], equipment: ['cable'] },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'strength', muscleGroups: ['back'], equipment: ['barbell'] },
  { id: 'face-pull', name: 'Face Pull', category: 'strength', muscleGroups: ['back', 'shoulders'], equipment: ['cable'] },

  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', category: 'strength', muscleGroups: ['shoulders', 'triceps'], equipment: ['barbell'] },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'strength', muscleGroups: ['shoulders'], equipment: ['dumbbell'] },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'strength', muscleGroups: ['shoulders'], equipment: ['dumbbell'] },
  { id: 'front-raise', name: 'Front Raise', category: 'strength', muscleGroups: ['shoulders'], equipment: ['dumbbell'] },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', category: 'strength', muscleGroups: ['shoulders', 'back'], equipment: ['dumbbell'] },
  { id: 'arnold-press', name: 'Arnold Press', category: 'strength', muscleGroups: ['shoulders'], equipment: ['dumbbell'] },
  { id: 'upright-row', name: 'Upright Row', category: 'strength', muscleGroups: ['shoulders', 'biceps'], equipment: ['barbell', 'dumbbell'] },

  // Arms
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'strength', muscleGroups: ['biceps'], equipment: ['barbell'] },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', category: 'strength', muscleGroups: ['biceps'], equipment: ['dumbbell'] },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'strength', muscleGroups: ['biceps', 'forearms'], equipment: ['dumbbell'] },
  { id: 'preacher-curl', name: 'Preacher Curl', category: 'strength', muscleGroups: ['biceps'], equipment: ['barbell', 'dumbbell'] },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'strength', muscleGroups: ['triceps'], equipment: ['cable'] },
  { id: 'skull-crusher', name: 'Skull Crusher', category: 'strength', muscleGroups: ['triceps'], equipment: ['barbell'] },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', category: 'strength', muscleGroups: ['triceps'], equipment: ['dumbbell', 'cable'] },
  { id: 'wrist-curl', name: 'Wrist Curl', category: 'strength', muscleGroups: ['forearms'], equipment: ['barbell', 'dumbbell'] },

  // Legs
  { id: 'squat', name: 'Squat', category: 'strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: ['barbell'] },
  { id: 'front-squat', name: 'Front Squat', category: 'strength', muscleGroups: ['quads', 'glutes'], equipment: ['barbell'] },
  { id: 'leg-press', name: 'Leg Press', category: 'strength', muscleGroups: ['quads', 'glutes'], equipment: ['machine'] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'glutes'], equipment: ['barbell', 'dumbbell'] },
  { id: 'leg-curl', name: 'Leg Curl', category: 'strength', muscleGroups: ['hamstrings'], equipment: ['machine'] },
  { id: 'leg-extension', name: 'Leg Extension', category: 'strength', muscleGroups: ['quads'], equipment: ['machine'] },
  { id: 'lunge', name: 'Lunge', category: 'strength', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbell', 'barbell', 'bodyweight'] },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'strength', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbell', 'bodyweight'] },
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'strength', muscleGroups: ['glutes', 'hamstrings'], equipment: ['barbell'] },
  { id: 'calf-raise', name: 'Calf Raise', category: 'strength', muscleGroups: ['calves'], equipment: ['machine', 'bodyweight'] },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'strength', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbell', 'kettlebell'] },

  // Core
  { id: 'plank', name: 'Plank', category: 'bodyweight', muscleGroups: ['abs', 'obliques'], equipment: ['bodyweight'] },
  { id: 'crunch', name: 'Crunch', category: 'bodyweight', muscleGroups: ['abs'], equipment: ['bodyweight'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'bodyweight', muscleGroups: ['abs'], equipment: ['bodyweight'] },
  { id: 'russian-twist', name: 'Russian Twist', category: 'bodyweight', muscleGroups: ['obliques', 'abs'], equipment: ['bodyweight'] },
  { id: 'cable-crunch', name: 'Cable Crunch', category: 'strength', muscleGroups: ['abs'], equipment: ['cable'] },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', category: 'bodyweight', muscleGroups: ['abs'], equipment: ['none'] },

  // Olympic
  { id: 'clean-and-jerk', name: 'Clean and Jerk', category: 'olympic', muscleGroups: ['full_body'], equipment: ['barbell'] },
  { id: 'snatch', name: 'Snatch', category: 'olympic', muscleGroups: ['full_body'], equipment: ['barbell'] },
  { id: 'power-clean', name: 'Power Clean', category: 'olympic', muscleGroups: ['full_body'], equipment: ['barbell'] },

  // Cardio
  { id: 'running', name: 'Running', category: 'cardio', muscleGroups: ['quads', 'hamstrings', 'calves'], equipment: ['none'] },
  { id: 'cycling', name: 'Cycling', category: 'cardio', muscleGroups: ['quads', 'hamstrings'], equipment: ['machine'] },
  { id: 'rowing', name: 'Rowing', category: 'cardio', muscleGroups: ['back', 'full_body'], equipment: ['machine'] },
  { id: 'jump-rope', name: 'Jump Rope', category: 'cardio', muscleGroups: ['calves', 'full_body'], equipment: ['none'] },
  { id: 'stairmaster', name: 'Stairmaster', category: 'cardio', muscleGroups: ['quads', 'glutes', 'calves'], equipment: ['machine'] },
];
