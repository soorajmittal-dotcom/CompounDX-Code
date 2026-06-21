'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceSheet } from './VoiceSheet';
import { VoiceParsedExercise } from '@/types';

interface VoiceButtonProps {
  onParsed: (exercises: VoiceParsedExercise[]) => void;
}

export function VoiceButton({ onParsed }: VoiceButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = (exercises: VoiceParsedExercise[]) => {
    onParsed(exercises);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-30 h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-90 transition-all"
      >
        <Mic className="h-6 w-6" />
      </button>

      <VoiceSheet open={open} onClose={() => setOpen(false)} onConfirm={handleConfirm} />
    </>
  );
}
