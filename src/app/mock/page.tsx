'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUBJECTS, SUBJECT_COLORS } from '@/lib/subjects';
import { getQuestionsBySubject } from '@/lib/questions';
import { useSessions } from '@/lib/db-hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Subject } from '@/types';
import { Clock, Target, ArrowRight, Trophy } from 'lucide-react';
import { subjectLabel, formatDuration } from '@/lib/utils';

const EXAM_CONFIGS: { label: string; subjects: Subject[]; questionCount: number; timeMinutes: number }[] = [
  { label: 'Quick Quiz', subjects: [], questionCount: 10, timeMinutes: 15 },
  { label: 'Half Paper', subjects: [], questionCount: 20, timeMinutes: 45 },
  { label: 'Full Paper', subjects: [], questionCount: 30, timeMinutes: 90 },
];

export default function MockExamPage() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConfig, setSelectedConfig] = useState(0);
  const sessions = useSessions(10);

  const mockSessions = sessions?.filter((s) => s.mode === 'mock' && s.completed) ?? [];

  const startExam = () => {
    const config = EXAM_CONFIGS[selectedConfig];
    const subject = selectedSubject ?? 'mathematics';
    const params = new URLSearchParams({
      subject,
      count: config.questionCount.toString(),
      time: config.timeMinutes.toString(),
    });
    router.push(`/mock/exam?${params.toString()}`);
  };

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Mock Exam</h1>
        <p className="text-sm text-zinc-500">Simulate real exam conditions</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select Subject</h2>
        <div className="grid grid-cols-3 gap-2">
          {SUBJECTS.map((subject) => {
            const colors = SUBJECT_COLORS[subject.id];
            const isSelected = selectedSubject === subject.id;
            const questionCount = getQuestionsBySubject(subject.id).length;
            return (
              <button key={subject.id} onClick={() => setSelectedSubject(subject.id)}>
                <Card className={`text-center py-3 transition-colors ${isSelected ? colors.border + ' ' + colors.bg : ''}`}>
                  <div className={`text-xs font-semibold ${isSelected ? colors.text : 'text-zinc-300'}`}>
                    {subject.name.slice(0, 5)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{questionCount}q</div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Exam Type</h2>
        <div className="space-y-2">
          {EXAM_CONFIGS.map((config, i) => (
            <button key={i} onClick={() => setSelectedConfig(i)} className="w-full text-left">
              <Card className={`transition-colors ${selectedConfig === i ? 'border-indigo-500/50 bg-indigo-600/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-zinc-800 p-2">
                      {i === 0 ? <Target className="h-4 w-4 text-emerald-400" /> :
                       i === 1 ? <Clock className="h-4 w-4 text-amber-400" /> :
                       <Trophy className="h-4 w-4 text-purple-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{config.label}</div>
                      <div className="text-xs text-zinc-500">
                        {config.questionCount} questions &middot; {config.timeMinutes} min
                      </div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${selectedConfig === i ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`} />
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-amber-950/20 border-amber-500/20">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300/80">
            <span className="font-medium">Real exam conditions:</span> Timer counts down, no hints,
            no skipping. Time-bleed warnings appear if you spend too long on a question.
          </div>
        </div>
      </Card>

      <Button onClick={startExam} disabled={!selectedSubject} className="w-full" size="lg">
        Start Mock Exam <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      {mockSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Recent Exams</h2>
          <div className="space-y-2">
            {mockSessions.map((session) => {
              const accuracy = session.totalQuestions > 0
                ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
                : 0;
              const duration = session.endTime ? Math.round((session.endTime - session.startTime) / 1000) : 0;
              return (
                <Card key={session.id} className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${accuracy >= 70 ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>
                    {accuracy >= 70 ? (
                      <Trophy className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Target className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-200">
                      {subjectLabel(session.subject)} &middot; {accuracy}%
                    </div>
                    <div className="text-xs text-zinc-500">
                      {session.correctAnswers}/{session.totalQuestions} correct &middot; {formatDuration(duration)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
