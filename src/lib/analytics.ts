import { QuestionAttempt, Subject, TopicMastery, MasteryLevel } from '@/types';

export function calculateAccuracy(attempts: QuestionAttempt[]): number {
  if (attempts.length === 0) return 0;
  const correct = attempts.filter((a) => a.isCorrect).length;
  return Math.round((correct / attempts.length) * 100);
}

export function calculateSubjectAccuracy(attempts: QuestionAttempt[]): Record<Subject, number> {
  const grouped: Record<string, QuestionAttempt[]> = {};
  for (const a of attempts) {
    if (!grouped[a.subject]) grouped[a.subject] = [];
    grouped[a.subject].push(a);
  }
  const result: Record<string, number> = {};
  for (const [subject, subjectAttempts] of Object.entries(grouped)) {
    result[subject] = calculateAccuracy(subjectAttempts);
  }
  return result as Record<Subject, number>;
}

export function getWeakTopics(
  attempts: QuestionAttempt[],
  limit = 5
): { subject: Subject; chapter: string; topic: string; accuracy: number; attempts: number }[] {
  const topicMap: Record<string, { subject: Subject; chapter: string; topic: string; total: number; correct: number }> = {};

  for (const a of attempts) {
    const key = `${a.subject}|${a.chapter}|${a.topic}`;
    if (!topicMap[key]) {
      topicMap[key] = { subject: a.subject, chapter: a.chapter, topic: a.topic, total: 0, correct: 0 };
    }
    topicMap[key].total++;
    if (a.isCorrect) topicMap[key].correct++;
  }

  return Object.values(topicMap)
    .filter((t) => t.total >= 2)
    .map((t) => ({
      subject: t.subject,
      chapter: t.chapter,
      topic: t.topic,
      accuracy: Math.round((t.correct / t.total) * 100),
      attempts: t.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function getTimeBleedQuestions(
  attempts: QuestionAttempt[],
  limit = 5
): { questionId: string; timeSpent: number; marksTotal: number; timePerMark: number }[] {
  return attempts
    .map((a) => ({
      questionId: a.questionId,
      timeSpent: a.timeSpent,
      marksTotal: a.marksTotal,
      timePerMark: a.marksTotal > 0 ? a.timeSpent / a.marksTotal : a.timeSpent,
    }))
    .sort((a, b) => b.timePerMark - a.timePerMark)
    .slice(0, limit);
}

export function getDailyProgress(
  attempts: QuestionAttempt[],
  days = 14
): { date: string; total: number; correct: number; accuracy: number }[] {
  const now = new Date();
  const result: { date: string; total: number; correct: number; accuracy: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayAttempts = attempts.filter((a) => {
      const aDate = new Date(a.timestamp).toISOString().split('T')[0];
      return aDate === dateStr;
    });
    result.push({
      date: dateStr,
      total: dayAttempts.length,
      correct: dayAttempts.filter((a) => a.isCorrect).length,
      accuracy: calculateAccuracy(dayAttempts),
    });
  }

  return result;
}

export function computeMasteryLevel(totalAttempts: number, correctAttempts: number, streak: number): MasteryLevel {
  if (totalAttempts === 0) return 'unstarted';
  const accuracy = correctAttempts / totalAttempts;
  if (accuracy >= 0.8 && streak >= 3 && totalAttempts >= 5) return 'mastered';
  if (accuracy >= 0.5 && totalAttempts >= 3) return 'practicing';
  return 'learning';
}

export function updateTopicMastery(
  existing: TopicMastery | undefined,
  subject: Subject,
  chapter: string,
  topic: string,
  isCorrect: boolean
): TopicMastery {
  const now = Date.now();
  if (!existing) {
    return {
      id: `${subject}-${chapter}-${topic}`,
      subject,
      chapter,
      topic,
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
      lastAttempted: now,
      lastCorrect: isCorrect ? now : undefined,
      streak: isCorrect ? 1 : 0,
      masteryLevel: 'learning',
    };
  }

  const totalAttempts = existing.totalAttempts + 1;
  const correctAttempts = existing.correctAttempts + (isCorrect ? 1 : 0);
  const streak = isCorrect ? existing.streak + 1 : 0;

  return {
    ...existing,
    totalAttempts,
    correctAttempts,
    lastAttempted: now,
    lastCorrect: isCorrect ? now : existing.lastCorrect,
    streak,
    masteryLevel: computeMasteryLevel(totalAttempts, correctAttempts, streak),
  };
}
