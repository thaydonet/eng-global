export interface Lesson {
  id: string;
  title: string;
  chapter: number;
  description: string;
  content: {
    theory: string[];
    examples: Example[];
    formulas: Formula[];
  };
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Example {
  title: string;
  problem: string;
  solution: string;
  steps?: string[];
}

export interface Formula {
  name: string;
  latex: string;
  description: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  tags: string[];
  imageUrl?: string;
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  lastAccessed: string;
}
