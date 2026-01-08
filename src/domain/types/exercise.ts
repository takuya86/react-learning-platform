import type { z } from 'zod';

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox';

export interface ExerciseField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[]; // for select type
  required?: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string; // Markdown content
  fields: ExerciseField[];
  // Using any for Zod schema since exact schema varies
  // In actual use, this will be created from ExerciseField definitions
  validationSchema?: z.ZodObject<Record<string, z.ZodTypeAny>>;
}

export interface ExerciseSubmission {
  exerciseId: string;
  data: Record<string, unknown>;
  submittedAt: string;
}
