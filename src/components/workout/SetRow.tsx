'use client';

import { ExerciseSet } from '@/types';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

const SET_TYPES: ExerciseSet['type'][] = ['working', 'warmup', 'dropset', 'failure'];

function rpeColor(rpe: number): string {
  if (rpe <= 6) return 'text-emerald-400';
  if (rpe <= 8) return 'text-amber-400';
  return 'text-red-400';
}

interface SetRowProps {
  set: ExerciseSet;
  onChange: (set: ExerciseSet) => void;
  onRemove: () => void;
}

export function SetRow({ set, onChange, onRemove }: SetRowProps) {
  const cycleType = () => {
    const idx = SET_TYPES.indexOf(set.type);
    onChange({ ...set, type: SET_TYPES[(idx + 1) % SET_TYPES.length] });
  };

  const cycleRpe = () => {
    const next = set.rpe ? (set.rpe >= 10 ? undefined : set.rpe + 1) : 6;
    onChange({ ...set, rpe: next });
  };

  return (
    <div className={cn(
      'flex items-center gap-2 py-1.5',
      set.completed && 'opacity-70'
    )}>
      <span className="text-xs text-zinc-500 w-6 text-center">{set.setNumber}</span>
      <button
        onClick={cycleType}
        className={cn(
          'text-[10px] px-1.5 py-0.5 rounded cursor-pointer',
          set.type === 'warmup' && 'bg-amber-900/30 text-amber-400',
          set.type === 'working' && 'bg-zinc-800 text-zinc-400',
          set.type === 'dropset' && 'bg-purple-900/30 text-purple-400',
          set.type === 'failure' && 'bg-red-900/30 text-red-400',
        )}
      >
        {set.type === 'working' ? 'W' : set.type[0].toUpperCase()}
      </button>
      <input
        type="number"
        inputMode="numeric"
        placeholder="wt"
        value={set.weight ?? ''}
        onChange={(e) => onChange({ ...set, weight: e.target.value ? Number(e.target.value) : undefined })}
        className="h-8 w-16 rounded-lg bg-zinc-800 text-center text-sm text-zinc-100 border-none focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <span className="text-zinc-600 text-xs">x</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={set.reps ?? ''}
        onChange={(e) => onChange({ ...set, reps: e.target.value ? Number(e.target.value) : undefined })}
        className="h-8 w-14 rounded-lg bg-zinc-800 text-center text-sm text-zinc-100 border-none focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <button
        onClick={cycleRpe}
        className="h-8 w-8 rounded-lg flex items-center justify-center bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        title="RPE (Rate of Perceived Exertion)"
      >
        {set.rpe ? (
          <span className={cn('text-[10px] font-bold', rpeColor(set.rpe))}>{set.rpe}</span>
        ) : (
          <span className="text-[9px] text-zinc-600">RPE</span>
        )}
      </button>
      <button
        onClick={() => onChange({ ...set, completed: !set.completed })}
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
          set.completed ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
        )}
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={onRemove}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
