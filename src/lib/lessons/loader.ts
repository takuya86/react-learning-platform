import { lazy } from 'react';
import type { MDXLessonModule, LoadedLesson, LessonFrontmatter } from './types';
import lessonMetadataJson from '@/content/lessons/metadata.json';

// Type for metadata from JSON (includes path)
interface LessonMetadataWithPath extends LessonFrontmatter {
  path: string;
}

// Typed metadata from JSON file
const lessonMetadata = lessonMetadataJson as LessonMetadataWithPath[];

// Vite's glob import for components only - lazy load on demand
// Since we're only using dynamic import (no eager), Vite will properly split chunks
const lessonComponents = import.meta.glob<MDXLessonModule>('/src/content/lessons/*.mdx');

// Transform metadata into LoadedLesson array with lazy components
function loadLessons(): LoadedLesson[] {
  return lessonMetadata.map((metadata) => {
    const { path, ...frontmatter } = metadata;

    // Create lazy component for this lesson
    const Component = lazy(async () => {
      const loader = lessonComponents[path];
      if (!loader) {
        throw new Error(`Lesson component not found: ${path}`);
      }
      const module = await loader();
      return { default: module.default };
    });

    return {
      id: frontmatter.slug,
      title: frontmatter.title,
      description: frontmatter.description,
      tags: frontmatter.tags,
      difficulty: frontmatter.difficulty,
      estimatedMinutes: frontmatter.estimatedMinutes,
      exerciseId: frontmatter.exerciseId,
      prerequisites: frontmatter.prerequisites ?? [],
      relatedQuizzes: frontmatter.relatedQuizzes ?? [],
      Component,
    };
  });
}

// Cached lessons array
let cachedLessons: LoadedLesson[] | null = null;

export function getAllLessons(): LoadedLesson[] {
  if (!cachedLessons) {
    cachedLessons = loadLessons();
  }
  return cachedLessons;
}

export function getLessonById(id: string): LoadedLesson | undefined {
  return getAllLessons().find((lesson) => lesson.id === id);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllLessons().forEach((lesson) => {
    lesson.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get lessons that should be read after the current lesson.
 * Finds lessons that have the current slug in their prerequisites.
 * @param currentSlug - The current lesson's slug
 * @param limit - Maximum number of lessons to return (default: 3)
 */
export function getNextLessons(currentSlug: string, limit: number = 3): LoadedLesson[] {
  return getAllLessons()
    .filter((lesson) => lesson.prerequisites.includes(currentSlug))
    .slice(0, limit);
}

/**
 * Get prerequisite lessons for a given lesson.
 * @param lessonId - The lesson's ID/slug
 */
export function getPrerequisiteLessons(lessonId: string): LoadedLesson[] {
  const lesson = getLessonById(lessonId);
  if (!lesson) return [];

  return lesson.prerequisites
    .map((prereqId) => getLessonById(prereqId))
    .filter((l): l is LoadedLesson => l !== undefined);
}

/**
 * Check if a lesson is unlocked (all prerequisites are completed).
 * @param lessonId - The lesson's ID/slug
 * @param completedLessonIds - Set of completed lesson IDs
 */
export function isLessonUnlocked(lessonId: string, completedLessonIds: Set<string>): boolean {
  const lesson = getLessonById(lessonId);
  if (!lesson) return false;

  // No prerequisites = always unlocked
  if (lesson.prerequisites.length === 0) return true;

  // All prerequisites must be completed
  return lesson.prerequisites.every((prereqId) => completedLessonIds.has(prereqId));
}

/**
 * Get incomplete prerequisites for a lesson.
 * @param lessonId - The lesson's ID/slug
 * @param completedLessonIds - Set of completed lesson IDs
 */
export function getIncompletePrerequisites(
  lessonId: string,
  completedLessonIds: Set<string>
): LoadedLesson[] {
  const lesson = getLessonById(lessonId);
  if (!lesson) return [];

  return lesson.prerequisites
    .filter((prereqId) => !completedLessonIds.has(prereqId))
    .map((prereqId) => getLessonById(prereqId))
    .filter((l): l is LoadedLesson => l !== undefined);
}
