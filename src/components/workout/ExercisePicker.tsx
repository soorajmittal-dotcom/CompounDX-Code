'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useExerciseLibrary } from '@/lib/db-hooks';
import { Exercise, MuscleGroup } from '@/types';
import { muscleGroupLabel } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs',
];

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ open, onClose, onSelect }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | undefined>();

  const exercises = useExerciseLibrary({ search, muscleGroup: selectedGroup });

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearch('');
    setSelectedGroup(undefined);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Exercise">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedGroup(undefined)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedGroup ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          {muscleGroups.map((mg) => (
            <button
              key={mg}
              onClick={() => setSelectedGroup(mg === selectedGroup ? undefined : mg)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                mg === selectedGroup ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {muscleGroupLabel(mg)}
            </button>
          ))}
        </div>

        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {exercises?.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => handleSelect(exercise)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div>
                <div className="text-sm font-medium text-zinc-100">{exercise.name}</div>
                <div className="flex gap-1 mt-1">
                  {exercise.muscleGroups.slice(0, 3).map((mg) => (
                    <Badge key={mg} variant="default">{muscleGroupLabel(mg)}</Badge>
                  ))}
                </div>
              </div>
              <Plus className="h-4 w-4 text-zinc-500" />
            </button>
          ))}

          {exercises?.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No exercises found
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
