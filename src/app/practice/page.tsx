'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SUBJECTS, SUBJECT_COLORS } from '@/lib/subjects';
import { getQuestionsBySubject, getQuestionsByChapter } from '@/lib/questions';
import { useAttemptsBySubject } from '@/lib/db-hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Subject } from '@/types';
import { ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><div className="text-sm text-zinc-500">Loading...</div></div>}>
      <PracticeContent />
    </Suspense>
  );
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject') as Subject | null;
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(initialSubject);

  const subjectInfo = selectedSubject ? SUBJECTS.find((s) => s.id === selectedSubject) : null;
  const subjectAttempts = useAttemptsBySubject(selectedSubject ?? 'mathematics');

  if (selectedSubject && subjectInfo) {
    const chapters = subjectInfo.chapters;
    const attemptedIds = new Set(subjectAttempts?.map((a) => a.questionId) ?? []);
    const correctIds = new Set(subjectAttempts?.filter((a) => a.isCorrect).map((a) => a.questionId) ?? []);

    return (
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSubject(null)} className="text-zinc-500 hover:text-zinc-300">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{subjectInfo.name}</h1>
            <p className="text-xs text-zinc-500">{chapters.length} chapters</p>
          </div>
        </div>

        <div className="space-y-2">
          {chapters.map((chapter) => {
            const chapterQuestions = getQuestionsByChapter(selectedSubject, chapter.id);
            const attempted = chapterQuestions.filter((q) => attemptedIds.has(q.id)).length;
            const correct = chapterQuestions.filter((q) => correctIds.has(q.id)).length;
            const total = chapterQuestions.length;
            const colors = SUBJECT_COLORS[selectedSubject];

            return (
              <Link key={chapter.id} href={`/practice/session?subject=${selectedSubject}&chapter=${chapter.id}`}>
                <Card className="hover:border-zinc-700 transition-colors cursor-pointer active:scale-[0.98] mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-200">{chapter.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {total} questions &middot; {attempted} attempted
                        {correct > 0 && ` · ${correct} correct`}
                      </div>
                      {attempted > 0 && (
                        <ProgressBar
                          value={correct}
                          max={total}
                          color={colors.text.replace('text-', 'bg-')}
                          size="sm"
                          className="mt-2"
                        />
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 flex-shrink-0 ml-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <Link href={`/practice/session?subject=${selectedSubject}`}>
          <Button className="w-full mt-2">
            <BookOpen className="h-4 w-4 mr-2" />
            Practice All {subjectInfo.name}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Practice</h1>
        <p className="text-sm text-zinc-500">Choose a subject to start</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUBJECTS.map((subject) => {
          const questions = getQuestionsBySubject(subject.id);
          const colors = SUBJECT_COLORS[subject.id];
          return (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className="text-left"
            >
              <Card className={`hover:${colors.border} transition-colors cursor-pointer active:scale-95 h-full`}>
                <div className={`rounded-lg ${colors.iconBg} p-2.5 w-fit mb-2`}>
                  <div className={`h-5 w-5 ${colors.text} text-center text-sm font-bold leading-5`}>
                    {subject.name[0]}
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-200">{subject.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {subject.chapters.length} chapters &middot; {questions.length} questions
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
