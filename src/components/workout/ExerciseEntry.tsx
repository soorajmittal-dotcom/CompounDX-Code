'use client';

import { WorkoutExercise, ExerciseSet } from '@/types';
import { SetRow } from './SetRow';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, GripVertical, History, StickyNote, Link2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useState } from 'react';

interface PreviousPerformance {
  sets: { weight?: number; reps?: number }[];
  date: string;
}

interface ExerciseEntryProps {
  exercise: WorkoutExercise;
  weightUnit: 'kg' | 'lbs';
  onChange: (exercise: WorkoutExercise) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  previous?: PreviousPerformance;
  isSuperset?: boolean;
}

export function ExerciseEntry({ exercise, weightUnit, onChange, onRemove, onMoveUp, onMoveDown, previous, isSuperset }: ExerciseEntryProps) {
  const [showNotes, setShowNotes] = useState(!!exercise.notes);
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
    <div className={`rounded-xl border bg-zinc-900/30 overflow-hidden ${isSuperset ? 'border-purple-800/50' : 'border-zinc-800'}`}>
      {isSuperset && (
        <div className="flex items-center gap-1 px-3 py-1 bg-purple-900/20 border-b border-purple-800/30">
          <Link2 className="h-3 w-3 text-purple-400" />
          <span className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">Superset</span>
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-800/50">
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col -my-1">
            {onMoveUp && (
              <button onClick={onMoveUp} className="p-0.5 text-zinc-600 hover:text-zinc-300">
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
            {onMoveDown && (
              <button onClick={onMoveDown} className="p-0.5 text-zinc-600 hover:text-zinc-300">
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
            {!onMoveUp && !onMoveDown && <GripVertical className="h-4 w-4 text-zinc-600" />}
          </div>
          <span className="font-medium text-sm text-zinc-100">{exercise.exerciseName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded-lg transition-colors ${showNotes || exercise.notes ? 'text-indigo-400 bg-indigo-900/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
          >
            <StickyNote className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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

      {showNotes && (
        <div className="px-3 py-2 border-b border-zinc-800/50">
          <textarea
            placeholder="Add notes..."
            value={exercise.notes ?? ''}
            onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
            rows={2}
            className="w-full bg-zinc-800/50 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 border-none outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
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
