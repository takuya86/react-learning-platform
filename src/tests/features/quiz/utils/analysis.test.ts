import { describe, it, expect } from 'vitest';
import {
  calculateTagStats,
  getWeakAreas,
  findRelatedLessons,
  calculateScore,
  getAllTagsFromQuestions,
} from '@/features/quiz/utils/analysis';
import type { QuestionResult, QuizQuestion, Lesson } from '@/domain/types';

describe('analysis', () => {
  const mockQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      question: 'What is React?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'React is a library',
      tags: ['react', 'basics'],
    },
    {
      id: 'q2',
      question: 'What is useState?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 1,
      explanation: 'useState is a hook',
      tags: ['react', 'hooks'],
    },
    {
      id: 'q3',
      question: 'What is useEffect?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 2,
      explanation: 'useEffect handles side effects',
      tags: ['react', 'hooks', 'lifecycle'],
    },
    {
      id: 'q4',
      question: 'What is JSX?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'JSX is syntax extension',
      tags: ['react', 'jsx'],
    },
  ];

  const mockLessons: Lesson[] = [
    {
      id: 'lesson-1',
      title: 'React Basics',
      description: 'Learn React basics',
      tags: ['react', 'basics'],
      difficulty: 'beginner',
      estimatedMinutes: 15,
      content: 'Content',
    },
    {
      id: 'lesson-2',
      title: 'React Hooks',
      description: 'Learn React hooks',
      tags: ['react', 'hooks'],
      difficulty: 'intermediate',
      estimatedMinutes: 20,
      content: 'Content',
    },
    {
      id: 'lesson-3',
      title: 'Lifecycle',
      description: 'Learn lifecycle',
      tags: ['lifecycle', 'useEffect'],
      difficulty: 'intermediate',
      estimatedMinutes: 25,
      content: 'Content',
    },
  ];

  describe('calculateTagStats', () => {
    it('should calculate correct stats when all answers are correct', () => {
      const results: QuestionResult[] = [
        { questionId: 'q1', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q2', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 1 },
        { questionId: 'q3', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 2 },
        { questionId: 'q4', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
      ];

      const stats = calculateTagStats(results, mockQuestions);
      const reactStats = stats.find((s) => s.tag === 'react');

      expect(reactStats).toBeDefined();
      expect(reactStats!.correct).toBe(4);
      expect(reactStats!.wrong).toBe(0);
      expect(reactStats!.wrongRate).toBe(0);
    });

    it('should calculate correct stats when some answers are wrong', () => {
      const results: QuestionResult[] = [
        { questionId: 'q1', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q2', isCorrect: false, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q3', isCorrect: false, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q4', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
      ];

      const stats = calculateTagStats(results, mockQuestions);
      const hooksStats = stats.find((s) => s.tag === 'hooks');

      expect(hooksStats).toBeDefined();
      expect(hooksStats!.correct).toBe(0);
      expect(hooksStats!.wrong).toBe(2);
      expect(hooksStats!.wrongRate).toBe(1);
    });

    it('should treat skipped questions as wrong', () => {
      const results: QuestionResult[] = [
        { questionId: 'q1', isCorrect: false, isSkipped: true, hintUsed: false, selectedChoiceIndex: null },
        { questionId: 'q2', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 1 },
      ];

      const stats = calculateTagStats(results, mockQuestions);
      const basicsStats = stats.find((s) => s.tag === 'basics');

      expect(basicsStats).toBeDefined();
      expect(basicsStats!.wrong).toBe(1);
      expect(basicsStats!.correct).toBe(0);
    });
  });

  describe('getWeakAreas', () => {
    it('should return top N weak areas sorted by wrong rate', () => {
      const results: QuestionResult[] = [
        { questionId: 'q1', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q2', isCorrect: false, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q3', isCorrect: false, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q4', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
      ];

      const weakAreas = getWeakAreas(results, mockQuestions, 2);

      expect(weakAreas.length).toBeLessThanOrEqual(2);
      expect(weakAreas[0].wrongRate).toBeGreaterThanOrEqual(weakAreas[1]?.wrongRate ?? 0);
    });

    it('should only include areas with wrong answers', () => {
      const results: QuestionResult[] = [
        { questionId: 'q1', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q2', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 1 },
      ];

      const weakAreas = getWeakAreas(results, mockQuestions, 3);

      expect(weakAreas.length).toBe(0);
    });

    it('should return empty array when all correct', () => {
      const results: QuestionResult[] = [
        { questionId: 'q1', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
        { questionId: 'q2', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 1 },
        { questionId: 'q3', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 2 },
        { questionId: 'q4', isCorrect: true, isSkipped: false, hintUsed: false, selectedChoiceIndex: 0 },
      ];

      const weakAreas = getWeakAreas(results, mockQuestions);

      expect(weakAreas).toEqual([]);
    });
  });

  describe('findRelatedLessons', () => {
    it('should find lessons matching given tags', () => {
      const relatedLessons = findRelatedLessons(['hooks'], mockLessons);

      expect(relatedLessons.length).toBeGreaterThan(0);
      expect(relatedLessons.some((l) => l.tags.includes('hooks'))).toBe(true);
    });

    it('should prioritize lessons with more matching tags', () => {
      const relatedLessons = findRelatedLessons(['react', 'hooks'], mockLessons, 3);

      expect(relatedLessons[0].id).toBe('lesson-2');
    });

    it('should return empty array when no tags match', () => {
      const relatedLessons = findRelatedLessons(['nonexistent'], mockLessons);

      expect(relatedLessons).toEqual([]);
    });

    it('should return empty array for empty tags', () => {
      const relatedLessons = findRelatedLessons([], mockLessons);

      expect(relatedLessons).toEqual([]);
    });

    it('should limit results to maxCount', () => {
      const relatedLessons = findRelatedLessons(['react'], mockLessons, 1);

      expect(relatedLessons.length).toBe(1);
    });
  });

  describe('calculateScore', () => {
    it('should calculate correct score', () => {
      const answers: Record<string, number | null> = {
        q1: 0,
        q2: 1,
        q3: 0,
        q4: 0,
      };

      const { correct, total, percentage } = calculateScore(answers, mockQuestions);

      expect(correct).toBe(3);
      expect(total).toBe(4);
      expect(percentage).toBe(75);
    });

    it('should handle all correct answers', () => {
      const answers: Record<string, number | null> = {
        q1: 0,
        q2: 1,
        q3: 2,
        q4: 0,
      };

      const result = calculateScore(answers, mockQuestions);

      expect(result.correct).toBe(4);
      expect(result.percentage).toBe(100);
    });

    it('should handle all wrong answers', () => {
      const answers: Record<string, number | null> = {
        q1: 3,
        q2: 3,
        q3: 3,
        q4: 3,
      };

      const result = calculateScore(answers, mockQuestions);

      expect(result.correct).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle null answers as wrong', () => {
      const answers: Record<string, number | null> = {
        q1: null,
        q2: 1,
      };

      const { correct } = calculateScore(answers, mockQuestions);

      expect(correct).toBe(1);
    });
  });

  describe('getAllTagsFromQuestions', () => {
    it('should extract all unique tags', () => {
      const tags = getAllTagsFromQuestions(mockQuestions);

      expect(tags).toContain('react');
      expect(tags).toContain('hooks');
      expect(tags).toContain('basics');
      expect(tags).toContain('lifecycle');
      expect(tags).toContain('jsx');
      expect(new Set(tags).size).toBe(tags.length);
    });

    it('should return empty array for questions without tags', () => {
      const questionsWithoutTags: QuizQuestion[] = [
        {
          id: 'q1',
          question: 'Test',
          options: ['A', 'B'],
          correctIndex: 0,
          explanation: 'Test',
        },
      ];

      const tags = getAllTagsFromQuestions(questionsWithoutTags);

      expect(tags).toEqual([]);
    });
  });
});
