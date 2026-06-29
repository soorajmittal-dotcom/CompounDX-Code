'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Subject, QuestionAttempt, PracticeSession, Question } from '@/types';
import { getQuestionsBySubject, shuffleQuestions } from '@/lib/questions';
import { updateTopicMastery } from '@/lib/analytics';
import { db } from '@/lib/db';
import { useMastery } from '@/lib/db-hooks';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn, subjectLabel, formatTimer, formatDuration } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, Trophy, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function MockExamExamPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><div className="text-sm text-zinc-500">Loading exam...</div></div>}>
      <MockExamContent />
    </Suspense>
  );
}

function MockExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = searchParams.get('subject') as Subject;
  const questionCount = parseInt(searchParams.get('count') ?? '10');
  const timeLimitMin = parseInt(searchParams.get('time') ?? '15');

  const [sessionId] = useState(uuid());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean; timeSpent: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMin * 60);
  const [timeUp, setTimeUp] = useState(false);
  const mastery = useMastery(subject);

  useEffect(() => {
    const qs = shuffleQuestions(getQuestionsBySubject(subject)).slice(0, questionCount);
    setQuestions(qs);
  }, [subject, questionCount]);

  useEffect(() => {
    if (finished || timeUp) return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          setTimeUp(true);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finished, timeUp]);

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
    const totalMarks = questions.slice(0, results.length).reduce((s, q) => s + q.marks, 0);
    const scoredMarks = results.filter((r) => r.isCorrect).reduce((s, r) => {
      const q = questions.find((qq) => qq.id === r.questionId);
      return s + (q?.marks ?? 0);
    }, 0);

    const session: PracticeSession = {
      id: sessionId,
      subject,
      mode: 'mock',
      startTime,
      endTime: Date.now(),
      totalQuestions: results.length,
      correctAnswers: results.filter((r) => r.isCorrect).length,
      totalMarks,
      scoredMarks,
      timeLimit: timeLimitMin * 60,
      completed: true,
    };
    await db.sessions.add(session);
  }, [sessionId, subject, startTime, results, questions, timeLimitMin]);

  useEffect(() => {
    if (finished && results.length > 0) {
      saveSession();
    }
  }, [finished, results.length, saveSession]);

  const totalTime = useMemo(() => results.reduce((s, r) => s + r.timeSpent, 0), [results]);
  const timePct = (timeRemaining / (timeLimitMin * 60)) * 100;
  const isTimeLow = timeRemaining < timeLimitMin * 12;

  if (questions.length === 0) {
    return (
      <div className="px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-sm text-zinc-400">Loading exam...</p>
        </Card>
      </div>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.isCorrect).length;
    const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
    const unanswered = questions.length - results.length;

    const timeBleedResults = results
      .map((r) => {
        const q = questions.find((qq) => qq.id === r.questionId);
        return { ...r, marks: q?.marks ?? 1, timePerMark: r.timeSpent / (q?.marks ?? 1) };
      })
      .filter((r) => r.timePerMark > 180);

    return (
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-zinc-100">
          {timeUp ? 'Time Up!' : 'Exam Complete'}
        </h1>

        {timeUp && (
          <Card className="bg-red-950/20 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-300">Time ran out. {unanswered} questions unanswered.</span>
            </div>
          </Card>
        )}

        <Card className="text-center py-6">
          <div className={cn(
            'text-4xl font-bold mb-1',
            accuracy >= 70 ? 'text-emerald-400' : accuracy >= 40 ? 'text-amber-400' : 'text-red-400'
          )}>
            {accuracy}%
          </div>
          <div className="text-sm text-zinc-500">
            {correct}/{results.length} correct
            {unanswered > 0 && ` · ${unanswered} unanswered`}
          </div>
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
            <div className="text-[10px] text-zinc-500">Time Used</div>
          </Card>
        </div>

        {timeBleedResults.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Time Audit
            </h2>
            <Card className="bg-amber-950/10 border-amber-500/20">
              <p className="text-xs text-amber-300/80 mb-2">
                {timeBleedResults.length} question(s) took over 3 min/mark — these bleed exam time.
              </p>
              {timeBleedResults.slice(0, 3).map((r, i) => {
                const q = questions.find((qq) => qq.id === r.questionId);
                return (
                  <div key={i} className="text-xs text-zinc-400 py-1 border-t border-zinc-800 first:border-0">
                    <span className="text-zinc-300">{q?.topic}</span>: {r.timeSpent}s for {r.marks} marks
                    ({Math.round(r.timePerMark)}s/mark)
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Question Results</h2>
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
                    <div className="text-xs text-zinc-300 truncate">{q?.question.slice(0, 50)}...</div>
                    <div className="text-[10px] text-zinc-500">{q?.topic} &middot; {r.timeSpent}s</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/mock')} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={() => window.location.reload()} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">{subjectLabel(subject)}</span>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono font-medium',
          isTimeLow ? 'bg-red-600/20 text-red-400' : 'bg-zinc-800 text-zinc-300'
        )}>
          <Clock className="h-3.5 w-3.5" />
          {formatTimer(timeRemaining)}
        </div>
      </div>

      <ProgressBar
        value={timePct}
        color={isTimeLow ? 'bg-red-500' : 'bg-indigo-500'}
        size="sm"
      />

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
