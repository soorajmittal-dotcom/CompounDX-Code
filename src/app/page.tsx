'use client';

import { useTodayAttempts, useAttempts, useStreakDays, useSubjectStats, useSettings } from '@/lib/db-hooks';
import { getWeakTopics, getDailyProgress } from '@/lib/analytics';
import { SUBJECTS, SUBJECT_COLORS } from '@/lib/subjects';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { subjectLabel } from '@/lib/utils';
import { Flame, Target, BookOpen, TrendingUp, AlertTriangle, ArrowRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function HomePage() {
  const todayAttempts = useTodayAttempts();
  const allAttempts = useAttempts(500);
  const streak = useStreakDays();
  const subjectStats = useSubjectStats();
  const settings = useSettings();

  const todayCount = todayAttempts?.length ?? 0;
  const todayCorrect = todayAttempts?.filter((a) => a.isCorrect).length ?? 0;
  const dailyGoal = settings?.dailyGoal ?? 20;
  const weakTopics = allAttempts ? getWeakTopics(allAttempts) : [];
  const dailyProgress = allAttempts ? getDailyProgress(allAttempts, 7) : [];

  const totalQuestions = allAttempts?.length ?? 0;
  const overallAccuracy = totalQuestions > 0
    ? Math.round((allAttempts!.filter((a) => a.isCorrect).length / totalQuestions) * 100)
    : 0;

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-zinc-100">ICSE Prep</h1>
        </div>
        <p className="text-sm text-zinc-500">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/practice">
          <Card className="flex items-center gap-3 hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95">
            <div className="rounded-lg bg-indigo-600/20 p-2.5">
              <BookOpen className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">Practice</div>
              <div className="text-xs text-zinc-500">By subject</div>
            </div>
          </Card>
        </Link>
        <Link href="/mock">
          <Card className="flex items-center gap-3 hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95">
            <div className="rounded-lg bg-purple-600/20 p-2.5">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">Mock Exam</div>
              <div className="text-xs text-zinc-500">Timed test</div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{streak ?? 0}</div>
          <div className="text-[10px] text-zinc-500">Day Streak</div>
        </Card>
        <Card className="text-center py-3">
          <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{overallAccuracy}%</div>
          <div className="text-[10px] text-zinc-500">Accuracy</div>
        </Card>
        <Card className="text-center py-3">
          <BookOpen className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{totalQuestions}</div>
          <div className="text-[10px] text-zinc-500">Attempted</div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Today&apos;s Goal</h2>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-300">{todayCount} / {dailyGoal} questions</span>
            <span className="text-xs text-zinc-500">{todayCorrect} correct</span>
          </div>
          <ProgressBar
            value={todayCount}
            max={dailyGoal}
            color={todayCount >= dailyGoal ? 'bg-emerald-500' : 'bg-indigo-500'}
          />
          {todayCount >= dailyGoal && (
            <div className="text-xs text-emerald-400 mt-2 text-center">Goal reached! Keep going!</div>
          )}
        </Card>
      </div>

      {dailyProgress.length > 0 && dailyProgress.some((d) => d.total > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">This Week</h2>
          <Card>
            <div className="flex items-end gap-1 h-20">
              {dailyProgress.map((day) => {
                const maxTotal = Math.max(...dailyProgress.map((d) => d.total), 1);
                const height = day.total > 0 ? Math.max(8, (day.total / maxTotal) * 100) : 4;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '60px' }}>
                      <div
                        className="w-full rounded-sm bg-indigo-500/60"
                        style={{ height: `${height}%`, minHeight: day.total > 0 ? '4px' : '2px' }}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-600">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'narrow' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {subjectStats && Object.keys(subjectStats).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Subject Performance</h2>
          <div className="space-y-2">
            {SUBJECTS.filter((s) => subjectStats[s.id]).map((subject) => {
              const stats = subjectStats[subject.id];
              const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              const colors = SUBJECT_COLORS[subject.id];
              return (
                <Link key={subject.id} href={`/practice?subject=${subject.id}`}>
                  <Card className="flex items-center gap-3 hover:border-zinc-700 transition-colors mb-2">
                    <div className={`rounded-lg ${colors.iconBg} p-2`}>
                      <div className={`h-4 w-4 ${colors.text} text-center text-xs font-bold leading-4`}>
                        {subject.name[0]}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">{subject.name}</span>
                        <span className="text-xs text-zinc-500">{accuracy}%</span>
                      </div>
                      <ProgressBar
                        value={accuracy}
                        color={accuracy >= 70 ? 'bg-emerald-500' : accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}
                        size="sm"
                        className="mt-1"
                      />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {weakTopics.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Weak Topics</h2>
            <Link href="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {weakTopics.slice(0, 3).map((wt) => (
              <Card key={`${wt.subject}-${wt.chapter}-${wt.topic}`} className="flex items-center gap-3">
                <div className="rounded-lg bg-red-600/20 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-200">{wt.topic}</div>
                  <div className="text-xs text-zinc-500">
                    {subjectLabel(wt.subject)} &middot; {wt.accuracy}% accuracy &middot; {wt.attempts} attempts
                  </div>
                </div>
                <Link
                  href={`/practice/session?subject=${wt.subject}&chapter=${wt.chapter}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Drill
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!allAttempts || allAttempts.length === 0) && (
        <Card className="text-center py-8">
          <GraduationCap className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-zinc-300 mb-1">Ready to start preparing?</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Practice questions across all ICSE Class 10 subjects
          </p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Start practicing <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}
    </div>
  );
}
