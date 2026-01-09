# クイズ機能

## 概要

学習内容の理解度を確認するためのインタラクティブなクイズ機能。タイマー、レジューム、苦手分野分析を提供。

## ユーザーストーリー

- [x] ユーザーはクイズ一覧を閲覧できる
- [x] ユーザーはクイズに回答できる
- [x] ユーザーは制限時間内に回答する必要がある
- [x] ユーザーは問題をスキップできる
- [x] ユーザーはヒントを表示できる
- [x] ユーザーは中断したクイズを再開できる
- [x] ユーザーは結果と解説を確認できる
- [x] ユーザーは苦手分野を確認できる
- [x] ユーザーは復習におすすめのレッスンを確認できる

## 画面・導線

| パス | 画面名 | 説明 |
|------|--------|------|
| /quiz | クイズ一覧 | 全クイズをカード形式で表示 |
| /quiz/:id | クイズ実施 | 問題回答・結果表示 |

### 画面状態

```
/quiz/:id
    │
    ├─→ 再開ダイアログ（保存データがある場合）
    │       ├─→ 続きから再開
    │       └─→ 最初からやり直す
    │
    ├─→ 問題画面
    │       ├─→ 回答選択 → 解説表示 → 次へ
    │       └─→ スキップ → 解説表示 → 次へ
    │
    └─→ 結果画面
            ├─→ スコア表示
            ├─→ 苦手分野
            ├─→ おすすめレッスン
            └─→ 回答レビュー
```

## データ構造

```typescript
interface Quiz {
  id: string;
  title: string;
  description: string;
  relatedLessonIds: string[];
  timeLimitSec: number | null;
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

// クイズセッション（LocalStorage保存用）
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

// クイズ結果
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

- セッション: LocalStorage（`quiz-session-{quizId}`）
- 結果履歴: ProgressContext経由でLocalStorage
- タイマー: useReducer + useEffect

## 受け入れ条件

- [x] 制限時間がカウントダウン表示される
- [x] 時間切れで自動終了する
- [x] 回答後に正解/不正解と解説が表示される
- [x] スキップした問題も解説が表示される
- [x] 中断してもブラウザを閉じても進捗が保存される
- [x] 再開時に「続きから」か「最初から」を選択できる
- [x] 苦手分野がタグ別に集計される
- [x] 苦手タグに関連するレッスンが提案される

## エッジケース

- 存在しないクイズID: 「クイズが見つかりません」画面を表示
- タイマーなしクイズ: タイマー非表示、時間無制限
- 全問スキップ: 0点として結果表示
- LocalStorage無効: セッション保存なしで動作（再開不可）

## 関連

- [レッスン機能](./lessons.md)
- [進捗機能](./progress.md)
