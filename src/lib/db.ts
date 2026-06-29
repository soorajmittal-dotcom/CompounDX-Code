import Dexie, { type EntityTable } from 'dexie';
import { QuestionAttempt, PracticeSession, TopicMastery, StudentSettings } from '@/types';

const db = new Dexie('ICSEPrep') as Dexie & {
  attempts: EntityTable<QuestionAttempt, 'id'>;
  sessions: EntityTable<PracticeSession, 'id'>;
  mastery: EntityTable<TopicMastery, 'id'>;
  settings: EntityTable<StudentSettings, 'id'>;
};

db.version(1).stores({
  attempts: 'id, questionId, subject, chapter, topic, sessionId, timestamp',
  sessions: 'id, subject, mode, startTime, completed',
  mastery: 'id, subject, chapter, topic, masteryLevel, lastAttempted',
  settings: 'id',
});

db.on('populate', (tx) => {
  (tx as unknown as { settings: EntityTable<StudentSettings, 'id'> }).settings.add({
    id: 'student-settings',
    dailyGoal: 20,
    subjects: ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'history'],
  });
});

export { db };
