# 進捗機能

## 概要

ユーザーの学習進捗を記録・表示する機能。完了したレッスン、クイズ、演習を追跡し、学習状況を可視化。

## ユーザーストーリー

- [x] ユーザーは学習進捗の概要を確認できる
- [x] ユーザーは完了したレッスン数を確認できる
- [x] ユーザーは完了したクイズ数を確認できる
- [x] ユーザーは完了した演習数を確認できる
- [x] ユーザーはクイズの得点履歴を確認できる
- [x] ユーザーは苦手分野の傾向を確認できる

## 画面・導線

| パス | 画面名 | 説明 |
|------|--------|------|
| /progress | 進捗 | 学習進捗のダッシュボード |

### レイアウト

```
┌─────────────────────────────────────────────────┐
│ 学習進捗                                        │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │レッスン │ │クイズ   │ │演習     │            │
│ │ 3/6完了 │ │ 2/3完了 │ │ 1/3完了 │            │
│ └─────────┘ └─────────┘ └─────────┘            │
├─────────────────────────────────────────────────┤
│ クイズ履歴                                      │
│ ・React基礎クイズ: 80% (2024/01/09)            │
│ ・Hooksクイズ: 75% (2024/01/08)                │
├─────────────────────────────────────────────────┤
│ 苦手分野                                        │
│ ・useEffect (不正解: 3回)                       │
│ ・Context (不正解: 2回)                         │
└─────────────────────────────────────────────────┘
```

## データ構造

```typescript
interface Progress {
  // 開いたレッスン（学習中）
  openedLessons: string[];

  // 完了したレッスン
  completedLessons: string[];

  // 完了したクイズ
  completedQuizzes: string[];

  // 完了した演習
  completedExercises: string[];

  // クイズ結果履歴
  quizAttempts: QuizAttempt[];
}

interface QuizAttempt {
  quizId: string;
  completedAt: string;
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

## 状態管理

- 永続化: LocalStorage（`learning-progress`）
- Context: ProgressContext（アプリ全体で共有）

### Context API

```typescript
interface ProgressContextValue {
  progress: Progress;

  // レッスン
  markLessonOpened: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  isLessonOpened: (lessonId: string) => boolean;
  isLessonCompleted: (lessonId: string) => boolean;

  // クイズ
  completeQuiz: (quizId: string) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;

  // 演習
  completeExercise: (exerciseId: string) => void;
}
```

## 受け入れ条件

- [x] 進捗カードに完了数/全体数が表示される
- [x] 完了率がプログレスバーで表示される
- [x] クイズ履歴が新しい順に表示される
- [x] 苦手分野が不正解数の多い順に表示される
- [x] ページリロードしても進捗が維持される
- [x] 他ページでの完了が即座に反映される

## エッジケース

- 初回アクセス: 全て0件で表示
- LocalStorage無効: メモリ内のみで動作（リロードでリセット）
- 大量の履歴: 最新N件のみ表示（将来的に対応）

## 関連

- [レッスン機能](./lessons.md)
- [クイズ機能](./quiz.md)
