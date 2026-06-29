'use client';

import { useState, useMemo } from 'react';
import { useAttempts } from '@/lib/db-hooks';
import { getQuestionById } from '@/lib/questions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { subjectLabel, formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, XCircle, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Filter } from 'lucide-react';
import Link from 'next/link';
import { Subject } from '@/types';

export default function ReviewPage() {
  const allAttempts = useAttempts(500);
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [showOnlyWrong, setShowOnlyWrong] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAttempts = useMemo(() => {
    if (!allAttempts) return [];
    let attempts = [...allAttempts];
    if (showOnlyWrong) {
      attempts = attempts.filter((a) => !a.isCorrect);
    }
    if (subjectFilter !== 'all') {
      attempts = attempts.filter((a) => a.subject === subjectFilter);
    }
    return attempts.slice(0, 50);
  }, [allAttempts, subjectFilter, showOnlyWrong]);

  const wrongCount = allAttempts?.filter((a) => !a.isCorrect).length ?? 0;
  const subjects: (Subject | 'all')[] = ['all', 'mathematics', 'physics', 'chemistry', 'biology', 'english', 'history'];

  if (!allAttempts) {
    return (
      <div className="px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-sm text-zinc-400">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Mistake Review</h1>
          <p className="text-xs text-zinc-500">{wrongCount} incorrect answers to learn from</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              subjectFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            {s === 'all' ? 'All Subjects' : subjectLabel(s)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowOnlyWrong(!showOnlyWrong)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            showOnlyWrong ? 'bg-red-600/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
          )}
        >
          <Filter className="h-3 w-3" />
          {showOnlyWrong ? 'Wrong only' : 'All attempts'}
        </button>
        <span className="text-xs text-zinc-500">{filteredAttempts.length} results</span>
      </div>

      {filteredAttempts.length === 0 ? (
        <Card className="text-center py-8">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-zinc-300 mb-1">
            {showOnlyWrong ? 'No mistakes to review!' : 'No attempts yet'}
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            {showOnlyWrong
              ? 'You\'ve been getting everything right. Keep it up!'
              : 'Start practising to see your history here.'}
          </p>
          <Link href="/practice" className="text-sm text-indigo-400 hover:text-indigo-300">
            Go to Practice
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAttempts.map((attempt) => {
            const question = getQuestionById(attempt.questionId);
            const isExpanded = expandedId === attempt.id;

            return (
              <Card
                key={attempt.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  !attempt.isCorrect && 'border-red-500/10'
                )}
                onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
              >
                <div className="flex items-start gap-3">
                  {attempt.isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 line-clamp-2">
                      {question?.question ?? 'Question not found'}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {subjectLabel(attempt.subject)} &middot; {attempt.topic} &middot; {attempt.timeSpent}s
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                  )}
                </div>

                {isExpanded && question && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500 font-medium">Your Answer</div>
                      <div className={cn(
                        'text-xs mt-0.5',
                        attempt.isCorrect ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {attempt.answer || '(no answer)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500 font-medium">Correct Answer</div>
                      <div className="text-xs text-emerald-400 mt-0.5">{question.correctAnswer}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500 font-medium">Explanation</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{question.explanation}</div>
                    </div>
                    {question.commonErrors && question.commonErrors.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-400" /> Common Errors
                        </div>
                        <ul className="text-xs text-amber-300/80 mt-0.5 space-y-0.5">
                          {question.commonErrors.map((e, i) => (
                            <li key={i}>&bull; {e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {question.markScheme && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500 font-medium">Mark Scheme</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{question.markScheme}</div>
                      </div>
                    )}
                    <Link
                      href={`/practice/session?subject=${attempt.subject}&chapter=${attempt.chapter}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BookOpen className="h-3 w-3" /> Practice this topic
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
