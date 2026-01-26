import { describe, it, expect } from 'vitest';
import { quizzes, getQuizById, getQuizByLessonId } from '@/data/quizzes';

describe('quizzes data', () => {
  describe('quizzes array', () => {
    it('should have quizzes array', () => {
      expect(Array.isArray(quizzes)).toBe(true);
      expect(quizzes.length).toBeGreaterThan(0);
    });

    it('should have valid quiz structure', () => {
      quizzes.forEach((quiz) => {
        expect(quiz).toHaveProperty('id');
        expect(quiz).toHaveProperty('title');
        expect(quiz).toHaveProperty('description');
        expect(quiz).toHaveProperty('relatedLessonIds');
        expect(quiz).toHaveProperty('timeLimitSec');
        expect(quiz).toHaveProperty('questions');

        expect(typeof quiz.id).toBe('string');
        expect(typeof quiz.title).toBe('string');
        expect(typeof quiz.description).toBe('string');
        expect(Array.isArray(quiz.relatedLessonIds)).toBe(true);
        expect(typeof quiz.timeLimitSec).toBe('number');
        expect(Array.isArray(quiz.questions)).toBe(true);
      });
    });

    it('should have unique quiz ids', () => {
      const ids = quizzes.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have positive time limits', () => {
      quizzes.forEach((quiz) => {
        expect(quiz.timeLimitSec).toBeGreaterThan(0);
      });
    });

    it('should have at least one question per quiz', () => {
      quizzes.forEach((quiz) => {
        expect(quiz.questions.length).toBeGreaterThan(0);
      });
    });

    it('should have at least one related lesson per quiz', () => {
      quizzes.forEach((quiz) => {
        expect(quiz.relatedLessonIds.length).toBeGreaterThan(0);
      });
    });
  });

  describe('question validation', () => {
    it('should have valid question structure', () => {
      quizzes.forEach((quiz) => {
        quiz.questions.forEach((question) => {
          expect(question).toHaveProperty('id');
          expect(question).toHaveProperty('question');
          expect(question).toHaveProperty('options');
          expect(question).toHaveProperty('correctIndex');
          expect(question).toHaveProperty('explanation');
          expect(question).toHaveProperty('hint');
          expect(question).toHaveProperty('tags');

          expect(typeof question.id).toBe('string');
          expect(typeof question.question).toBe('string');
          expect(Array.isArray(question.options)).toBe(true);
          expect(typeof question.correctIndex).toBe('number');
          expect(typeof question.explanation).toBe('string');
          expect(typeof question.hint).toBe('string');
          expect(Array.isArray(question.tags)).toBe(true);
        });
      });
    });

    it('should have unique question ids within each quiz', () => {
      quizzes.forEach((quiz) => {
        const questionIds = quiz.questions.map((q) => q.id);
        const uniqueIds = new Set(questionIds);
        expect(questionIds.length).toBe(uniqueIds.size);
      });
    });

    it('should have at least 2 options per question', () => {
      quizzes.forEach((quiz) => {
        quiz.questions.forEach((question) => {
          expect(question.options.length).toBeGreaterThanOrEqual(2);
        });
      });
    });

    it('should have valid correctIndex values', () => {
      quizzes.forEach((quiz) => {
        quiz.questions.forEach((question) => {
          expect(question.correctIndex).toBeGreaterThanOrEqual(0);
          expect(question.correctIndex).toBeLessThan(question.options.length);
        });
      });
    });

    it('should have non-empty explanations', () => {
      quizzes.forEach((quiz) => {
        quiz.questions.forEach((question) => {
          expect(question.explanation.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have non-empty hints', () => {
      quizzes.forEach((quiz) => {
        quiz.questions.forEach((question) => {
          expect(question.hint.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have at least one tag per question', () => {
      quizzes.forEach((quiz) => {
        quiz.questions.forEach((question) => {
          expect(question.tags.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getQuizById', () => {
    it('should return quiz by id', () => {
      const quiz = getQuizById('react-basics-quiz');
      expect(quiz).toBeDefined();
      expect(quiz?.id).toBe('react-basics-quiz');
    });

    it('should return undefined for non-existent id', () => {
      const quiz = getQuizById('non-existent');
      expect(quiz).toBeUndefined();
    });

    it('should return correct quiz for all existing ids', () => {
      quizzes.forEach((quiz) => {
        const found = getQuizById(quiz.id);
        expect(found).toBe(quiz);
      });
    });
  });

  describe('getQuizByLessonId', () => {
    it('should return quiz for a valid lesson id', () => {
      const quiz = getQuizByLessonId('react-basics');
      expect(quiz).toBeDefined();
      expect(quiz?.relatedLessonIds).toContain('react-basics');
    });

    it('should return undefined for non-existent lesson id', () => {
      const quiz = getQuizByLessonId('non-existent-lesson');
      expect(quiz).toBeUndefined();
    });

    it('should return first matching quiz when multiple quizzes relate to same lesson', () => {
      // Find a lesson that might be in multiple quizzes
      const allRelatedLessons = quizzes.flatMap((q) => q.relatedLessonIds);
      const lessonCounts = allRelatedLessons.reduce(
        (acc, lessonId) => {
          acc[lessonId] = (acc[lessonId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // If there's a lesson with multiple quizzes, test it
      const duplicateLesson = Object.keys(lessonCounts).find((id) => lessonCounts[id] > 1);
      if (duplicateLesson) {
        const quiz = getQuizByLessonId(duplicateLesson);
        expect(quiz).toBeDefined();
        expect(quiz?.relatedLessonIds).toContain(duplicateLesson);
      }
    });

    it('should return correct quiz for all related lesson ids', () => {
      quizzes.forEach((quiz) => {
        quiz.relatedLessonIds.forEach((lessonId) => {
          const found = getQuizByLessonId(lessonId);
          expect(found).toBeDefined();
          expect(found?.relatedLessonIds).toContain(lessonId);
        });
      });
    });
  });

  describe('specific quizzes', () => {
    it('should have react-basics-quiz', () => {
      const quiz = getQuizById('react-basics-quiz');
      expect(quiz).toBeDefined();
      expect(quiz?.title).toBe('React基礎クイズ');
      expect(quiz?.questions.length).toBeGreaterThan(0);
    });

    it('should have hooks-quiz', () => {
      const quiz = getQuizById('hooks-quiz');
      expect(quiz).toBeDefined();
      expect(quiz?.title).toBe('React Hooksクイズ');
      expect(quiz?.questions.length).toBeGreaterThan(0);
    });
  });

  describe('data consistency', () => {
    it('should have consistent data across all quizzes', () => {
      quizzes.forEach((quiz) => {
        // Title should not be empty
        expect(quiz.title.trim().length).toBeGreaterThan(0);

        // Description should not be empty
        expect(quiz.description.trim().length).toBeGreaterThan(0);

        // All options should be non-empty strings
        quiz.questions.forEach((question) => {
          question.options.forEach((option) => {
            expect(typeof option).toBe('string');
            expect(option.trim().length).toBeGreaterThan(0);
          });

          // Tags should be non-empty strings
          question.tags.forEach((tag) => {
            expect(typeof tag).toBe('string');
            expect(tag.trim().length).toBeGreaterThan(0);
          });
        });
      });
    });

    it('should have reasonable time limits (between 30s and 30min)', () => {
      quizzes.forEach((quiz) => {
        expect(quiz.timeLimitSec).toBeGreaterThanOrEqual(30);
        expect(quiz.timeLimitSec).toBeLessThanOrEqual(1800); // 30 minutes
      });
    });

    it('should have reasonable number of questions (1-50)', () => {
      quizzes.forEach((quiz) => {
        expect(quiz.questions.length).toBeGreaterThanOrEqual(1);
        expect(quiz.questions.length).toBeLessThanOrEqual(50);
      });
    });
  });
});
