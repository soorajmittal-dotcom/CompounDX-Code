'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Subject, QuestionAttempt, PracticeSession, Question } from '@/types';
import { getWeakQuestions, getQuestionsBySubject, shuffleQuestions } from '@/lib/questions';
import { updateTopicMastery } from '@/lib/analytics';
import { db } from '@/lib/db';
import { useAttempts, useMastery } from '@/lib/db-hooks';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { subjectLabel, formatDuration } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import { ArrowLeft, CheckCircle, XCircle, Clock, Zap, RotateCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DrillPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><div className="text-sm text-zinc-500">Loading drill...</div></div>}>
      <DrillContent />
    </Suspense>
  );
}

function DrillContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = searchParams.get('subject') as Subject | null;

  const allAttempts = useAttempts(500);
  const mastery = useMastery(subject ?? undefined);

  const [sessionId] = useState(uuid());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean; timeSpent: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!allAttempts || loaded) return;

    let weakQs = getWeakQuestions(allAttempts, subject ?? undefined, 15);

    if (weakQs.length < 5 && subject) {
      const subjectQs = shuffleQuestions(getQuestionsBySubject(subject));
      const weakIds = new Set(weakQs.map((q) => q.id));
      for (const q of subjectQs) {
        if (!weakIds.has(q.id) && weakQs.length < 10) {
          weakQs.push(q);
        }
      }
    }

    setQuestions(shuffleQuestions(weakQs));
    setLoaded(true);
  }, [allAttempts, subject, loaded]);

  const handleAnswer = useCallback(async (answer: string, timeSpent: number) => {
    if (answer === '__next__') {
      if (currentIndex >= questions.length - 1) {
        setFinished(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
      return;
    }

    const q = questions[currentIndex];
    const isCorrect = q.type === 'mcq'
      ? answer === q.correctAnswer
      : answer.trim().toLowerCase().includes(q.correctAnswer.toLowerCase().slice(0, 20));

    const attempt: QuestionAttempt = {
      id: uuid(),
      questionId: q.id,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      answer,
      isCorrect,
      timeSpent,
      marksScored: isCorrect ? q.marks : 0,
      marksTotal: q.marks,
      timestamp: Date.now(),
      sessionId,
    };

    await db.attempts.add(attempt);

    const existingMastery = mastery?.find(
      (m) => m.subject === q.subject && m.chapter === q.chapter && m.topic === q.topic
    );
    const updatedMastery = updateTopicMastery(existingMastery, q.subject, q.chapter, q.topic, isCorrect);
    await db.mastery.put(updatedMastery);

    setResults((r) => [...r, { questionId: q.id, isCorrect, timeSpent }]);
  }, [currentIndex, questions, mastery, sessionId]);

  const saveSession = useCallback(async () => {
    const session: PracticeSession = {
      id: sessionId,
      subject: subject ?? (questions[0]?.subject ?? 'mathematics'),
      mode: 'drill',
      startTime,
      endTime: Date.now(),
      totalQuestions: results.length,
      correctAnswers: results.filter((r) => r.isCorrect).length,
      totalMarks: questions.reduce((s, q) => s + q.marks, 0),
      scoredMarks: results.filter((r) => r.isCorrect).reduce((s, r) => {
        const q = questions.find((qq) => qq.id === r.questionId);
        return s + (q?.marks ?? 0);
      }, 0),
      completed: true,
    };
    await db.sessions.add(session);
  }, [sessionId, subject, startTime, results, questions]);

  useEffect(() => {
    if (finished && results.length > 0) {
      saveSession();
    }
  }, [finished, results.length, saveSession]);

  const totalTime = useMemo(() => results.reduce((s, r) => s + r.timeSpent, 0), [results]);

  if (!loaded || !allAttempts) {
    return (
      <div className="px-4 py-6">
        <Card className="text-center py-8">
          <Zap className="h-8 w-8 text-amber-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-zinc-400">Analysing weak patterns...</p>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Card className="text-center py-8">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-zinc-300 mb-1">No weak topics found!</h3>
          <p className="text-xs text-zinc-500 mb-4">
            {allAttempts.length === 0
              ? 'Start practising to build your drill queue.'
              : 'Great job — you\'ve answered everything correctly so far.'}
          </p>
          <Link href="/practice" className="text-sm text-indigo-400 hover:text-indigo-300">
            Go to Practice
          </Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.isCorrect).length;
    const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

    return (
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-zinc-100">Drill Complete</h1>

        <Card className="text-center py-6">
          <div className={`text-4xl font-bold mb-1 ${accuracy >= 70 ? 'text-emerald-400' : accuracy >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {accuracy}%
          </div>
          <div className="text-sm text-zinc-500">{correct}/{results.length} correct</div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{correct}</div>
            <div className="text-[10px] text-zinc-500">Correct</div>
          </Card>
          <Card className="text-center py-3">
            <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{results.length - correct}</div>
            <div className="text-[10px] text-zinc-500">Wrong</div>
          </Card>
          <Card className="text-center py-3">
            <Clock className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-zinc-100">{formatDuration(totalTime)}</div>
            <div className="text-[10px] text-zinc-500">Time</div>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Results</h2>
          <div className="space-y-1">
            {results.map((r, i) => {
              const q = questions.find((qq) => qq.id === r.questionId);
              return (
                <Card key={i} className="flex items-center gap-3 py-2">
                  {r.isCorrect ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate">{q?.question.slice(0, 60)}...</div>
                    <div className="text-[10px] text-zinc-500">{subjectLabel(q?.subject ?? 'mathematics')} &middot; {q?.topic}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/')} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Home
          </Button>
          <Button onClick={() => window.location.reload()} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-1" /> Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">Weak Topic Drill</span>
        </div>
        <span className="text-xs text-zinc-500">
          {results.filter((r) => r.isCorrect).length}/{results.length}
        </span>
      </div>

      <Card className="bg-amber-950/10 border-amber-500/20 py-2 px-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300/80">
            These questions target your weakest patterns. Take your time.
          </span>
        </div>
      </Card>

      <ProgressBar value={currentIndex + 1} max={questions.length} color="bg-amber-500" size="sm" />

      <QuestionCard
        key={questions[currentIndex].id}
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        showTimer
      />
    </div>
  );
}
