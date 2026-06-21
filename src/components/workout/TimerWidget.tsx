'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react';

const PRESETS = [30, 60, 90, 120, 180];

export function TimerWidget() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [targetSeconds, setTargetSeconds] = useState(0);
  const [autoRest, setAutoRest] = useState(90);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = () => {
      if (autoRest > 0) {
        setShow(true);
        setMode('countdown');
        setSeconds(autoRest);
        setTargetSeconds(autoRest);
        setIsRunning(true);
      }
    };
    window.addEventListener('set-completed', handler);
    return () => window.removeEventListener('set-completed', handler);
  }, [autoRest]);

  const tick = useCallback(() => {
    setSeconds((prev) => {
      if (mode === 'countdown') {
        if (prev <= 1) {
          setIsRunning(false);
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      }
      return prev + 1;
    });
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const startCountdown = (s: number) => {
    setMode('countdown');
    setSeconds(s);
    setTargetSeconds(s);
    setIsRunning(true);
  };

  const startStopwatch = () => {
    setMode('stopwatch');
    setSeconds(0);
    setIsRunning(true);
  };

  const toggle = () => {
    if (isRunning) {
      setIsRunning(false);
    } else if (mode === 'countdown' && seconds === 0 && targetSeconds > 0) {
      setSeconds(targetSeconds);
      setIsRunning(true);
    } else {
      setIsRunning(true);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setSeconds(mode === 'countdown' ? targetSeconds : 0);
  };

  const pct = mode === 'countdown' && targetSeconds > 0
    ? ((targetSeconds - seconds) / targetSeconds) * 100
    : 0;

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
    <div className="fixed bottom-20 right-4 z-30 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-3 w-[180px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400 font-medium">
          {mode === 'countdown' ? 'Rest Timer' : 'Stopwatch'}
        </span>
        <button onClick={() => { setIsRunning(false); setShow(false); }} className="text-zinc-500 hover:text-zinc-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-3">
        {mode === 'countdown' && targetSeconds > 0 && (
          <svg className="absolute h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#27272a" strokeWidth="3" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={seconds === 0 ? '#10b981' : '#6366f1'}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - pct / 100)}
              className="transition-all duration-1000"
            />
          </svg>
        )}
        <div className="text-2xl font-mono font-bold text-zinc-100 z-10">
          {formatDuration(seconds)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => startCountdown(s)}
            className={`flex-1 min-w-[3rem] py-1 rounded-lg text-[10px] font-medium transition-colors ${
              mode === 'countdown' && targetSeconds === s
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s >= 60 ? `${s / 60}m` : `${s}s`}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={toggle}
          className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        {mode !== 'stopwatch' && (
          <button
            onClick={startStopwatch}
            className="h-9 px-2 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 text-[10px] font-medium"
          >
            <Timer className="h-3 w-3 mr-1" />SW
          </button>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Auto-rest on set</span>
          <select
            value={autoRest}
            onChange={(e) => setAutoRest(Number(e.target.value))}
            className="bg-zinc-800 text-zinc-300 text-[10px] rounded px-1.5 py-0.5 border-none outline-none"
          >
            <option value={0}>Off</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
            <option value={90}>90s</option>
            <option value={120}>2m</option>
            <option value={180}>3m</option>
          </select>
        </div>
      </div>
    </div>
  );
}
