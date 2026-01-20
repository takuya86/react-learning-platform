import { describe, it, expect } from 'vitest';
import { exercises, getExerciseById } from '@/data/exercises';

describe('exercises data', () => {
  describe('exercises array', () => {
    it('should have exercises array', () => {
      expect(Array.isArray(exercises)).toBe(true);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('should have valid exercise structure', () => {
      exercises.forEach((exercise) => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('title');
        expect(exercise).toHaveProperty('description');
        expect(exercise).toHaveProperty('instructions');
        expect(exercise).toHaveProperty('fields');

        expect(typeof exercise.id).toBe('string');
        expect(typeof exercise.title).toBe('string');
        expect(typeof exercise.description).toBe('string');
        expect(typeof exercise.instructions).toBe('string');
        expect(Array.isArray(exercise.fields)).toBe(true);
      });
    });

    it('should have unique exercise ids', () => {
      const ids = exercises.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have valid field structure in each exercise', () => {
      exercises.forEach((exercise) => {
        exercise.fields.forEach((field) => {
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('label');
          expect(field).toHaveProperty('type');
          expect(field).toHaveProperty('required');

          expect(typeof field.name).toBe('string');
          expect(typeof field.label).toBe('string');
          expect(typeof field.type).toBe('string');
          expect(typeof field.required).toBe('boolean');

          // Validate field types
          expect(['text', 'textarea', 'checkbox']).toContain(field.type);
        });
      });
    });

    it('should have at least one field per exercise', () => {
      exercises.forEach((exercise) => {
        expect(exercise.fields.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getExerciseById', () => {
    it('should return exercise by id', () => {
      const exercise = getExerciseById('jsx-basics');
      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe('jsx-basics');
    });

    it('should return undefined for non-existent id', () => {
      const exercise = getExerciseById('non-existent');
      expect(exercise).toBeUndefined();
    });

    it('should return correct exercise for all existing ids', () => {
      exercises.forEach((exercise) => {
        const found = getExerciseById(exercise.id);
        expect(found).toBe(exercise);
      });
    });
  });

  describe('specific exercises', () => {
    it('should have jsx-basics exercise', () => {
      const exercise = getExerciseById('jsx-basics');
      expect(exercise).toBeDefined();
      expect(exercise?.title).toBe('JSXの基本練習');
      expect(exercise?.fields.length).toBeGreaterThan(0);
    });

    it('should have counter-exercise exercise', () => {
      const exercise = getExerciseById('counter-exercise');
      expect(exercise).toBeDefined();
      expect(exercise?.title).toBe('カウンター実装練習');
      expect(exercise?.fields.length).toBeGreaterThan(0);
    });

    it('should have form-exercise exercise', () => {
      const exercise = getExerciseById('form-exercise');
      expect(exercise).toBeDefined();
      expect(exercise?.title).toBe('フォームバリデーション練習');
      expect(exercise?.fields.length).toBeGreaterThan(0);
    });
  });

  describe('field validation', () => {
    it('should have required fields marked correctly', () => {
      exercises.forEach((exercise) => {
        const hasRequiredField = exercise.fields.some((field) => field.required === true);
        const hasOptionalField = exercise.fields.some((field) => field.required === false);

        // At least one of required or optional should exist (basic sanity check)
        expect(hasRequiredField || hasOptionalField).toBe(true);
      });
    });

    it('should have placeholders for text fields', () => {
      exercises.forEach((exercise) => {
        exercise.fields.forEach((field) => {
          if (field.type === 'text' || field.type === 'textarea') {
            // Placeholder is optional but recommended for text fields
            expect(['string', 'undefined']).toContain(typeof field.placeholder);
          }
        });
      });
    });

    it('should have unique field names within each exercise', () => {
      exercises.forEach((exercise) => {
        const fieldNames = exercise.fields.map((f) => f.name);
        const uniqueNames = new Set(fieldNames);
        expect(fieldNames.length).toBe(uniqueNames.size);
      });
    });
  });
});
