'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { Workout, WorkoutExercise, Exercise, ExerciseSet } from '@/types';
import { db } from '@/lib/db';
import { useSettings } from '@/lib/db-hooks';
import { todayStr, formatDuration, totalVolume } from '@/lib/utils';
import { ExerciseEntry } from './ExerciseEntry';
import { ExercisePicker } from './ExercisePicker';
import { TimerWidget } from './TimerWidget';
import { WorkoutSummarySheet } from './WorkoutSummarySheet';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Save, Clock, Link2 } from 'lucide-react';

interface WorkoutFormProps {
  existingWorkout?: Workout;
}

type PreviousMap = Map<string, { sets: { weight?: number; reps?: number }[]; date: string }>;

export function WorkoutForm({ existingWorkout }: WorkoutFormProps) {
  const router = useRouter();
  const settings = useSettings();

  const [name, setName] = useState(existingWorkout?.name ?? '');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(existingWorkout?.exercises ?? []);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(existingWorkout?.startTime ?? Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [previousPerf, setPreviousPerf] = useState<PreviousMap>(new Map());
  const [savedWorkout, setSavedWorkout] = useState<Workout | null>(null);

  const weightUnit = settings?.weightUnit ?? 'lbs';

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const fetchPrevious = useCallback(async (exerciseIds: string[]) => {
    const allWorkouts = await db.workouts.orderBy('date').reverse().toArray();
    const newMap = new Map(previousPerf);

    for (const exId of exerciseIds) {
      if (newMap.has(exId)) continue;
      for (const w of allWorkouts) {
        const found = w.exercises.find((e) => e.exerciseId === exId);
        if (found) {
          newMap.set(exId, {
            sets: found.sets
              .filter((s) => s.completed)
              .map((s) => ({ weight: s.weight, reps: s.reps })),
            date: w.date,
          });
          break;
        }
      }
    }

    setPreviousPerf(newMap);
  }, [previousPerf]);

  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: uuid(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: exercises.length,
      sets: [
        { id: uuid(), setNumber: 1, weightUnit, type: 'working', completed: false },
        { id: uuid(), setNumber: 2, weightUnit, type: 'working', completed: false },
        { id: uuid(), setNumber: 3, weightUnit, type: 'working', completed: false },
      ],
    };
    setExercises([...exercises, newExercise]);
    fetchPrevious([exercise.id]);
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
    fetchPrevious(parsed.filter((p) => p.matchedExerciseId).map((p) => p.matchedExerciseId!));
  };

  const updateExercise = (index: number, exercise: WorkoutExercise) => {
    const updated = [...exercises];
    updated[index] = exercise;
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const toggleSuperset = (index: number) => {
    const updated = [...exercises];
    const a = updated[index];
    const b = updated[index + 1];
    if (!a || !b) return;

    if (a.supersetGroup && a.supersetGroup === b.supersetGroup) {
      updated[index] = { ...a, supersetGroup: undefined };
      updated[index + 1] = { ...b, supersetGroup: undefined };
    } else {
      const group = Date.now();
      updated[index] = { ...a, supersetGroup: group };
      updated[index + 1] = { ...b, supersetGroup: group };
    }
    setExercises(updated);
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
    setSavedWorkout(workout);
  };

  const completedSets = exercises.reduce((s, e) => s + e.sets.filter((st) => st.completed).length, 0);
  const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0);
  const vol = exercises.reduce((s, e) => s + totalVolume(e.sets), 0);

  return (
    <div className="space-y-4 pb-24">
      <Input
        placeholder="Workout name (e.g., Push Day)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-base font-medium"
      />

      {/* Live stats bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/50 rounded-xl px-3 py-2 border border-zinc-800">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(elapsed)}
        </span>
        <span>{completedSets}/{totalSets} sets</span>
        {vol > 0 && <span>{vol.toLocaleString()} {weightUnit}</span>}
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, i) => {
          const isSuperset = !!exercise.supersetGroup;
          const nextIsSameGroup = i < exercises.length - 1 &&
            exercise.supersetGroup && exercise.supersetGroup === exercises[i + 1]?.supersetGroup;
          return (
            <div key={exercise.id}>
              <ExerciseEntry
                exercise={exercise}
                weightUnit={weightUnit}
                onChange={(e) => updateExercise(i, e)}
                onRemove={() => removeExercise(i)}
                previous={previousPerf.get(exercise.exerciseId)}
                isSuperset={isSuperset}
              />
              {i < exercises.length - 1 && (
                <div className="flex justify-center -my-1.5 relative z-10">
                  <button
                    onClick={() => toggleSuperset(i)}
                    className={`p-1 rounded-full border transition-colors ${
                      nextIsSameGroup
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
                    }`}
                    title={nextIsSameGroup ? 'Unlink superset' : 'Link as superset'}
                  >
                    <Link2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
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

      {savedWorkout && (
        <WorkoutSummarySheet
          workout={savedWorkout}
          onClose={() => router.push('/workouts')}
        />
      )}
    </div>
  );
}
