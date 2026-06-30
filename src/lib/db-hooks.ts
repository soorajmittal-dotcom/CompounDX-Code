'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Subject } from '@/types';

export function useAttempts(limit?: number) {
  return useLiveQuery(
    () => db.attempts.orderBy('timestamp').reverse().limit(limit ?? 200).toArray(),
    [limit]
  );
}

export function useAttemptsBySubject(subject: Subject) {
  return useLiveQuery(
    () => db.attempts.where('subject').equals(subject).toArray(),
    [subject]
  );
}

export function useAttemptsBySession(sessionId: string) {
  return useLiveQuery(
    () => db.attempts.where('sessionId').equals(sessionId).toArray(),
    [sessionId]
  );
}

export function useTodayAttempts() {
  return useLiveQuery(async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return db.attempts.where('timestamp').aboveOrEqual(startOfDay.getTime()).toArray();
  });
}

export function useSessions(limit?: number) {
  return useLiveQuery(
    () => db.sessions.orderBy('startTime').reverse().limit(limit ?? 50).toArray(),
    [limit]
  );
}

export function useSession(id: string) {
  return useLiveQuery(() => db.sessions.get(id), [id]);
}

export function useCompletedSessions() {
  return useLiveQuery(
    () => db.sessions.where('completed').equals(1).toArray()
  );
}

export function useMastery(subject?: Subject) {
  return useLiveQuery(async () => {
    if (subject) {
      return db.mastery.where('subject').equals(subject).toArray();
    }
    return db.mastery.toArray();
  }, [subject]);
}

export function useSettings() {
  return useLiveQuery(() => db.settings.get('student-settings'));
}

export function useStreakDays() {
  return useLiveQuery(async () => {
    const attempts = await db.attempts.orderBy('timestamp').reverse().toArray();
    if (attempts.length === 0) return 0;

    const days = new Set(
      attempts.map((a) => new Date(a.timestamp).toISOString().split('T')[0])
    );
    const sortedDays = [...days].sort().reverse();

    const today = new Date().toISOString().split('T')[0];
    if (sortedDays[0] !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (sortedDays[0] !== yesterday) return 0;
    }

    let streak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff <= 1.5) streak++;
      else break;
    }
    return streak;
  });
}

export function useSubjectStats() {
  return useLiveQuery(async () => {
    const attempts = await db.attempts.toArray();
    const subjects: Record<string, { total: number; correct: number; avgTime: number }> = {};

    for (const a of attempts) {
      if (!subjects[a.subject]) {
        subjects[a.subject] = { total: 0, correct: 0, avgTime: 0 };
      }
      subjects[a.subject].total++;
      if (a.isCorrect) subjects[a.subject].correct++;
      subjects[a.subject].avgTime += a.timeSpent;
    }

    for (const s of Object.values(subjects)) {
      if (s.total > 0) s.avgTime = Math.round(s.avgTime / s.total);
    }

    return subjects;
  });
}
