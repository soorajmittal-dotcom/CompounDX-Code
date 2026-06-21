'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressChart } from '@/components/analytics/ProgressChart';
import { VolumeChart } from '@/components/analytics/VolumeChart';
import { StatsGrid } from '@/components/analytics/StatsGrid';
import { useAllWorkouts, useExerciseLibrary, useSettings } from '@/lib/db-hooks';
import {
  calculatePRs,
  getVolumeOverTime,
  getWeightProgression,
  getCurrentStreak,
  getWorkoutFrequency,
  getExerciseRecommendations,
  getMuscleGroupVolume,
} from '@/lib/analytics';
import { Badge } from '@/components/ui/Badge';
import { totalVolume, muscleGroupLabel } from '@/lib/utils';
import { MuscleGroup } from '@/types';
import { BarChart3, Dumbbell, Flame, Lightbulb, Target, TrendingUp, Trophy } from 'lucide-react';

export default function AnalyticsPage() {
  const workouts = useAllWorkouts();
  const exercises = useExerciseLibrary();
  const settings = useSettings();
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const unit = settings?.weightUnit ?? 'lbs';

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

        {(() => {
          const exerciseMap = new Map<string, MuscleGroup[]>();
          exercises.forEach((e) => exerciseMap.set(e.id, e.muscleGroups));
          const mgVolume = getMuscleGroupVolume(workouts, exerciseMap, 30);
          const entries = Array.from(mgVolume.entries())
            .sort((a, b) => b[1] - a[1]);
          const maxVol = Math.max(...entries.map(([, v]) => v), 1);
          if (entries.length === 0) return null;
          return (
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Muscle Groups (30d)</h2>
              <Card className="space-y-2">
                {entries.map(([group, vol]) => (
                  <div key={group}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-zinc-300">{muscleGroupLabel(group)}</span>
                      <span className="text-zinc-500">{vol.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(vol / maxVol) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          );
        })()}

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

        {(() => {
          const recs = getExerciseRecommendations(workouts, exercises);
          if (recs.length === 0) return null;
          return (
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recommendations</h2>
              <div className="space-y-2">
                {recs.map((rec, i) => (
                  <Card key={i} className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-600/20 p-2">
                      <Lightbulb className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100">{rec.exercise.name}</span>
                        <Badge variant={rec.priority === 'high' ? 'warning' : 'default'}>{rec.priority}</Badge>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{rec.reason}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}

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
                      {pr.maxWeight} {unit} &middot; {pr.maxReps} reps &middot; {pr.maxVolume.toLocaleString()} vol
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
