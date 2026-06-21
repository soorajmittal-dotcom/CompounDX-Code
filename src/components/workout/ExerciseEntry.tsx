'use client';

import { WorkoutExercise, ExerciseSet } from '@/types';
import { SetRow } from './SetRow';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, GripVertical, History } from 'lucide-react';
import { v4 as uuid } from 'uuid';

interface PreviousPerformance {
  sets: { weight?: number; reps?: number }[];
  date: string;
}

interface ExerciseEntryProps {
  exercise: WorkoutExercise;
  weightUnit: 'kg' | 'lbs';
  onChange: (exercise: WorkoutExercise) => void;
  onRemove: () => void;
  previous?: PreviousPerformance;
}

export function ExerciseEntry({ exercise, weightUnit, onChange, onRemove, previous }: ExerciseEntryProps) {
  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: ExerciseSet = {
      id: uuid(),
      setNumber: exercise.sets.length + 1,
      reps: lastSet?.reps,
      weight: lastSet?.weight,
      weightUnit,
      type: 'working',
      completed: false,
    };
    onChange({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, set: ExerciseSet) => {
    const sets = [...exercise.sets];
    sets[index] = set;
    onChange({ ...exercise, sets });
  };

  const removeSet = (index: number) => {
    const sets = exercise.sets
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, setNumber: i + 1 }));
    onChange({ ...exercise, sets });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-zinc-600" />
          <span className="font-medium text-sm text-zinc-100">{exercise.exerciseName}</span>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {previous && previous.sets.length > 0 && (
        <div className="px-3 py-1.5 bg-zinc-800/20 border-b border-zinc-800/50 flex items-center gap-1.5">
          <History className="h-3 w-3 text-zinc-600" />
          <span className="text-[10px] text-zinc-500">Last: </span>
          <span className="text-[10px] text-zinc-400">
            {previous.sets.map((s, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {s.weight ?? '?'}×{s.reps ?? '?'}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
          <span className="w-6 text-center">Set</span>
          <span className="w-6"></span>
          <span className="w-16 text-center">{weightUnit}</span>
          <span className="w-3"></span>
          <span className="w-14 text-center">Reps</span>
        </div>

        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            onChange={(s) => updateSet(i, s)}
            onRemove={() => removeSet(i)}
          />
        ))}

        <Button variant="ghost" size="sm" onClick={addSet} className="w-full mt-1 text-zinc-400">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Set
        </Button>
      </div>
    </div>
  );
}
