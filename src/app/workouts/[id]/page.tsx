'use client';

import { use } from 'react';
import { useWorkout } from '@/lib/db-hooks';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateLong, totalVolume } from '@/lib/utils';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { WorkoutTemplate, TemplateExercise, Workout, WorkoutExercise, ExerciseSet } from '@/types';
import { useSettings } from '@/lib/db-hooks';
import { todayStr } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import { Trash2, Clock, Dumbbell, BookmarkPlus, RotateCcw, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const workout = useWorkout(id);
  const settings = useSettings();
  const router = useRouter();

  if (!workout) {
    return (
      <div>
        <Header title="Workout" showBack />
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>
      </div>
    );
  }

  const duration = workout.endTime && workout.startTime
    ? Math.round((workout.endTime - workout.startTime) / 60000)
    : null;

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareWorkout = async () => {
    const unit = settings?.weightUnit ?? 'lbs';
    const vol = workout.exercises.reduce((s, e) => s + totalVolume(e.sets), 0);
    const lines = [
      `${workout.name} - ${formatDateLong(workout.date)}`,
      duration ? `Duration: ${duration} min` : '',
      vol > 0 ? `Volume: ${vol.toLocaleString()} ${unit}` : '',
      '',
      ...workout.exercises.map((e) => {
        const sets = e.sets.filter((s) => s.completed);
        const setStr = sets.map((s) => `${s.weight ?? '-'}x${s.reps ?? '-'}`).join(', ');
        return `${e.exerciseName}: ${setStr || 'no completed sets'}`;
      }),
      '',
      'Logged with CompounDX',
    ].filter(Boolean);

    const text = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: workout.name, text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    await db.workouts.delete(workout.id);
    router.push('/workouts');
  };

  const saveAsTemplate = async () => {
    const template: WorkoutTemplate = {
      id: uuid(),
      name: workout.name,
      exercises: workout.exercises.map((e): TemplateExercise => {
        const completedSets = e.sets.filter((s) => s.completed);
        const topWeight = Math.max(...completedSets.map((s) => s.weight ?? 0), 0);
        const topReps = Math.max(...completedSets.map((s) => s.reps ?? 0), 0);
        return {
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: e.sets.length,
          reps: topReps || undefined,
          weight: topWeight || undefined,
          order: e.order,
        };
      }),
      createdAt: Date.now(),
    };
    await db.templates.add(template);
    setSaved(true);
  };

  const repeatWorkout = async () => {
    const weightUnit = settings?.weightUnit ?? 'lbs';
    const newWorkout: Workout = {
      id: uuid(),
      date: todayStr(),
      startTime: Date.now(),
      name: workout.name,
      exercises: workout.exercises.map((e): WorkoutExercise => ({
        id: uuid(),
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        order: e.order,
        sets: e.sets.map((s, j): ExerciseSet => ({
          id: uuid(),
          setNumber: j + 1,
          reps: s.reps,
          weight: s.weight,
          weightUnit,
          type: s.type,
          completed: false,
        })),
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.workouts.put(newWorkout);
    router.push(`/workouts/${newWorkout.id}`);
  };

  return (
    <div>
      <Header
        title={workout.name}
        showBack
        action={
          <button onClick={handleDelete} className="p-2 text-zinc-400 hover:text-red-400">
            <Trash2 className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>{formatDateLong(workout.date)}</span>
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {duration} min
            </span>
          )}
        </div>

        {workout.voiceTranscript && (
          <Card className="bg-indigo-900/10 border-indigo-800/30">
            <p className="text-xs text-indigo-400 mb-1">Voice transcript</p>
            <p className="text-sm text-zinc-300">{workout.voiceTranscript}</p>
          </Card>
        )}

        <div className="space-y-3">
          {workout.exercises.map((exercise) => {
            const vol = totalVolume(exercise.sets);
            return (
              <Card key={exercise.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-indigo-400" />
                    <span className="font-medium text-sm text-zinc-100">{exercise.exerciseName}</span>
                  </div>
                  {vol > 0 && <Badge variant="indigo">{vol.toLocaleString()} {settings?.weightUnit ?? 'lbs'}</Badge>}
                </div>

                {exercise.notes && (
                  <p className="text-xs text-zinc-400 italic mb-2">{exercise.notes}</p>
                )}

                <div className="space-y-1">
                  <div className="grid grid-cols-5 text-[10px] text-zinc-500 uppercase tracking-wider px-1">
                    <span>Set</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>RPE</span>
                    <span>Status</span>
                  </div>
                  {exercise.sets.map((set) => (
                    <div key={set.id} className="grid grid-cols-5 text-sm px-1 py-1">
                      <span className="text-zinc-500">{set.setNumber}</span>
                      <span className="text-zinc-100">{set.weight ?? '-'} {set.weightUnit}</span>
                      <span className="text-zinc-100">{set.reps ?? '-'}</span>
                      <span className="text-zinc-400">{set.rpe ?? '-'}</span>
                      <span>{set.completed ? <Badge variant="success">Done</Badge> : <Badge>Skip</Badge>}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-900/20 text-emerald-400 text-sm text-center">
            Saved as template!
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={repeatWorkout} className="w-full">
            <RotateCcw className="h-4 w-4 mr-1" /> Repeat
          </Button>
          <Button variant="secondary" onClick={saveAsTemplate} disabled={saved} className="w-full">
            <BookmarkPlus className="h-4 w-4 mr-1" /> {saved ? 'Saved' : 'Template'}
          </Button>
          <Button variant="secondary" onClick={shareWorkout} className="w-full">
            <Share2 className="h-4 w-4 mr-1" /> {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>

        <Button variant="danger" onClick={handleDelete} className="w-full">
          <Trash2 className="h-4 w-4 mr-2" /> Delete Workout
        </Button>
      </div>
    </div>
  );
}
