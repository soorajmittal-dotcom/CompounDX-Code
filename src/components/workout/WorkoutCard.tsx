'use client';

import { Workout } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, totalVolume } from '@/lib/utils';
import { Dumbbell, Clock } from 'lucide-react';
import Link from 'next/link';

interface WorkoutCardProps {
  workout: Workout;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0);
  const vol = workout.exercises.reduce((sum, e) => sum + totalVolume(e.sets), 0);
  const duration = workout.endTime && workout.startTime
    ? Math.round((workout.endTime - workout.startTime) / 60000)
    : null;

  return (
    <Link href={`/workouts/${workout.id}`}>
      <Card className="hover:border-zinc-700 transition-colors active:scale-[0.98]">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-zinc-100">{workout.name}</h3>
            <p className="text-xs text-zinc-500">{formatDate(workout.date)}</p>
          </div>
          {workout.voiceTranscript && (
            <Badge variant="indigo">Voice</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" />
            {exerciseCount} exercises
          </span>
          <span>{setCount} sets</span>
          {vol > 0 && <span>{vol.toLocaleString()} lbs</span>}
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {duration}m
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
