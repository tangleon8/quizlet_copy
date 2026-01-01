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

export type AppView = 'home' | 'create' | 'edit' | 'import' | 'flashcards' | 'learn' | 'quiz' | 'match';
