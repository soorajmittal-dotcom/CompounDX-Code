'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
