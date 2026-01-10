import type { ComponentType } from 'react';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  exerciseId?: string;
  Component: ComponentType;
}
