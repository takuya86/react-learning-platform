import type { QuestionResult, QuizQuestion, Lesson } from '@/domain/types';

export interface TagStats {
  tag: string;
  correct: number;
  wrong: number;
  total: number;
  wrongRate: number;
}

export interface WeakArea {
  tag: string;
  wrongRate: number;
  wrongCount: number;
  totalCount: number;
}

export function calculateTagStats(
  perQuestion: QuestionResult[],
  questions: QuizQuestion[]
): TagStats[] {
  const tagMap = new Map<string, { correct: number; wrong: number }>();

  perQuestion.forEach((result) => {
    const question = questions.find((q) => q.id === result.questionId);
    if (!question) return;

    const tags = question.tags || [];
    tags.forEach((tag) => {
      const current = tagMap.get(tag) || { correct: 0, wrong: 0 };
      if (result.isSkipped || !result.isCorrect) {
        current.wrong++;
      } else {
        current.correct++;
      }
      tagMap.set(tag, current);
    });
  });

  const stats: TagStats[] = [];
  tagMap.forEach((value, tag) => {
    const total = value.correct + value.wrong;
    stats.push({
      tag,
      correct: value.correct,
      wrong: value.wrong,
      total,
      wrongRate: total > 0 ? value.wrong / total : 0,
    });
  });

  return stats;
}

export function getWeakAreas(
  perQuestion: QuestionResult[],
  questions: QuizQuestion[],
  topN: number = 3
): WeakArea[] {
  const stats = calculateTagStats(perQuestion, questions);

  return stats
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrongRate - a.wrongRate || b.wrong - a.wrong)
    .slice(0, topN)
    .map((s) => ({
      tag: s.tag,
      wrongRate: s.wrongRate,
      wrongCount: s.wrong,
      totalCount: s.total,
    }));
}

export function findRelatedLessons(
  questionTags: string[],
  lessons: Lesson[],
  maxCount: number = 3
): Lesson[] {
  if (questionTags.length === 0) {
    return [];
  }

  const tagSet = new Set(questionTags);

  const lessonsWithScore = lessons
    .map((lesson) => {
      const matchingTags = lesson.tags.filter((tag) => tagSet.has(tag));
      return {
        lesson,
        score: matchingTags.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return lessonsWithScore.slice(0, maxCount).map((item) => item.lesson);
}

export function getAllTagsFromQuestions(questions: QuizQuestion[]): string[] {
  const tags = new Set<string>();
  questions.forEach((q) => {
    (q.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags);
}

export function calculateScore(
  answers: Record<string, number | null>,
  questions: QuizQuestion[]
): { correct: number; total: number; percentage: number } {
  let correct = 0;
  questions.forEach((q) => {
    if (answers[q.id] === q.correctIndex) {
      correct++;
    }
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, total, percentage };
}
