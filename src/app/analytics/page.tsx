'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressChart } from '@/components/analytics/ProgressChart';
import { VolumeChart } from '@/components/analytics/VolumeChart';
import { StatsGrid } from '@/components/analytics/StatsGrid';
import { useAllWorkouts, useExerciseLibrary } from '@/lib/db-hooks';
import {
  calculatePRs,
  getVolumeOverTime,
  getWeightProgression,
  getCurrentStreak,
  getWorkoutFrequency,
} from '@/lib/analytics';
import { totalVolume } from '@/lib/utils';
import { BarChart3, Dumbbell, Flame, Target, TrendingUp, Trophy } from 'lucide-react';

export default function AnalyticsPage() {
  const workouts = useAllWorkouts();
  const exercises = useExerciseLibrary();
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  if (!workouts || !exercises) {
    return (
      <div>
        <Header title="Analytics" />
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div>
        <Header title="Analytics" />
        <div className="px-4 py-4">
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Complete some workouts to see your analytics"
          />
        </div>
      </div>
    );
  }

  const prs = calculatePRs(workouts);
  const streak = getCurrentStreak(workouts);
  const frequency = getWorkoutFrequency(workouts);
  const totalVol = workouts.reduce(
    (sum, w) => sum + w.exercises.reduce((s, e) => s + totalVolume(e.sets), 0),
    0
  );

  const volumeData = getVolumeOverTime(workouts);

  const exercisesUsed = new Set<string>();
  workouts.forEach((w) => w.exercises.forEach((e) => exercisesUsed.add(e.exerciseId)));
  const usedExercises = exercises.filter((e) => exercisesUsed.has(e.id));

  const weightData = selectedExercise ? getWeightProgression(workouts, selectedExercise) : [];

  return (
    <div>
      <Header title="Analytics" />

      <div className="px-4 py-4 space-y-5">
        <StatsGrid
          stats={[
            { label: 'Workouts', value: workouts.length, icon: Dumbbell, color: 'bg-indigo-900/30 text-indigo-400' },
            { label: 'Day Streak', value: streak, icon: Flame, color: 'bg-orange-900/30 text-orange-400' },
            { label: 'This Month', value: frequency, icon: Target, color: 'bg-emerald-900/30 text-emerald-400' },
            { label: 'Total Vol', value: `${(totalVol / 1000).toFixed(0)}k`, icon: TrendingUp, color: 'bg-purple-900/30 text-purple-400' },
          ]}
        />

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Volume Over Time</h2>
          <Card>
            <VolumeChart data={volumeData} />
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Weight Progression</h2>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 mb-3 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select an exercise</option>
            {usedExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <Card>
            <ProgressChart data={weightData} />
          </Card>
        </div>

        {prs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Personal Records</h2>
            <div className="space-y-2">
              {prs.slice(0, 10).map((pr) => (
                <Card key={pr.exerciseId} className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-600/20 p-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-100">{pr.exerciseName}</div>
                    <div className="text-xs text-zinc-500">
                      {pr.maxWeight} lbs &middot; {pr.maxReps} reps &middot; {pr.maxVolume.toLocaleString()} vol
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
