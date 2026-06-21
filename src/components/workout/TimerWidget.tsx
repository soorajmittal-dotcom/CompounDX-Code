'use client';

import { useTimer } from '@/hooks/useTimer';
import { formatDuration } from '@/lib/utils';
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

export function TimerWidget() {
  const [show, setShow] = useState(false);
  const { seconds, isRunning, start, pause, reset } = useTimer();

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-20 right-4 z-30 h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 shadow-lg"
      >
        <Timer className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-30 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-3 min-w-[140px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400 font-medium">Rest Timer</span>
        <button onClick={() => { reset(); setShow(false); }} className="text-zinc-500 hover:text-zinc-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-2xl font-mono font-bold text-zinc-100 text-center mb-2">
        {formatDuration(seconds)}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={isRunning ? pause : start}
          className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <button
          onClick={() => reset(0)}
          className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
