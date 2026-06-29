'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, difficultyColor } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string, timeSpent: number) => void;
  showTimer?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showTimer = false,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, submitted]);

  const isCorrect = question.type === 'mcq'
    ? selectedOption === question.correctAnswer
    : textAnswer.trim().toLowerCase().includes(question.correctAnswer.toLowerCase().slice(0, 20));

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const answer = question.type === 'mcq' ? (selectedOption ?? '') : textAnswer;
    onAnswer(answer, elapsed);
  }, [submitted, question.type, selectedOption, textAnswer, elapsed, onAnswer]);

  const timePerMark = question.marks > 0 ? elapsed / question.marks : elapsed;
  const isTimeBleed = timePerMark > 180;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">
          Question {questionNumber} of {totalQuestions}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', difficultyColor(question.difficulty), 'bg-zinc-800')}>
            {question.difficulty}
          </span>
          <span className="text-xs text-zinc-500">{question.marks} marks</span>
          {showTimer && (
            <span className={cn('text-xs font-mono', isTimeBleed && !submitted ? 'text-red-400' : 'text-zinc-500')}>
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      <Card className="border-zinc-700">
        <p className="text-sm text-zinc-100 whitespace-pre-line leading-relaxed">{question.question}</p>
      </Card>

      {question.type === 'mcq' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = selectedOption === opt;
            const isCorrectOption = opt === question.correctAnswer;

            return (
              <button
                key={i}
                onClick={() => !submitted && setSelectedOption(opt)}
                disabled={submitted}
                className={cn(
                  'w-full text-left rounded-xl border p-3 text-sm transition-all',
                  !submitted && isSelected && 'border-indigo-500 bg-indigo-600/10',
                  !submitted && !isSelected && 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600',
                  submitted && isCorrectOption && 'border-emerald-500 bg-emerald-600/10',
                  submitted && isSelected && !isCorrectOption && 'border-red-500 bg-red-600/10',
                  submitted && !isSelected && !isCorrectOption && 'border-zinc-800 bg-zinc-900/30 opacity-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border',
                    !submitted && isSelected && 'border-indigo-500 text-indigo-400',
                    !submitted && !isSelected && 'border-zinc-600 text-zinc-500',
                    submitted && isCorrectOption && 'border-emerald-500 text-emerald-400',
                    submitted && isSelected && !isCorrectOption && 'border-red-500 text-red-400',
                    submitted && !isSelected && !isCorrectOption && 'border-zinc-700 text-zinc-600',
                  )}>
                    {submitted && isCorrectOption ? <CheckCircle className="h-4 w-4" /> :
                     submitted && isSelected && !isCorrectOption ? <XCircle className="h-4 w-4" /> :
                     letter}
                  </span>
                  <span className="text-zinc-200">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {question.type !== 'mcq' && !submitted && (
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={4}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none resize-none"
        />
      )}

      {submitted && (
        <Card className={cn(
          'border',
          isCorrect ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-red-500/30 bg-red-950/20'
        )}>
          <div className="flex items-start gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className={cn('text-sm font-medium', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                <span className="font-medium text-zinc-300">Answer: </span>
                {question.correctAnswer}
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{question.explanation}</p>
          {question.commonErrors && question.commonErrors.length > 0 && (
            <div className="mt-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Common Errors</span>
              </div>
              <ul className="text-xs text-zinc-500 space-y-1">
                {question.commonErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
          {question.markScheme && (
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <span className="text-xs font-medium text-zinc-400">Mark Scheme: </span>
              <span className="text-xs text-zinc-500">{question.markScheme}</span>
            </div>
          )}
          {isTimeBleed && (
            <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-xs text-amber-400">
                Time alert: {Math.round(timePerMark)}s per mark (aim for under 3 min/mark)
              </span>
            </div>
          )}
        </Card>
      )}

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={question.type === 'mcq' ? !selectedOption : !textAnswer.trim()}
          className="w-full"
        >
          Submit Answer
        </Button>
      ) : (
        <Button onClick={() => onAnswer('__next__', elapsed)} className="w-full">
          Next Question <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
