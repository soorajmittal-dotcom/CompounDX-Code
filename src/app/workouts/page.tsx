'use client';

import { useAllWorkouts } from '@/lib/db-hooks';
import { Header } from '@/components/layout/Header';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Dumbbell, Plus } from 'lucide-react';
import Link from 'next/link';

export default function WorkoutsPage() {
  const workouts = useAllWorkouts();

  return (
    <div>
      <Header
        title="Workouts"
        action={
          <Link href="/workouts/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-3">
        {workouts && workouts.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Start your first workout to begin tracking your progress"
            action={
              <Link href="/workouts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> Start Workout
                </Button>
              </Link>
            }
          />
        )}

        {workouts?.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  );
}
