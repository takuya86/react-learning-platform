# データモデル設計

## 概要

静的データ（レッスン、クイズ）とユーザーデータ（進捗、ノート）の2種類。

## 静的データ

### Lesson

```typescript
interface Lesson {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  content: string;       // Markdown
  exerciseId?: string;   // 関連演習（オプション）
}
```

### Quiz

```typescript
interface Quiz {
  id: string;
  title: string;
  description: string;
  relatedLessonIds: string[];
  timeLimitSec: number | null;  // nullは時間無制限
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
  tags?: string[];
}
```

### Exercise

```typescript
interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;  // Markdown
  fields: ExerciseField[];
}

interface ExerciseField {
  name: string;
  type: 'text' | 'textarea' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
}
```

## ユーザーデータ（LocalStorage）

### Progress

```typescript
// キー: 'learning-progress'
interface Progress {
  openedLessons: string[];
  completedLessons: string[];
  completedQuizzes: string[];
  completedExercises: string[];
  quizAttempts: QuizAttempt[];
}

interface QuizAttempt {
  quizId: string;
  completedAt: string;  // ISO 8601
  score: number;
  totalQuestions: number;
  questionResults: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean;
  isSkipped: boolean;
  hintUsed: boolean;
  tags: string[];
}
```

### QuizSession

```typescript
// キー: 'quiz-session-{quizId}'
interface QuizSession {
  quizId: string;
  answers: Record<string, number | null>;
  skippedQuestionIds: string[];
  hintUsedByQuestionId: Record<string, boolean>;
  currentIndex: number;
  timeRemainingSec: number | null;
  startedAt: string;
  lastUpdatedAt: string;
}
```

### Notes

```typescript
// キー: 'notes-storage'
interface NotesStorage {
  notesByLessonId: Record<string, Note>;
}

interface Note {
  lessonId: string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
}
```

## ER図

```
┌─────────────┐      ┌─────────────┐
│   Lesson    │      │    Quiz     │
├─────────────┤      ├─────────────┤
│ id          │◄────┐│ id          │
│ title       │     ││ title       │
│ exerciseId ─┼──┐  ││ relatedLessonIds
│ ...         │  │  │└─────────────┘
└─────────────┘  │         │
                 │         │
┌─────────────┐  │  ┌──────▼──────┐
│  Exercise   │◄─┘  │  Question   │
├─────────────┤     ├─────────────┤
│ id          │     │ id          │
│ fields      │     │ question    │
│ ...         │     │ tags        │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│   Note      │     │ QuizAttempt │
├─────────────┤     ├─────────────┤
│ lessonId ───┼────►│ quizId      │
│ markdown    │     │ questionResults
│ ...         │     │ ...         │
└─────────────┘     └─────────────┘
```

## 関連

- [ADR-0002: LocalStorage永続化](../adr/0002-local-storage-persistence.md)
