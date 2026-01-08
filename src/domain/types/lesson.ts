export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown content
  tags: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  exerciseId?: string;
}
