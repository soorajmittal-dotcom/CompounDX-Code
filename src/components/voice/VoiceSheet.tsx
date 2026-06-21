'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseVoiceInput } from '@/lib/voice-parser';
import { useExerciseLibrary } from '@/lib/db-hooks';
import { VoiceParsedExercise } from '@/types';
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (exercises: VoiceParsedExercise[]) => void;
}

export function VoiceSheet({ open, onClose, onConfirm }: VoiceSheetProps) {
  const { transcript, interimTranscript, isListening, isSupported, error, start, stop, reset } = useSpeechRecognition();
  const exercises = useExerciseLibrary();
  const [parsed, setParsed] = useState<VoiceParsedExercise[]>([]);

  useEffect(() => {
    if (open && !isListening && isSupported) {
      start();
    }
  }, [open, isSupported, start, isListening]);

  useEffect(() => {
    if (transcript && exercises) {
      setParsed(parseVoiceInput(transcript, exercises));
    }
  }, [transcript, exercises]);

  const handleClose = () => {
    stop();
    reset();
    setParsed([]);
    onClose();
  };

  const handleConfirm = () => {
    stop();
    onConfirm(parsed);
    reset();
    setParsed([]);
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Voice Log">
      <div className="space-y-4">
        {!isSupported && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Speech recognition is not supported in this browser. Try Chrome or Safari.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-900/20 text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onClick={isListening ? stop : start}
            disabled={!isSupported}
            className={cn(
              'h-20 w-20 rounded-full flex items-center justify-center transition-all',
              isListening
                ? 'bg-red-600 animate-pulse shadow-lg shadow-red-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700'
            )}
          >
            {isListening ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white" />}
          </button>
          <span className="text-sm text-zinc-400">
            {isListening ? 'Listening... tap to stop' : 'Tap to start'}
          </span>
        </div>

        {(transcript || interimTranscript) && (
          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <p className="text-sm text-zinc-500 mb-1">Transcript</p>
            <p className="text-sm text-zinc-200">
              {transcript}
              {interimTranscript && (
                <span className="text-zinc-500 italic">{interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        {parsed.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400 font-medium">Parsed exercises:</p>
            {parsed.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div>
                  <span className="text-sm font-medium text-zinc-100">{p.exerciseName}</span>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {p.sets} sets x {p.reps} reps
                    {p.weight && ` @ ${p.weight} ${p.weightUnit ?? 'lbs'}`}
                  </div>
                </div>
                <div className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  p.confidence >= 0.7 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'
                )}>
                  {Math.round(p.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {parsed.length > 0 && (
          <Button onClick={handleConfirm} className="w-full">
            <Check className="h-4 w-4 mr-2" /> Add {parsed.length} Exercise{parsed.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </BottomSheet>
  );
}
