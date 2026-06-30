'use client';

import { useAttempts, useMastery, useSubjectStats } from '@/lib/db-hooks';
import { getWeakTopics, getDailyProgress, calculateAccuracy, getTimeBleedQuestions } from '@/lib/analytics';
import { getQuestionById } from '@/lib/questions';
import { SUBJECTS, SUBJECT_COLORS } from '@/lib/subjects';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn, subjectLabel, formatDuration } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsPage() {
  const allAttempts = useAttempts(1000);
  const allMastery = useMastery();
  const subjectStats = useSubjectStats();

  const weakTopics = allAttempts ? getWeakTopics(allAttempts, 10) : [];
  const dailyProgress = allAttempts ? getDailyProgress(allAttempts, 14) : [];
  const timeBleed = allAttempts ? getTimeBleedQuestions(allAttempts) : [];
  const overallAccuracy = allAttempts ? calculateAccuracy(allAttempts) : 0;

  const masteryBreakdown = {
    mastered: allMastery?.filter((m) => m.masteryLevel === 'mastered').length ?? 0,
    practicing: allMastery?.filter((m) => m.masteryLevel === 'practicing').length ?? 0,
    learning: allMastery?.filter((m) => m.masteryLevel === 'learning').length ?? 0,
    unstarted: allMastery?.filter((m) => m.masteryLevel === 'unstarted').length ?? 0,
  };

  if (!allAttempts || allAttempts.length === 0) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-zinc-100 mb-4">Analytics</h1>
        <Card className="text-center py-8">
          <TrendingUp className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">No data yet. Start practicing to see your analytics.</p>
          <Link href="/practice" className="text-sm text-indigo-400 mt-2 inline-block">
            Start practicing
          </Link>
        </Card>
      </div>
    );
  }

  const chartData = dailyProgress.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en', { day: 'numeric', month: 'short' }),
    Correct: d.correct,
    Wrong: d.total - d.correct,
  }));

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-zinc-100">Analytics</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{overallAccuracy}%</div>
          <div className="text-[10px] text-zinc-500">Accuracy</div>
        </Card>
        <Card className="text-center py-3">
          <BookOpen className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">{allAttempts.length}</div>
          <div className="text-[10px] text-zinc-500">Questions</div>
        </Card>
        <Card className="text-center py-3">
          <Clock className="h-5 w-5 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-zinc-100">
            {formatDuration(allAttempts.reduce((s, a) => s + a.timeSpent, 0))}
          </div>
          <div className="text-[10px] text-zinc-500">Total Time</div>
        </Card>
      </div>

      {chartData.some((d) => d.Correct + d.Wrong > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Daily Activity</h2>
          <Card>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Bar dataKey="Correct" fill="#22c55e" radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="Wrong" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {subjectStats && Object.keys(subjectStats).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">By Subject</h2>
          <div className="space-y-2">
            {SUBJECTS.filter((s) => subjectStats[s.id]).map((subject) => {
              const stats = subjectStats[subject.id];
              const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              const colors = SUBJECT_COLORS[subject.id];
              return (
                <Card key={subject.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-sm font-medium', colors.text)}>{subject.name}</span>
                    <span className="text-xs text-zinc-500">
                      {stats.correct}/{stats.total} &middot; {accuracy}%
                    </span>
                  </div>
                  <ProgressBar
                    value={accuracy}
                    color={accuracy >= 70 ? 'bg-emerald-500' : accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}
                    size="sm"
                  />
                  <div className="text-[10px] text-zinc-600 mt-1">
                    Avg time: {stats.avgTime}s/question
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {allMastery && allMastery.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mastery Overview</h2>
          <Card>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-emerald-400">{masteryBreakdown.mastered}</div>
                <div className="text-[10px] text-zinc-500">Mastered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-indigo-400">{masteryBreakdown.practicing}</div>
                <div className="text-[10px] text-zinc-500">Practicing</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-400">{masteryBreakdown.learning}</div>
                <div className="text-[10px] text-zinc-500">Learning</div>
              </div>
              <div>
                <div className="text-lg font-bold text-zinc-500">{masteryBreakdown.unstarted}</div>
                <div className="text-[10px] text-zinc-500">Unstarted</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {weakTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Weak Topics (Needs Drill)
          </h2>
          <div className="space-y-2">
            {weakTopics.map((wt) => (
              <Card key={`${wt.subject}-${wt.chapter}-${wt.topic}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{wt.topic}</div>
                      <div className="text-xs text-zinc-500">
                        {subjectLabel(wt.subject)} &middot; {wt.attempts} attempts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-sm font-bold',
                      wt.accuracy >= 50 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {wt.accuracy}%
                    </div>
                    <Link
                      href={`/practice/session?subject=${wt.subject}&chapter=${wt.chapter}`}
                      className="text-[10px] text-indigo-400"
                    >
                      Drill →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {timeBleed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Time Bleed Analysis
          </h2>
          <Card className="bg-amber-950/10 border-amber-500/20">
            <div className="text-xs text-amber-300/80 mb-2">
              Questions where you spent more than 3 min per mark:
            </div>
            {timeBleed.slice(0, 5).map((tb, i) => {
              const q = getQuestionById(tb.questionId);
              return (
                <div key={i} className="text-xs text-zinc-400 py-1.5 border-t border-zinc-800 first:border-0 flex justify-between">
                  <span className="text-zinc-300">{q?.topic ?? 'Unknown'}</span>
                  <span className="text-amber-400">{Math.round(tb.timePerMark)}s/mark</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
