export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'olympic';

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs' | 'obliques' | 'full_body';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell'
  | 'band' | 'none';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  weightUnit: 'kg' | 'lbs';
  duration?: number;
  distance?: number;
  distanceUnit?: 'km' | 'mi';
  type: 'working' | 'warmup' | 'dropset' | 'failure';
  completed: boolean;
  rpe?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
  notes?: string;
  order: number;
}

export interface Workout {
  id: string;
  date: string;
  startTime: number;
  endTime?: number;
  name: string;
  exercises: WorkoutExercise[];
  notes?: string;
  voiceTranscript?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  isCustom: boolean;
  instructions?: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  createdAt: number;
}

export interface UserSettings {
  id: string;
  name?: string;
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'mi';
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  date: string;
}

export interface VoiceParsedExercise {
  exerciseName: string;
  matchedExerciseId?: string;
  sets: number;
  reps: number;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  duration?: number;
  confidence: number;
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps?: number;
  weight?: number;
  order: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: number;
  lastUsed?: number;
}
