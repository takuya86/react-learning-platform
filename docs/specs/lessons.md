# レッスン機能

## 概要

React/TypeScriptの学習コンテンツをレッスン形式で提供し、ユーザーが段階的に学習できる機能。

## ユーザーストーリー

- [x] ユーザーはレッスン一覧を閲覧できる
- [x] ユーザーは難易度・タグでレッスンを絞り込める
- [x] ユーザーはレッスン詳細でコンテンツを読める
- [x] ユーザーはレッスンを完了済みにできる
- [x] ユーザーはレッスンから関連クイズに遷移できる
- [x] ユーザーはレッスンからノートを開ける
- [x] ユーザーはレッスンに紐づく演習に取り組める

## 画面・導線

| パス | 画面名 | 説明 |
|------|--------|------|
| /lessons | レッスン一覧 | 全レッスンをカード形式で表示 |
| /lessons/:id | レッスン詳細 | Markdownコンテンツを表示 |
| /lessons/:id/exercise | 演習 | フォーム形式の演習問題 |

### 遷移図

```
/lessons
    │
    └─→ /lessons/:id（詳細）
            │
            ├─→ /lessons/:id/exercise（演習）
            ├─→ /quiz/:quizId（関連クイズ）
            └─→ /notes?lessonId=:id（ノート）
```

## データ構造

```typescript
interface Lesson {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  content: string; // Markdown
  exerciseId?: string;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string; // Markdown
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

## 状態管理

- 永続化: なし（レッスンデータは静的）
- 進捗: ProgressContext経由でLocalStorageに保存

## 受け入れ条件

- [x] レッスン一覧が表示される
- [x] 難易度バッジが色分けされている（初級:緑、中級:黄、上級:赤）
- [x] 完了済みレッスンに「完了」バッジが表示される
- [x] 学習中レッスンに「学習中」バッジが表示される
- [x] レッスン詳細でMarkdownが正しくレンダリングされる
- [x] コードブロックがシンタックスハイライトされる
- [x] 関連クイズがある場合のみ「クイズを開く」リンクが表示される

## エッジケース

- 存在しないレッスンID: 「レッスンが見つかりません」画面を表示
- 演習がないレッスン: 「演習に進む」ボタンを非表示

## 関連

- [クイズ機能](./quiz.md)
- [ノート機能](./notes.md)
- [進捗機能](./progress.md)
