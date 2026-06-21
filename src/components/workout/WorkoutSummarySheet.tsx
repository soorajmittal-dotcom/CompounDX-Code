'use client';

import { Workout } from '@/types';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDuration, totalVolume } from '@/lib/utils';
import { Trophy, Dumbbell, Clock, Zap, CheckCircle2 } from 'lucide-react';

interface WorkoutSummarySheetProps {
  workout: Workout;
  onClose: () => void;
}

export function WorkoutSummarySheet({ workout, onClose }: WorkoutSummarySheetProps) {
  const duration = workout.endTime && workout.startTime
    ? Math.floor((workout.endTime - workout.startTime) / 1000)
    : 0;

  const exerciseCount = workout.exercises.length;
  const completedSets = workout.exercises.reduce(
    (s, e) => s + e.sets.filter((st) => st.completed).length, 0
  );
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const vol = workout.exercises.reduce((s, e) => s + totalVolume(e.sets), 0);

  const topSet = workout.exercises
    .flatMap((e) => e.sets.filter((s) => s.completed && s.weight && s.reps).map((s) => ({
      exercise: e.exerciseName,
      weight: s.weight!,
      reps: s.reps!,
      volume: s.weight! * s.reps!,
    })))
    .sort((a, b) => b.weight - a.weight)[0];

  return (
    <BottomSheet open={true} onClose={onClose} title="Workout Complete">
      <div className="space-y-4">
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-600/20 mb-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">{workout.name}</h2>
          <p className="text-sm text-zinc-500 mt-1">Great work!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center py-3">
            <Clock className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{formatDuration(duration)}</div>
            <div className="text-[10px] text-zinc-500">Duration</div>
          </Card>
          <Card className="text-center py-3">
            <Dumbbell className="h-4 w-4 text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{exerciseCount}</div>
            <div className="text-[10px] text-zinc-500">Exercises</div>
          </Card>
          <Card className="text-center py-3">
            <Zap className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{completedSets}/{totalSets}</div>
            <div className="text-[10px] text-zinc-500">Sets Done</div>
          </Card>
          <Card className="text-center py-3">
            <Trophy className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{vol.toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500">Total Volume</div>
          </Card>
        </div>

        {topSet && (
          <Card className="bg-amber-900/10 border-amber-800/30">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Top Set</span>
            </div>
            <div className="text-sm text-zinc-100">
              {topSet.exercise}: <span className="font-bold">{topSet.weight} × {topSet.reps}</span>
            </div>
          </Card>
        )}

        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Exercises</h3>
          {workout.exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-zinc-300">{ex.exerciseName}</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">
                  {ex.sets.filter((s) => s.completed).length} sets
                </span>
                {totalVolume(ex.sets) > 0 && (
                  <Badge variant="default">{totalVolume(ex.sets).toLocaleString()}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full" size="lg">
          Done
        </Button>
      </div>
    </BottomSheet>
  );
}
