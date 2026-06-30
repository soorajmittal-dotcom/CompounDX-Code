'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Subject, QuestionAttempt, PracticeSession as PracticeSessionType, Question } from '@/types';
import { getQuestionsBySubject, getQuestionsByChapter, shuffleQuestions } from '@/lib/questions';
import { updateTopicMastery } from '@/lib/analytics';
import { db } from '@/lib/db';
import { useMastery } from '@/lib/db-hooks';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { subjectLabel, formatDuration } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import { ArrowLeft, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><div className="text-sm text-zinc-500">Loading...</div></div>}>
      <PracticeSessionContent />
    </Suspense>
  );
}

function PracticeSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = searchParams.get('subject') as Subject;
  const chapter = searchParams.get('chapter');

  const [sessionId] = useState(uuid());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ questionId: string; isCorrect: boolean; timeSpent: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const mastery = useMastery(subject);

  useEffect(() => {
    let qs: Question[];
    if (chapter) {
      qs = getQuestionsByChapter(subject, chapter);
    } else {
      qs = getQuestionsBySubject(subject);
    }
    setQuestions(shuffleQuestions(qs));
  }, [subject, chapter]);

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
    const session: PracticeSessionType = {
      id: sessionId,
      subject,
      chapter: chapter ?? undefined,
      mode: 'practice',
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
  }, [sessionId, subject, chapter, startTime, results, questions]);

  useEffect(() => {
    if (finished && results.length > 0) {
      saveSession();
    }
  }, [finished, results.length, saveSession]);

  const totalTime = useMemo(() => results.reduce((s, r) => s + r.timeSpent, 0), [results]);

  if (questions.length === 0) {
    return (
      <div className="px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-sm text-zinc-400">No questions available for this selection.</p>
          <Link href="/practice" className="text-sm text-indigo-400 mt-2 inline-block">Go back</Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.isCorrect).length;
    const accuracy = Math.round((correct / results.length) * 100);

    return (
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-zinc-100">Session Complete</h1>

        <Card className="text-center py-6">
          <div className="text-4xl font-bold text-zinc-100 mb-1">{accuracy}%</div>
          <div className="text-sm text-zinc-500">Accuracy</div>
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
                    <div className="text-[10px] text-zinc-500">{r.timeSpent}s &middot; {q?.marks} marks</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/practice')} className="flex-1">
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
        <button onClick={() => router.push('/practice')} className="text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-zinc-300">{subjectLabel(subject)}</span>
        <span className="text-xs text-zinc-500">
          {results.filter((r) => r.isCorrect).length}/{results.length} correct
        </span>
      </div>

      <ProgressBar value={currentIndex + 1} max={questions.length} color="bg-indigo-500" size="sm" />

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
