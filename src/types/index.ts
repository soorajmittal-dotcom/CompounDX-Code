export type Subject = 'mathematics' | 'physics' | 'chemistry' | 'biology' | 'english' | 'history';

export type QuestionType = 'mcq' | 'short_answer' | 'numerical' | 'long_answer';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type MasteryLevel = 'unstarted' | 'learning' | 'practicing' | 'mastered';

export interface Question {
  id: string;
  subject: Subject;
  chapter: string;
  topic: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  commonErrors?: string[];
  markScheme?: string;
  year?: number;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  subject: Subject;
  chapter: string;
  topic: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  marksScored: number;
  marksTotal: number;
  timestamp: number;
  sessionId?: string;
}

export interface PracticeSession {
  id: string;
  subject: Subject;
  chapter?: string;
  mode: 'practice' | 'drill' | 'mock';
  startTime: number;
  endTime?: number;
  totalQuestions: number;
  correctAnswers: number;
  totalMarks: number;
  scoredMarks: number;
  timeLimit?: number;
  completed: boolean;
}

export interface TopicMastery {
  id: string;
  subject: Subject;
  chapter: string;
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  lastAttempted: number;
  lastCorrect?: number;
  streak: number;
  masteryLevel: MasteryLevel;
}

export interface StudentSettings {
  id: string;
  name?: string;
  targetScore?: number;
  examDate?: string;
  dailyGoal: number;
  subjects: Subject[];
}

export interface SubjectInfo {
  id: Subject;
  name: string;
  icon: string;
  color: string;
  chapters: ChapterInfo[];
}

export interface ChapterInfo {
  id: string;
  name: string;
  topics: string[];
}
