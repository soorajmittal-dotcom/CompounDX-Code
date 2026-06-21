'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useExerciseLibrary } from '@/lib/db-hooks';
import { MuscleGroup } from '@/types';
import { muscleGroupLabel } from '@/lib/utils';
import { Search, Dumbbell } from 'lucide-react';

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs',
];

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | undefined>();

  const exercises = useExerciseLibrary({ search, muscleGroup: selectedGroup });

  return (
    <div>
      <Header title="Exercises" />

      <div className="px-4 py-4 space-y-4">
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
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedGroup ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            All
          </button>
          {muscleGroups.map((mg) => (
            <button
              key={mg}
              onClick={() => setSelectedGroup(mg === selectedGroup ? undefined : mg)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                mg === selectedGroup ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {muscleGroupLabel(mg)}
            </button>
          ))}
        </div>

        {exercises && exercises.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title="No exercises found"
            description="Try a different search or filter"
          />
        )}

        <div className="space-y-2">
          {exercises?.map((exercise) => (
            <Card key={exercise.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{exercise.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {exercise.muscleGroups.map((mg) => (
                      <Badge key={mg}>{muscleGroupLabel(mg)}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {exercise.equipment.map((eq) => (
                      <span key={eq} className="text-[10px] text-zinc-600 capitalize">{eq}</span>
                    ))}
                  </div>
                </div>
                <Badge variant="indigo">{exercise.category}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
