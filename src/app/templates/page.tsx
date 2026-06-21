'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTemplates, useSettings } from '@/lib/db-hooks';
import { db } from '@/lib/db';
import { Workout, WorkoutExercise, ExerciseSet } from '@/types';
import { todayStr } from '@/lib/utils';
import { ClipboardList, Play, Trash2 } from 'lucide-react';

export default function TemplatesPage() {
  const templates = useTemplates();
  const settings = useSettings();
  const router = useRouter();
  const weightUnit = settings?.weightUnit ?? 'lbs';

  const startFromTemplate = async (templateId: string) => {
    const template = await db.templates.get(templateId);
    if (!template) return;

    const workout: Workout = {
      id: uuid(),
      date: todayStr(),
      startTime: Date.now(),
      name: template.name,
      exercises: template.exercises.map((te): WorkoutExercise => ({
        id: uuid(),
        exerciseId: te.exerciseId,
        exerciseName: te.exerciseName,
        order: te.order,
        sets: Array.from({ length: te.sets }, (_, j): ExerciseSet => ({
          id: uuid(),
          setNumber: j + 1,
          reps: te.reps,
          weight: te.weight,
          weightUnit,
          type: 'working',
          completed: false,
        })),
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.workouts.put(workout);
    await db.templates.update(templateId, { lastUsed: Date.now() });
    router.push(`/workouts/detail?id=${workout.id}`);
  };

  const deleteTemplate = async (id: string) => {
    await db.templates.delete(id);
  };

  return (
    <div>
      <Header title="Templates" showBack />

      <div className="px-4 py-4 space-y-3">
        {templates && templates.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No templates yet"
            description="Save a workout as a template to reuse your favorite routines"
          />
        )}

        {templates?.map((template) => (
          <Card key={template.id}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm text-zinc-100">{template.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {template.exercises.length} exercises
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startFromTemplate(template.id)}
                  className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 active:scale-90"
                >
                  <Play className="h-4 w-4 ml-0.5" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {template.exercises.map((ex) => (
                <div key={ex.exerciseId + ex.order} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{ex.exerciseName}</span>
                  <span className="text-zinc-500">
                    {ex.sets}x{ex.reps ?? '?'}
                    {ex.weight ? ` @ ${ex.weight} ${weightUnit}` : ''}
                  </span>
                </div>
              ))}
            </div>

            {template.lastUsed && (
              <div className="mt-2">
                <Badge>Last used: {new Date(template.lastUsed).toLocaleDateString()}</Badge>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
