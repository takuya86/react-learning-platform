declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export interface LessonFrontmatter {
    title: string;
    slug: string;
    description: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes: number;
    exerciseId?: string;
    prerequisites?: string[];
    relatedQuizzes?: string[];
  }

  export const frontmatter: LessonFrontmatter;
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
