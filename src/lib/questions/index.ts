import { Question, Subject } from '@/types';
import { mathematicsQuestions } from './mathematics';
import { physicsQuestions } from './physics';
import { chemistryQuestions } from './chemistry';
import { biologyQuestions } from './biology';
import { englishQuestions } from './english';
import { historyQuestions } from './history';

export const ALL_QUESTIONS: Question[] = [
  ...mathematicsQuestions,
  ...physicsQuestions,
  ...chemistryQuestions,
  ...biologyQuestions,
  ...englishQuestions,
  ...historyQuestions,
];

export function getQuestionsBySubject(subject: Subject): Question[] {
  return ALL_QUESTIONS.filter((q) => q.subject === subject);
}

export function getQuestionsByChapter(subject: Subject, chapter: string): Question[] {
  return ALL_QUESTIONS.filter((q) => q.subject === subject && q.chapter === chapter);
}

export function getQuestionsByTopic(subject: Subject, chapter: string, topic: string): Question[] {
  return ALL_QUESTIONS.filter((q) => q.subject === subject && q.chapter === chapter && q.topic === topic);
}

export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function getWeakQuestions(
  attempts: { questionId: string; isCorrect: boolean }[],
  subject?: Subject,
  limit = 10
): Question[] {
  const failedIds = new Set(
    attempts.filter((a) => !a.isCorrect).map((a) => a.questionId)
  );
  const passedIds = new Set(
    attempts.filter((a) => a.isCorrect).map((a) => a.questionId)
  );

  const weakIds = [...failedIds].filter((id) => !passedIds.has(id));

  let questions = ALL_QUESTIONS.filter((q) => weakIds.includes(q.id));
  if (subject) questions = questions.filter((q) => q.subject === subject);
  return questions.slice(0, limit);
}

export function getUnattemptedQuestions(
  attemptedIds: Set<string>,
  subject?: Subject,
  chapter?: string,
  limit = 10
): Question[] {
  let questions = ALL_QUESTIONS.filter((q) => !attemptedIds.has(q.id));
  if (subject) questions = questions.filter((q) => q.subject === subject);
  if (chapter) questions = questions.filter((q) => q.chapter === chapter);
  return questions.slice(0, limit);
}

export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
