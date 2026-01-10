import type { ComponentType } from 'react';
import type { Difficulty } from '@/domain/types';

export interface LessonFrontmatter {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  exerciseId?: string;
  prerequisites?: string[];
  relatedQuizzes?: string[];
}

export interface MDXLessonModule {
  default: ComponentType;
  frontmatter: LessonFrontmatter;
}

export interface LoadedLesson {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  exerciseId?: string;
  prerequisites: string[];
  relatedQuizzes: string[];
  Component: ComponentType;
}
