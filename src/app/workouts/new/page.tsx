'use client';

import { Header } from '@/components/layout/Header';
import { WorkoutForm } from '@/components/workout/WorkoutForm';

export default function NewWorkoutPage() {
  return (
    <div>
      <Header title="New Workout" showBack />
      <div className="px-4 py-4">
        <WorkoutForm />
      </div>
    </div>
  );
}
