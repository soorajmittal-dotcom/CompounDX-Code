'use client';

import { useWorkoutsByDate, useNutritionLog, useSettings, useAllWorkouts, useBodyWeight } from '@/lib/db-hooks';
import { todayStr } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { NutritionSummary } from '@/components/nutrition/NutritionSummary';
import { WeeklyCalendar } from '@/components/analytics/WeeklyCalendar';
import { getCurrentStreak, calculatePRs, getWorkoutFrequency } from '@/lib/analytics';
import { Dumbbell, Plus, Mic, Flame, Trophy, TrendingUp, Calendar, ClipboardList, Scale, Calculator } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useMemo } from 'react';

export default function HomePage() {
  const today = todayStr();
  const todayWorkouts = useWorkoutsByDate(today);
  const todayNutrition = useNutritionLog(today);
  const allWorkouts = useAllWorkouts();
  const settings = useSettings();
  const bodyWeight = useBodyWeight(1);

  const streak = allWorkouts ? getCurrentStreak(allWorkouts) : 0;
  const prs = allWorkouts ? calculatePRs(allWorkouts).slice(0, 3) : [];
  const frequency = allWorkouts ? getWorkoutFrequency(allWorkouts) : 0;

  const workoutDates = useMemo(() => {
    if (!allWorkouts) return new Set<string>();
    return new Set(allWorkouts.map((w) => w.date));
  }, [allWorkouts]);

  const latestWeight = bodyWeight?.[0];

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">CompounDX</h1>
        <p className="text-sm text-zinc-500">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Link href="/workouts/new">
          <Card className="flex flex-col items-center gap-1 py-3 hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95">
            <div className="rounded-lg bg-indigo-600/20 p-2">
              <Plus className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-[10px] font-semibold text-zinc-100">Workout</div>
          </Card>
        </Link>
        <Link href="/workouts/new">
          <Card className="flex flex-col items-center gap-1 py-3 hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95">
            <div className="rounded-lg bg-purple-600/20 p-2">
              <Mic className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-[10px] font-semibold text-zinc-100">Voice</div>
          </Card>
        </Link>
        <Link href="/templates">
          <Card className="flex flex-col items-center gap-1 py-3 hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95">
            <div className="rounded-lg bg-emerald-600/20 p-2">
              <ClipboardList className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-[10px] font-semibold text-zinc-100">Templates</div>
          </Card>
        </Link>
        <Link href="/tools">
          <Card className="flex flex-col items-center gap-1 py-3 hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95">
            <div className="rounded-lg bg-amber-600/20 p-2">
              <Calculator className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-[10px] font-semibold text-zinc-100">Tools</div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{streak}</div>
          <div className="text-[10px] text-zinc-500">Day Streak</div>
        </Card>
        <Card className="text-center py-3">
          <Calendar className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{frequency}</div>
          <div className="text-[10px] text-zinc-500">This Month</div>
        </Card>
        <Card className="text-center py-3">
          {latestWeight ? (
            <>
              <Scale className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-zinc-100">{latestWeight.weight}</div>
              <div className="text-[10px] text-zinc-500">{latestWeight.weightUnit}</div>
            </>
          ) : (
            <>
              <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-zinc-100">{allWorkouts?.length ?? 0}</div>
              <div className="text-[10px] text-zinc-500">Total</div>
            </>
          )}
        </Card>
      </div>

      {/* Training Calendar */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Training Activity</h2>
        <Card className="overflow-x-auto">
          <WeeklyCalendar workoutDates={workoutDates} weeks={8} />
        </Card>
      </div>

      {todayWorkouts && todayWorkouts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Today&apos;s Workout</h2>
          {todayWorkouts.map((w) => (
            <Link key={w.id} href={`/workouts/detail?id=${w.id}`}>
              <Card className="hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-600/20 p-2">
                    <Dumbbell className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{w.name}</div>
                    <div className="text-xs text-zinc-500">
                      {w.exercises.length} exercises &middot; {w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} sets
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {settings && todayNutrition && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Today&apos;s Nutrition</h2>
          <Card>
            <NutritionSummary entries={todayNutrition} settings={settings} />
            <Link
              href="/nutrition"
              className="block text-center text-xs text-indigo-400 hover:text-indigo-300 mt-2"
            >
              Log food
            </Link>
          </Card>
        </div>
      )}

      {prs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Personal Records</h2>
          <div className="space-y-2">
            {prs.map((pr) => (
              <Card key={pr.exerciseId} className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-600/20 p-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-100">{pr.exerciseName}</div>
                  <div className="text-xs text-zinc-500">{pr.maxWeight} {settings?.weightUnit ?? 'lbs'} &middot; {pr.maxReps} reps</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
