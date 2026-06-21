'use client';

import { Suspense } from 'react';
import { WorkoutDetailClient } from './WorkoutDetailClient';

export default function WorkoutDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>}>
      <WorkoutDetailClient />
    </Suspense>
  );
}
