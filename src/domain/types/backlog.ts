import type { Difficulty } from './lesson';

export type BacklogStatus = 'pending' | 'generated' | 'published';

export interface BacklogEntry {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  status: BacklogStatus;
  generatedAt: string | null;
  publishedAt?: string | null;
  prerequisites: string[];
  relatedQuizzes: string[];
}

export interface BacklogData {
  version: number;
  lessons: BacklogEntry[];
}
