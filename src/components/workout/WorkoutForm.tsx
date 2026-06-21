'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { Workout, WorkoutExercise, Exercise, ExerciseSet } from '@/types';
import { db } from '@/lib/db';
import { useSettings } from '@/lib/db-hooks';
import { todayStr } from '@/lib/utils';
import { ExerciseEntry } from './ExerciseEntry';
import { ExercisePicker } from './ExercisePicker';
import { TimerWidget } from './TimerWidget';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Save } from 'lucide-react';

interface WorkoutFormProps {
  existingWorkout?: Workout;
}

export function WorkoutForm({ existingWorkout }: WorkoutFormProps) {
  const router = useRouter();
  const settings = useSettings();

  const [name, setName] = useState(existingWorkout?.name ?? '');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(existingWorkout?.exercises ?? []);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(existingWorkout?.startTime ?? Date.now());

  const weightUnit = settings?.weightUnit ?? 'lbs';

  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: uuid(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: exercises.length,
      sets: [
        {
          id: uuid(),
          setNumber: 1,
          weightUnit,
          type: 'working',
          completed: false,
        },
        {
          id: uuid(),
          setNumber: 2,
          weightUnit,
          type: 'working',
          completed: false,
        },
        {
          id: uuid(),
          setNumber: 3,
          weightUnit,
          type: 'working',
          completed: false,
        },
      ],
    };
    setExercises([...exercises, newExercise]);
  };

  const addVoiceExercises = (parsed: { exerciseName: string; matchedExerciseId?: string; sets: number; reps: number; weight?: number }[]) => {
    const newExercises: WorkoutExercise[] = parsed.map((p, i) => ({
      id: uuid(),
      exerciseId: p.matchedExerciseId ?? uuid(),
      exerciseName: p.exerciseName,
      order: exercises.length + i,
      sets: Array.from({ length: p.sets }, (_, j): ExerciseSet => ({
        id: uuid(),
        setNumber: j + 1,
        reps: p.reps,
        weight: p.weight,
        weightUnit,
        type: 'working',
        completed: false,
      })),
    }));
    setExercises([...exercises, ...newExercises]);
  };

  const updateExercise = (index: number, exercise: WorkoutExercise) => {
    const updated = [...exercises];
    updated[index] = exercise;
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (exercises.length === 0) return;
    setSaving(true);

    const workout: Workout = {
      id: existingWorkout?.id ?? uuid(),
      date: existingWorkout?.date ?? todayStr(),
      startTime,
      endTime: Date.now(),
      name: name || 'Workout',
      exercises,
      createdAt: existingWorkout?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    await db.workouts.put(workout);
    router.push('/workouts');
  };

  return (
    <div className="space-y-4 pb-24">
      <Input
        placeholder="Workout name (e.g., Push Day)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-base font-medium"
      />

      <div className="space-y-3">
        {exercises.map((exercise, i) => (
          <ExerciseEntry
            key={exercise.id}
            exercise={exercise}
            weightUnit={weightUnit}
            onChange={(e) => updateExercise(i, e)}
            onRemove={() => removeExercise(i)}
          />
        ))}
      </div>

      <Button variant="secondary" onClick={() => setShowPicker(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Exercise
      </Button>

      <Button
        onClick={save}
        disabled={exercises.length === 0 || saving}
        className="w-full"
        size="lg"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Finish Workout'}
      </Button>

      <ExercisePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={addExercise}
      />

      <VoiceButton onParsed={addVoiceExercises} />
      <TimerWidget />
    </div>
  );
}
