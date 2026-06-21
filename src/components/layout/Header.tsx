'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export function Header({ title, showBack, action }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1.5 -ml-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
