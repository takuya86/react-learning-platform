import type { ComponentType, LazyExoticComponent } from 'react';
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
  /** Lazy-loaded MDX component - wrap with Suspense when rendering */
  Component: LazyExoticComponent<ComponentType>;
}
