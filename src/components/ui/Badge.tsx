'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'indigo';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-zinc-800 text-zinc-300',
        variant === 'success' && 'bg-emerald-900/50 text-emerald-400',
        variant === 'warning' && 'bg-amber-900/50 text-amber-400',
        variant === 'indigo' && 'bg-indigo-900/50 text-indigo-400',
        className
      )}
    >
      {children}
    </span>
  );
}
