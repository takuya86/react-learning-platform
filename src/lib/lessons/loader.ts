import type { MDXLessonModule, LoadedLesson } from './types';

// Vite's glob import - imports all MDX files eagerly
const lessonModules = import.meta.glob<MDXLessonModule>('/src/content/lessons/*.mdx', {
  eager: true,
});

// Transform modules into LoadedLesson array
function loadLessons(): LoadedLesson[] {
  return Object.entries(lessonModules).map(([, module]) => {
    const { frontmatter, default: Component } = module;

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
