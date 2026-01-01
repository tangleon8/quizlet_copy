export interface Question {
  id: string;
  questionText: string;
  correctAnswer: string;
}

export interface StudySet {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

// Progress tracking for study sessions
export interface QuestionProgress {
  questionId: string;
  correct: boolean;
  attempts: number;
  lastAttempt: number;
}

export interface StudyProgress {
  setId: string;
  mode: 'learn' | 'quiz';
  currentIndex: number;
  questionProgress: QuestionProgress[];
  startedAt: number;
  lastUpdated: number;
  completed: boolean;
}

export type AppView = 'home' | 'create' | 'edit' | 'import' | 'flashcards' | 'learn' | 'quiz' | 'match' | 'view' | 'games' | 'settings';
